import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import AlertModal from '../../components/common/AlertModal.jsx';
import DatePicker from '../../components/common/DatePicker.jsx';
import { driversApi, vendorsApi } from 'services/management';

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

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <textarea
        {...props}
        className={`w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${props.className || ''}`}
      />
    </label>
  );
}

function Select({ label, icon, children, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <select
          {...props}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-8 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white cursor-pointer ${props.className || ''}`}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </label>
  );
}

export default function DriverForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  console.log('🔍 DriverForm - URL param id:', id, 'type:', typeof id);

  const isNew = id === 'new';
  const isEdit = id && id !== 'new' && id !== undefined && id !== 'undefined';

  const [form, setForm] = React.useState({
    // Basic Info
    name: '',
    phone: '',
    email: '',
    license_number: '', // License Number (required)
    license_type: '', // License Type
    license_expiry: '', // License Expiry Date
    vendor_id: '', // Vendor ID
    status: 'aktif', // 'aktif' or 'nonaktif'
  });
  const [vendors, setVendors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [validationErrors, setValidationErrors] = React.useState([]);
  const [alertModal, setAlertModal] = React.useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Load driver data if editing and vendors
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load vendors
        const vendorsRes = await vendorsApi.getAll().catch(() => ({ data: { vendors: [] } }));
        const vendorsArray = vendorsRes?.data?.vendors || vendorsRes?.data || [];
        setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);

        // Load driver data if editing
        if (isEdit && id && id !== 'undefined') {
          console.log('📡 Loading driver data from Backend 2 with ID:', id);
          try {
            const res = await driversApi.getById(id);
            console.log('✅ Driver response:', res);

            // Handle different response formats
            const driver = res?.data?.driver || res?.data || res;

            if (driver && driver.id) {
              console.log('📝 Setting form data:', driver);
              setForm({
                name: driver.name || '',
                phone: driver.phone || '',
                email: driver.email || '',
                license_number: driver.license_number || driver.licenseNumber || '',
                license_type: driver.license_type || driver.licenseType || '',
                license_expiry: driver.license_expiry || driver.licenseExpiry || '',
                vendor_id: String(driver.vendor_id || driver.vendorId || ''),
                status: driver.status || 'aktif',
              });
              console.log('✅ Form data set successfully');
              console.log('📝 Driver Name:', driver.name);
              console.log('📞 Phone:', driver.phone);
              console.log('🏢 Vendor ID:', driver.vendor_id || driver.vendorId);
            } else {
              console.warn('⚠️ No driver data found in response');
              setError('Driver data not found');
              setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Driver data not found.',
              });
            }
          } catch (driverErr) {
            console.error('❌ Failed to load driver data:', driverErr);
            setError(driverErr.message || 'Failed to load driver data');
            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Error',
              message: 'Failed to load driver data. Please try again.',
            });
          }
        }
      } catch (err) {
        console.error('❌ Failed to load data:', err);
        setError(err.message || 'Failed to load data');
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to load form data. Please check your connection.',
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEdit, navigate]);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setValidationErrors([]);

      // Basic frontend validation
      if (!form.name || !form.license_number) {
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Validation Error',
          message: 'Name and License Number are required fields!',
        });
        return;
      }

      // Build payload for API
      const driverData = {
        name: form.name,
        phone: form.phone || '',
        email: form.email || '',
        license_number: form.license_number,
        license_type: form.license_type || '',
        license_expiry: form.license_expiry || '',
        vendor_id: form.vendor_id
          ? isNaN(parseInt(form.vendor_id))
            ? form.vendor_id
            : parseInt(form.vendor_id)
          : null,
        status: form.status || 'aktif',
      };

      // Remove undefined fields (keep nulls where explicit)
      Object.keys(driverData).forEach((k) => {
        if (driverData[k] === undefined) delete driverData[k];
      });

      let response;
      if (isEdit) {
        // UPDATE existing driver
        console.log('🔄 Updating driver ID:', id);
        console.log('🔄 Driver data:', driverData);

        // Validate ID before update
        if (!id || id === 'new') {
          throw new Error('Invalid driver ID for update');
        }

        response = await driversApi.update(id, driverData);
        console.log('✅ Driver updated successfully:', response);
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Driver updated successfully!',
        });
      } else {
        // CREATE new driver
        console.log('➕ Creating new driver', driverData);
        response = await driversApi.create(driverData);
        console.log('✅ Driver created successfully:', response);
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Driver created successfully!',
        });
      }
    } catch (err) {
      console.error('❌ Failed to save driver:', err);

      // Handle validation errors from backend
      if (err?.data?.errors && Array.isArray(err.data.errors)) {
        setValidationErrors(err.data.errors);
        const errorMessages = err.data.errors.map((e) => `${e.field}: ${e.message}`).join('\n');
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Validation Error',
          message: errorMessages,
        });
      } else {
        const errorMsg = err.message || err?.data?.message || 'Unknown error';
        setError(errorMsg);
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Failed',
          message: `Failed to save driver: ${errorMsg}`,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <TailwindLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Loading driver data...</p>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  return (
    <TailwindLayout>
      {/* <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-4 overflow-y-auto"> */}
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
          <Link to="/drivers" className="hover:text-indigo-600 transition-colors">
            Drivers
          </Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-900 font-medium">Add Driver</span>
        </nav>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Add New Driver' : 'Edit Driver'}
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                {isNew ? 'Create a new driver record' : 'Update driver information'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/drivers')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 text-sm mt-3">Loading driver data...</p>
          </div>
        ) : (
          <>
            {/* Error Alerts - Full Width */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs text-red-800">
                    <strong>Error:</strong> {error}
                  </span>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                <p className="text-xs font-semibold text-yellow-800 mb-2">Validation Errors:</p>
                <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>
                      <strong>{err.field}:</strong> {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Preview Card (Only show when editing and data loaded) */}
            {isEdit && !loading && form.name && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      Current Driver Data
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-blue-700 font-medium">Name:</span>
                        <span className="text-blue-900 ml-2">{form.name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Phone:</span>
                        <span className="text-blue-900 ml-2">{form.phone || '-'}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Email:</span>
                        <span className="text-blue-900 ml-2">{form.email || '-'}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">License:</span>
                        <span className="text-blue-900 ml-2">{form.license_number || '-'}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Type:</span>
                        <span className="text-blue-900 ml-2">{form.license_type || '-'}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Status:</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                            form.status === 'aktif'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {form.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-3">
              {/* Left Column - Main Info (spans 7 columns on xl, 8 on lg) */}
              <div className="lg:col-span-8 xl:col-span-7 space-y-3">
                {/* Personal Info Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-blue-50">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-indigo-600"
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
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">
                          Personal Information
                        </h2>
                        <p className="text-xs text-gray-600">Driver identity and contact</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      <Input
                        label="Driver Name *"
                        placeholder="Enter driver name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        icon={
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        }
                      />
                      <Input
                        label="Phone Number"
                        placeholder="+62812345678"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        type="tel"
                        icon={
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
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        }
                      />
                      <Input
                        label="Email"
                        placeholder="driver@example.com"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        type="email"
                        icon={
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
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      <Input
                        label="License Number *"
                        placeholder="e.g., LICENSE001"
                        value={form.license_number}
                        onChange={(e) => update('license_number', e.target.value)}
                        icon={
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
                              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                            />
                          </svg>
                        }
                      />
                      <Input
                        label="License Type"
                        placeholder="e.g., A, B1, B2"
                        value={form.license_type}
                        onChange={(e) => update('license_type', e.target.value)}
                        icon={
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
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        }
                      />
                      <DatePicker
                        label="License Expiry"
                        placeholder="Select expiry date"
                        value={form.license_expiry ? new Date(form.license_expiry) : null}
                        onChange={(date) =>
                          update('license_expiry', date ? date.toISOString().split('T')[0] : '')
                        }
                        minDate={new Date()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Additional Info (spans 5 columns on xl, 4 on lg) */}
              <div className="lg:col-span-4 xl:col-span-5 space-y-3">
                {/* Status Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-purple-600"
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
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                        <p className="text-xs text-gray-600">Driver status</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <Select
                      label="Status *"
                      value={form.status}
                      onChange={(e) => update('status', e.target.value)}
                      icon={
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      }
                    >
                      <option value="aktif">✅ Active</option>
                      <option value="nonaktif">⛔ Inactive</option>
                    </Select>

                    <div className="pt-2 border-t border-gray-100">
                      <div
                        className={`p-3 rounded-md text-center ${form.status === 'aktif' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}
                      >
                        <div
                          className={`text-2xl mb-1 ${form.status === 'aktif' ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {form.status === 'aktif' ? '✓' : '○'}
                        </div>
                        <p
                          className={`text-xs font-semibold ${form.status === 'aktif' ? 'text-green-700' : 'text-gray-600'}`}
                        >
                          {form.status === 'aktif' ? 'Driver Active' : 'Driver Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vendor Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600"
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
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">Vendor</h2>
                        <p className="text-xs text-gray-600">Associated vendor</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <Select
                      label="Vendor"
                      value={form.vendor_id}
                      onChange={(e) => update('vendor_id', e.target.value)}
                      icon={
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      }
                    >
                      <option value="">Select Vendor (Optional)</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name || v.name_vendor}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Image Upload Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-yellow-50 to-orange-50">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer - Full Width */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Fields marked with <span className="text-red-500 font-medium">*</span> are
                  required
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/drivers')}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {saving ? 'Saving...' : isNew ? 'Create Driver' : 'Update Driver'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* </div> */}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
        confirmText="OK"
      />
    </TailwindLayout>
  );
}
