import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { driversApi } from 'services/management';
import { Button } from '../../components/common/Button.jsx';
import AlertModal from '../../components/common/AlertModal.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../../components/common/DropdownMenu.jsx';

function DriverActionMenu({ driver, onEdit, onDelete }) {
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
          <DropdownMenuItem onClick={() => onEdit(driver.id)} className="gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Driver
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(driver.id)}
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
                {driver.createdAt && driver.createdAt !== '-'
                  ? new Date(driver.createdAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created By:</span>
              <span className="text-gray-900 font-medium">{driver.createdBy || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated:</span>
              <span className="text-gray-900 font-medium">
                {driver.updatedAt && driver.updatedAt !== '-'
                  ? new Date(driver.updatedAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated By:</span>
              <span className="text-gray-900 font-medium">{driver.updatedBy || '-'}</span>
            </div>
            {driver.deletedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deleted:</span>
                <span className="text-red-600 font-medium">
                  {new Date(driver.deletedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function DriversList() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [error, setError] = React.useState('');

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = React.useState({
    id: false,
    createdAt: false,
    updatedAt: false,
    deletedAt: false,
  });

  // Sort state
  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: 'asc',
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Loading drivers from Backend 2...');

      const res = await driversApi.getAll();
      console.log('✅ Drivers response:', res);
      console.log('✅ Drivers data structure:', res.data);

      const driversArray = res.data?.drivers || res.data;
      console.log('✅ Drivers array:', driversArray);
      console.log('✅ First driver sample:', driversArray?.[0]);

      if (Array.isArray(driversArray)) {
        setDrivers(driversArray);
        console.log(`✅ Loaded ${driversArray.length} drivers from Backend 2`);
        setError('');
      } else {
        setDrivers([]);
        setError('Drivers data unavailable');
        console.log('⚠️ Drivers endpoint returned no data');
      }
    } catch (e) {
      setDrivers([]);
      setError(e.message || 'Failed to load drivers');
      console.log('❌ Error loading drivers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      // Toggle between asc and desc for the same column
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      // New column, start with asc
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
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
    let result = drivers.filter((v) => {
      const licenseNum = v.license_number || '';
      const licenseType = v.license_type || '';
      const matchQuery =
        !q ||
        String(v.id || '').toLowerCase().includes(q) ||
        (v.name || '').toLowerCase().includes(q) ||
        licenseNum.toLowerCase().includes(q) ||
        licenseType.toLowerCase().includes(q) ||
        (v.telephone || v.phone || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.address || '').toLowerCase().includes(q) ||
        (v.status || '').toLowerCase().includes(q);

      const matchStatus = !statusFilter || v.status === statusFilter;

      return matchQuery && matchStatus;
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        // Handle different field names
        if (sortConfig.key === 'phone') {
          aVal = a.telephone || a.phone || '';
          bVal = b.telephone || b.phone || '';
        } else if (sortConfig.key === 'licenseNumber') {
          aVal = a.license_number || '';
          bVal = b.license_number || '';
        } else if (sortConfig.key === 'licenseType') {
          aVal = a.license_type || '';
          bVal = b.license_type || '';
        } else if (sortConfig.key === 'createdAt') {
          aVal = a.created_at || '';
          bVal = b.created_at || '';
        } else if (sortConfig.key === 'updatedAt') {
          aVal = a.updated_at || '';
          bVal = b.updated_at || '';
        } else if (sortConfig.key === 'deletedAt') {
          aVal = a.deleted_at || '';
          bVal = b.deleted_at || '';
        }

        if (typeof aVal === 'string') {
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
  }, [drivers, query, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedDrivers = filtered.slice(start, end);

  // Get unique status options
  const statusOptions = React.useMemo(() => {
    return [...new Set(drivers.map((d) => d.status).filter(Boolean))];
  }, [drivers]);

  React.useEffect(() => setPage(1), [query, statusFilter, pageSize]);

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
      title: 'Delete Driver?',
      message: 'Are you sure you want to delete this driver? This action cannot be undone.',
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
      await driversApi.delete(id);
      console.log('✅ Driver deleted successfully');
      await load();

      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Driver deleted successfully!',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => setAlert({ ...alert, isOpen: false }),
      });
    } catch (error) {
      console.error('❌ Failed to delete driver:', error);

      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete driver: ' + error.message,
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
    navigate(`/drivers/${id}`);
  };

  const columnDefinitions = [
    { key: 'no', label: 'No', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'licenseNumber', label: 'License Number', sortable: true },
    { key: 'licenseType', label: 'License Type', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true },
    { key: 'updatedAt', label: 'Updated At', sortable: true },
    { key: 'deletedAt', label: 'Deleted At', sortable: true },
  ];

  // Only optional columns appear in the column toggle dropdown
  const toggleableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'deletedAt', label: 'Deleted At' },
  ];

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
          <span className="text-gray-900 font-medium">Drivers</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage driver information and licenses</p>
          </div>
          <Link
            to="/drivers/new"
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
            Add Driver
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
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
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {drivers.filter((d) => d.status === 'active' || d.status === 'aktif').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
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
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">
                  {drivers.filter((d) => d.status !== 'active' && d.status !== 'aktif').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
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
              <div>
                <p className="text-sm text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table with Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 flex-1 w-full">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Name, license, phone, email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between w-[120px] whitespace-nowrap">
                      {pageSize} / Page
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
                  <DropdownMenuContent align="start" className="w-[120px]">
                    {[10, 25, 50, 100].map((size) => (
                      <DropdownMenuItem
                        key={size}
                        onClick={() => {
                          setPageSize(Number(size));
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
              </div>

              {/* Actions */}
              <div className="flex gap-2">
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
                        'Name',
                        'License Number',
                        'License Type',
                        'Phone',
                        'Email',
                        'Address',
                        'Status',
                      ].join(','),
                      ...filtered.map((d, i) =>
                        [
                          i + 1,
                          d.name || '',
                          d.license_number || '',
                          d.license_type || '',
                          d.telephone || d.phone || '',
                          d.email || '',
                          d.address || '',
                          d.status || '',
                        ]
                          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                          .join(',')
                      ),
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `drivers_${new Date().toISOString().split('T')[0]}.csv`;
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

                {(query || statusFilter) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery('');
                      setStatusFilter('');
                      setPage(1);
                    }}
                    className="gap-2"
                    title="Clear all filters"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Table Content */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
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
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={load}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Drivers Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                {query
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first driver'}
              </p>
              {!query && (
                <Link
                  to="/drivers/new"
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
                  Add Driver
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columnDefinitions.map((col) => {
                        // Only check visibility for optional columns (id, timestamps)
                        const isOptional = ['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(
                          col.key
                        );
                        if (isOptional && !visibleColumns[col.key]) return null;

                        return (
                          <th
                            key={col.key}
                            scope="col"
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                              col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                            }`}
                            onClick={() => col.sortable && handleSort(col.key)}
                          >
                            <div className="flex items-center justify-start gap-2">
                              <span className="whitespace-normal">{col.label}</span>
                              {col.sortable && getSortIcon(col.key)}
                            </div>
                          </th>
                        );
                      })}
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedDrivers.map((driver, index) => (
                      <tr key={driver.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{start + index + 1}</div>
                        </td>
                        {visibleColumns.id && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-600">{driver.id}</div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {driver.license_number || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.license_type || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {driver.phone || driver.telephone || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              driver.status === 'active' || driver.status === 'aktif'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {driver.status || 'N/A'}
                          </span>
                        </td>
                        {visibleColumns.createdAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {driver.created_at
                                ? new Date(driver.created_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.updatedAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {driver.updated_at
                                ? new Date(driver.updated_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.deletedAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {driver.deleted_at
                                ? new Date(driver.deleted_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <DriverActionMenu
                            driver={driver}
                            onEdit={handleEdit}
                            onDelete={onDelete}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      Showing <span className="font-medium">{start + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(end, filtered.length)}</span> of{' '}
                      <span className="font-medium">{filtered.length}</span> results
                    </span>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center">
                      <button
                        onClick={() => setPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                        title="First page"
                      >
                        First
                      </button>
                      <button
                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
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
                              className={`px-3 py-2 text-sm font-medium -ml-px border border-gray-300 hover:bg-gray-50 transition-colors ${
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
                        onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
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
                        disabled={currentPage === totalPages}
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
}
