import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, CalendarDays, CircleAlert, CalendarClock, Calendar,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../firebase/constants';
import { useAcademicCalendar } from '../hooks/useAcademicCalendar';
import {
  buildSchoolYearId,
  saveSchoolYearConfig,
  addHoliday,
  deleteHoliday,
  addNoClassPeriod,
  deleteNoClassPeriod,
  saveExamPeriodRange,
} from '../services/academicCalendarService';
import {
  formatDisplayDate,
  formatExamRange,
  normalizeExamPeriods,
  countConfiguredExamPeriods,
} from '../utils/academicCalendarUtils';

export default function AcademicCalendar() {
  const { profile } = useAuth();
  const isRegistrar = profile?.role === ROLES.REGISTRAR;

  const {
    schoolYears,
    activeSchoolYearId,
    setActiveSchoolYearId,
    calendarData,
    loading,
    error,
  } = useAcademicCalendar();

  const [openSection, setOpenSection] = useState('none');
  const [syForm, setSyForm] = useState({
    label: '',
    s1s: '',
    s1e: '',
    s2s: '',
    s2e: '',
  });
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '', desc: '' });
  const [ncForm, setNcForm] = useState({ start: '', end: '', reason: '', desc: '' });
  const [examTab, setExamTab] = useState('1');
  const [examEdit, setExamEdit] = useState(null);
  const [examDraft, setExamDraft] = useState({ start: '', end: '' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const { config, holidays, noClassPeriods } = calendarData;
  const examPeriods = useMemo(
    () => normalizeExamPeriods(config?.examPeriods),
    [config?.examPeriods],
  );

  useEffect(() => {
    if (!config) return;
    setSyForm({
      label: config.label || '',
      s1s: config.semester1Start || '',
      s1e: config.semester1End || '',
      s2s: config.semester2Start || '',
      s2e: config.semester2End || '',
    });
  }, [config]);

  const activeSchoolYear = schoolYears.find((sy) => sy.id === activeSchoolYearId);
  const displaySchoolYear = activeSchoolYear?.displayLabel
    || (syForm.label ? `SY ${syForm.label}` : 'School year');

  const handleSaveSy = async () => {
    if (!isRegistrar || !syForm.label.trim()) return;
    setSaving(true);
    setActionError('');
    try {
      const schoolYearId = activeSchoolYearId || buildSchoolYearId(syForm.label);
      await saveSchoolYearConfig(schoolYearId, {
        label: syForm.label.trim(),
        semester1Start: syForm.s1s,
        semester1End: syForm.s1e,
        semester2Start: syForm.s2s,
        semester2End: syForm.s2e,
      });
      if (!activeSchoolYearId) setActiveSchoolYearId(schoolYearId);
    } catch (err) {
      setActionError(err.message || 'Failed to save school year configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!isRegistrar || !activeSchoolYearId || !holidayForm.date || !holidayForm.name.trim()) return;
    setSaving(true);
    setActionError('');
    try {
      await addHoliday(activeSchoolYearId, holidayForm);
      setHolidayForm({ date: '', name: '', desc: '' });
    } catch (err) {
      setActionError(err.message || 'Failed to add holiday.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!isRegistrar || !activeSchoolYearId) return;
    setActionError('');
    try {
      await deleteHoliday(activeSchoolYearId, holidayId);
    } catch (err) {
      setActionError(err.message || 'Failed to delete holiday.');
    }
  };

  const handleAddNoClass = async () => {
    if (!isRegistrar || !activeSchoolYearId || !ncForm.start || !ncForm.end || !ncForm.reason.trim()) return;
    setSaving(true);
    setActionError('');
    try {
      await addNoClassPeriod(activeSchoolYearId, ncForm);
      setNcForm({ start: '', end: '', reason: '', desc: '' });
    } catch (err) {
      setActionError(err.message || 'Failed to add no-class period.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNoClass = async (periodId) => {
    if (!isRegistrar || !activeSchoolYearId) return;
    setActionError('');
    try {
      await deleteNoClassPeriod(activeSchoolYearId, periodId);
    } catch (err) {
      setActionError(err.message || 'Failed to delete no-class period.');
    }
  };

  const openExamEditor = (semester, periodKey, level) => {
    if (!isRegistrar) return;
    const range = examPeriods[semester]?.[periodKey]?.[level];
    setExamEdit({ semester, periodKey, level });
    setExamDraft({ start: range?.start || '', end: range?.end || '' });
  };

  const handleSaveExamRange = async () => {
    if (!examEdit || !activeSchoolYearId || !examDraft.start || !examDraft.end) return;
    setSaving(true);
    setActionError('');
    try {
      await saveExamPeriodRange(
        activeSchoolYearId,
        examEdit.semester,
        examEdit.periodKey,
        examEdit.level,
        examDraft.start,
        examDraft.end,
      );
      setExamEdit(null);
      setExamDraft({ start: '', end: '' });
    } catch (err) {
      setActionError(err.message || 'Failed to save exam period.');
    } finally {
      setSaving(false);
    }
  };

  const configuredExamCount = countConfiguredExamPeriods(examPeriods, examTab);

  const sectionMeta = useMemo(
    () => ({
      sy: {
        title: 'School Year Configuration',
        subtitle: `${displaySchoolYear} - S1: ${formatDisplayDate(syForm.s1s)} to ${formatDisplayDate(syForm.s1e)}`,
        Icon: CalendarDays,
        iconColor: '#7F1D1D',
      },
      holiday: {
        title: 'Holidays & No Class Dates',
        subtitle: 'Block specific dates from scheduling',
        Icon: CircleAlert,
        iconColor: '#A16207',
      },
      noclass: {
        title: 'No-Class Dates',
        subtitle: `${noClassPeriods.length} blocked date range${noClassPeriods.length === 1 ? '' : 's'}`,
        Icon: CalendarClock,
        iconColor: '#1D4ED8',
      },
      exams: {
        title: 'Exam Period Ranges',
        subtitle: `Semester ${examTab} - ${configuredExamCount} period${configuredExamCount === 1 ? '' : 's'} configured`,
        Icon: Calendar,
        iconColor: '#7F1D1D',
      },
    }),
    [displaySchoolYear, syForm, noClassPeriods.length, examTab, configuredExamCount],
  );

  const toggle = (key) => setOpenSection((prev) => (prev === key ? 'none' : key));
  const inputStyle = 'form-input';

  const renderExamLevel = (semester, periodKey, level, label) => {
    const data = examPeriods[semester]?.[periodKey]?.[level];
    const rangeText = formatExamRange(data);
    const isEditing = examEdit?.semester === semester
      && examEdit?.periodKey === periodKey
      && examEdit?.level === level;

    return (
      <div className="bg-white p-3" style={{ borderRadius: 8 }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#2B3235' }}>{label}</p>
        {rangeText && !isEditing && (
          <p className="text-base font-semibold mb-2" style={{ color: '#1E3A8A' }}>{rangeText}</p>
        )}
        {isEditing ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className={inputStyle}
                value={examDraft.start}
                onChange={(e) => setExamDraft((d) => ({ ...d, start: e.target.value }))}
              />
              <input
                type="date"
                className={inputStyle}
                value={examDraft.end}
                onChange={(e) => setExamDraft((d) => ({ ...d, end: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 border border-gray-200 text-sm font-bold py-2"
                style={{ borderRadius: 8, color: '#2B3235' }}
                onClick={() => setExamEdit(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 btn-maroon text-sm justify-center py-2"
                onClick={handleSaveExamRange}
                disabled={saving}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          isRegistrar && (
            <button
              type="button"
              className="w-full border border-gray-200 text-sm font-bold py-2 flex items-center justify-center gap-2"
              style={{ borderRadius: 8, color: '#2B3235' }}
              onClick={() => openExamEditor(semester, periodKey, level)}
            >
              <Plus size={15} /> {rangeText ? 'Edit Dates' : 'Set Dates'}
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <Layout title="Academic Calendar" subtitle="Super Admin · Configure school year, holidays, no class, and exams">
      {(error || actionError) && (
        <div className="mb-4 p-3 border border-red-200 bg-red-50 text-sm font-semibold text-red-700" style={{ borderRadius: 10 }}>
          {actionError || error}
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-bold" style={{ color: '#2B3235' }}>School Year:</label>
        <div className="relative w-[220px]">
          <select
            className="form-input appearance-none pr-10 font-semibold"
            value={activeSchoolYearId || ''}
            onChange={(e) => setActiveSchoolYearId(e.target.value || null)}
            disabled={loading || !schoolYears.length}
          >
            {!schoolYears.length && <option value="">No school years yet</option>}
            {schoolYears.map((sy) => (
              <option key={sy.id} value={sy.id}>{sy.displayLabel || `SY ${sy.label}`}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" size={18} />
        </div>
        {loading && <span className="text-xs font-semibold opacity-60" style={{ color: '#2B3235' }}>Loading…</span>}
      </div>

      <div className="space-y-4">
        {(['sy', 'holiday', 'noclass', 'exams']).map((key) => {
          const meta = sectionMeta[key];
          const isOpen = openSection === key;
          const Icon = meta.Icon;
          return (
            <div key={key} className="bg-white border border-gray-200 shadow-sm overflow-hidden" style={{ borderRadius: 14 }}>
              <button
                type="button"
                onClick={() => toggle(key)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} style={{ color: meta.iconColor }} />
                  <div>
                    <p className="font-black text-base" style={{ color: '#2B3235' }}>{meta.title}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#2B3235', opacity: 0.7 }}>{meta.subtitle}</p>
                  </div>
                </div>
                {isOpen ? <ChevronDown size={18} style={{ color: '#9CA3AF' }} /> : <ChevronRight size={18} style={{ color: '#9CA3AF' }} />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-200 p-5">
                  {key === 'sy' && (
                    <div className="space-y-4">
                      <div>
                        <label className="form-label">School Year Label</label>
                        <input
                          className={inputStyle}
                          placeholder="e.g., 2025-2026"
                          value={syForm.label}
                          onChange={(e) => setSyForm((s) => ({ ...s, label: e.target.value }))}
                          disabled={!isRegistrar}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Semester 1 Start</label>
                          <input type="date" className={inputStyle} value={syForm.s1s} onChange={(e) => setSyForm((s) => ({ ...s, s1s: e.target.value }))} disabled={!isRegistrar} />
                        </div>
                        <div>
                          <label className="form-label">Semester 1 End</label>
                          <input type="date" className={inputStyle} value={syForm.s1e} onChange={(e) => setSyForm((s) => ({ ...s, s1e: e.target.value }))} disabled={!isRegistrar} />
                        </div>
                        <div>
                          <label className="form-label">Semester 2 Start</label>
                          <input type="date" className={inputStyle} value={syForm.s2s} onChange={(e) => setSyForm((s) => ({ ...s, s2s: e.target.value }))} disabled={!isRegistrar} />
                        </div>
                        <div>
                          <label className="form-label">Semester 2 End</label>
                          <input type="date" className={inputStyle} value={syForm.s2e} onChange={(e) => setSyForm((s) => ({ ...s, s2e: e.target.value }))} disabled={!isRegistrar} />
                        </div>
                      </div>
                      {isRegistrar && (
                        <button type="button" className="btn-maroon w-full justify-center" onClick={handleSaveSy} disabled={saving}>
                          <Plus size={16} /> Save School Year Configuration
                        </button>
                      )}
                      <div className="space-y-2">
                        {schoolYears.map((row) => (
                          <div key={row.id} className="p-3 border border-gray-100" style={{ borderRadius: 10, background: '#fff' }}>
                            <p className="text-xs font-bold" style={{ color: '#2B3235' }}>
                              {row.displayLabel || `SY ${row.label}`} - S1: {formatDisplayDate(row.semester1Start)} to {formatDisplayDate(row.semester1End)}
                              {row.semester2Start && row.semester2End && (
                                <> · S2: {formatDisplayDate(row.semester2Start)} to {formatDisplayDate(row.semester2End)}</>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {key === 'holiday' && (
                    <div className="space-y-4">
                      {isRegistrar && (
                        <div className="p-4 border" style={{ borderRadius: 10, background: '#F6F3E3', borderColor: '#E6DFA8' }}>
                          <h4 className="font-black text-lg mb-3" style={{ color: '#2B3235' }}>Add Holiday</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="form-label">Date</label>
                              <input type="date" className={inputStyle} value={holidayForm.date} onChange={(e) => setHolidayForm((h) => ({ ...h, date: e.target.value }))} />
                            </div>
                            <div>
                              <label className="form-label">Holiday Name</label>
                              <input className={inputStyle} placeholder="e.g., Labor Day" value={holidayForm.name} onChange={(e) => setHolidayForm((h) => ({ ...h, name: e.target.value }))} />
                            </div>
                            <div>
                              <label className="form-label">Description (Optional)</label>
                              <input className={inputStyle} placeholder="e.g., National holiday" value={holidayForm.desc} onChange={(e) => setHolidayForm((h) => ({ ...h, desc: e.target.value }))} />
                            </div>
                            <button type="button" className="w-full py-2.5 text-white font-bold flex items-center justify-center gap-2" style={{ borderRadius: 10, background: '#D97706' }} onClick={handleAddHoliday} disabled={saving || !activeSchoolYearId}>
                              <Plus size={15} /> Add Holiday
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-black text-lg mb-3" style={{ color: '#2B3235' }}>Configured Holidays</h4>
                        <div className="space-y-2">
                          {!holidays.length && (
                            <p className="text-sm font-semibold opacity-70" style={{ color: '#2B3235' }}>No holidays configured.</p>
                          )}
                          {holidays.map((h) => (
                            <div key={h.id} className="p-4 border flex items-start justify-between gap-3" style={{ borderRadius: 10, background: '#F8F6E8', borderColor: '#ECE4B7' }}>
                              <div>
                                <p className="font-black text-2xl" style={{ color: '#2B3235' }}>{h.name}</p>
                                <p className="text-base font-semibold" style={{ color: '#2B3235', opacity: 0.9 }}>{h.date}</p>
                                <p className="text-sm" style={{ color: '#2B3235', opacity: 0.7 }}>{h.desc}</p>
                              </div>
                              {isRegistrar && (
                                <button type="button" onClick={() => handleDeleteHoliday(h.id)}>
                                  <Trash2 size={16} className="text-red-500" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {key === 'noclass' && (
                    <div className="space-y-4">
                      {isRegistrar && (
                        <div className="p-4 border" style={{ borderRadius: 10, background: '#EDF4FF', borderColor: '#C8DCF8' }}>
                          <h4 className="font-black text-lg mb-3" style={{ color: '#2B3235' }}>Add No-Class Period</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="form-label">Start Date</label>
                              <input type="date" className={inputStyle} value={ncForm.start} onChange={(e) => setNcForm((h) => ({ ...h, start: e.target.value }))} />
                            </div>
                            <div>
                              <label className="form-label">End Date</label>
                              <input type="date" className={inputStyle} value={ncForm.end} onChange={(e) => setNcForm((h) => ({ ...h, end: e.target.value }))} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="form-label">Reason</label>
                              <input className={inputStyle} placeholder="e.g., Spring Break" value={ncForm.reason} onChange={(e) => setNcForm((h) => ({ ...h, reason: e.target.value }))} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="form-label">Description (Optional)</label>
                              <input className={inputStyle} placeholder="e.g., No classes scheduled" value={ncForm.desc} onChange={(e) => setNcForm((h) => ({ ...h, desc: e.target.value }))} />
                            </div>
                            <div className="sm:col-span-2">
                              <button type="button" className="w-full py-2.5 text-white font-bold flex items-center justify-center gap-2" style={{ borderRadius: 10, background: '#2563EB' }} onClick={handleAddNoClass} disabled={saving || !activeSchoolYearId}>
                                <Plus size={15} /> Add No-Class Period
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-black text-lg mb-3" style={{ color: '#2B3235' }}>Configured No-Class Periods</h4>
                        <div className="space-y-2">
                          {!noClassPeriods.length && (
                            <p className="text-sm font-semibold opacity-70" style={{ color: '#2B3235' }}>No no-class periods configured.</p>
                          )}
                          {noClassPeriods.map((h) => (
                            <div key={h.id} className="p-4 border flex items-start justify-between gap-3" style={{ borderRadius: 10, background: '#EDF4FF', borderColor: '#C8DCF8' }}>
                              <div>
                                <p className="font-black text-2xl" style={{ color: '#2B3235' }}>{h.reason}</p>
                                <p className="text-base font-semibold" style={{ color: '#2B3235', opacity: 0.9 }}>{h.start} to {h.end}</p>
                                <p className="text-sm" style={{ color: '#2B3235', opacity: 0.7 }}>{h.desc}</p>
                              </div>
                              {isRegistrar && (
                                <button type="button" onClick={() => handleDeleteNoClass(h.id)}>
                                  <Trash2 size={16} className="text-red-500" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {key === 'exams' && (
                    <div className="space-y-4">
                      <div className="flex gap-2 mb-2">
                        {['1', '2'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setExamTab(t)}
                            className="px-6 py-2 text-sm font-bold border"
                            style={
                              examTab === t
                                ? { background: '#800000', color: '#fff', borderRadius: 10, borderColor: '#800000' }
                                : { color: '#2B3235', borderRadius: 10, background: '#fff', borderColor: '#E5E7EB' }
                            }
                          >
                            Semester {t}
                          </button>
                        ))}
                      </div>

                      {[
                        { key: 'p1', label: 'P1 Period', bg: '#FFF5F5', border: '#F3CACA' },
                        { key: 'p2', label: 'P2 Period', bg: '#FFFAF0', border: '#F5D5A3' },
                        { key: 'p3', label: 'P3 Period', bg: '#FBF5FF', border: '#E9D8FD' },
                        { key: 'rbe', label: 'RBE Period', bg: '#F0FFF4', border: '#B7E4C7' },
                      ].map((p) => (
                        <div key={p.key} className="p-4 border" style={{ borderRadius: 10, background: p.bg, borderColor: p.border }}>
                          <h4 className="font-black text-lg mb-3" style={{ color: '#2B3235' }}>{p.label}</h4>
                          <div className="space-y-2">
                            {renderExamLevel(examTab, p.key, 'fr', 'Freshmen')}
                            {renderExamLevel(examTab, p.key, 'up', 'Upperclassmen')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
