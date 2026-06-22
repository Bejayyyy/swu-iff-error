import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Shield, Code2 } from 'lucide-react';
import { NAV_WIDTH_PX, TOP_NAV_HEIGHT_PX } from '../../constants/layout';
import { DEVELOPER_ROUTE_PREFIX } from '../../firebase/constants';
import systemLogo from '../../assets/logo.png';

const navItems = [
  { label: 'Registrar Accounts', icon: Users, path: DEVELOPER_ROUTE_PREFIX },
];

export default function DeveloperLeftNav({ isDesktop = true, isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      {!isDesktop && isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/35"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
          isDesktop ? 'z-50 translate-x-0' : `z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        }`}
        style={{ width: NAV_WIDTH_PX, background: '#0f2744', borderRight: '1px solid #1a3658' }}
      >
        <header
          className="flex items-center gap-1.5 px-3 py-2 flex-shrink-0"
          style={{ minHeight: TOP_NAV_HEIGHT_PX, borderBottom: '1px solid #1a3658' }}
        >
          <img src={systemLogo} alt="SWU-IFSS logo" className="h-12 w-auto object-contain flex-shrink-0 brightness-110" />
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight truncate text-white">SWU-IFSS</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200/80">Developer Portal</p>
          </div>
        </header>

        <section className="px-3 py-4 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <Code2 size={16} className="text-blue-300 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white leading-tight">Account management only</p>
              <p className="text-[10px] text-blue-200/70 leading-tight mt-0.5">
                No scheduling or registrar system features
              </p>
            </div>
          </div>
        </section>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => {
                  navigate(path);
                  if (!isDesktop) onClose();
                }}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg transition-colors"
                style={{
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                }}
              >
                <Icon size={17} style={{ color: active ? '#93c5fd' : undefined }} />
                <span className="text-[13px] font-semibold">{label}</span>
                {active && <Shield size={12} className="ml-auto text-blue-300" />}
              </button>
            );
          })}
        </nav>

        <footer className="px-4 py-4 border-t flex-shrink-0" style={{ borderColor: '#1a3658' }}>
          <p className="text-[10px] text-blue-200/50 leading-relaxed">
            Manage Registrar accounts, permissions, and access. Institutional email: @phinmaed.com
          </p>
        </footer>
      </aside>
    </>
  );
}
