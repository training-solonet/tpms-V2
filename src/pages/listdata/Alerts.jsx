// src/pages/Alerts.jsx
import React, { useEffect, useState, useCallback } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { alertEventsAPI } from '../../services/alertEvents.api.js';
import { Button } from '../../components/common/Button.jsx';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '../../components/common/DropdownMenu.jsx';
import AlertModal from '../../components/common/AlertModal.jsx';
import DatePicker from '../../components/common/DatePicker.jsx';
import { useAlertNotifications } from '../../hooks/useAlertNotifications.js';

const Alerts = () => {
  const { refresh: refreshNotifications } = useAlertNotifications();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const pageSize = 20;

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Loading alerts from Alert Events API...');

      const params = {
        page,
        limit: pageSize,
        sortBy: 'created_at',
        sortOrder: 'desc',
      };

      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;

      // Add date range from date pickers
      if (dateFrom) {
        params.date_from = dateFrom.toISOString().split('T')[0];
      }
      if (dateTo) {
        params.date_to = dateTo.toISOString().split('T')[0];
      }

      const response = await alertEventsAPI.getAlerts(params);
      console.log('✅ Alerts response:', response);

      if (response.success) {
        setAlerts(response.data || []);
        setPagination(response.pagination || null);
      }
    } catch (error) {
      console.error('❌ Failed to load alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus, dateFrom, dateTo, page]);

  const loadStats = useCallback(async () => {
    try {
      const response = await alertEventsAPI.getAlertStats(7);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    loadStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAlerts();
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAlerts, loadStats]);

  const handleResolveAlert = async () => {
    if (!selectedAlert || isResolving) return;

    setIsResolving(true);
    setShowModal(false);

    try {
      await alertEventsAPI.resolveAlert(selectedAlert.id);
      console.log('✅ Alert resolved successfully');

      setModalConfig({
        type: 'success',
        title: 'Alert Resolved!',
        message: 'The alert has been marked as resolved successfully.',
      });
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        loadAlerts();
        loadStats();
        refreshNotifications(); // Refresh header notifications immediately
      }, 500);
    } catch (error) {
      console.error('❌ Failed to resolve alert:', error);
      setModalConfig({
        type: 'error',
        title: 'Failed!',
        message: error.message || 'Failed to resolve alert. Please try again.',
      });
      setShowModal(true);
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveAll = async () => {
    setShowModal(false);
    setIsResolving(true);

    try {
      // Fetch ALL active alerts from backend (not just current page)
      console.log('🔄 Fetching all active alerts from backend...');
      const response = await alertEventsAPI.getActiveAlerts();

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch active alerts');
      }

      const allActiveAlerts = Array.isArray(response.data) ? response.data : [];

      if (allActiveAlerts.length === 0) {
        setModalConfig({
          type: 'info',
          title: 'No Active Alerts',
          message: 'There are no active alerts to resolve.',
        });
        setShowModal(true);
        setIsResolving(false);
        return;
      }

      console.log(`🔄 Resolving ${allActiveAlerts.length} alerts from entire database...`);

      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(
        allActiveAlerts.map((alert) => alertEventsAPI.resolveAlert(alert.id))
      );

      // Count successes and failures
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      console.log(`✅ Resolved: ${successful}, ❌ Failed: ${failed}`);

      if (failed === 0) {
        // All succeeded
        setModalConfig({
          type: 'success',
          title: 'Success!',
          message: `${successful} alert(s) have been resolved successfully.`,
        });
      } else if (successful === 0) {
        // All failed
        setModalConfig({
          type: 'error',
          title: 'Failed!',
          message: `Failed to resolve all ${allActiveAlerts.length} alert(s). Please try again.`,
        });
      } else {
        // Partial success
        setModalConfig({
          type: 'warning',
          title: 'Partially Completed',
          message: `${successful} alert(s) resolved successfully, but ${failed} alert(s) failed.`,
        });
      }

      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        loadAlerts();
        loadStats();
        refreshNotifications(); // Refresh header notifications immediately
      }, 500);
    } catch (error) {
      console.error('❌ Failed to resolve all alerts:', error);
      setModalConfig({
        type: 'error',
        title: 'Failed!',
        message: error.message || 'Failed to resolve alerts. Please try again.',
      });
      setShowModal(true);
    } finally {
      setIsResolving(false);
    }
  };

  const openResolveDialog = (alert) => {
    setSelectedAlert(alert);
    setModalConfig({
      type: 'warning',
      title: 'Resolve Alert?',
      message: `Are you sure you want to mark this alert as resolved?\n\n${alert.message}`,
      showCancel: true,
    });
    setShowModal(true);
  };

  const openResolveAllDialog = () => {
    const activeCount = stats?.summary?.active || 0;
    setModalConfig({
      type: 'warning',
      title: 'Resolve All Alerts?',
      message: `Are you sure you want to resolve all ${activeCount} active alert(s) in the entire database?`,
      showCancel: true,
    });
    setShowModal(true);
  };

  const getSeverityColor = (severity) => {
    const sev = String(severity || '').toLowerCase();
    if (sev === 'critical') return 'bg-red-100 text-red-800 border-red-300';
    if (sev === 'warning') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getSeverityIcon = (severity) => {
    const sev = String(severity || '').toLowerCase();
    if (sev === 'critical') return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
    if (sev === 'warning') return <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" />;
    return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alert Events Log</h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time tire pressure & temperature monitoring alerts
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openResolveAllDialog}
                disabled={isResolving || !stats?.summary?.active}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Resolve All ({stats?.summary?.active || 0})
              </button>
              <button
                onClick={() => {
                  loadAlerts();
                  loadStats();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.summary.total}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.summary.active}</p>
                  </div>
                  <ExclamationCircleIcon className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Critical</p>
                    <p className="text-2xl font-bold text-red-600">{stats.summary.critical}</p>
                  </div>
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Warning</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.summary.warning || 0}
                    </p>
                  </div>
                  <ExclamationCircleIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.summary.resolved}</p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Date Range Filters */}
              <div className="flex items-center gap-2">
                <DatePicker
                  value={dateFrom}
                  onChange={(date) => {
                    setDateFrom(date);
                    setPage(1);
                  }}
                  placeholder="Start Date"
                  maxDate={dateTo || new Date()}
                  className="w-40"
                />
                <span className="text-gray-500">-</span>
                <DatePicker
                  value={dateTo}
                  onChange={(date) => {
                    setDateTo(date);
                    setPage(1);
                  }}
                  placeholder="End Date"
                  minDate={dateFrom}
                  maxDate={new Date()}
                  className="w-40"
                />
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom(null);
                      setDateTo(null);
                      setPage(1);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {filterSeverity === 'critical' && (
                      <>
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                        <span>Critical</span>
                      </>
                    )}
                    {filterSeverity === 'warning' && (
                      <>
                        <ExclamationCircleIcon className="h-4 w-4 text-yellow-600" />
                        <span>Warning</span>
                      </>
                    )}
                    {filterSeverity === 'info' && (
                      <>
                        <InformationCircleIcon className="h-4 w-4 text-blue-600" />
                        <span>Info</span>
                      </>
                    )}
                    {!filterSeverity && <span>All Severities</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56 z-[9999]">
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('');
                      setPage(1);
                    }}
                    className="cursor-pointer"
                  >
                    <FunnelIcon className="h-4 w-4 mr-2 text-gray-500" />
                    All Severities
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('critical');
                      setPage(1);
                    }}
                    className="cursor-pointer"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-red-600" />
                    <span>Critical</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      High Priority
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('warning');
                      setPage(1);
                    }}
                    className="cursor-pointer"
                  >
                    <ExclamationCircleIcon className="h-4 w-4 mr-2 text-yellow-600" />
                    <span>Warning</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      Medium
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('info');
                      setPage(1);
                    }}
                    className="cursor-pointer"
                  >
                    <InformationCircleIcon className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Info</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Low Priority
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {filterStatus === 'active'
                      ? 'Active Only'
                      : filterStatus === 'resolved'
                        ? 'Resolved Only'
                        : 'All Status'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48 z-[9999]">
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterStatus('');
                      setPage(1);
                    }}
                  >
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterStatus('active');
                      setPage(1);
                    }}
                  >
                    Active Only
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterStatus('resolved');
                      setPage(1);
                    }}
                  >
                    Resolved Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Alerts List */}
          <div className="rounded-lg overflow-hidden">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center py-12">
                  <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading alerts...</span>
                </div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircleIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">No alerts found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-all ${
                      alert.status === 'active'
                        ? alert.severity === 'critical'
                          ? 'border-l-4 border-l-red-500 border-t-red-100 border-r-red-100 border-b-red-100'
                          : alert.severity === 'warning'
                            ? 'border-l-4 border-l-yellow-500 border-t-yellow-100 border-r-yellow-100 border-b-yellow-100'
                            : 'border-l-4 border-l-blue-500 border-t-blue-100 border-r-blue-100 border-b-blue-100'
                        : 'border-l-4 border-l-gray-300 border-t-gray-200 border-r-gray-200 border-b-gray-200'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="shrink-0">{getSeverityIcon(alert.severity)}</div>

                        {/* Content - Horizontal Layout */}
                        <div className="flex-1 min-w-0 flex items-center gap-4">
                          {/* Main Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {alert.alert?.name || 'Alert Event'}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${getSeverityColor(alert.severity)}`}
                              >
                                {alert.severity}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  alert.status === 'active'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {alert.status === 'active' ? '● Active' : '✓ Resolved'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{alert.message}</p>
                          </div>

                          {/* Metadata - Horizontal */}
                          <div className="flex items-center gap-4 text-xs text-gray-600 shrink-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Truck:</span>
                              <span className="text-gray-900">
                                {alert.truck?.name || `#${alert.truck_id}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Value:</span>
                              <span className="text-gray-900 font-mono">{alert.value}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3.5 w-3.5" />
                              <span className="text-gray-900">
                                {formatTimeAgo(alert.created_at)}
                              </span>
                            </div>
                            {alert.status === 'resolved' && alert.resolved_at && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                <span>{formatTimeAgo(alert.resolved_at)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        {alert.status === 'active' && (
                          <button
                            onClick={() => openResolveDialog(alert)}
                            disabled={isResolving}
                            className="shrink-0 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm px-6 py-3 flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total
                alerts)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        showCancel={modalConfig.showCancel}
        confirmText={modalConfig.type === 'warning' ? 'Yes, Resolve' : 'OK'}
        cancelText="Cancel"
        onConfirm={() => {
          if (modalConfig.type === 'warning') {
            if (modalConfig.title === 'Resolve All Alerts?') {
              handleResolveAll();
            } else {
              handleResolveAlert();
            }
          } else {
            setShowModal(false);
          }
        }}
        onCancel={() => {
          setShowModal(false);
          setSelectedAlert(null);
        }}
      />
    </TailwindLayout>
  );
};

export default Alerts;
