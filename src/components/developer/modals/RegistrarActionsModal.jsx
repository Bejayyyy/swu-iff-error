import React, { useState } from 'react';
import { KeyRound, Power, Trash2, X, Pencil } from 'lucide-react';
import { USER_STATUS } from '../../../firebase/constants';

export default function RegistrarActionsModal({
  registrar,
  onClose,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onDelete,
  busy,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isActive = registrar.status === USER_STATUS.ACTIVE;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl relative" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700">
          <X size={20} />
        </button>
        <div className="p-8 pt-10">
          <h2 className="font-black text-lg mb-1" style={{ color: '#1e3a5f' }}>{registrar.displayName}</h2>
          <p className="text-xs font-medium mb-6" style={{ color: '#2B3235', opacity: 0.65 }}>{registrar.email}</p>

          <div className="space-y-2">
            <button type="button" className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm font-semibold" onClick={() => { onClose(); onEdit(registrar); }} disabled={busy}>
              <Pencil size={16} /> Edit information & permissions
            </button>
            <button type="button" className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm font-semibold" onClick={() => onToggleStatus(registrar)} disabled={busy}>
              <Power size={16} /> {isActive ? 'Deactivate account' : 'Activate account'}
            </button>
            <button type="button" className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm font-semibold" onClick={() => onResetPassword(registrar)} disabled={busy}>
              <KeyRound size={16} /> Send password reset email
            </button>
            {!confirmDelete ? (
              <button type="button" className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-red-100 text-red-700 hover:bg-red-50 text-sm font-semibold" onClick={() => setConfirmDelete(true)} disabled={busy}>
                <Trash2 size={16} /> Delete account
              </button>
            ) : (
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <p className="text-xs font-semibold text-red-800 mb-2">Remove Firestore records? Auth user may remain until removed via Admin SDK.</p>
                <div className="flex gap-2">
                  <button type="button" className="btn-outline-maroon flex-1 justify-center py-2 text-xs" onClick={() => setConfirmDelete(false)}>Cancel</button>
                  <button type="button" className="flex-1 py-2 text-xs font-bold text-white bg-red-700 rounded-lg" onClick={() => onDelete(registrar)} disabled={busy}>Confirm delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
