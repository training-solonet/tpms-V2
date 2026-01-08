import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { devicesApi, trucksApi } from 'services/management';
import { useCRUD } from '../../hooks/useApi2';
import { useAlert } from '../../hooks/useAlert';
import AlertModal from '../../components/common/AlertModal';
import TailwindLayout from '../../components/layout/TailwindLayout';
import { Button } from '../../components/common/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../components/common/DropdownMenu';

function DevicesActionMenu({ device, onEdit, onDelete }) {
  const [showTimestamp] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative z-50 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="More options"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuItem onClick={() => onEdit(device.id)} className="gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Device
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onDelete(device.id)}
            className="gap-3 text-red-600 hover:bg-red-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Vehicle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showTimestamp && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-900 font-medium">
                {device.createdAt && device.createdAt !== '-'
                  ? new Date(device.createdAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created By:</span>
              <span className="text-gray-900 font-medium">{device.createdBy || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated:</span>
              <span className="text-gray-900 font-medium">
                {device.updatedAt && device.updatedAt !== '-'
                  ? new Date(device.updatedAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated By:</span>
              <span className="text-gray-900 font-medium">{device.updatedBy || '-'}</span>
            </div>
            {device.deletedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deleted:</span>
                <span className="text-red-600 font-medium">
                  {new Date(device.deletedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const Devices = () => {
  // State
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use alert hook
  const { showAlert, alertState } = useAlert();

  // Use CRUD hook
  const { remove: deleteDevice } = useCRUD(devicesApi);

  // Filters
  const [query, setQuery] = useState('');
  const [truckFilter, setDeviceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sort state
  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: 'asc',
  });

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? (
        <svg className="w-4 h-4 shrink-0 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3l-6 8h12l-6-8z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 17l6-8H4l6 8z" />
        </svg>
      );
    }
    return null;
  };

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: false,
    createdAt: false,
    updatedAt: false,
  });

  // Toggleable columns (optional columns only)
  const toggleableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
  ];

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch data
  useEffect(() => {
    fetchDevices();
    fetchTrucks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching devices from API...');
      const response = await devicesApi.getAll();
      console.log('📥 Devices API response:', response);

      // Handle different response formats
      let data = [];
      if (response?.data?.devices) {
        data = response.data.devices;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }

      console.log('✅ Devices data loaded:', data.length, 'devices');
      setDevices(data);
    } catch (err) {
      console.error('❌ Error fetching devices:', err);

      // More detailed error handling
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      const errorStatus = err.response?.status;

      if (errorStatus === 404) {
        console.warn('⚠️ Devices endpoint not found (404)');
        showAlert.error(
          'Devices API endpoint not found. Please check backend server.',
          'API Error'
        );
      } else if (errorStatus === 500) {
        console.error('� Server error (500)');
        showAlert.error('Server error occurred. Please try again later.', 'Server Error');
      } else {
        showAlert.error(`Failed to load devices: ${errorMessage}`, 'Error');
      }

      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrucks = async () => {
    try {
      const response = await trucksApi.getAll();
      console.log('📥 Trucks API response:', response);

      // Handle different response formats
      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      console.log('✅ Trucks data:', data);
    } catch (err) {
      console.error('❌ Error fetching trucks:', err);
    }
  };

  // Filter & Search
  const filtered = useMemo(() => {
    let result = devices.filter((device) => {
      const matchQuery =
        !query ||
        // Search by ID
        String(device.id || '').toLowerCase().includes(query.toLowerCase()) ||
        // API shows 'sn' field for serial number
        (device.sn || device.serial_number || '').toLowerCase().includes(query.toLowerCase()) ||
        // API shows 'sim_number' field
        (device.sim_number || device.sim_4g_number || '')
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        // Search by truck name
        device.truck?.name?.toLowerCase().includes(query.toLowerCase()) ||
        // Search by status
        (device.status || '').toLowerCase().includes(query.toLowerCase()) ||
        // Search by installed date
        (device.installed_at || '').toLowerCase().includes(query.toLowerCase());

      const matchTruck = !truckFilter || device.truck_id?.toString() === truckFilter;
      const matchStatus = !statusFilter || device.status === statusFilter;

      return matchQuery && matchTruck && matchStatus;
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal, bVal;

        switch (sortConfig.key) {
          case 'id':
            aVal = a.id;
            bVal = b.id;
            break;
          case 'sn':
            aVal = a.sn || a.serial_number || '';
            bVal = b.sn || b.serial_number || '';
            break;
          case 'simNumber':
            aVal = a.sim_number || a.sim_4g_number || '';
            bVal = b.sim_number || b.sim_4g_number || '';
            break;
          case 'truck':
            aVal = a.truck?.name || a.truck?.truck_number || '';
            bVal = b.truck?.name || b.truck?.truck_number || '';
            break;
          case 'status':
            aVal = a.status || '';
            bVal = b.status || '';
            break;
          case 'createdAt':
            aVal = a.created_at && a.created_at !== '-' ? new Date(a.created_at).getTime() : 0;
            bVal = b.created_at && b.created_at !== '-' ? new Date(b.created_at).getTime() : 0;
            break;
          case 'updatedAt':
            aVal = a.updated_at && a.updated_at !== '-' ? new Date(a.updated_at).getTime() : 0;
            bVal = b.updated_at && b.updated_at !== '-' ? new Date(b.updated_at).getTime() : 0;
            break;
          case 'installed_at':
            aVal =
              a.installed_at && a.installed_at !== '-' ? new Date(a.installed_at).getTime() : 0;
            bVal =
              b.installed_at && b.installed_at !== '-' ? new Date(b.installed_at).getTime() : 0;
            break;
          default:
            aVal = a[sortConfig.key] || '';
            bVal = b[sortConfig.key] || '';
        }

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        // Compare values
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [devices, query, truckFilter, statusFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: devices.length,
      active: devices.filter((d) => d.status === 'active').length,
      inactive: devices.filter((d) => d.status === 'inactive').length,
      filtered: filtered.length,
    };
  }, [devices, filtered]);

  // Get unique status options
  const statusOptions = useMemo(() => {
    return [...new Set(devices.map((d) => d.status).filter(Boolean))];
  }, [devices]);

  // Delete device
  const onDelete = (device) => {
    showAlert.delete(device.sn || `Device #${device.id}`, async () => {
      try {
        await deleteDevice(parseInt(device.id));
        console.log('✅ Device deleted successfully');

        // Reload data dari server untuk memastikan sinkronisasi
        await fetchDevices();

        showAlert.success('Device has been deleted successfully.', 'Deleted!');
      } catch (err) {
        console.error('Error deleting device:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
        showAlert.error(`Failed to delete device: ${errorMessage}`, 'Delete Failed');
      }
    });
  };

  const handleEdit = (id) => {
    window.location.href = `/devices/${id}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TailwindLayout>
      <div className="h-[calc(100vh-80px)] overflow-y-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-900 font-medium">Devices</span>
        </nav>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Device Center</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage gateway, repeater, and IoT devices
              </p>
            </div>
            <Link
              to="/devices/new"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Device
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.filtered}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table with Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Filters Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 flex-1 w-full flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Serial number, truck, SIM 4G, status..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[150px]">
                      {devices.id || 'All Device'}
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[150px]">
                    <DropdownMenuItem onClick={() => setDeviceFilter('')}>
                      All Device
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {devices.map((d) => (
                      <DropdownMenuItem key={d.id} onClick={() => setDeviceFilter(d.id)}>
                        {d.sn || d.serial_number || `Device #${d.id}`}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[130px]">
                      {statusFilter
                        ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
                        : 'All Status'}
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[130px]">
                    <DropdownMenuItem onClick={() => setStatusFilter('')}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {statusOptions.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Per Page Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[120px] whitespace-nowrap">
                      {pageSize} / page
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[120px]">
                    {[10, 25, 50, 100].map((size) => (
                      <DropdownMenuItem
                        key={size}
                        onClick={() => {
                          setPageSize(size);
                          setPage(1);
                        }}
                      >
                        {size} / page
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Column Toggle Dropdown */}
                <div className="relative">
                  <details className="group">
                    <summary className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition-colors list-none">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        />
                      </svg>
                      Columns
                      <svg
                        //Pakai ini jika ingin ada animasi rotasi
                        // className="w-4 h-4 group-open:rotate-180 transition-transform"
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20 max-h-96">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Toggle Columns</p>
                        {toggleableColumns.map((col) => (
                          <label
                            key={col.key}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns[col.key]}
                              onChange={() => toggleColumn(col.key)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (filtered.length === 0) {
                        showAlert('warning', 'No Data', 'No data to export');
                        return;
                      }
                      const csvContent = [
                        ['No', 'Serial Number', 'Truck', 'SIM 4G', 'Status', 'Installed'].join(','),
                        ...filtered.map((d, i) =>
                          [
                            i + 1,
                            d.sn || d.serial_number || '',
                            d.truck?.name || 'Unassigned',
                            d.sim_number || d.sim_4g_number || '',
                            d.status || '',
                            d.installed_at || '',
                          ]
                            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                            .join(',')
                        ),
                      ].join('\n');

                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `devices_${new Date().toISOString().split('T')[0]}.csv`;
                      link.click();
                    }}
                    className="gap-2"
                    title="Export to CSV"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export
                  </Button>

                  {query && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery('');
                        setPage(1);
                      }}
                      className="gap-2"
                      title="Clear search"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                {query ? 'Try adjusting your search' : 'Get started by adding your first device'}
              </p>
              {!query && (
                <Link
                  to="/devices/new"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Device
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        No
                      </th>
                      {visibleColumns.id && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            ID
                            {getSortIcon('id')}
                          </div>
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('sn')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Serial Number
                          {getSortIcon('sn')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('truck')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Truck
                          {getSortIcon('truck')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('simNumber')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          SIM 4G Number
                          {getSortIcon('simNumber')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('installed_at')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Installed
                          {getSortIcon('installed_at')}
                        </div>
                      </th>
                      {visibleColumns.createdAt && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center justify-start gap-2">
                            Created At
                            {getSortIcon('created_at')}
                          </div>
                        </th>
                      )}
                      {visibleColumns.updatedAt && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('updated_at')}
                        >
                          <div className="flex items-center justify-start gap-2">
                            Updated At
                            {getSortIcon('updated_at')}
                          </div>
                        </th>
                      )}

                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginated.map((device, index) => {
                      return (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          {visibleColumns.id && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.id}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {device.sn || device.serial_number || '--'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {device.truck ? (
                              <Link
                                to={`/trucks/${device.truck_id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                              >
                                {device.truck.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.sim_number || device.sim_4g_number || '--'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                device.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : device.status === 'inactive'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {device.status || 'unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(device.installed_at)}
                          </td>
                          {visibleColumns.createdAt && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(device.created_at)}
                            </td>
                          )}
                          {visibleColumns.updatedAt && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(device.updated_at)}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <DevicesActionMenu
                                device={device}
                                onEdit={handleEdit}
                                onDelete={() => onDelete(device)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * pageSize, filtered.length)}
                    </span>{' '}
                    of <span className="font-medium">{filtered.length}</span> results
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        title="First page"
                      >
                        First
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-2 text-sm font-medium -ml-px border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        title="Previous page"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {/* Page Numbers */}
                      <div className="hidden sm:flex items-center">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium -ml-px border border-gray-300 hover:bg-gray-50 transition-colors ${
                                page === pageNum
                                  ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 z-10'
                                  : 'text-gray-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Mobile: Show current page */}
                      <div className="sm:hidden px-3 py-2 text-sm font-medium -ml-px border border-gray-300 bg-indigo-50 text-indigo-600">
                        {page}
                      </div>

                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-2 text-sm font-medium -ml-px border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        title="Next page"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="px-3 py-2 text-sm font-medium -ml-px border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        title="Last page"
                      >
                        Last
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
      />
    </TailwindLayout>
  );
};

export default Devices;
