import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { vendorsApi } from 'services/management';
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

export default function VendorForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const [form, setForm] = React.useState({
    name_vendor: '',
    email: '',
    telephone: '',
    address: '',
    contact_person: '',
  });
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [alertModal, setAlertModal] = React.useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (isNew) return;
    const loadVendor = async () => {
      setLoading(true);
      try {
        console.log('📡 Loading vendor data from Backend 2...');
        const res = await vendorsApi.getById(id);
        console.log('✅ Vendor response:', res);
        const vendor = res?.data;
        if (vendor) {
          setForm({
            name_vendor: vendor.name || vendor.name_vendor || '',
            email: vendor.email || '',
            telephone: vendor.telephone || vendor.contact_phone || '',
            address: vendor.address || vendor.description || '',
            contact_person: vendor.contact_person || vendor.contact_name || '',
          });
        }
      } catch (error) {
        console.error('❌ Failed to load vendor:', error);
      }
      setLoading(false);
    };
    loadVendor();
  }, [id, isNew]);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSave = async () => {
    try {
      setSaving(true);

      // Frontend Validation dengan pesan yang spesifik
      const errors = [];

      if (!form.name_vendor?.trim()) {
        errors.push('• Vendor Name is required');
      } else if (form.name_vendor.length < 2) {
        errors.push('• Vendor Name must be at least 2 characters');
      } else if (form.name_vendor.length > 255) {
        errors.push('• Vendor Name must not exceed 255 characters');
      }

      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.push('• Email format is invalid (example: user@domain.com)');
      }

      if (form.telephone && form.telephone.length > 50) {
        errors.push('• Telephone number must not exceed 50 characters');
      }

      if (form.address && form.address.length > 500) {
        errors.push('• Address must not exceed 500 characters');
      }

      if (form.contact_person && form.contact_person.length > 255) {
        errors.push('• Contact Person must not exceed 255 characters');
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

      console.log('💾 Saving vendor data to Backend 2...', form);

      const vendorData = {
        name_vendor: form.name_vendor,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        address: form.address || undefined,
        contact_person: form.contact_person || undefined,
      };

      // Remove undefined fields
      Object.keys(vendorData).forEach(
        (key) => vendorData[key] === undefined && delete vendorData[key]
      );

      let response;
      if (!isNew) {
        // UPDATE existing vendor
        console.log('🔄 Updating vendor:', id, vendorData);
        response = await vendorsApi.update(id, vendorData);
        console.log('✅ Vendor updated successfully:', response);
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Vendor updated successfully!',
        });
      } else {
        // CREATE new vendor
        console.log('➕ Creating new vendor', vendorData);
        response = await vendorsApi.create(vendorData);
        console.log('✅ Vendor created successfully:', response);
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Vendor created successfully!',
        });
      }
    } catch (error) {
      console.error('❌ Failed to save vendor:', error);

      // Handle validation errors from backend
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors
          .map((e) => `• ${e.field}: ${e.message}`)
          .join('\n');
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Validation Error',
          message: `Please fix the following errors:\n\n${errorMessages}`,
        });
      } else {
        const errorMsg =
          error.response?.data?.message || error.message || 'Failed to save vendor data';
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: `Failed to save vendor:\n${errorMsg}`,
        });
      }
    } finally {
      setSaving(false);
    }
  };

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
          <Link to="/Vendors" className="hover:text-indigo-600 transition-colors">
            Vendors
          </Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-900 font-medium">Add Vendor</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Add New Vendor' : 'Edit Vendor'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isNew ? 'Create a new vendor record' : 'Update vendor information'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/vendors"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Loading vendor data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Form Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Vendor Information</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in the vendor details below</p>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Vendor Name *"
                    placeholder="Enter vendor name"
                    value={form.name_vendor}
                    onChange={(e) => update('name_vendor', e.target.value)}
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
                  />
                  <Input
                    label="Email"
                    placeholder="vendor@example.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
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

                <div className="mt-4">
                  <TextArea
                    label="Address"
                    placeholder="Enter vendor address (optional)"
                    rows={3}
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                  />
                </div>
              </div>

              {/* Contact Section */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Person"
                    placeholder="Contact person name"
                    value={form.contact_person}
                    onChange={(e) => update('contact_person', e.target.value)}
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
                    label="Telephone"
                    placeholder="Phone number"
                    value={form.telephone}
                    onChange={(e) => update('telephone', e.target.value)}
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
                </div>
              </div>

              {/* Required Fields Note */}
              <div className="pt-6 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
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
                      Fields marked with <span className="font-semibold">*</span> are required.
                      Please ensure all required fields are filled before saving.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <Link
                to="/vendors"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {saving ? 'Saving...' : isNew ? 'Add Data' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
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
