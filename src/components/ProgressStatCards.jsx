import React from 'react';

const ACCENTS = {
  total: '#DC2626',
  pending: '#EA580C',
  approved: '#16A34A',
  rejected: '#B91C1C',
  neutral: '#800000',
};

const MAROON_ICON = '#800000';

/**
 * Progress / KPI cards: fixed min height 150px, maroon icons on #FFFBFB holder.
 */
export default function ProgressStatCards({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map(({ label, value, icon: Icon, accent = 'neutral' }) => (
        <div
          key={label}
          className="rounded-[10px] bg-white shadow-md flex items-stretch justify-between overflow-hidden"
          style={{ borderLeft: `5px solid ${ACCENTS[accent] || ACCENTS.neutral}`, minHeight: 150 }}
        >
          <div className="flex flex-col justify-center py-6 pl-5 pr-3 flex-1 min-w-0">
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{ color: '#2B3235' }}
            >
              {label}
            </p>
            <p className="text-3xl font-black leading-none tabular-nums" style={{ color: '#2B3235' }}>
              {typeof value === 'number' ? String(value).padStart(2, '0') : value}
            </p>
          </div>
          <div className="flex items-center pr-5 flex-shrink-0">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{ background: '#FFFBFB', borderRadius: 10 }}
            >
              {Icon && <Icon size={24} style={{ color: MAROON_ICON }} strokeWidth={2} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
