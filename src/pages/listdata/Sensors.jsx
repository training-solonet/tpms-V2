import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { devicesApi, trucksApi } from 'services/management';
import TailwindLayout from '../../components/layout/TailwindLayout';
import { Button } from '../../components/common/Button.jsx';
import AlertModal from '../../components/common/AlertModal.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '../../components/common/DropdownMenu.jsx';

function SensorsActionMenu({ sensor, onEdit, onDelete }) {
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
          <DropdownMenuItem onClick={() => onEdit(sensor.id)} className="gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit sensors
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onDelete(sensor.id)}
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
            Delete sensors
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showTimestamp && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-900 font-medium">
                {sensor.createdAt && sensor.createdAt !== '-'
                  ? new Date(sensor.createdAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created By:</span>
              <span className="text-gray-900 font-medium">{sensor.createdBy || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated:</span>
              <span className="text-gray-900 font-medium">
                {sensor.updatedAt && sensor.updatedAt !== '-'
                  ? new Date(sensor.updatedAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated By:</span>
              <span className="text-gray-900 font-medium">{sensor.updatedBy || '-'}</span>
            </div>
            {sensor.deletedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deleted:</span>
                <span className="text-red-600 font-medium">
                  {new Date(sensor.deletedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
const Sensors = () => {
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
  });

  const handleEdit = (id) => {
    window.location.href = `/sensors/${id}`;
  };

  const showDeleteConfirmation = (id) => {
    setAlert({
      isOpen: true,
      type: 'warning',
      title: 'Delete Sensor?',
      message: 'Are you sure you want to delete this sensor? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      showCancel: true,
      onConfirm: () => confirmDelete(id),
      onCancel: () => setAlert({ ...alert, isOpen: false }),
    });
  };

  const confirmDelete = async (id) => {
    setAlert({ ...alert, isOpen: false });

    try {
      console.log('🗑️ Deleting sensor:', id);
      await devicesApi.deleteSensor(id);
      console.log('✅ Sensor deleted successfully');

      // Reload data dari server untuk memastikan sinkronisasi
      await fetchSensors();

      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Sensor deleted successfully!',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => setAlert({ ...alert, isOpen: false }),
      });
    } catch (error) {
      console.error('❌ Failed to delete sensor:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';

      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete sensor: ' + errorMsg,
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => setAlert({ ...alert, isOpen: false }),
      });
    }
  };

  const onDelete = (id) => {
    showDeleteConfirmation(id);
  };
  // State
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [sensorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: false,
    sensorNo: true,
    extype: false,
    createdAt: false,
  });

  // Toggleable columns (optional columns only)
  const toggleableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'sensorNo', label: 'Sensor Number' },
    { key: 'extype', label: 'External Type' },
    { key: 'createdAt', label: 'Created At' },
  ];

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch data
  useEffect(() => {
    fetchSensors();
    fetchDevices();
    fetchTrucks();
  }, []);

  const fetchSensors = async () => {
    try {
      setLoading(true);
      const response = await devicesApi.getAllSensors();
      console.log('📥 Sensors API response:', response);

      // Handle different response formats
      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data?.sensors)
          ? response.data.sensors
          : Array.isArray(response?.data)
            ? response.data
            : [];

      console.log('✅ Sensors data:', data.length, 'sensors');

      // Extract devices and trucks from included sensor data
      const devicesFromSensors = [];
      const trucksFromDevices = [];

      data.forEach((sensor) => {
        if (sensor.device && !devicesFromSensors.find((d) => d.id === sensor.device.id)) {
          devicesFromSensors.push(sensor.device);

          // Extract truck from device
          if (
            sensor.device.truck &&
            !trucksFromDevices.find((t) => t.id === sensor.device.truck.id)
          ) {
            trucksFromDevices.push(sensor.device.truck);
          }
        }
      });

      console.log('🔍 Extracted devices from sensors:', devicesFromSensors.length);
      console.log('🔍 Extracted trucks from devices:', trucksFromDevices.length);

      // Update devices and trucks state with extracted data
      if (devicesFromSensors.length > 0) {
        setDevices(devicesFromSensors);
      }
      if (trucksFromDevices.length > 0) {
        setTrucks(trucksFromDevices);
      }

      setSensors(data);
    } catch (err) {
      console.error('❌ Error fetching sensors:', err);
      setSensors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await devicesApi.getAll();
      console.log('📥 Devices API response (for filter):', response);

      // Handle different response formats
      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      console.log('✅ Devices data:', data);
      setDevices(data);
    } catch (err) {
      console.error('❌ Error fetching devices:', err);
      setDevices([]);
    }
  };

  const fetchTrucks = async () => {
    try {
      const response = await trucksApi.getAll();
      console.log('📥 Trucks API response (for filter):', response);

      // Handle different response formats
      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      console.log('✅ Trucks data:', data);
      setTrucks(data);
    } catch (err) {
      console.error('❌ Error fetching trucks:', err);
      setTrucks([]);
    }
  };

  // Get device and truck info for sensor
  const getSensorInfo = useCallback(
    (sensor) => {
      // First try to use included device data from sensor object
      let device = sensor.device;
      let truck = sensor.device?.truck;

      // If not included, try to find from devices array
      if (!device) {
        device = devices.find(
          (d) =>
            d.id === sensor.device_id ||
            d.id === sensor.deviceId ||
            d.sn === sensor.sim_number ||
            d.serial_number === sensor.sim_number ||
            d.sim_number === sensor.sim_number
        );
      }

      // If device found but no truck, try to find from trucks array
      if (device && !truck) {
        truck = trucks.find((t) => t.id === device.truck_id || t.id === device.truckId);
      }

      return { device, truck };
    },
    [devices, trucks]
  );

  // Sort state
  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: 'asc',
  });

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      // Toggle between asc and desc for the same column
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      // New column, start with asc
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
    return null; // No icon when not sorted
  };

  // Filter & Search
  const filtered = useMemo(() => {
    let result = sensors.filter((sensor) => {
      const { device, truck } = getSensorInfo(sensor);

      const matchQuery =
        !query ||
        // Search by ID
        String(sensor.id || '').toLowerCase().includes(query.toLowerCase()) ||
        // Search by sensor serial number
        (sensor.sn || '').toLowerCase().includes(query.toLowerCase()) ||
        // Search by sensor number
        (sensor.sensor_no || '').toLowerCase().includes(query.toLowerCase()) ||
        // Search by sim number
        (sensor.sim_number || '').toLowerCase().includes(query.toLowerCase()) ||
        // Search by device serial number
        (device?.sn || device?.serial_number || '').toLowerCase().includes(query.toLowerCase()) ||
        // Search by truck name
        (truck?.name || '').toLowerCase().includes(query.toLowerCase()) ||
        // Search by tire position
        String(sensor.tire_no || '').toLowerCase().includes(query.toLowerCase()) ||
        // Search by status
        (sensor.status || '').toLowerCase().includes(query.toLowerCase());

      const matchDevice = !deviceFilter || device?.id?.toString() === deviceFilter;
      const matchTruck = !sensorFilter || truck?.id?.toString() === sensorFilter;
      const matchStatus = !statusFilter || sensor.status === statusFilter;

      return matchQuery && matchDevice && matchTruck && matchStatus;
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const { device: aDevice, truck: aTruck } = getSensorInfo(a);
        const { device: bDevice, truck: bTruck } = getSensorInfo(b);

        let aVal, bVal;

        // Handle different sort keys
        switch (sortConfig.key) {
          case 'id':
            aVal = a.id;
            bVal = b.id;
            break;
          case 'sn':
            aVal = a.sn || '';
            bVal = b.sn || '';
            break;
          case 'device':
            aVal = aDevice?.sn || aDevice?.serial_number || '';
            bVal = bDevice?.sn || bDevice?.serial_number || '';
            break;
          case 'truck':
            aVal = aTruck?.name || aTruck?.truck_number || '';
            bVal = bTruck?.name || bTruck?.truck_number || '';
            break;
          case 'tirePosition':
            aVal = a.tire_no || 0;
            bVal = b.tire_no || 0;
            break;
          case 'sensorNo':
            aVal = a.sensor_no || '';
            bVal = b.sensor_no || '';
            break;
          case 'created_at':
            aVal = a.created_at && a.created_at !== '-' ? new Date(a.created_at).getTime() : 0;
            bVal = b.created_at && b.created_at !== '-' ? new Date(b.created_at).getTime() : 0;
            break;
          default:
            aVal = a[sortConfig.key];
            bVal = b[sortConfig.key];
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
  }, [sensors, query, deviceFilter, sensorFilter, statusFilter, getSensorInfo, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: sensors.length,
      active: sensors.filter((s) => s.status === 'active').length,
      warning: sensors.filter((s) => {
        const temp = parseFloat(s.temp_value);
        const pressure = parseFloat(s.tire_value);
        return (temp > 60 && temp < 80) || (pressure > 25 && pressure < 28);
      }).length,
      filtered: filtered.length,
    };
  }, [sensors, filtered]);

  // Get unique status options
  const statusOptions = useMemo(() => {
    return [...new Set(sensors.map((s) => s.status).filter(Boolean))];
  }, [sensors]);

  // Get tire position label
  const getTirePosition = (tireNo) => {
    const positions = {
      1: 'Front Left',
      2: 'Front Right',
      3: 'Rear Left 1',
      4: 'Rear Right 1',
      5: 'Rear Left 2',
      6: 'Rear Right 2',
      7: 'Rear Left 3',
      8: 'Rear Right 3',
      9: 'Rear Left 4',
      10: 'Rear Right 4',
      11: 'Rear Left 5',
      12: 'Rear Right 5',
    };
    return positions[tireNo] || `Tire ${tireNo}`;
  };

  // Get status color
  const getStatusColor = (sensor) => {
    if (sensor.status !== 'active') return 'bg-gray-100 text-gray-800';

    const temp = parseFloat(sensor.temp_value);
    const pressure = parseFloat(sensor.tire_value);

    // Critical
    if (temp >= 80 || pressure < 25) return 'bg-red-100 text-red-800';
    // Warning
    if ((temp > 60 && temp < 80) || (pressure >= 25 && pressure < 28))
      return 'bg-yellow-100 text-yellow-800';
    // Normal
    return 'bg-green-100 text-green-800';
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
          <span className="text-gray-900 font-medium">Sensors</span>
        </nav>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sensor Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage tire pressure and temperature sensors
              </p>
            </div>
            <Link
              to="/sensors/new"
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
              Add Sensor
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sensors</p>
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
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
                <p className="text-sm text-gray-600">Warning</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.warning}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
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
                    placeholder="Serial number, device, truck, tire position, status..."
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
                    <DropdownMenuItem onClick={() => setStatusFilter}>All Status</DropdownMenuItem>
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
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20 max-h-96 overflow-y-auto">
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
                <div className="relative flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (filtered.length === 0) {
                        setAlert({
                          isOpen: true,
                          type: 'warning',
                          title: 'No Data',
                          message: 'No data to export',
                          onConfirm: () => setAlert({ ...alert, isOpen: false }),
                          showCancel: false,
                        });
                        return;
                      }
                      const csvContent = [
                        ['No', 'Serial Number', 'Device', 'Truck', 'Tire Position', 'Status'].join(
                          ','
                        ),
                        ...filtered.map((s, i) => {
                          const { device, truck } = getSensorInfo(s);
                          return [
                            i + 1,
                            s.sn || '',
                            device?.sn || device?.serial_number || 'N/A',
                            truck?.name || 'Unassigned',
                            getTirePosition(s.tireNo || s.tire_no),
                            s.status || '',
                          ]
                            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                            .join(',');
                        }),
                      ].join('\n');

                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `sensors_${new Date().toISOString().split('T')[0]}.csv`;
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sensors Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                {query ? 'Try adjusting your search' : 'Get started by adding your first sensor'}
              </p>
              {!query && (
                <Link
                  to="/sensors/new"
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
                  Add Sensor
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
                          <div className="flex items-center justify-start gap-2">
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
                        onClick={() => handleSort('device')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Device
                          {getSortIcon('device')}
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
                        onClick={() => handleSort('tirePosition')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Tire Position
                          {getSortIcon('tirePosition')}
                        </div>
                      </th>
                      {visibleColumns.sensorNo && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('sensorNo')}
                        >
                          <div className="flex items-center justify-start gap-2">
                            Sensor #{getSortIcon('sensorNo')}
                          </div>
                        </th>
                      )}
                      {visibleColumns.extype && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Type
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
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
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginated.map((sensor, index) => {
                      const { device, truck } = getSensorInfo(sensor);
                      return (
                        <tr key={sensor.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          {visibleColumns.id && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sensor.id}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {sensor.sn || '--'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {device ? (
                              <Link
                                to={`/devices/${device.id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                              >
                                {device.sn || device.serial_number || 'N/A'}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {truck ? (
                              <Link
                                to={`/trucks/${truck.id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                              >
                                {truck.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTirePosition(sensor.tireNo || sensor.tire_no)}
                          </td>
                          {visibleColumns.sensorNo && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sensor.sensorNo || sensor.sensor_no || '--'}
                            </td>
                          )}
                          {visibleColumns.extype && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sensor.extype || '--'}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sensor)}`}
                            >
                              {sensor.status || 'unknown'}
                            </span>
                          </td>
                          {visibleColumns.createdAt && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(sensor.created_at)}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <SensorsActionMenu
                              sensor={sensor}
                              onEdit={handleEdit}
                              onDelete={onDelete}
                            />
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
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        showCancel={alert.showCancel}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
      />
    </TailwindLayout>
  );
};

export default Sensors;
