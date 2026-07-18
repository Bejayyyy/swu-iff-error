import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { reportMaintenanceIssue } from '../../services/maintenanceService';
import { useAuth } from '../../context/AuthContext';
import LoadingModal from './LoadingModal';

export default function ReportMaintenanceModal({ 
  isOpen, 
  onClose, 
  room, 
  buildingName,
  onSuccess 
}) {
  const { profile } = useAuth();
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!issue.trim()) {
      setError('Please describe the issue.');
      return;
    }

    if (issue.trim().length < 10) {
      setError('Please provide a more detailed description (at least 10 characters).');
      return;
    }

    setIsLoading(true);

    try {
      await reportMaintenanceIssue({
        roomId: room.id,
        roomDocId: room.docId || null, // Pass the Firestore document ID
        roomName: room.name || room.id,
        buildingId: room.buildingId,
        buildingName: buildingName || '',
        floor: room.floorNumber || null,
        issue: issue.trim(),
        priority,
        reportedByUid: profile?.uid || null,
        reportedByName: profile?.displayName || profile?.email || 'Anonymous',
        reportedByEmail: profile?.email || '',
      });

      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setIssue('');
      setPriority('medium');
      setError('');
      onClose();
    } catch (err) {
      console.error('Error reporting maintenance:', err);
      setError(err.message || 'Failed to submit maintenance report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIssue('');
      setPriority('medium');
      setError('');
      onClose();
    }
  };

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={handleClose}
        />
        
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#2B3235]">
                  Report Maintenance Issue
                </h2>
                <p className="text-xs text-gray-500">
                  {room.name} - {buildingName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    disabled={isLoading}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all disabled:opacity-50 ${
                      priority === p.value
                        ? `${p.bg} ${p.border} ${p.color}`
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Issue Description */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="Describe the maintenance issue in detail (e.g., broken AC, damaged furniture, water leakage, etc.)..."
                required
                disabled={isLoading}
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none disabled:opacity-50"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {issue.length}/1000 characters • Minimum 10 characters
              </p>
            </div>

            {/* Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-[11px] text-blue-700">
                <p className="font-bold mb-1">What happens after you report?</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                  <li>GSD will be notified immediately</li>
                  <li>Your report will be reviewed and acknowledged</li>
                  <li>Maintenance will be scheduled if needed</li>
                  <li>You'll be able to track the status of your report</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-orange-600 text-white hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>

      <LoadingModal 
        isOpen={isLoading} 
        message="Submitting maintenance report..." 
      />
    </>
  );
}
