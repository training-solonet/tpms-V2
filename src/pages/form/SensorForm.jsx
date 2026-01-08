import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { devicesApi } from 'services/management';
import AlertModal from '../../components/common/AlertModal.jsx';

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
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed ${props.className || ''}`}
        />
      </div>
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
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-8 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed ${props.className || ''}`}
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

export default function SensorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = React.useState({
    device_id: '',
    tireNo: 1,
    sensorNo: '',
    simNumber: '',
    sn: '',
    status: 'active',
  });

  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [alertModal, setAlertModal] = React.useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Tire positions for TPMS sensors (1-20 for typical mining trucks)
  const tirePositions = Array.from({ length: 20 }, (_, i) => ({
    value: i + 1,
    label: `Tire ${i + 1}`,
  }));

  // Load data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📡 Loading sensor form data...');
        console.log('📌 Sensor ID from URL:', id);
        console.log('📌 Is New?', isNew);

        // Load devices for dropdown
        const devicesRes = await devicesApi.getAll().catch(() => ({ data: [] }));
        const devicesArray = devicesRes?.data?.devices || devicesRes?.data || [];
        setDevices(Array.isArray(devicesArray) ? devicesArray : []);

        // Load sensor data if editing
        if (!isNew) {
          // Validate ID
          const sensorId = parseInt(id);
          if (isNaN(sensorId) || sensorId <= 0) {
            throw new Error(`Invalid sensor ID: ${id}`);
          }

          console.log('📌 Parsed Sensor ID:', sensorId);

          // Get sensor by ID
          const sensorRes = await devicesApi.getSensorById(sensorId);
          const sensor = sensorRes?.data?.sensor || sensorRes?.data;

          if (sensor) {
            console.log('✅ Sensor data loaded:', sensor);
            setForm({
              device_id: sensor.device_id?.toString() || '',
              tireNo: sensor.tireNo || sensor.tire_no || 1,
              sensorNo: sensor.sensorNo || sensor.sensor_no || '',
              simNumber: sensor.simNumber || sensor.sim_number || '',
              sn: sensor.sn || sensor.serial_number || '',
              status: sensor.status || 'active',
            });
          } else {
            throw new Error('Sensor not found');
          }
        }
      } catch (err) {
        console.error('❌ Failed to load form data:', err);
        setError(err.message || 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew]);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Frontend Validation dengan pesan yang spesifik
      const errors = [];

      if (!form.device_id) {
        errors.push('• Device is required (please select a device)');
      }

      if (!form.sn?.trim()) {
        errors.push('• Serial Number is required');
      } else if (form.sn.length < 3) {
        errors.push('• Serial Number must be at least 3 characters');
      } else if (form.sn.length > 50) {
        errors.push('• Serial Number must not exceed 50 characters');
      } else if (!/^[A-Za-z0-9_-]+$/.test(form.sn)) {
        errors.push('• Serial Number can only contain letters, numbers, hyphens and underscores');
      }

      if (!form.tireNo) {
        errors.push('• Tire Number is required');
      } else if (form.tireNo < 1 || form.tireNo > 24) {
        errors.push('• Tire Number must be between 1-24');
      }

      if (form.simNumber && form.simNumber.length > 20) {
        errors.push('• SIM Number must not exceed 20 characters');
      }

      if (form.sensorNo && (form.sensorNo < 1 || form.sensorNo > 100)) {
        errors.push('• Sensor Number must be between 1-100');
      }

      if (errors.length > 0) {
        setAlertModal({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: `Please fix the following errors:\n\n${errors.join('\n')}`,
        });
        setSaving(false);
        return;
      }

      console.log('💾 Saving sensor data...', form);

      const sensorData = {
        device_id: parseInt(form.device_id),
        sn: form.sn,
        tireNo: parseInt(form.tireNo),
        ...(form.sensorNo && { sensorNo: parseInt(form.sensorNo) }),
        ...(form.simNumber && { simNumber: form.simNumber }),
        status: form.status,
      };

      let response;
      if (isNew) {
        console.log('➕ Creating new sensor');
        response = await devicesApi.createSensor(sensorData);
        console.log('✅ Sensor created successfully:', response);
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Sensor created successfully!',
        });
      } else {
        console.log('🔄 Updating sensor:', id);
        // For update, allow changing device_id, tireNo, sensorNo, simNumber, and status
        // Only Serial Number (sn) cannot be changed as it's the hardware identifier
        const updateData = {
          device_id: parseInt(form.device_id),
          tireNo: parseInt(form.tireNo),
          status: form.status,
        };

        // Add optional fields if they have values
        if (form.sensorNo) {
          updateData.sensorNo = parseInt(form.sensorNo);
        }
        if (form.simNumber) {
          updateData.simNumber = form.simNumber;
        }

        response = await devicesApi.updateSensor(parseInt(id), updateData);
        console.log('✅ Sensor updated successfully:', response);
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Sensor updated successfully!',
        });
      }
    } catch (err) {
      console.error('❌ Failed to save sensor:', err);
      setError(err.message || 'Failed to save sensor');

      // Handle validation errors from backend
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors
          .map((e) => `• ${e.field}: ${e.message}`)
          .join('\n');
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Validation Error',
          message: `Please fix the following errors:\n\n${errorMessages}`,
        });
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to save sensor data';
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: `Failed to save sensor:\n${errorMsg}`,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TailwindLayout>
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Loading sensor data...</p>
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
          <Link to="/Sensors" className="hover:text-indigo-600 transition-colors">
            Sensors
          </Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-900 font-medium">Add Sensor</span>
        </nav>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Add New Sensor' : 'Edit Sensor'}
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                {isNew ? 'Create a new sensor record' : 'Update sensor information'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/devices')}
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

        {/* Error Alert */}
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

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-8 xl:col-span-7 space-y-3">
            {/* Sensor Information Card */}
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Sensor Information</h2>
                    <p className="text-xs text-gray-600">Sensor configuration details</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {!isNew && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                    <p className="text-xs text-blue-800 flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600 mt-0.5 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        <strong>Edit Mode:</strong> You can change the Parent Device (to move sensor
                        to another truck), Tire Position, Sensor Number, SIM Number, and Status.
                        Only the Serial Number (hardware ID) cannot be changed.
                      </span>
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Select
                    label="Parent Device *"
                    value={form.device_id}
                    onChange={(e) => update('device_id', e.target.value)}
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
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    }
                  >
                    <option value="">Select Device *</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.sn || device.device_sn || device.deviceSn} (Truck:{' '}
                        {device.truck?.name || device.truck?.plate || 'N/A'})
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Serial Number *"
                    placeholder="e.g., SN123456"
                    value={form.sn}
                    onChange={(e) => update('sn', e.target.value)}
                    disabled={!isNew}
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <Select
                    label="Tire Number *"
                    value={form.tireNo}
                    onChange={(e) => update('tireNo', e.target.value)}
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    }
                  >
                    {tirePositions.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Sensor Number"
                    placeholder="e.g., 1"
                    type="number"
                    value={form.sensorNo}
                    onChange={(e) => update('sensorNo', e.target.value)}
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
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                    }
                  />

                  <Input
                    label="SIM Number"
                    placeholder="e.g., 628123456789"
                    value={form.simNumber}
                    onChange={(e) => update('simNumber', e.target.value)}
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
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status */}
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
                    <p className="text-xs text-gray-600">Sensor operational status</p>
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
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                  <option value="calibrating">⚙️ Calibrating</option>
                  <option value="error">⛔ Error</option>
                </Select>

                <div className="pt-2 border-t border-gray-100">
                  <div
                    className={`p-3 rounded-md text-center ${
                      form.status === 'active'
                        ? 'bg-green-50 border border-green-200'
                        : form.status === 'calibrating'
                          ? 'bg-yellow-50 border border-yellow-200'
                          : form.status === 'inactive'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div
                      className={`text-2xl mb-1 ${
                        form.status === 'active'
                          ? 'text-green-600'
                          : form.status === 'calibrating'
                            ? 'text-yellow-600'
                            : form.status === 'inactive'
                              ? 'text-blue-600'
                              : 'text-red-600'
                      }`}
                    >
                      {form.status === 'active'
                        ? '✓'
                        : form.status === 'calibrating'
                          ? '⚙'
                          : form.status === 'inactive'
                            ? '⏸'
                            : '✕'}
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        form.status === 'active'
                          ? 'text-green-700'
                          : form.status === 'calibrating'
                            ? 'text-yellow-700'
                            : form.status === 'inactive'
                              ? 'text-blue-700'
                              : 'text-red-700'
                      }`}
                    >
                      {form.status === 'active'
                        ? 'Sensor Active'
                        : form.status === 'calibrating'
                          ? 'Calibrating'
                          : form.status === 'inactive'
                            ? 'Sensor Inactive'
                            : 'Sensor Error'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Footer */}
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
              Fields marked with <span className="text-red-500 font-medium">*</span> are required
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/sensors')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {saving ? 'Saving...' : isNew ? 'Add Data' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* </div> */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
      />
    </TailwindLayout>
  );
}
