import React, { useState } from 'react';
import {
  BarChart3, PieChart, X, Download, Wrench, AlertTriangle, Building2, Users, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart as RePie, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import Layout from '../components/Layout';
import ProgressStatCards from '../components/ProgressStatCards';

const utilizationData = [
  { room: 'ENG-201', hours: 42, building: 'Engineering' },
  { room: 'PH-102', hours: 38, building: 'Phinma Hall' },
  { room: 'ENG-101', hours: 36, building: 'Engineering' },
  { room: 'MB-101', hours: 31, building: 'Merlo' },
  { room: 'BB-101', hours: 28, building: 'Business' },
];

const approvalData = [
  { week: 'W1', approved: 12, rejected: 2, pending: 5 },
  { week: 'W2', approved: 18, rejected: 1, pending: 4 },
  { week: 'W3', approved: 14, rejected: 3, pending: 7 },
  { week: 'W4', approved: 20, rejected: 0, pending: 3 },
];

const requestTypeData = [
  { name: 'Academic', value: 58, color: '#800000' },
  { name: 'Non-academic', value: 22, color: '#CA8A04' },
  { name: 'Maintenance', value: 12, color: '#64748B' },
  { name: 'Ad-hoc', value: 8, color: '#16A34A' },
];

const peakHourData = [
  { hour: '7a', load: 12 },
  { hour: '9a', load: 45 },
  { hour: '11a', load: 52 },
  { hour: '1p', load: 48 },
  { hour: '3p', load: 38 },
  { hour: '5p', load: 22 },
];

const buildingOccupancy = [
  { name: 'Engineering', pct: 78 },
  { name: 'Phinma', pct: 64 },
  { name: 'Merlo', pct: 41 },
  { name: 'Business', pct: 55 },
];

const maintenanceRows = [
  { id: 1, room: 'ENG-202', issue: 'AC service', date: 'Apr 14, 2026', cost: '₱12,400' },
  { id: 2, room: 'PH-105', issue: 'Projector bulb', date: 'Apr 18, 2026', cost: '₱8,200' },
];

function Modal({ title, children, onClose }) {
  const r = 10;
  return (
    <div className="modal-overlay z-[1001]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl relative m-4 border border-gray-100"
        style={{ borderRadius: r }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-black text-lg" style={{ color: '#2B3235' }}>{title}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100" style={{ borderRadius: r }}>
            <X size={20} style={{ color: '#2B3235' }} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [modal, setModal] = useState(null);

  const stats = [
    { label: 'Reports run (30d)', value: 42, icon: BarChart3, accent: 'total' },
    { label: 'Avg. utilization', value: '68%', icon: PieChart, accent: 'approved' },
    { label: 'Open conflicts', value: 3, icon: AlertTriangle, accent: 'pending' },
    { label: 'Maintenance tickets', value: 8, icon: Wrench, accent: 'neutral' },
  ];

  const exportCsv = () => {
    const rows = [['Room', 'Building', 'Hours'], ...utilizationData.map((r) => [r.room, r.building, r.hours])];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ifss-utilization.csv';
    a.click();
    URL.revokeObjectURL(url);
    setModal(null);
  };

  const btn = { borderRadius: 10 };

  return (
    <Layout
      title="Reports and Analytics"
      subtitle="Utilization, approvals, maintenance, and exports for IFSS operations"
    >
      <ProgressStatCards items={stats} />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[10px] border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase mb-2" style={{ color: '#2B3235', opacity: 0.65 }}>Key Insight</p>
          <p className="text-sm font-semibold" style={{ color: '#2B3235' }}>
            Engineering rooms are consistently above 75% load during mid-day blocks.
          </p>
        </div>
        <div className="bg-white rounded-[10px] border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase mb-2" style={{ color: '#2B3235', opacity: 0.65 }}>Risk Watch</p>
          <p className="text-sm font-semibold" style={{ color: '#2B3235' }}>
            3 unresolved schedule conflicts may impact registrar turnaround this week.
          </p>
        </div>
        <div className="bg-white rounded-[10px] border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase mb-2" style={{ color: '#2B3235', opacity: 0.65 }}>Recommendation</p>
          <p className="text-sm font-semibold" style={{ color: '#2B3235' }}>
            Shift 1-2 large sessions to PH/MB blocks to balance building utilization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="bg-white rounded-[10px] shadow-md border border-gray-100 p-6">
          <h3 className="font-bold text-base mb-1" style={{ color: '#2B3235' }}>Most occupied / utilized rooms</h3>
          <p className="text-xs font-medium mb-4" style={{ color: '#2B3235', opacity: 0.65 }}>
            Booked hours by venue
          </p>
          <div className="h-56 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" tick={{ fill: '#2B3235', fontSize: 11 }} />
                <YAxis dataKey="room" type="category" width={72} tick={{ fill: '#2B3235', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #eee' }} labelStyle={{ color: '#2B3235', fontWeight: 700 }} />
                <Bar dataKey="hours" fill="#800000" radius={[0, 10, 10, 0]} name="Booked hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button type="button" className="btn-maroon w-full justify-center" style={btn} onClick={() => setModal('util')}>
            Full utilization report
          </button>
        </div>

        <div className="bg-white rounded-[10px] shadow-md border border-gray-100 p-6">
          <h3 className="font-bold text-base mb-1" style={{ color: '#2B3235' }}>Approval throughput</h3>
          <p className="text-xs font-medium mb-4" style={{ color: '#2B3235', opacity: 0.65 }}>
            Weekly outcomes (academic &amp; non-academic)
          </p>
          <div className="h-56 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="week" tick={{ fill: '#2B3235', fontSize: 11 }} />
                <YAxis tick={{ fill: '#2B3235', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 10 }} />
                <Bar dataKey="approved" stackId="a" fill="#16A34A" name="Approved" />
                <Bar dataKey="pending" stackId="a" fill="#CA8A04" name="Pending" />
                <Bar dataKey="rejected" stackId="a" fill="#DC2626" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button type="button" className="btn-maroon w-full justify-center" style={btn} onClick={() => setModal('approval')}>
            Approval analytics
          </button>
        </div>

        <div className="bg-white rounded-[10px] shadow-md border border-gray-100 p-6">
          <h3 className="font-bold text-base mb-1" style={{ color: '#2B3235' }}>Request mix</h3>
          <p className="text-xs font-medium mb-4" style={{ color: '#2B3235', opacity: 0.65 }}>
            Share of request types in IFSS
          </p>
          <div className="h-56 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie data={requestTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72}>
                  {requestTypeData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePie>
            </ResponsiveContainer>
          </div>
          <button type="button" className="btn-maroon w-full justify-center" style={btn} onClick={() => setModal('mix')}>
            Request type breakdown
          </button>
        </div>

        <div className="bg-white rounded-[10px] shadow-md border border-gray-100 p-6">
          <h3 className="font-bold text-base mb-1" style={{ color: '#2B3235' }}>Peak campus load</h3>
          <p className="text-xs font-medium mb-4" style={{ color: '#2B3235', opacity: 0.65 }}>
            Relative bookings by time band
          </p>
          <div className="h-56 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="hour" tick={{ fill: '#2B3235', fontSize: 11 }} />
                <YAxis tick={{ fill: '#2B3235', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 10 }} />
                <Line type="monotone" dataKey="load" stroke="#800000" strokeWidth={2} dot={{ fill: '#800000', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <button type="button" className="btn-maroon w-full justify-center" style={btn} onClick={() => setModal('peak')}>
            Peak hours detail
          </button>
        </div>

        <div className="bg-white rounded-[10px] shadow-md border border-gray-100 p-6">
          <h3 className="font-bold text-base mb-1 flex items-center gap-2" style={{ color: '#2B3235' }}>
            <Building2 size={18} className="text-[#800000]" /> Building occupancy index
          </h3>
          <p className="text-xs font-medium mb-4" style={{ color: '#2B3235', opacity: 0.65 }}>
            Percent of schedulable slots filled
          </p>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildingOccupancy} layout="vertical" margin={{ left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#2B3235', fontSize: 11 }} unit="%" />
                <YAxis dataKey="name" type="category" width={72} tick={{ fill: '#2B3235', fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 10 }} />
                <Bar dataKey="pct" fill="#800000" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button type="button" className="btn-maroon w-full justify-center" style={btn} onClick={() => setModal('buildings')}>
            Building comparison
          </button>
        </div>

        <div className="bg-white rounded-[10px] shadow-md border border-gray-100 p-6">
          <h3 className="font-bold text-base mb-1 flex items-center gap-2" style={{ color: '#2B3235' }}>
            <Wrench size={18} className="text-[#800000]" /> Maintenance &amp; cost
          </h3>
          <p className="text-xs font-medium mb-4" style={{ color: '#2B3235', opacity: 0.65 }}>
            Upcoming work orders (sample)
          </p>
          <ul className="space-y-2 mb-4 text-sm" style={{ color: '#2B3235' }}>
            {maintenanceRows.map((m) => (
              <li key={m.id} className="flex justify-between border border-gray-100 px-3 py-2 rounded-[10px]">
                <span className="font-semibold">{m.room}</span>
                <span className="text-xs opacity-70">{m.date}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-maroon w-full justify-center" style={btn} onClick={() => setModal('maint')}>
            Maintenance ledger
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn-outline-maroon gap-2" style={btn} onClick={() => setModal('export')}>
          <Download size={16} /> Export data package
        </button>
        <button type="button" className="btn-outline-maroon gap-2" style={btn} onClick={() => setModal('conflicts')}>
          <AlertTriangle size={16} /> Scheduling conflicts
        </button>
        <button type="button" className="btn-outline-maroon gap-2" style={btn} onClick={() => setModal('users')}>
          <Users size={16} /> Active users snapshot
        </button>
        <button type="button" className="btn-outline-maroon gap-2" style={btn} onClick={() => setModal('sla')}>
          <Clock size={16} /> SLA turnaround
        </button>
      </div>

      {modal === 'util' && (
        <Modal title="Room utilization report" onClose={() => setModal(null)}>
          <p className="text-sm mb-4" style={{ color: '#2B3235', opacity: 0.85 }}>
            Ranked by scheduled hours. Use for load balancing and preventive maintenance planning.
          </p>
          <table className="w-full text-sm border border-gray-100 rounded-[10px] overflow-hidden">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="text-left py-2 px-3 font-bold" style={{ color: '#2B3235' }}>Room</th>
                <th className="text-left py-2 px-3 font-bold" style={{ color: '#2B3235' }}>Building</th>
                <th className="text-right py-2 px-3 font-bold" style={{ color: '#2B3235' }}>Hours</th>
                <th className="text-right py-2 px-3 font-bold" style={{ color: '#2B3235' }}>Util.</th>
              </tr>
            </thead>
            <tbody>
              {utilizationData.map((row, i) => (
                <tr key={row.room} className="border-t border-gray-100">
                  <td className="py-2 px-3 font-semibold" style={{ color: '#2B3235' }}>{row.room}</td>
                  <td className="py-2 px-3" style={{ color: '#2B3235', opacity: 0.8 }}>{row.building}</td>
                  <td className="py-2 px-3 text-right font-mono">{row.hours}</td>
                  <td className="py-2 px-3 text-right font-bold text-[#800000]">{85 - i * 7}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {modal === 'approval' && (
        <Modal title="Approval pipeline analytics" onClose={() => setModal(null)}>
          <p className="text-sm mb-4" style={{ color: '#2B3235', opacity: 0.85 }}>
            Weekly trend of registrar and dean decisions. Pending spikes may need staffing adjustments.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="approved" fill="#16A34A" name="Approved" />
                <Bar dataKey="pending" fill="#CA8A04" name="Pending" />
                <Bar dataKey="rejected" fill="#DC2626" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Modal>
      )}

      {modal === 'mix' && (
        <Modal title="Request type breakdown" onClose={() => setModal(null)}>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie data={requestTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={88}>
                  {requestTypeData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePie>
            </ResponsiveContainer>
          </div>
          <p className="text-sm" style={{ color: '#2B3235', opacity: 0.8 }}>
            Academic requests dominate IFSS volume; maintenance and ad-hoc bookings are tracked separately for facilities budgeting.
          </p>
        </Modal>
      )}

      {modal === 'peak' && (
        <Modal title="Peak hours detail" onClose={() => setModal(null)}>
          <p className="text-sm mb-4" style={{ color: '#2B3235', opacity: 0.85 }}>
            Midday bands show the highest concurrent room usage. Consider staggered exams or overflow rooms during 11:00–14:00.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakHourData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="stepAfter" dataKey="load" stroke="#800000" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Modal>
      )}

      {modal === 'buildings' && (
        <Modal title="Building comparison" onClose={() => setModal(null)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-bold" style={{ color: '#2B3235' }}>Building</th>
                <th className="text-right py-2 font-bold" style={{ color: '#2B3235' }}>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {buildingOccupancy.map((b) => (
                <tr key={b.name} className="border-b border-gray-100">
                  <td className="py-2 font-semibold" style={{ color: '#2B3235' }}>{b.name}</td>
                  <td className="py-2 text-right font-black text-[#800000]">{b.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {modal === 'maint' && (
        <Modal title="Maintenance ledger" onClose={() => setModal(null)}>
          <table className="w-full text-sm border border-gray-100 rounded-[10px] overflow-hidden">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="text-left py-2 px-3 font-bold" style={{ color: '#2B3235' }}>Room</th>
                <th className="text-left py-2 px-3 font-bold" style={{ color: '#2B3235' }}>Issue</th>
                <th className="text-left py-2 px-3 font-bold" style={{ color: '#2B3235' }}>Date</th>
                <th className="text-right py-2 px-3 font-bold" style={{ color: '#2B3235' }}>Est.</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRows.map((m) => (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="py-2 px-3 font-semibold">{m.room}</td>
                  <td className="py-2 px-3">{m.issue}</td>
                  <td className="py-2 px-3">{m.date}</td>
                  <td className="py-2 px-3 text-right font-bold text-[#800000]">{m.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {modal === 'export' && (
        <Modal title="Export data package" onClose={() => setModal(null)}>
          <p className="text-sm mb-4" style={{ color: '#2B3235', opacity: 0.85 }}>
            Download utilization as CSV. Other bundles (PDF summary, full audit) can be wired to your API later.
          </p>
          <button type="button" className="btn-maroon gap-2 justify-center w-full py-3" style={btn} onClick={exportCsv}>
            <Download size={18} /> Download utilization CSV
          </button>
        </Modal>
      )}

      {modal === 'conflicts' && (
        <Modal title="Scheduling conflicts" onClose={() => setModal(null)}>
          <ul className="space-y-3 text-sm" style={{ color: '#2B3235' }}>
            <li className="p-3 border border-amber-200 bg-amber-50 rounded-[10px]">
              <strong>ENG-101</strong> — Double booking Thu 10:00 (BIO-101 vs BSIT lab)
            </li>
            <li className="p-3 border border-amber-200 bg-amber-50 rounded-[10px]">
              <strong>PH-102</strong> — Exam block overlaps organization activity
            </li>
            <li className="p-3 border border-amber-200 bg-amber-50 rounded-[10px]">
              <strong>BB-101</strong> — Registrar hold vs department reservation
            </li>
          </ul>
        </Modal>
      )}

      {modal === 'users' && (
        <Modal title="Active users snapshot" onClose={() => setModal(null)}>
          <p className="text-sm mb-4" style={{ color: '#2B3235', opacity: 0.85 }}>
            Concurrent sessions today: <strong>128</strong>. Peak login window 08:00–09:00. Breakdown by role mirrors your System Administration directory.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-4 bg-[#F9FAFB] rounded-[10px]"><strong>Faculty</strong><br />54 active</div>
            <div className="p-4 bg-[#F9FAFB] rounded-[10px]"><strong>Staff</strong><br />41 active</div>
            <div className="p-4 bg-[#F9FAFB] rounded-[10px]"><strong>Students</strong><br />33 active</div>
            <div className="p-4 bg-[#F9FAFB] rounded-[10px]"><strong>Admins</strong><br />12 active</div>
          </div>
        </Modal>
      )}

      {modal === 'sla' && (
        <Modal title="SLA turnaround" onClose={() => setModal(null)}>
          <p className="text-sm mb-4" style={{ color: '#2B3235', opacity: 0.85 }}>
            Median time from submission to registrar decision: <strong>1.6 business days</strong>. Dean step adds avg. <strong>0.8 days</strong> when GSD is required.
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Academic', d: 1.6 }, { name: 'Non-acad.', d: 2.1 }, { name: 'Urgent', d: 0.5 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#2B3235' }} />
                <YAxis unit="d" tick={{ fontSize: 11, fill: '#2B3235' }} />
                <Tooltip />
                <Bar dataKey="d" fill="#800000" radius={[10, 10, 0, 0]} name="Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
