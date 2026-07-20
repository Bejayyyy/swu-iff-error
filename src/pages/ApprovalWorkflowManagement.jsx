import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import Layout from '../components/Layout';
import { CategoryFilterTabs } from '../components/FilterControls';
import WorkflowLevelModal from '../components/modals/WorkflowLevelModal';
import {
  subscribeApprovalWorkflows,
  addWorkflowLevel,
  updateWorkflowLevel,
  deleteWorkflowLevel,
  reorderWorkflowLevels,
  seedDefaultWorkflowsIfEmpty,
} from '../services/approvalWorkflowService';
import { APPROVAL_TYPES } from '../constants/approvalWorkflow';

function WorkflowTable({ levels, onEdit, onDelete, onMoveUp, onMoveDown, onAdd }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {['Level', 'Role', 'Actions'].map((h) => (
                <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-gray-400 py-3 px-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-10 text-center text-sm text-gray-400">
                  No approval levels configured yet.
                </td>
              </tr>
            ) : (
              levels.map((level, index) => (
                <tr key={level.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-gray-300" />
                      <span className="text-sm font-bold text-dark">{level.levelNumber}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-sm font-semibold text-dark">{level.roleLabel || level.roleId}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-1">
                      <button type="button" className="p-1.5 rounded-lg hover:bg-gray-100" onClick={() => onMoveUp(level.id)} disabled={index === 0} title="Move up">
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-gray-100" onClick={() => onMoveDown(level.id)} disabled={index === levels.length - 1} title="Move down">
                        <ChevronDown size={14} />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-red-50 text-[#7A0808]" onClick={() => onEdit(level)} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" onClick={() => onDelete(level)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-100">
        <button type="button" className="btn-maroon" onClick={onAdd}>
          <Plus size={16} /> Add Level
        </button>
      </div>
    </div>
  );
}

export default function ApprovalWorkflowManagement() {
  const [tab, setTab] = useState(APPROVAL_TYPES.ACADEMIC);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    seedDefaultWorkflowsIfEmpty().catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeApprovalWorkflows(
      (data) => {
        setWorkflows(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Failed to load approval workflows.');
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const academicLevels = useMemo(
    () => workflows.filter((w) => w.approvalType === APPROVAL_TYPES.ACADEMIC).sort((a, b) => a.levelNumber - b.levelNumber),
    [workflows],
  );
  const nonAcademicLevels = useMemo(
    () => workflows.filter((w) => w.approvalType === APPROVAL_TYPES.NON_ACADEMIC).sort((a, b) => a.levelNumber - b.levelNumber),
    [workflows],
  );
  const deanManagedAcademicLevels = useMemo(
    () => workflows.filter((w) => w.approvalType === APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC).sort((a, b) => a.levelNumber - b.levelNumber),
    [workflows],
  );
  const deanManagedNonAcademicLevels = useMemo(
    () => workflows.filter((w) => w.approvalType === APPROVAL_TYPES.DEAN_MANAGED_NON_ACADEMIC).sort((a, b) => a.levelNumber - b.levelNumber),
    [workflows],
  );

  const currentLevels = tab === APPROVAL_TYPES.ACADEMIC 
    ? academicLevels 
    : tab === APPROVAL_TYPES.NON_ACADEMIC 
      ? nonAcademicLevels 
      : tab === APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC
        ? deanManagedAcademicLevels
        : deanManagedNonAcademicLevels;

  const reorder = async (orderedLevels) => {
    await reorderWorkflowLevels(tab, orderedLevels.map((l) => l.id));
  };

  const moveLevel = async (id, direction) => {
    const list = [...currentLevels];
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= list.length) return;
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
    await reorder(list);
  };

  const handleDelete = async (level) => {
    if (!window.confirm(`Delete Level ${level.levelNumber} (${level.roleLabel})?`)) return;
    await deleteWorkflowLevel(level.id);
    const remaining = currentLevels.filter((l) => l.id !== level.id);
    if (remaining.length) await reorder(remaining);
  };

  return (
    <Layout
      title="Approval Workflow"
      subtitle="Configure multi-level approval chains for academic and non-academic room reservations"
    >
      {error && (
        <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="mb-5 w-fit max-w-full">
        <div className="inline-flex w-fit flex-wrap items-center p-1 gap-1 shadow-sm" style={{ background: '#F9FAFB', borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setTab(APPROVAL_TYPES.ACADEMIC)}
            className="px-5 py-2 text-sm font-bold transition-all whitespace-nowrap"
            style={
              tab === APPROVAL_TYPES.ACADEMIC
                ? { background: '#800000', color: 'white', borderRadius: 10 }
                : { background: 'transparent', color: '#2B3235', borderRadius: 10 }
            }
          >
            Academic ({academicLevels.length})
          </button>
          <button
            type="button"
            onClick={() => setTab(APPROVAL_TYPES.NON_ACADEMIC)}
            className="px-5 py-2 text-sm font-bold transition-all whitespace-nowrap"
            style={
              tab === APPROVAL_TYPES.NON_ACADEMIC
                ? { background: '#800000', color: 'white', borderRadius: 10 }
                : { background: 'transparent', color: '#2B3235', borderRadius: 10 }
            }
          >
            Non-Academic ({nonAcademicLevels.length})
          </button>
          <button
            type="button"
            onClick={() => setTab(APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC)}
            className="px-5 py-2 text-sm font-bold transition-all whitespace-nowrap"
            style={
              tab === APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC
                ? { background: '#800000', color: 'white', borderRadius: 10 }
                : { background: 'transparent', color: '#2B3235', borderRadius: 10 }
            }
          >
            Dean-Managed Academic ({deanManagedAcademicLevels.length})
          </button>
          <button
            type="button"
            onClick={() => setTab(APPROVAL_TYPES.DEAN_MANAGED_NON_ACADEMIC)}
            className="px-5 py-2 text-sm font-bold transition-all whitespace-nowrap"
            style={
              tab === APPROVAL_TYPES.DEAN_MANAGED_NON_ACADEMIC
                ? { background: '#800000', color: 'white', borderRadius: 10 }
                : { background: 'transparent', color: '#2B3235', borderRadius: 10 }
            }
          >
            Dean-Managed Non-Academic ({deanManagedNonAcademicLevels.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">Loading workflow configuration…</p>
      ) : (
        <>
          {(tab === APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC || tab === APPROVAL_TYPES.DEAN_MANAGED_NON_ACADEMIC) && (
            <div className="mb-5 bg-blue-50 rounded-xl border border-blue-200 p-4">
              <h4 className="text-sm font-black text-blue-900 mb-2">
                {tab === APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC 
                  ? 'Dean-Managed Academic Rooms Workflow' 
                  : 'Dean-Managed Non-Academic Rooms Workflow'}
              </h4>
              <p className="text-xs font-medium text-blue-800 mb-2">
                {tab === APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC
                  ? 'This workflow applies to academic reservations for rooms assigned to a specific dean. Typical flow: College Dean → GSD → Room Manager Dean (final approval).'
                  : 'This workflow applies to non-academic reservations for rooms assigned to a specific dean. Typical flow: Student Life → GSD → Room Manager Dean (final approval).'}
              </p>
              <p className="text-xs font-medium text-blue-700">
                💡 The "Room Manager Dean" role is dynamically replaced with the specific dean assigned to manage the room/floor.
              </p>
            </div>
          )}
          
          <WorkflowTable
            levels={currentLevels}
            onEdit={(level) => setModal({ mode: 'edit', level })}
            onDelete={handleDelete}
            onMoveUp={(id) => moveLevel(id, 'up')}
            onMoveDown={(id) => moveLevel(id, 'down')}
            onAdd={() => setModal({ mode: 'add', approvalType: tab, nextLevelNumber: currentLevels.length + 1 })}
          />

          {/* Dean-Managed Rooms/Floors Information */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-blue-900 mb-2">
                  Dean-Managed Rooms & Floors
                </h3>
                <p className="text-sm font-medium text-blue-800 mb-3">
                  The workflows above apply to standard room reservations. However, you can delegate specific floors or rooms to deans for direct management.
                </p>
                
                <div className="bg-white/60 rounded-xl p-4 mb-3 border border-blue-200">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 mb-2">
                    How Dean-Managed Workflows Work:
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">1.</span>
                      <span>
                        <strong>Assign Manager:</strong> In Building Management or Room Availability, registrars can assign a dean as the manager for a specific floor or room.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">2.</span>
                      <span>
                        <strong>Simplified Workflow:</strong> Reservations for managed rooms bypass the standard workflow and go directly to the assigned dean, then to the registrar for final approval.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">3.</span>
                      <span>
                        <strong>Dean Visibility:</strong> Assigned deans only see reservations for their managed spaces in their approval queue.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/building-management"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Manage Buildings & Floors
                  </a>
                  <a
                    href="/room-availability"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configure Room Managers
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {modal?.mode === 'add' && (
        <WorkflowLevelModal
          approvalType={modal.approvalType}
          nextLevelNumber={modal.nextLevelNumber}
          onClose={() => setModal(null)}
          onSave={(form) => addWorkflowLevel(form)}
        />
      )}
      {modal?.mode === 'edit' && (
        <WorkflowLevelModal
          initial={modal.level}
          onClose={() => setModal(null)}
          onSave={(form) => updateWorkflowLevel(modal.level.id, form)}
        />
      )}
    </Layout>
  );
}
