import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, AlertTriangle, Calendar, CheckCircle, Clock, XCircle, Filter, Search } from 'lucide-react';
import Layout from '../components/Layout';
import { 
  subscribeMaintenanceSchedules, 
  subscribeMaintenanceReports,
  acknowledgeMaintenanceReport,
  resolveMaintenanceReport,
  completeMaintenanceSchedule,
  updateMaintenanceReport,
} from '../services/maintenanceService';
import { useModal } from '../hooks/useModal';
import LoadingModal from '../components/modals/LoadingModal';
import ScheduleMaintenanceModal from '../components/modals/ScheduleMaintenanceModal';
import { ModalRenderer } from '../components/modals/ModalProvider';

export default function MaintenanceDashboard() {
  const navigate = useNavigate();
  const { showConfirm, showNotification, confirmState, notificationState } = useModal();
  
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'schedules'
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Subscribe to maintenance schedules
  useEffect(() => {
    const unsubscribe = subscribeMaintenanceSchedules(
      (data) => setSchedules(data),
      (error) => console.error('Error loading schedules:', error)
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to maintenance reports
  useEffect(() => {
    const unsubscribe = subscribeMaintenanceReports(
      (data) => setReports(data),
      (error) => console.error('Error loading reports:', error)
    );
    return () => unsubscribe();
  }, []);

  // Filter and search
  const filteredReports = reports.filter((report) => {
    const statusMatch = filterStatus === 'all' || report.status === filterStatus;
    const searchMatch = !searchQuery || 
      report.roomName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.buildingName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.issue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedByName?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  const filteredSchedules = schedules.filter((schedule) => {
    const statusMatch = filterStatus === 'all' || schedule.status === filterStatus;
    const searchMatch = !searchQuery ||
      schedule.roomName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.buildingName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  // Stats
  const reportStats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    acknowledged: reports.filter(r => r.status === 'acknowledged').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  const scheduleStats = {
    total: schedules.length,
    scheduled: schedules.filter(s => s.status === 'scheduled').length,
    inProgress: schedules.filter(s => s.status === 'in-progress').length,
    completed: schedules.filter(s => s.status === 'completed').length,
  };

  // Handlers
  const handleScheduleFromReport = (report) => {
    setSelectedReport(report);
    setScheduleModalOpen(true);
  };

  const handleScheduleSuccess = () => {
    showNotification({
      type: 'success',
      title: 'Maintenance scheduled',
      message: 'The maintenance has been scheduled successfully.',
      autoCloseMs: 2000,
    });
    setSelectedReport(null);
  };

  const handleAcknowledge = async (reportId) => {
    const confirmed = await showConfirm({
      title: 'Acknowledge report?',
      message: 'This will mark the report as acknowledged and notify the reporter.',
      confirmText: 'Acknowledge',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    setIsLoading(true);
    setLoadingMessage('Acknowledging report...');

    try {
      await acknowledgeMaintenanceReport(reportId, 'gsd-uid', 'GSD');
      showNotification({
        type: 'success',
        title: 'Report acknowledged',
        message: 'The maintenance report has been acknowledged.',
        autoCloseMs: 2000,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to acknowledge',
        message: error.message || 'Could not acknowledge the report.',
        autoCloseMs: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartProgress = async (reportId) => {
    setIsLoading(true);
    setLoadingMessage('Updating status...');

    try {
      await updateMaintenanceReport(reportId, { status: 'in-progress' });
      showNotification({
        type: 'success',
        title: 'Status updated',
        message: 'Maintenance is now in progress.',
        autoCloseMs: 2000,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to update',
        message: error.message,
        autoCloseMs: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (reportId) => {
    const confirmed = await showConfirm({
      title: 'Mark as resolved?',
      message: 'This will close the maintenance report.',
      confirmText: 'Resolve',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    setIsLoading(true);
    setLoadingMessage('Resolving report...');

    try {
      await resolveMaintenanceReport(reportId, 'Issue resolved', 'gsd-uid', 'GSD');
      showNotification({
        type: 'success',
        title: 'Report resolved',
        message: 'The maintenance report has been marked as resolved.',
        autoCloseMs: 2000,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to resolve',
        message: error.message,
        autoCloseMs: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSchedule = async (scheduleId) => {
    const confirmed = await showConfirm({
      title: 'Complete maintenance?',
      message: 'This will mark the maintenance as completed and restore the room to operational status.',
      confirmText: 'Complete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    setIsLoading(true);
    setLoadingMessage('Completing maintenance...');

    try {
      await completeMaintenanceSchedule(scheduleId);
      showNotification({
        type: 'success',
        title: 'Maintenance completed',
        message: 'The room has been restored to operational status.',
        autoCloseMs: 2000,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to complete',
        message: error.message,
        autoCloseMs: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'acknowledged': return 'badge-approved';
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200 text-xs font-bold px-3 py-1 rounded-full border';
      case 'resolved': return 'badge-approved';
      case 'scheduled': return 'badge-pending';
      case 'completed': return 'badge-approved';
      default: return 'badge-pending';
    }
  };

  return (
    <Layout 
      title="Maintenance Dashboard" 
      subtitle="GSD - Manage room maintenance schedules and reports"
    >
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {activeTab === 'reports' ? (
          <>
            <div className="stat-card">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Total Reports</p>
                <p className="text-3xl font-black text-[#2B3235]">{reportStats.total}</p>
              </div>
              <div className="stat-icon-box"><AlertTriangle size={18} /></div>
            </div>
            <div className="stat-card">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Pending</p>
                <p className="text-3xl font-black text-yellow-600">{reportStats.pending}</p>
              </div>
              <div className="stat-icon-box bg-yellow-50"><Clock size={18} className="text-yellow-600" /></div>
            </div>
            <div className="stat-card">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">In Progress</p>
                <p className="text-3xl font-black text-blue-600">{reportStats.inProgress}</p>
              </div>
              <div className="stat-icon-box bg-blue-50"><Wrench size={18} className="text-blue-600" /></div>
            </div>
            <div className="stat-card">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Resolved</p>
                <p className="text-3xl font-black text-green-600">{reportStats.resolved}</p>
              </div>
              <div className="stat-icon-box bg-green-50"><CheckCircle size={18} className="text-green-600" /></div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Total Schedules</p>
                <p className="text-3xl font-black text-[#2B3235]">{scheduleStats.total}</p>
              </div>
              <div className="stat-icon-box"><Calendar size={18} /></div>
            </div>
            <div className="stat-card">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Scheduled</p>
                <p className="text-3xl font-black text-yellow-600">{scheduleStats.scheduled}</p>
              </div>
              <div className="stat-icon-box bg-yellow-50"><Clock size={18} className="text-yellow-600" /></div>
            </div>
            <div className="stat-card">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">In Progress</p>
                <p className="text-3xl font-black text-blue-600">{scheduleStats.inProgress}</p>
              </div>
              <div className="stat-icon-box bg-blue-50"><Wrench size={18} className="text-blue-600" /></div>
            </div>
            <div className="stat-card">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Completed</p>
                <p className="text-3xl font-black text-green-600">{scheduleStats.completed}</p>
              </div>
              <div className="stat-icon-box bg-green-50"><CheckCircle size={18} className="text-green-600" /></div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="inline-flex w-fit items-center p-1 gap-1 shadow-sm" style={{ background: '#F9FAFB', borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-2.5 text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-[#800000] text-white'
                : 'bg-transparent text-[#2B3235] hover:bg-gray-100'
            }`}
            style={{ borderRadius: 10 }}
          >
            <AlertTriangle size={16} />
            Maintenance Reports ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className={`px-6 py-2.5 text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'schedules'
                ? 'bg-[#800000] text-white'
                : 'bg-transparent text-[#2B3235] hover:bg-gray-100'
            }`}
            style={{ borderRadius: 10 }}
          >
            <Calendar size={16} />
            Maintenance Schedules ({schedules.length})
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000]/20"
            >
              <option value="all">All Status</option>
              {activeTab === 'reports' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </>
              ) : (
                <>
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </>
              )}
            </select>
          </div>
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by room, building, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000]/20"
              />
            </div>
          </div>
          {(filterStatus !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}
              className="px-3 py-2 text-xs font-bold text-[#800000] hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'reports' ? (
        <div className="space-y-6">
          {/* Pending Repair Tickets */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-base text-[#2B3235]">🔴 Pending Repair Tickets</h2>
                <p className="text-xs text-gray-500 mt-1">New reports that need immediate attention</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {filteredReports.filter(r => r.status === 'pending').length} NEW
              </span>
            </div>
            
            {filteredReports.filter(r => r.status === 'pending').length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle size={36} className="mx-auto mb-2" />
                <p className="text-sm">No pending repair tickets. Great job!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.filter(r => r.status === 'pending').map((report) => (
                  <div key={report.id} className="border-2 border-red-200 bg-red-50 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${report.priority === 'urgent' || report.priority === 'high' ? 'bg-red-200' : 'bg-orange-200'}`}>
                          <AlertTriangle size={20} className={report.priority === 'urgent' || report.priority === 'high' ? 'text-red-700' : 'text-orange-700'} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getPriorityColor(report.priority)}`}>
                              {report.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                            </span>
                            <span className="text-xs font-bold text-red-600">⚠️ NEEDS ACTION</span>
                          </div>
                          <h3 className="font-bold text-sm text-[#2B3235] mb-1">
                            {report.roomName} - {report.buildingName}
                          </h3>
                          <p className="text-xs text-gray-700 mb-2 font-semibold">{report.issue}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>👤 {report.reportedByName}</span>
                            <span>•</span>
                            <span>📧 {report.reportedByEmail || 'N/A'}</span>
                            <span>•</span>
                            <span>🕐 {new Date(report.createdAt?.seconds * 1000 || Date.now()).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(report.id)}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
                      >
                        ✓ Acknowledge Report
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScheduleFromReport(report)}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-[#800000] text-white hover:bg-[#600000] transition-all"
                      >
                        📅 Schedule Maintenance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Repair Tickets */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-base mb-4 text-[#2B3235]">All Repair Tickets</h2>
            
            {filteredReports.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <AlertTriangle size={48} className="mx-auto mb-3" />
                <p className="text-sm font-bold mb-1">No repair tickets found</p>
                <p className="text-xs">Tickets will appear here when users report maintenance issues.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <div key={report.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getPriorityColor(report.priority)}`}>
                            {report.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                          </span>
                          <span className={getStatusBadge(report.status)}>
                            {report.status?.replace('-', ' ').toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-[#2B3235] mb-1">
                          📍 {report.roomName} - {report.buildingName}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">{report.issue}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Reported by: {report.reportedByName}</span>
                          <span>•</span>
                          <span>{new Date(report.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                        </div>
                        {report.acknowledgedByName && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Acknowledged by {report.acknowledgedByName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {report.status === 'pending' && !report.scheduleId && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(report.id)}
                            className="btn-outline-maroon text-xs py-2 px-4"
                          >
                            Acknowledge
                          </button>
                          <button
                            type="button"
                            onClick={() => handleScheduleFromReport(report)}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#800000] text-white hover:bg-[#600000] transition-all"
                          >
                            📅 Schedule Maintenance
                          </button>
                        </>
                      )}
                      {report.status === 'acknowledged' && !report.scheduleId && (
                        <button
                          type="button"
                          onClick={() => handleScheduleFromReport(report)}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#800000] text-white hover:bg-[#600000] transition-all"
                        >
                          📅 Schedule Maintenance
                        </button>
                      )}
                      {report.scheduleId && (report.status === 'pending' || report.status === 'acknowledged') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-green-600">✓ Maintenance scheduled</span>
                          <button
                            type="button"
                            onClick={() => handleStartProgress(report.id)}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                          >
                            🔧 Start Repair
                          </button>
                        </div>
                      )}
                      {report.status === 'in-progress' && (
                        <button
                          type="button"
                          onClick={() => handleResolve(report.id)}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
                        >
                          ✓ Mark as Resolved
                        </button>
                      )}
                      {report.status === 'resolved' && (
                        <span className="text-xs font-semibold text-gray-500">✓ Resolved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-base mb-4 text-[#2B3235]">Maintenance Schedules</h2>
          
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar size={48} className="mx-auto mb-3" />
              <p className="text-sm font-bold mb-1">No maintenance schedules found</p>
              <p className="text-xs">Schedule maintenance from room details pages.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={getStatusBadge(schedule.status)}>
                          {schedule.status?.replace('-', ' ') || 'Scheduled'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#2B3235] mb-1">
                        {schedule.roomName} - {schedule.buildingName}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">{schedule.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Start: {schedule.startDate}</span>
                        <span>•</span>
                        <span>End: {schedule.endDate}</span>
                      </div>
                    </div>
                  </div>
                  {schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteSchedule(schedule.id)}
                        className="btn-maroon text-xs py-2 px-4"
                      >
                        Complete Maintenance
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <LoadingModal isOpen={isLoading} message={loadingMessage} />
      <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
      
      {/* Schedule Maintenance Modal */}
      {selectedReport && (
        <ScheduleMaintenanceModal
          isOpen={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setSelectedReport(null);
          }}
          room={{
            id: selectedReport.roomId,
            docId: selectedReport.roomDocId || selectedReport.roomId, // Use roomDocId if available
            name: selectedReport.roomName,
            buildingId: selectedReport.buildingId,
          }}
          buildingName={selectedReport.buildingName}
          reportId={selectedReport.id}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </Layout>
  );
}
