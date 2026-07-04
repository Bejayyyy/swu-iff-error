import React from 'react';
import { X, Mail, Shield, Pencil } from 'lucide-react';

const R = 10;

export default function UserActionsModal({ user, onClose, onEdit }) {
  if (!user) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm shadow-xl m-4 border border-gray-100"
        style={{ borderRadius: R }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-black text-base" style={{ color: '#2B3235' }}>User actions</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100" style={{ borderRadius: R }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="font-bold" style={{ color: '#2B3235' }}>{user.name}</p>
          <p className="text-xs flex items-center gap-2" style={{ color: '#2B3235', opacity: 0.75 }}>
            <Mail size={14} className="text-[#800000]" /> {user.email}
          </p>
          <p className="text-xs flex items-center gap-2" style={{ color: '#2B3235', opacity: 0.75 }}>
            <Shield size={14} className="text-[#800000]" /> {user.role} · {user.department || 'No department'}
          </p>

          <button
            type="button"
            className="btn-maroon w-full justify-center py-2.5 gap-2"
            style={{ borderRadius: R }}
            onClick={() => { onEdit?.(user); onClose(); }}
          >
            <Pencil size={14} /> Edit user & access
          </button>
        </div>
      </div>
    </div>
  );
}
