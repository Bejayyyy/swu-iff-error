import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, ChevronDown, User, Settings, LockKeyhole, Mail, Phone, BadgeCheck, FileText, Clock3, Menu,
} from 'lucide-react';
import { NAV_WIDTH_PX, TOP_NAV_HEIGHT_PX } from '../constants/layout';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../firebase/authHelpers';

const initialNotifications = [
  {
    id: 1,
    type: 'Approval',
    title: 'Academic request approved',
    requester: 'Dr. John Mark Somoged',
    request: 'BSIT 3A - Data Structures',
    location: 'Engineering Building / ENG-201',
    submittedAt: 'Today, 8:10 AM',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 2,
    type: 'Pending',
    title: 'New booking request pending',
    requester: 'Prof. Maria Santos',
    request: 'Midterm review session',
    location: 'Phinma Hall / PH-102',
    submittedAt: 'Today, 7:40 AM',
    time: '3 hours ago',
    unread: true,
  },
  {
    id: 3,
    type: 'Conflict',
    title: 'Schedule conflict detected',
    requester: 'Registrar',
    request: 'ENG-101 overlapping schedule',
    location: 'Engineering Building / ENG-101',
    submittedAt: 'Today, 6:15 AM',
    time: '6 hours ago',
    unread: false,
  },
];

