import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { subscribeColleges } from '../../services/collegeService';
import { grantFirstCollegeAccess } from '../../services/scheduleAccessService';
import { useAuth } from '../../context/AuthContext';

export default function GrantScheduleAccessModal({
  isOpen,
  onClose,
  schoolYearId,
  semester,
  onSuccess,
}) {
  const { profile } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    
    return subscribeColleges(
      (collegeList) => {
        setColleges(collegeList);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading colleges:', err);
        setError('Failed to load colleges.');
        setLoading(false);
      }
    );
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Grant access form submitted with:', {
      schoolYearId,
      semester,
      selectedCollege,
      profileUid: profile?.uid
    });
    
    if (!selectedCollege) {
      setError('Please select a college.');
      return;
    }

    if (!schoolYearId || !semester) {
      setError('School year and semester are required.');
      return;
    }

    const college = colleges.find((c) => c.code === selectedCollege);
    if (!college) {
      setError('Invalid college selection.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await grantFirstCollegeAccess({
        schoolYearId,
        schoolYearLabel: `SY ${schoolYearId}`, // Add school year label
        semester,
        collegeCode: college.code,
        collegeName: college.name,
        grantedBy: profile?.uid,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error granting access:', err);
      setError(err.message || 'Failed to grant access.');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h3 className="font-black text-lg" style={{ color: '#2B3235' }}>
                Grant First College Access
              </h3>
              <p className="text-xs mt-1 text-gray-500">
                Select which college can create schedules first
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-bold text-blue-900 mb-1">
                📋 School Year {schoolYearId} · Semester {semester}
              </p>
              <p className="text-[11px] text-blue-700">
                This college will be the first to create their course schedule. Other colleges will wait until you click "Allow All Remaining Colleges" after the first college completes.
              </p>
            </div>

            {/* College Selection */}
            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: '#2B3235' }}>
                Select College <span className="text-red-500">*</span>
              </label>
              {loading ? (
                <div className="input-field w-full text-gray-400">Loading colleges...</div>
              ) : (
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="input-field w-full"
                  required
                  disabled={submitting}
                >
                  <option value="">Choose a college...</option>
                  {colleges.map((college) => (
                    <option key={college.code} value={college.code}>
                      {college.name} ({college.code})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                The dean of this college will receive immediate access to create schedules
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-2 rounded-lg text-sm font-bold bg-[#800000] text-white hover:bg-[#600000] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={16} />
              {submitting ? 'Granting Access...' : 'Grant Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
