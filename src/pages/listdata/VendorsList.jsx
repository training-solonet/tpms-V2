import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { vendorsApi } from 'services/management';
import { Button } from '../../components/common/Button.jsx';
import AlertModal from '../../components/common/AlertModal.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/common/DropdownMenu.jsx';

function VendorActionMenu({ vendor, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showTimestamp] = React.useState(false);
  const [position, setPosition] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);
  const menuRef = React.useRef(null);
  const buttonRef = React.useRef(null);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      // Reset ready state when opening
      setIsReady(false);

      const calculatePosition = () => {
        if (!buttonRef.current || !dropdownRef.current) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Use actual dimensions from rendered dropdown
        const dropdownHeight = dropdownRect.height;
        const dropdownWidth = dropdownRect.width || 224;

        // Determine if dropdown should open upward or downward
        const spaceBelow = viewportHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;

        let top = buttonRect.bottom + 8;

        // If not enough space below and more space above, open upward
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          top = buttonRect.top - dropdownHeight - 8;
        }

        // Calculate horizontal position (align to right)
        let left = buttonRect.right - dropdownWidth;

        // Ensure dropdown doesn't overflow viewport
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - 16;
        }
        if (left < 16) {
          left = 16;
        }

        setPosition({ top, left });
        setIsReady(true);
      };

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      });
    } else {
      setPosition(null);
      setIsReady(false);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="More options"
      >
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          style={{
            top: position ? `${position.top}px` : '-9999px',
            left: position ? `${position.left}px` : '-9999px',
            zIndex: 9999,
            visibility: isReady ? 'visible' : 'hidden',
            opacity: isReady ? 1 : 0,
            transition: isReady ? 'opacity 0.1s ease-out' : 'none',
          }}
        >
          <button
            onClick={() => {
              onEdit(vendor.id);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Vendor
          </button>

          <hr className="my-1" />

          <button
            onClick={() => {
              onDelete(vendor.id);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Vendor
          </button>
        </div>
      )}

      {showTimestamp && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-900 font-medium">
                {vendor.created_at ? new Date(vendor.created_at).toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated:</span>
              <span className="text-gray-900 font-medium">
                {vendor.updated_at ? new Date(vendor.updated_at).toLocaleString() : '-'}
              </span>
            </div>
            {vendor.deleted_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deleted:</span>
                <span className="text-red-600 font-medium">
                  {new Date(vendor.deleted_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorsList() {
  const navigate = useNavigate();
  const [vendors, setVendors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  // Column visibility state - only for optional columns
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
      console.log('📡 Loading vendors from Backend 2...');

      const res = await vendorsApi.getAll();
      console.log('✅ Vendors response:', res);
      console.log('✅ Vendors data structure:', res.data);

      const vendorsArray = res.data?.vendors || res.data || [];
      console.log('✅ Vendors array:', vendorsArray);
      console.log('✅ First vendor sample:', vendorsArray[0]);

      // Check all field names in first vendor
      if (vendorsArray[0]) {
        console.log('🔍 Vendor fields available:', Object.keys(vendorsArray[0]));
        console.log('🔍 Vendor code field:', vendorsArray[0].code);
        console.log('🔍 Vendor description field:', vendorsArray[0].description);
      }

      setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);
      setError('');
    } catch (err) {
      console.error('❌ Error loading vendors:', err);
      setError(err.message || 'Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleEdit = (id) => {
    navigate(`/vendors/${id}`);
  };

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
      title: 'Delete Vendor?',
      message:
        'Are you sure you want to delete this vendor? Note: Vendors with associated trucks or drivers cannot be deleted.',
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
      await vendorsApi.delete(id);
      console.log('✅ Vendor deleted successfully');

      // Reload data dari server untuk memastikan sinkronisasi
      await load();

      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Vendor deleted successfully!',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => setAlert({ ...alert, isOpen: false }),
      });
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';

      if (
        errorMsg.includes('associated') ||
        errorMsg.includes('Cannot delete') ||
        errorMsg.includes('active trucks') ||
        errorMsg.includes('active drivers')
      ) {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Cannot Delete',
          message: errorMsg.includes('Cannot delete')
            ? errorMsg
            : 'Cannot delete vendor: This vendor has associated trucks or drivers. Please reassign or remove them first.',
          confirmText: 'OK',
          showCancel: false,
          onConfirm: () => setAlert({ ...alert, isOpen: false }),
        });
      } else {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete vendor: ' + errorMsg,
          confirmText: 'OK',
          showCancel: false,
          onConfirm: () => setAlert({ ...alert, isOpen: false }),
        });
      }
    }
  };

  const handleDelete = (id) => {
    showDeleteConfirmation(id);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // Compute stats
  const stats = React.useMemo(() => {
    const total = vendors.length;
    return { total };
  }, [vendors]);

  // Filter and sort vendors
  const filtered = React.useMemo(() => {
    let result = [...vendors];

    // Search filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (v) =>
          (v.name || '').toLowerCase().includes(lowerQuery) ||
          (v.code || '').toLowerCase().includes(lowerQuery) ||
          (v.description || '').toLowerCase().includes(lowerQuery) ||
          (v.address || '').toLowerCase().includes(lowerQuery) ||
          (v.email || v.contact_email || '').toLowerCase().includes(lowerQuery) ||
          (v.telephone || v.phone || v.contact_phone || '').includes(lowerQuery) ||
          (v.contact_person || v.contactPerson || v.contact_name || '')
            .toLowerCase()
            .includes(lowerQuery)
      );
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle different field names
        if (sortConfig.key === 'name') {
          aVal = a.name || a.name_vendor;
          bVal = b.name || b.name_vendor;
        } else if (sortConfig.key === 'phone') {
          aVal = a.telephone || a.phone || a.contact_phone;
          bVal = b.telephone || b.phone || b.contact_phone;
        } else if (sortConfig.key === 'email') {
          aVal = a.email || a.contact_email;
          bVal = b.email || b.contact_email;
        } else if (sortConfig.key === 'contactPerson') {
          aVal = a.contact_person || a.contactPerson || a.contact_name;
          bVal = b.contact_person || b.contactPerson || b.contact_name;
        }

        // Handle null/undefined
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        // String comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // Numeric comparison
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [vendors, query, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedVendors = filtered.slice(startIndex, endIndex);

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

  // Column definitions - separate optional columns for toggle
  const toggleableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'deletedAt', label: 'Deleted At' },
  ];

  const columnDefinitions = [
    { key: 'no', label: 'No', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'contactPerson', label: 'Contact Person', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true },
    { key: 'updatedAt', label: 'Updated At', sortable: true },
    { key: 'deletedAt', label: 'Deleted At', sortable: true },
  ];

  return (
    <TailwindLayout>
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
          <span className="text-gray-900 font-medium">Vendors</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your vendor information and contacts
            </p>
          </div>
          <Link
            to="/vendors/new"
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
            Add Vendor
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vendors</p>
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{filtered.length}</p>
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error Loading Vendors</h3>
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

        {/* Table with Filters */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Filters Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 flex-1 w-full">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Name, code, email, phone..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

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
                        type: 'info',
                        title: 'No Data',
                        message: 'No data to export',
                        showCancel: false,
                      });
                      return;
                    }
                    const csvContent = [
                      ['No', 'Name', 'Address', 'Phone', 'Email', 'Contact Person'].join(','),
                      ...filtered.map((v, i) =>
                        [
                          i + 1,
                          v.name || '',
                          v.address || '',
                          v.phone || '',
                          v.email || '',
                          v.contact_person || '',
                        ]
                          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                          .join(',')
                      ),
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `vendors_${new Date().toISOString().split('T')[0]}.csv`;
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
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vendors Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                {query ? 'Try adjusting your search' : 'Get started by adding your first vendor'}
              </p>
              {!query && (
                <Link
                  to="/vendors/new"
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
                  Add Vendor
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
                        // Always show main columns, only check visibility for optional columns
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
                              <span>{col.label}</span>
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
                    {paginatedVendors.map((vendor, index) => (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{startIndex + index + 1}</div>
                        </td>
                        {visibleColumns.id && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-600">{vendor.id}</div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.name || vendor.name_vendor || '-'}
                          </div>
                        </td>
                        {/* <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                            {vendor.code || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {vendor.description || '-'}
                          </div>
                        </td> */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {vendor.address || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vendor.telephone || vendor.contact_phone || vendor.phone || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vendor.email || vendor.contact_email || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vendor.contact_person ||
                              vendor.contact_name ||
                              vendor.contactPerson ||
                              '-'}
                          </div>
                        </td>
                        {visibleColumns.createdAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {vendor.created_at
                                ? new Date(vendor.created_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.updatedAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {vendor.updated_at
                                ? new Date(vendor.updated_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.deletedAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-red-600">
                              {vendor.deleted_at
                                ? new Date(vendor.deleted_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <VendorActionMenu
                            vendor={vendor}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, filtered.length)}</span> of{' '}
                      <span className="font-medium">{filtered.length}</span> results
                    </span>
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
                        onClick={() => setPage(Math.max(1, page - 1))}
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
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
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
}