export default function TopNav({ title, subtitle, isDesktop = true, onToggleNav = () => {} }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [notifItems, setNotifItems] = useState(initialNotifications);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: profile?.displayName || 'Registrar',
    role: 'Registrar',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });
  const displayName = profile?.displayName || 'Registrar';
  const initials = profile?.initials || getInitials(profile?.displayName, profile?.email) || 'R';

  const handleSignOut = async () => {
    closeAll();
    await logout();
    navigate('/login');
  };
  const unreadCount = notifItems.filter((n) => n.unread).length;
  const r = 10;
  const closeAll = () => {
    setShowNotif(false);
    setShowProfile(false);
    setShowProfileModal(false);
    setShowEditProfileModal(false);
    setShowSettingsModal(false);
    setShowForgotPassword(false);
  };
  const hasAnyOverlay =
    showNotif || showProfile || showProfileModal || showEditProfileModal || showSettingsModal || showForgotPassword;
  const sortedNotifications = useMemo(
    () => [...notifItems].sort((a, b) => Number(b.unread) - Number(a.unread)),
    [notifItems],
  );

  return (
    <div
      className="fixed top-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-6"
      style={{
        left: isDesktop ? NAV_WIDTH_PX : 0,
        height: TOP_NAV_HEIGHT_PX,
        background: '#800000',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      <div className="min-w-0 flex items-center gap-2 sm:gap-3">
        {!isDesktop && (
          <button
            type="button"
            onClick={onToggleNav}
            className="relative p-2 hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ borderRadius: r }}
            aria-label="Open sidebar"
          >
            <Menu size={20} className="text-white" />
          </button>
        )}
        <div className="min-w-0">
        <h1 className="text-white font-bold text-lg sm:text-xl leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-red-100 text-xs font-normal mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotif(!showNotif);
              setShowProfile(false);
              setShowProfileModal(false);
              setShowSettingsModal(false);
              setShowForgotPassword(false);
            }}
            className="relative p-2 hover:bg-white/10 transition-colors"
            style={{ borderRadius: r }}
          >
            <Bell size={22} className="text-white" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 text-[#2B3235] text-[10px] font-black min-w-[18px] h-[18px] px-1 flex items-center justify-center"
                style={{ background: '#FFC107', borderRadius: 6 }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotif(false);
              setShowProfileModal(false);
              setShowSettingsModal(false);
              setShowForgotPassword(false);
            }}
            className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 transition-colors"
            style={{ borderRadius: r }}
          >
            <div
              className="w-9 h-9 flex items-center justify-center text-[#2B3235] font-black text-sm"
              style={{ background: '#FFC107', borderRadius: r }}
            >
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-white text-xs font-bold leading-tight">{displayName}</p>
              <p className="text-red-100 text-[10px] font-medium">Registrar</p>
            </div>
            <ChevronDown size={14} className="text-red-100 hidden sm:block" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-14 w-48 bg-white shadow-xl border border-gray-100 z-50 overflow-hidden" style={{ borderRadius: r }}>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold" style={{ color: '#2B3235' }}>{displayName}</p>
                <p className="text-[11px]" style={{ color: '#2B3235', opacity: 0.55 }}>Registrar</p>
              </div>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-gray-50"
                style={{ color: '#2B3235' }}
                onClick={() => {
                  setShowProfile(false);
                  setShowProfileModal(true);
                }}
              >
                My Profile
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-gray-50"
                style={{ color: '#2B3235' }}
                onClick={() => {
                  setShowProfile(false);
                  setShowSettingsModal(true);
                }}
              >
                Settings
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 border-t border-gray-100"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {hasAnyOverlay && (
        <div className="fixed inset-0 z-40" onClick={closeAll} aria-hidden />
      )}

      {showNotif && (
        <div className="fixed inset-0 z-[60] p-4 md:p-8" onClick={() => setShowNotif(false)}>
          <div
            className="ml-auto w-full max-w-3xl h-full max-h-[85vh] bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            style={{ borderRadius: r }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-black text-base" style={{ color: '#2B3235' }}>Notifications</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#2B3235', opacity: 0.65 }}>
                  Request details and important events
                </p>
              </div>
              <button type="button" className="btn-outline-maroon text-xs py-2 px-3" onClick={() => setShowNotif(false)}>
                Close
              </button>
            </div>
            <div className="overflow-y-auto">
              {sortedNotifications.map((n) => (
                <div key={n.id} className={`px-6 py-4 border-b border-gray-100 ${n.unread ? 'bg-[#FFFBFB]' : 'bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className="inline-flex items-center text-[10px] font-black mb-1 px-2 py-0.5"
                        style={{
                          color: n.type === 'Pending' ? '#92400E' : n.type === 'Conflict' ? '#991B1B' : '#065F46',
                          background: n.type === 'Pending' ? '#FEF3C7' : n.type === 'Conflict' ? '#FEE2E2' : '#D1FAE5',
                          borderRadius: 6,
                        }}
                      >
                        {n.type}
                      </span>
                      <p className="text-sm font-bold" style={{ color: '#2B3235' }}>{n.title}</p>
                      <p className="text-xs mt-1" style={{ color: '#2B3235', opacity: 0.85 }}>
                        <span className="font-bold">Requester:</span> {n.requester}
                      </p>
                      <p className="text-xs" style={{ color: '#2B3235', opacity: 0.85 }}>
                        <span className="font-bold">Request:</span> {n.request}
                      </p>
                      <p className="text-xs" style={{ color: '#2B3235', opacity: 0.85 }}>
                        <span className="font-bold">Location:</span> {n.location}
                      </p>
                      <p className="text-[11px] mt-2" style={{ color: '#2B3235', opacity: 0.55 }}>
                        {n.submittedAt} · {n.time}
                      </p>
                    </div>
                    {n.unread && <span className="text-[10px] font-black px-2 py-1 text-white bg-[#800000]" style={{ borderRadius: 6 }}>NEW</span>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="btn-maroon text-xs py-2 px-3">View request details</button>
                    <button
                      type="button"
                      className="btn-outline-maroon text-xs py-2 px-3"
                      onClick={() => setNotifItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                    >
                      Mark as read
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal-overlay z-[70]" onClick={() => setShowProfileModal(false)}>
          <div
            className="bg-white w-full max-w-xl shadow-2xl border border-gray-100"
            style={{ borderRadius: r }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100" style={{ background: '#FFFBFB' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center text-[#2B3235] font-black text-base" style={{ background: '#FFC107', borderRadius: 10 }}>
                  K
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: '#2B3235' }}>My Profile</h3>
                  <p className="text-xs font-semibold" style={{ color: '#2B3235', opacity: 0.65 }}>Account and identity details</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase" style={{ color: '#2B3235', opacity: 0.6 }}>Full Name</p>
                  <p className="text-sm font-semibold" style={{ color: '#2B3235' }}>{profileForm.fullName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase" style={{ color: '#2B3235', opacity: 0.6 }}>Role</p>
                  <p className="text-sm font-semibold" style={{ color: '#2B3235' }}>{profileForm.role}</p>
                </div>
              </div>
              <p className="text-xs flex items-center gap-2" style={{ color: '#2B3235' }}><Mail size={14} className="text-[#800000]" /> {profileForm.email}</p>
              <p className="text-xs flex items-center gap-2" style={{ color: '#2B3235' }}><Phone size={14} className="text-[#800000]" /> {profileForm.phone}</p>
              <p className="text-xs flex items-center gap-2" style={{ color: '#2B3235' }}><BadgeCheck size={14} className="text-[#800000]" /> Account status: Verified</p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn-maroon text-xs py-2.5 px-4"
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowEditProfileModal(true);
                  }}
                >
                  Edit Profile
                </button>
                <button type="button" className="btn-outline-maroon text-xs py-2.5 px-4" onClick={() => setShowProfileModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditProfileModal && (
        <div className="modal-overlay z-[71]" onClick={() => setShowEditProfileModal(false)}>
          <div
            className="bg-white w-full max-w-md shadow-2xl border border-gray-100"
            style={{ borderRadius: r }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <User size={16} style={{ color: '#800000' }} />
              <h3 className="font-black text-sm" style={{ color: '#2B3235' }}>Edit Profile</h3>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={profileForm.fullName} onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Role</label>
                <input className="form-input" value={profileForm.role} onChange={(e) => setProfileForm((f) => ({ ...f, role: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn-maroon text-xs py-2.5 px-4" onClick={() => setShowEditProfileModal(false)}>
                  Save Changes
                </button>
                <button type="button" className="btn-outline-maroon text-xs py-2.5 px-4" onClick={() => setShowEditProfileModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal-overlay z-[70]" onClick={() => setShowSettingsModal(false)}>
          <div
            className="bg-white w-full max-w-lg shadow-xl border border-gray-100"
            style={{ borderRadius: r }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Settings size={16} style={{ color: '#800000' }} />
              <h3 className="font-black text-sm" style={{ color: '#2B3235' }}>Settings</h3>
            </div>
            <div className="p-5 space-y-3">
              <button type="button" className="w-full text-left p-3 border border-gray-100 hover:bg-gray-50" style={{ borderRadius: r, color: '#2B3235' }}>
                <div className="flex items-center gap-2 font-bold text-sm"><FileText size={14} className="text-[#800000]" /> Preferences</div>
                <p className="text-xs mt-1 opacity-70">Configure notification and display options</p>
              </button>
              <button type="button" className="w-full text-left p-3 border border-gray-100 hover:bg-gray-50" style={{ borderRadius: r, color: '#2B3235' }}>
                <div className="flex items-center gap-2 font-bold text-sm"><Clock3 size={14} className="text-[#800000]" /> Session & Security</div>
                <p className="text-xs mt-1 opacity-70">Manage devices and active sessions</p>
              </button>
              <button
                type="button"
                className="w-full text-left p-3 border border-gray-100 hover:bg-gray-50"
                style={{ borderRadius: r, color: '#2B3235' }}
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowForgotPassword(true);
                }}
              >
                <div className="flex items-center gap-2 font-bold text-sm"><LockKeyhole size={14} className="text-[#800000]" /> Forgot Password</div>
                <p className="text-xs mt-1 opacity-70">Send reset link to your registered email</p>
              </button>
              <div className="pt-1">
                <button type="button" className="btn-outline-maroon text-xs py-2.5 px-4" onClick={() => setShowSettingsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className="modal-overlay z-[70]" onClick={() => setShowForgotPassword(false)}>
          <div
            className="bg-white w-full max-w-md shadow-xl border border-gray-100"
            style={{ borderRadius: r }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-black text-sm" style={{ color: '#2B3235' }}>Forgot Password</h3>
            </div>
            <div className="p-5">
              <p className="text-xs mb-3" style={{ color: '#2B3235', opacity: 0.75 }}>
                Send a password reset link to your account email.
              </p>
              <input className="form-input mb-3" value="registrar@swu.edu.ph" readOnly />
              <div className="flex gap-2">
                <button type="button" className="btn-maroon text-xs py-2.5 px-4">Send reset link</button>
                <button type="button" className="btn-outline-maroon text-xs py-2.5 px-4" onClick={() => setShowForgotPassword(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
