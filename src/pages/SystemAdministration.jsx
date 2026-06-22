import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, MoreVertical, Shield, UserCog, Users, Building2 } from 'lucide-react';
import Layout from '../components/Layout';
import ProgressStatCards from '../components/ProgressStatCards';
import AddUserModal from '../components/modals/AddUserModal';
import UserFilterModal from '../components/modals/UserFilterModal';
import UserActionsModal from '../components/modals/UserActionsModal';
import { useAuth } from '../context/AuthContext';
import { createStaffUserByEmailInvite, subscribeStaffUsers } from '../services/systemUserService';

const roleStyle = (role) => {
  const r = (role || '').toLowerCase();
  if (r.includes('admin') || r.includes('dean')) return 'bg-sky-100 text-sky-900';
  if (r.includes('teacher')) return 'bg-emerald-100 text-emerald-900';
  if (r.includes('head')) return 'bg-violet-100 text-violet-900';
  return 'bg-gray-100 text-gray-800';
};

export default function SystemAdministration() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({ role: 'Any', status: 'Any' });
  const [actionUser, setActionUser] = useState(null);
  const [page] = useState(1);

  useEffect(() => {
    const unsub = subscribeStaffUsers(
      (list) => {
        setUsers(list);
        setLoadError('');
      },
      (err) => setLoadError(err.message || 'Failed to load users.'),
    );
    return unsub;
  }, []);

  const addUser = async (form) => {
    await createStaffUserByEmailInvite(
      {
        name: form.name,
        email: form.email,
        department: form.department,
        roleValue: form.role,
      },
      profile?.uid,
    );
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filter.role !== 'Any' && u.role !== filter.role) return false;
      if (filter.status !== 'Any' && u.status !== filter.status) return false;
      return true;
    });
  }, [users, filter]);

  const admins = users.filter((u) => /admin|registrar|dean/i.test(u.role)).length;
  const dept = users.filter((u) => /department head/i.test(u.role)).length;
  const org = users.filter((u) => /organization/i.test(u.role)).length;

  const stats = [
    { label: 'Total users', value: users.length, icon: Users, accent: 'total' },
    { label: 'Admin / registrar', value: admins, icon: Shield, accent: 'approved' },
    { label: 'Department heads', value: dept, icon: UserCog, accent: 'pending' },
    { label: 'Organization heads', value: org, icon: Building2, accent: 'neutral' },
  ];

  return (
    <Layout title="System Administration" subtitle="Manage users, admins, and view system activity">
      <ProgressStatCards items={stats} />

      {loadError && <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">{loadError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-4">
        <button type="button" className="btn-maroon gap-2" style={{ borderRadius: 10 }} onClick={() => setShowFilter(true)}>
          <Filter size={16} /> Filter
        </button>
        <button type="button" className="btn-maroon gap-2" style={{ borderRadius: 10 }} onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add user
        </button>
      </div>

      {(filter.role !== 'Any' || filter.status !== 'Any') && (
        <p className="text-xs font-semibold mb-2" style={{ color: '#800000' }}>
          Filtered: {filter.role} · {filter.status} ({filteredUsers.length} shown)
        </p>
      )}

      <div className="bg-white rounded-[10px] shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider" style={{ color: '#2B3235' }}>Name</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider" style={{ color: '#2B3235' }}>Email</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider" style={{ color: '#2B3235' }}>Role</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider" style={{ color: '#2B3235' }}>Department</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider" style={{ color: '#2B3235' }}>Status</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider w-12" style={{ color: '#2B3235' }} />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: '#800000', borderRadius: 10 }}
                      >
                        {u.initials}
                      </div>
                      <span className="font-bold" style={{ color: '#2B3235' }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium" style={{ color: '#2B3235', opacity: 0.85 }}>{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-black px-2 py-1 uppercase ${roleStyle(u.role)}`} style={{ borderRadius: 8 }}>{u.role}</span>
                  </td>
                  <td className="py-3 px-4 font-medium" style={{ color: '#2B3235', opacity: 0.8 }}>{u.department}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#2B3235' }}>
                      <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      className="p-1.5 hover:bg-gray-100"
                      style={{ borderRadius: 10 }}
                      onClick={() => setActionUser(u)}
                    >
                      <MoreVertical size={16} style={{ color: '#2B3235', opacity: 0.55 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 text-xs font-semibold" style={{ color: '#2B3235', opacity: 0.75 }}>
          <span>Showing 1–{filteredUsers.length} of {filteredUsers.length} users</span>
          <button type="button" className="w-8 h-8 font-black text-white text-sm" style={{ background: '#800000', borderRadius: 10 }}>
            {page}
          </button>
        </div>
      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSave={addUser} />}
      {showFilter && (
        <UserFilterModal
          onClose={() => setShowFilter(false)}
          onApply={setFilter}
          initialRole={filter.role}
          initialStatus={filter.status}
        />
      )}
      {actionUser && <UserActionsModal user={actionUser} onClose={() => setActionUser(null)} />}
    </Layout>
  );
}
