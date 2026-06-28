import React from 'react';
import { X, GraduationCap, Users } from 'lucide-react';
import { APPROVAL_TYPES } from '../../constants/approvalWorkflow';

export default function EventTypePickerModal({ onClose, onSelect }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md relative p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-700">
          <X size={20} />
        </button>
        <h2 className="font-black text-lg mb-1" style={{ color: '#7A0808' }}>Room Reservation</h2>
        <p className="text-xs text-gray-500 mb-6">Select the type of event to determine the approval workflow.</p>
        <div className="space-y-3">
          <button
            type="button"
            className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-[#7A0808] hover:bg-red-50/40 transition-all"
            onClick={() => onSelect(APPROVAL_TYPES.ACADEMIC)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFF0F0', color: '#7A0808' }}>
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-dark">Academic Event</p>
                <p className="text-xs text-gray-400">Classes, lectures, academic activities</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-[#7A0808] hover:bg-red-50/40 transition-all"
            onClick={() => onSelect(APPROVAL_TYPES.NON_ACADEMIC)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFF0F0', color: '#7A0808' }}>
                <Users size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-dark">Non-Academic Event</p>
                <p className="text-xs text-gray-400">Student activities, org events, campus activities</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
