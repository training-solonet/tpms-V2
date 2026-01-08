import React from 'react';
import { Link } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import TruckImage from '../../components/common/TruckImage.jsx';
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
// Use Backend 2 APIs
import { trucksApi, driversApi, vendorsApi } from 'services/management';

function Input({ label, icon, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${props.className || ''}`}
        />
      </div>
    </label>
  );
}

function TruckActionMenu({ truck, onEdit, onDelete }) {
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
          <DropdownMenuItem onClick={() => onEdit(truck.id)} className="gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Vehicle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(truck.id)}
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
                {truck.createdAt && truck.createdAt !== '-'
                  ? new Date(truck.createdAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created By:</span>
              <span className="text-gray-900 font-medium">{truck.createdBy || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated:</span>
              <span className="text-gray-900 font-medium">
                {truck.updatedAt && truck.updatedAt !== '-'
                  ? new Date(truck.updatedAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated By:</span>
              <span className="text-gray-900 font-medium">{truck.updatedBy || '-'}</span>
            </div>
            {truck.deletedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deleted:</span>
                <span className="text-red-600 font-medium">
                  {new Date(truck.deletedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const TrucksFormList = () => {
  const [trucks, setTrucks] = React.useState([]);
  const [drivers, setDrivers] = React.useState([]);
  const [vendors, setVendors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [query, setQuery] = React.useState('');
  const [cluster, setCluster] = React.useState('');
  const [vendorFilter, setVendorFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  // Column visibility state - only for optional columns
  const [visibleColumns, setVisibleColumns] = React.useState({
    id: false,
    createdAt: false,
    updatedAt: false,
    deletedAt: false,
    createdBy: false,
    updatedBy: false,
  });

  // Sort state
  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: 'asc',
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Loading trucks data from Backend 2...');

      const [trucksRes, driversRes, vendorsRes] = await Promise.all([
        trucksApi.getAll(),
        driversApi.getAll().catch((err) => {
          console.warn('Failed to load drivers:', err);
          return { data: { drivers: [] } };
        }),
        vendorsApi.getAll().catch((err) => {
          console.warn('Failed to load vendors:', err);
          return { data: { vendors: [] } };
        }),
      ]);

      console.log('✅ Trucks response:', trucksRes);
      console.log('✅ Drivers response:', driversRes);
      console.log('✅ Vendors response:', vendorsRes);

      const trucksArray = trucksRes?.data?.trucks || [];
      const driversArray = driversRes?.data?.drivers || [];
      const vendorsArray = vendorsRes?.data?.vendors || [];

      console.log('✅ Trucks array length:', trucksArray.length);
      console.log('✅ Drivers array length:', driversArray.length);
      console.log('✅ Vendors array length:', vendorsArray.length);
      console.log('✅ First truck sample:', trucksArray?.[0]);
      console.log('✅ First driver sample:', driversArray?.[0]);
      console.log('✅ First vendor sample:', vendorsArray?.[0]);

      setTrucks(Array.isArray(trucksArray) ? trucksArray : []);
      setDrivers(Array.isArray(driversArray) ? driversArray : []);
      setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);
      setError('');
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      setError(error.message || 'Failed to load trucks');
      setTrucks([]);
      setDrivers([]);
      setVendors([]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const allTrucks = React.useMemo(() => {
    console.log('🔍 Processing trucks data...');
    console.log('📊 Raw trucks array:', trucks);

    return trucks.map((truck, index) => {
      if (index === 0) {
        console.log('🚛 First truck raw object:', truck);
        console.log('🔍 All truck fields:', Object.keys(truck));
        console.log('🔍 truck.name:', truck.name);
        console.log('🔍 truck.truckName:', truck.truckName);
        console.log('🔍 truck.truck_name:', truck.truck_name);
        console.log('🔍 truck.year:', truck.year);
        console.log('🔍 truck.model:', truck.model);
        console.log('🔍 truck.vin:', truck.vin);
        console.log('🔍 truck.vendor_id:', truck.vendor_id);
        console.log('🔍 truck.fleet_group_id:', truck.fleet_group_id);
        console.log('🔍 truck.cluster:', truck.cluster);
        console.log('🔍 truck.deleted_at:', truck.deleted_at);
        console.log('🔍 truck.deletedAt:', truck.deletedAt);
      }

      // Backend 2 uses different field names
      const driver = drivers.find((d) => d.id === (truck.driver_id || truck.driverId));
      const vendor = vendors.find((v) => v.id === (truck.vendor_id || truck.vendorId));

      const processedTruck = {
        id: truck.id,
        // API doc shows 'name' field for truck name
        name: truck.name || truck.truckNumber || truck.truck_number || '-',
        image: truck.image || truck.imageUrl || '',
        // API shows 'year' field
        year: truck.year || '-',
        // API shows 'model' field
        model: truck.model || '-',
        type: truck.type || truck.truckType || '-',
        vendor_id: truck.vendor_id || truck.vendorId || '',
        vendor_name: vendor
          ? vendor.name || vendor.name_vendor || vendor.vendor_name || '-'
          : truck.vendor_name || '-',
        status: truck.status || 'idle',
        // API shows 'vin' field
        vin: truck.vin || truck.vinNumber || '-',
        plate: truck.plate || truck.plateNumber || truck.plate_number || '-',
        createdAt: truck.createdAt || truck.created_at || '-',
        updatedAt: truck.updatedAt || truck.updated_at || '-',
        deletedAt: truck.deletedAt || truck.deleted_at || null,
        createdBy: truck.createdBy || truck.created_by || '-',
        updatedBy: truck.updatedBy || truck.updated_by || '-',
        // API shows 'fleet_group_id' but not cluster field
        cluster: truck.fleet_group_id || truck.fleetGroupId || truck.cluster || '-',
        driver: {
          name: driver
            ? driver.name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || '-'
            : truck.driver_name || truck.driverName || '-',
        },
        fuel: truck.fuelLevel || truck.fuel_level || 0,
        location: { coordinates: [truck.latitude || 0, truck.longitude || 0] },
        speed: truck.speed || 0,
        manufacturer: truck.manufacturer || 'Caterpillar',
      };

      if (index === 0) {
        console.log('✅ Processed truck:', processedTruck);
      }

      return processedTruck;
    });
  }, [trucks, drivers, vendors]);

  // Filter out soft-deleted trucks for display
  const activeTrucks = React.useMemo(() => {
    const filtered = allTrucks.filter((t) => {
      const isDeleted = t.deletedAt || t.deleted_at;
      if (isDeleted) {
        console.log(
          '🚫 Filtering out deleted truck:',
          t.id,
          'deleted_at:',
          t.deletedAt || t.deleted_at
        );
      }
      return !isDeleted;
    });

    console.log(
      `📊 Total trucks: ${allTrucks.length}, Active trucks: ${filtered.length}, Deleted: ${allTrucks.length - filtered.length}`
    );

    return filtered;
  }, [allTrucks]);

  const clusters = React.useMemo(
    () => Array.from(new Set(activeTrucks.map((t) => t.cluster).filter(Boolean))),
    [activeTrucks]
  );

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

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    let result = activeTrucks.filter((t) => {
      const matchesQ =
        !q ||
        String(t.id || '').toLowerCase().includes(q) ||
        String(t.plate || '').toLowerCase().includes(q) ||
        String(t.name || '').toLowerCase().includes(q) ||
        String(t.vin || '').toLowerCase().includes(q) ||
        String(t.cluster || '').toLowerCase().includes(q) ||
        String(t.brand || '').toLowerCase().includes(q) ||
        String(t.model || '').toLowerCase().includes(q) ||
        String(t.year || '').toLowerCase().includes(q) ||
        String(t.status || '').toLowerCase().includes(q) ||
        String(t.vendor?.name || '').toLowerCase().includes(q) ||
        String(t.driver?.name || '').toLowerCase().includes(q) ||
        String(t.driver?.phone || t.driver?.telephone || '').toLowerCase().includes(q) ||
        String(t.address || '').toLowerCase().includes(q);
      const matchesCluster = !cluster || t.cluster === cluster;
      const matchesVendor = !vendorFilter || t.vendor_id === vendorFilter;
      // Handle 'active' filter to include both 'active' and 'operational'
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' ? (t.status === 'active' || t.status === 'operational') : t.status === statusFilter);
      return matchesQ && matchesCluster && matchesVendor && matchesStatus;
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle nested values
        if (sortConfig.key === 'vendor') {
          aVal = vendors.find((v) => v.id === a.vendor_id)?.name || '';
          bVal = vendors.find((v) => v.id === b.vendor_id)?.name || '';
        }

        // Handle dates
        if (['createdAt', 'updatedAt', 'deletedAt'].includes(sortConfig.key)) {
          aVal = aVal && aVal !== '-' ? new Date(aVal).getTime() : 0;
          bVal = bVal && bVal !== '-' ? new Date(bVal).getTime() : 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [activeTrucks, query, cluster, vendorFilter, statusFilter, sortConfig, vendors]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  React.useEffect(() => {
    setPage(1);
  }, [query, cluster, pageSize]);

  const [alert, setAlert] = React.useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
  });

  const showDeleteConfirmation = (id) => {
    setAlert({
      isOpen: true,
      type: 'warning',
      title: 'Delete Vehicle?',
      message:
        'This will soft-delete the vehicle (hidden from list but retained in database). Are you sure?',
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
      console.log('🗑️ Soft-deleting vehicle with ID:', id);

      // Call DELETE API endpoint (backend akan melakukan soft delete)
      const response = await trucksApi.delete(id);
      console.log('✅ Delete response:', response);

      // Verify the delete was successful
      if (response?.data?.success !== false) {
        console.log('✅ Vehicle soft-deleted successfully');

        // Reload data dari server untuk memastikan sinkronisasi
        await load();

        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Vehicle deleted successfully!',
          confirmText: 'OK',
          showCancel: false,
          onConfirm: () => setAlert({ ...alert, isOpen: false }),
        });
      } else {
        throw new Error(response?.data?.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('❌ Failed to delete vehicle:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';

      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete vehicle: ' + errorMsg,
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => setAlert({ ...alert, isOpen: false }),
      });
    }
  };

  const onDelete = (id) => {
    showDeleteConfirmation(id);
  };

  const handleEdit = (id) => {
    window.location.href = `/trucks/${id}`;
  };

  const statusOptions = ['active', 'idle', 'maintenance', 'inactive'];

  // Hitung statistik status
  const statusStats = React.useMemo(() => {
    return {
      active: activeTrucks.filter((t) => t.status === 'active' || t.status === 'operational').length,
      idle: activeTrucks.filter((t) => t.status === 'idle').length,
      maintenance: activeTrucks.filter((t) => t.status === 'maintenance').length,
      inactive: activeTrucks.filter((t) => t.status === 'inactive').length,
    };
  }, [activeTrucks]);

  return (
    <TailwindLayout>
      <div className="max-w-full mx-auto max-h-[calc(100vh-100px)] overflow-y-scroll">
        {/* Breadcrumb */}
        <div className="p-6 space-y-6">
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
            <span className="text-gray-900 font-medium">Vehicles</span>
          </nav>
          {/* Header Section */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Manage your fleet vehicles and equipment
                </p>
              </div>
              <Link
                to="/trucks/new"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Vehicle
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-lg">
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
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{activeTrucks.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-lg">
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
                <div>
                  <p className="text-xs text-gray-600 font-medium">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{statusStats.active}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Idle</p>
                  <p className="text-2xl font-bold text-gray-900">{statusStats.idle}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-100 rounded-lg">
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
                <div>
                  <p className="text-xs text-gray-600 font-medium">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">{statusStats.maintenance}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-100 rounded-lg">
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
                <div>
                  <p className="text-xs text-gray-600 font-medium">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{statusStats.inactive}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Table Header with Filters and Column Toggle */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4 flex-wrap items-center">
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
                    placeholder="Name, plate, VIN, model, type, cluster, vendor, driver..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Cluster Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[150px]">
                      {cluster || 'All Clusters'}
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
                  <DropdownMenuContent align="start" className="min-w-[150px]">
                    <DropdownMenuItem onClick={() => setCluster('')}>
                      All Clusters
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {clusters.map((c) => (
                      <DropdownMenuItem key={c} onClick={() => setCluster(c)}>
                        {c}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Vendor Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[150px]">
                      {vendorFilter
                        ? vendors.find((v) => v.id === vendorFilter)?.name || 'All Vendors'
                        : 'All Vendors'}
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
                  <DropdownMenuContent align="start" className="min-w-[150px]">
                    <DropdownMenuItem onClick={() => setVendorFilter('')}>
                      All Vendors
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {vendors.map((v) => (
                      <DropdownMenuItem key={v.id} onClick={() => setVendorFilter(v.id)}>
                        {v.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[130px]">
                      {statusFilter
                        ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
                        : 'All Status'}
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
                    <summary className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition-colors">
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
                        {[
                          { key: 'id', label: 'ID' },
                          { key: 'createdAt', label: 'Created At' },
                          { key: 'updatedAt', label: 'Updated At' },
                          { key: 'deletedAt', label: 'Deleted At' },
                          { key: 'createdBy', label: 'Created By' },
                          { key: 'updatedBy', label: 'Updated By' },
                        ].map((col) => (
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

                {/* Export Button */}
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
                        [
                          'No',
                          'Truck Name',
                          'Plate Number',
                          'VIN',
                          'Model',
                          'Year',
                          'Type',
                          'Vendor',
                          'Cluster',
                          'Status',
                          'Driver',
                          'Manufacturer',
                        ].join(','),
                        ...filtered.map((truck, i) =>
                          [
                            i + 1,
                            truck.name || '',
                            truck.plate || '',
                            truck.vin || '',
                            truck.model || '',
                            truck.year || '',
                            truck.type || '',
                            truck.vendor_name || '',
                            truck.cluster || '',
                            truck.status || '',
                            truck.driver?.name || '',
                            truck.manufacturer || '',
                          ]
                            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                            .join(',')
                        ),
                      ].join('\n');

                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `vehicles_${new Date().toISOString().split('T')[0]}.csv`;
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
              </div>

              {/* Active Filters Display */}
              {(query || cluster || vendorFilter || statusFilter) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-600 font-medium">Active filters:</span>
                  {query && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                      Search: &quot;{query}&quot;
                      <button
                        onClick={() => setQuery('')}
                        className="hover:bg-indigo-200 rounded p-0.5"
                      >
                        <svg
                          className="w-3 h-3"
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
                      </button>
                    </span>
                  )}
                  {cluster && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Cluster: {cluster}
                      <button
                        onClick={() => setCluster('')}
                        className="hover:bg-blue-200 rounded p-0.5"
                      >
                        <svg
                          className="w-3 h-3"
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
                      </button>
                    </span>
                  )}
                  {vendorFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      Vendor: {vendors.find((v) => v.id === vendorFilter)?.name}
                      <button
                        onClick={() => setVendorFilter('')}
                        className="hover:bg-green-200 rounded p-0.5"
                      >
                        <svg
                          className="w-3 h-3"
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
                      </button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter('')}
                        className="hover:bg-purple-200 rounded p-0.5"
                      >
                        <svg
                          className="w-3 h-3"
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
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setQuery('');
                      setCluster('');
                      setVendorFilter('');
                      setStatusFilter('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Vehicles</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                    >
                      No
                    </th>
                    {visibleColumns.id && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-gray-50"
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
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Image
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center justify-start gap-2">
                        Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('plate')}
                    >
                      <div className="flex items-center justify-start gap-2">
                        Plate
                        {getSortIcon('plate')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('year')}
                    >
                      <div className="flex items-center justify-start gap-2">
                        Year
                        {getSortIcon('year')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('model')}
                    >
                      <div className="flex items-center justify-start gap-2">
                        Model
                        {getSortIcon('model')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center justify-start gap-2">
                        Type
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('vendor')}
                    >
                      <div className="flex items-center justify-start gap-2">
                        Vendor
                        {getSortIcon('vendor')}
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
                      onClick={() => handleSort('vin')}
                    >
                      <div className="flex items-center justify-start gap-2">
                        VIN
                        {getSortIcon('vin')}
                      </div>
                    </th>
                    {visibleColumns.createdAt && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Created At
                          {getSortIcon('createdAt')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.updatedAt && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Updated At
                          {getSortIcon('updatedAt')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.deletedAt && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('deletedAt')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Deleted At
                          {getSortIcon('deletedAt')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.createdBy && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdBy')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Created By
                          {getSortIcon('createdBy')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.updatedBy && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedBy')}
                      >
                        <div className="flex items-center justify-start gap-2">
                          Updated By
                          {getSortIcon('updatedBy')}
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
                  {loading ? (
                    <tr>
                      <td colSpan="20" className="px-4 py-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading vehicles...</p>
                      </td>
                    </tr>
                  ) : pageData.length === 0 ? (
                    <tr>
                      <td colSpan="20" className="px-4 py-12 text-center">
                        <svg
                          className="w-12 h-12 text-gray-400 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                          />
                        </svg>
                        <p className="text-gray-600 font-medium">No vehicles found</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pageData.map((truck, index) => (
                      <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {(currentPage - 1) * pageSize + index + 1}
                          </div>
                        </td>
                        {visibleColumns.id && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-600">{truck.id}</div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="w-16 h-12 rounded-md overflow-hidden bg-gray-100">
                            <TruckImage
                              id={truck.id}
                              width={160}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{truck.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{truck.plate}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {truck.year}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {truck.model}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {truck.type}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {vendors.find((v) => v.id === truck.vendor_id)?.name ||
                            vendors.find((v) => v.id === truck.vendor_id)?.name_vendor ||
                            '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              truck.status === 'active' || truck.status === 'operational'
                                ? 'bg-green-100 text-green-800'
                                : truck.status === 'maintenance'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : truck.status === 'idle'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {truck.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                          {truck.vin}
                        </td>
                        {visibleColumns.createdAt && (
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {truck.createdAt !== '-'
                              ? new Date(truck.createdAt).toLocaleString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                        )}
                        {visibleColumns.updatedAt && (
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {truck.updatedAt !== '-'
                              ? new Date(truck.updatedAt).toLocaleString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                        )}
                        {visibleColumns.deletedAt && (
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {truck.deletedAt
                              ? new Date(truck.deletedAt).toLocaleString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                        )}
                        {visibleColumns.createdBy && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {truck.createdBy}
                          </td>
                        )}
                        {visibleColumns.updatedBy && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {truck.updatedBy}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <TruckActionMenu truck={truck} onEdit={handleEdit} onDelete={onDelete} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{start + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(end, filtered.length)}</span> of{' '}
                  <span className="font-medium">{filtered.length}</span> results
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center">
                    <button
                      onClick={() => setPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white bg-white transition-colors"
                      title="First page"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium -ml-px border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white bg-white transition-colors"
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
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium -ml-px border border-gray-300 hover:bg-gray-50 bg-white transition-colors ${
                              currentPage === pageNum
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
                      {currentPage}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium -ml-px border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white bg-white transition-colors"
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
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium -ml-px border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white bg-white transition-colors"
                      title="Last page"
                    >
                      Last
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
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

export default TrucksFormList;
