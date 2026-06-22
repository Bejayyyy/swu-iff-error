import React from 'react';

const MAROON = '#800000';
const TEXT = '#2B3235';
const BADGE = '#800000';
const CONTAINER_BG = '#F9FAFB';
const R = 10;

/**
 * Primary category switcher — shrink-wrapped container, 10px radii (not pills).
 */
export function CategoryFilterTabs({ value, onChange, academicCount, nonAcademicCount, labels = ['Academic', 'Non-Academic'] }) {
  const counts = [academicCount, nonAcademicCount];
  const keys = ['academic', 'non-academic'];

  return (
    <div
      className="inline-flex w-fit flex-wrap items-center p-1 gap-0.5 shadow-sm max-w-full"
      style={{ background: CONTAINER_BG, borderRadius: R }}
    >
      {keys.map((k, i) => {
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className="px-4 py-2 text-sm font-bold flex items-center gap-2 transition-all"
            style={{
              borderRadius: R,
              background: active ? MAROON : 'transparent',
              color: active ? '#fff' : TEXT,
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {labels[i]}
            <span
              className="min-w-[22px] h-[22px] px-1 flex items-center justify-center text-[11px] font-black text-white"
              style={{ background: BADGE, borderRadius: 6 }}
            >
              {counts[i]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Status row — shrink-wrapped, #F9FAFB container, 10px button radius.
 */
export function StatusFilterRow({ value, onChange, options = ['All', 'Pending', 'Approved', 'Rejected'] }) {
  return (
    <div
      className="inline-flex w-fit flex-wrap items-center p-1 gap-1 shadow-sm max-w-full"
      style={{ background: CONTAINER_BG, borderRadius: R }}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-4 py-2 text-sm font-semibold transition-all"
            style={{
              borderRadius: R,
              background: active ? MAROON : 'transparent',
              color: active ? '#fff' : TEXT,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Building / floor pills — 10px radius; active maroon fill or outline per variant.
 */
export function PillFilterRow({ options, value, onChange, variant = 'filled' }) {
  return (
    <div className="flex flex-wrap gap-2 w-fit max-w-full">
      {options.map((opt) => {
        const key = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = value === key;
        if (variant === 'outline') {
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`px-4 py-2 text-sm font-bold transition-all border ${
                active ? '' : 'hover:bg-[#800000] hover:text-white hover:border-[#800000]'
              }`}
              style={{
                borderRadius: R,
                background: active ? '#800000' : '#fff',
                color: active ? '#fff' : TEXT,
                borderColor: active ? MAROON : '#E5E7EB',
              }}
            >
              {label}
            </button>
          );
        }
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              active ? '' : 'hover:bg-[#800000] hover:text-white hover:border-[#800000]'
            }`}
            style={{
              borderRadius: R,
              background: active ? MAROON : '#fff',
              color: active ? '#fff' : TEXT,
              border: active ? 'none' : '1px solid #E5E7EB',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
