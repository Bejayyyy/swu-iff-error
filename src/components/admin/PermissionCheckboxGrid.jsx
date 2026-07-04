import React from 'react';
import { ACCESS_CATALOG, applyNavToggle, togglePermission } from '../../constants/accessCatalog';

export default function PermissionCheckboxGrid({
  permissions = [],
  navKeys = [],
  onChange,
  disabled = false,
  showNavigation = true,
  showPermissions = true,
}) {
  const emit = (nextPermissions, nextNavKeys) => {
    onChange?.({ permissions: nextPermissions, navKeys: nextNavKeys });
  };

  const handleNavToggle = (navKey, checked) => {
    const next = applyNavToggle(navKeys, permissions, navKey, checked);
    emit(next.permissions, next.navKeys);
  };

  const handlePermissionToggle = (permission, checked) => {
    emit(togglePermission(permissions, permission, checked), navKeys);
  };

  return (
    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
      {ACCESS_CATALOG.map((category) => {
        const isNavCategory = category.id === 'navigation';
        if (isNavCategory && !showNavigation) return null;
        if (!isNavCategory && !showPermissions) return null;

        return (
          <div key={category.id} className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: '#7A0808' }}>
                {category.label}
              </p>
              {category.description && (
                <p className="text-[11px] font-medium mt-0.5" style={{ color: '#2B3235', opacity: 0.65 }}>
                  {category.description}
                </p>
              )}
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {category.items.map((item) => {
                if (item.type === 'nav') {
                  return (
                    <label
                      key={`nav-${item.navKey}`}
                      className={`flex items-start gap-2 text-xs font-medium rounded-lg p-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={navKeys.includes(item.navKey)}
                        disabled={disabled}
                        onChange={(e) => handleNavToggle(item.navKey, e.target.checked)}
                      />
                      <span>
                        <span className="font-bold block" style={{ color: '#2B3235' }}>{item.label}</span>
                        {item.description && (
                          <span className="text-[10px] opacity-60">{item.description}</span>
                        )}
                      </span>
                    </label>
                  );
                }

                return (
                  <label
                    key={`perm-${item.permission}`}
                    className={`flex items-start gap-2 text-xs font-medium rounded-lg p-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={permissions.includes(item.permission)}
                      disabled={disabled}
                      onChange={(e) => handlePermissionToggle(item.permission, e.target.checked)}
                    />
                    <span>
                      <span className="font-bold block" style={{ color: '#2B3235' }}>{item.label}</span>
                      {item.description && (
                        <span className="text-[10px] opacity-60">{item.description}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
