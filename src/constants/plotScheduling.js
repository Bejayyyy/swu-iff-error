/** CAS dean plots first; other college deans follow in order */
export const DEAN_TIER = {
  CAS: 'cas',
  COLLEGE: 'college',
};

export const DEAN_COLLEGE_OPTIONS = [
  { value: 'CAS', label: 'College of Arts and Sciences (CAS)', tier: DEAN_TIER.CAS, priority: 0 },
  { value: 'Medicine', label: 'College of Medicine', tier: DEAN_TIER.COLLEGE, priority: 1 },
  { value: 'IT', label: 'College of IT / Engineering', tier: DEAN_TIER.COLLEGE, priority: 1 },
  { value: 'Business', label: 'College of Business', tier: DEAN_TIER.COLLEGE, priority: 1 },
  { value: 'Nursing', label: 'College of Nursing', tier: DEAN_TIER.COLLEGE, priority: 1 },
];

export const PLOT_REQUEST_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const RECIPIENT_PLOT_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

export function isCasDepartment(department) {
  const d = (department || '').toLowerCase();
  return d.includes('cas')
    || d.includes('arts and sciences')
    || d.includes('college of arts');
}

export function collegeTierFromValue(college) {
  const hit = DEAN_COLLEGE_OPTIONS.find((c) => c.value === college);
  if (hit?.tier) return hit.tier;
  return isCasDepartment(college) ? DEAN_TIER.CAS : DEAN_TIER.COLLEGE;
}

export function collegePriorityFromValue(college) {
  const hit = DEAN_COLLEGE_OPTIONS.find((c) => c.value === college);
  if (hit) return hit.priority;
  return isCasDepartment(college) ? 0 : 1;
}

export function sortRecipientsByPlotOrder(recipients) {
  return [...recipients].sort((a, b) => {
    const tierDiff = (a.priority ?? 1) - (b.priority ?? 1);
    if (tierDiff !== 0) return tierDiff;
    return (a.plotOrder ?? 0) - (b.plotOrder ?? 0);
  });
}
