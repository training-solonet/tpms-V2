// src/pages/MasterData.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import managementClient from '../services/management/config';
import TailwindLayout from '../components/layout/TailwindLayout';
import AlertModal from '../components/common/AlertModal';
import DuplicateModal from '../components/common/DuplicateModal';
import {
  CircleStackIcon,
  TruckIcon,
  CpuChipIcon,
  SignalIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

const MasterData = () => {
  const masterDataImportRef = useRef(null);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [importProgress, setImportProgress] = useState({
    show: false,
    current: 0,
    total: 0,
    errors: [],
  });
  const [selectedDataType, setSelectedDataType] = useState('devices');
  const [profile, setProfile] = useState(null);

  // Duplicate handling states
  const [duplicateModal, setDuplicateModal] = useState({
    isOpen: false,
    itemName: '',
    dataType: '',
    errorMessage: '',
    onSkip: null,
    onOverwrite: null,
    onCancel: null,
  });
  const [applyToAll, setApplyToAll] = useState(false);
  const [userDecision, setUserDecision] = useState(null); // 'skip' or 'overwrite' or null
  
  // Use refs to track current values for use in async loops
  const applyToAllRef = useRef(false);
  const userDecisionRef = useRef(null);
  
  // Update refs when state changes
  React.useEffect(() => {
    applyToAllRef.current = applyToAll;
  }, [applyToAll]);
  
  React.useEffect(() => {
    userDecisionRef.current = userDecision;
  }, [userDecision]);

  // Helper to decode JWT token (not currently used but kept for future use)
  // eslint-disable-next-line no-unused-vars
  const decodeToken = (token) => {
    try {
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!currentToken) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }

      const response = await managementClient.get(`/users/me?t=${Date.now()}`);

      let rawData;
      if (response.success && response.data) {
        rawData = response.data;
      } else if (response.user) {
        rawData = response.user;
      } else if (response.id && response.email) {
        rawData = response;
      } else {
        throw new Error('Invalid response structure');
      }

      const normalizedData = {
        id: rawData.id,
        role: rawData.role || '',
      };

      setProfile(normalizedData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Helper function to check if user has admin privileges
  const isAdminRole = (role) => {
    if (!role) return false;
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'admin' || normalizedRole === 'superadmin';
  };

  // Master Data Templates
  const getMasterDataTemplate = (type) => {
    const templates = {
      devices: {
        headers: ['sn', 'truck_id', 'sim_number', 'status'],
        example: ['TPMS-DEV-001', '1', '6281234567890', 'active'],
      },
      sensors: {
        headers: ['sn', 'device_id', 'tireNo', 'simNumber', 'sensorNo', 'status'],
        example: ['SENS-T1-FL', '1', '1', '6281234560001', 'FL', 'active'],
      },
      trucks: {
        headers: ['name', 'vin', 'plate', 'model', 'year', 'type', 'vendor_id', 'status'],
        example: [
          'TRUCK-HD001',
          'HD001',
          'KT 7890 AB',
          'HD785-7',
          '2023',
          'Haul Truck',
          '1',
          'active',
        ],
      },
      drivers: {
        headers: [
          'name',
          'license_number',
          'license_type',
          'license_expiry',
          'phone',
          'email',
          'vendor_id',
          'status',
        ],
        example: [
          'Ahmad Supriadi',
          'B2-12345-2023',
          'B2',
          '2026-06-30',
          '+62 812 3456 7890',
          'ahmad.supriadi@email.com',
          '1',
          'aktif',
        ],
      },
      vendors: {
        headers: ['name_vendor', 'address', 'telephone', 'email', 'contact_person'],
        example: [
          'PT Mitra Transportasi Nusantara',
          'Jl. Raya Industri No. 45 Balikpapan',
          '0542-7654321',
          'info@mitratrans.co.id',
          'Budi Setiawan',
        ],
      },
    };
    return templates[type] || templates.devices;
  };

  // Export Master Data Template
  const handleExportMasterDataTemplate = (type) => {
    const template = getMasterDataTemplate(type);
    const csvContent = [
      template.headers.join(','),
      template.example.join(','),
      template.headers.map(() => '').join(','),
      template.headers.map(() => '').join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${type}_import_template_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Master Data
  const handleExportMasterData = async (type) => {
    try {
      const endpoints = {
        devices: '/iot/devices',
        sensors: '/iot/sensors',
        trucks: '/trucks',
        drivers: '/drivers',
        vendors: '/vendors',
      };

      const response = await managementClient.get(endpoints[type] || endpoints.devices);

      console.log(`[Export ${type}] Response:`, response.data);

      // Handle different response structures from different endpoints
      let data;
      if (type === 'devices' || type === 'sensors') {
        // IoT endpoints return: { success, data: { devices/sensors, pagination } }
        data = response.data?.data?.[type] || response.data?.[type] || [];
      } else if (type === 'trucks') {
        // Trucks endpoint returns: { data: { trucks: [...] } }
        data =
          response.data?.data?.trucks ||
          response.data?.trucks ||
          response.data?.data ||
          response.data ||
          [];
      } else if (type === 'drivers') {
        // Drivers endpoint returns: { data: { drivers: [...] } }
        data =
          response.data?.data?.drivers ||
          response.data?.drivers ||
          response.data?.data ||
          response.data ||
          [];
      } else if (type === 'vendors') {
        // Vendors endpoint returns: { data: { vendors: [...] } }
        data =
          response.data?.data?.vendors ||
          response.data?.vendors ||
          response.data?.data ||
          response.data ||
          [];
      } else {
        data = response.data?.data || response.data || [];
      }

      console.log(`[Export ${type}] Parsed data:`, data);

      if (!Array.isArray(data)) {
        console.error(`[Export ${type}] Data is not array:`, typeof data, data);
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Export Failed',
          message: `Invalid data format received from server`,
        });
        return;
      }

      if (data.length === 0) {
        setAlertModal({
          isOpen: true,
          type: 'info',
          title: 'No Data',
          message: `No ${type} found to export`,
        });
        return;
      }

      const template = getMasterDataTemplate(type);
      const headers = template.headers;
      const csvRows = [headers.join(',')];

      data.forEach((item) => {
        const row = headers.map((header) => {
          const value = item[header] || '';
          return value.toString().includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Export Success',
        message: `Successfully exported ${data.length} ${type}`,
      });
    } catch (error) {
      console.error(`Failed to export ${type}:`, error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Export Failed',
        message: error.response?.data?.message || `Failed to export ${type}`,
      });
    }
  };

  // Parse CSV content
  const parseCSV = (text) => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));

      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        const firstKey = Object.keys(row)[0];
        if (row[firstKey] && row[firstKey].trim()) {
          data.push(row);
        }
      }
    }

    return data;
  };

  // Import Master Data from CSV
  const handleImportMasterData = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Invalid File',
        message: 'Please upload a CSV file',
      });
      return;
    }

    try {
      const text = await file.text();
      const items = parseCSV(text);

      if (items.length === 0) {
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'No Data',
          message: `No valid ${type} data found in CSV file`,
        });
        return;
      }

      // Reset states
      setApplyToAll(false);
      setUserDecision(null);
      applyToAllRef.current = false;
      userDecisionRef.current = null;

      setImportProgress({ show: true, current: 0, total: items.length, errors: [] });

      let successCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      // Helper: delay to prevent rate limiting
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // Helper: Show duplicate modal and wait for user decision
      const askUserDecision = (itemName, errorMsg) => {
        return new Promise((resolve) => {
          setDuplicateModal({
            isOpen: true,
            itemName,
            dataType: type,
            errorMessage: errorMsg,
            onSkip: () => {
              setDuplicateModal({ ...duplicateModal, isOpen: false });
              resolve('skip');
            },
            onOverwrite: () => {
              setDuplicateModal({ ...duplicateModal, isOpen: false });
              resolve('overwrite');
            },
            onCancel: () => {
              setDuplicateModal({ ...duplicateModal, isOpen: false });
              resolve('cancel');
            },
          });
        });
      };

      const endpoints = {
        devices: '/iot/devices',
        sensors: '/iot/sensors',
        trucks: '/trucks',
        drivers: '/drivers',
        vendors: '/vendors',
      };

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Transform data based on type to match backend expectations (at loop level for access in catch block)
        let transformedItem = { ...item };

        try {
          // Apply transformations
          if (type === 'devices') {
            if (transformedItem.truck_id)
              transformedItem.truck_id = parseInt(transformedItem.truck_id);
            if (!transformedItem.sim_number) delete transformedItem.sim_number;
            if (!transformedItem.status) transformedItem.status = 'active';
          } else if (type === 'sensors') {
            if (transformedItem.device_id)
              transformedItem.device_id = parseInt(transformedItem.device_id);
            if (transformedItem.tireNo) transformedItem.tireNo = parseInt(transformedItem.tireNo);
            if (transformedItem.sensorNo)
              transformedItem.sensorNo = parseInt(transformedItem.sensorNo);
            if (!transformedItem.simNumber) delete transformedItem.simNumber;
            if (!transformedItem.sensorNo) delete transformedItem.sensorNo;
            if (!transformedItem.status) transformedItem.status = 'active';
          } else if (type === 'trucks') {
            if (transformedItem.year) transformedItem.year = parseInt(transformedItem.year);
            if (transformedItem.vendor_id)
              transformedItem.vendor_id = parseInt(transformedItem.vendor_id);
            if (!transformedItem.vin) delete transformedItem.vin;
            if (!transformedItem.model) delete transformedItem.model;
            if (!transformedItem.year) delete transformedItem.year;
            if (!transformedItem.type) delete transformedItem.type;
            if (!transformedItem.vendor_id) delete transformedItem.vendor_id;
            if (!transformedItem.status) transformedItem.status = 'active';
          } else if (type === 'drivers') {
            if (transformedItem.vendor_id)
              transformedItem.vendor_id = parseInt(transformedItem.vendor_id);
            if (!transformedItem.phone) delete transformedItem.phone;
            if (!transformedItem.email) delete transformedItem.email;
            if (!transformedItem.vendor_id) delete transformedItem.vendor_id;
            if (!transformedItem.status) transformedItem.status = 'active';
          } else if (type === 'vendors') {
            if (!transformedItem.address) delete transformedItem.address;
            if (!transformedItem.telephone) delete transformedItem.telephone;
            if (!transformedItem.email) delete transformedItem.email;
            if (!transformedItem.contact_person) delete transformedItem.contact_person;
          }

          // Client-side pre-validation: sensors must have device_id
          if (type === 'sensors') {
            if (!transformedItem.device_id || isNaN(transformedItem.device_id)) {
              const rowIdentifier = item[Object.keys(item)[0]] || `Row ${i + 2}`;
              console.log('[Import] Sensor validation failed:', {
                row: i + 2,
                item,
                transformedItem,
              });
              setImportProgress({ show: false, current: 0, total: items.length, errors: [] });
              if (masterDataImportRef.current) masterDataImportRef.current.value = '';
              setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Import Failed - Invalid Device ID',
                message: `Import failed at row ${i + 2} (${rowIdentifier}):\n\nColumn 'device_id' is empty or invalid.\n\nReceived value: ${item.device_id || '(empty)'}\nParsed value: ${transformedItem.device_id || '(empty)'}\n\nPlease:\n1. Make sure the Device is already imported to the database\n2. Fill in the correct 'device_id' number in the CSV\n3. Import Devices before importing Sensors`,
              });
              setUserDecision(null);
              setApplyToAll(false);
              return;
            }
          }

          await managementClient.post(endpoints[type], transformedItem);
          successCount++;

          // Delay to prevent rate limiting (300ms)
          await delay(300);
        } catch (error) {
          // Get detailed error message
          let errorMessage = `Failed to create ${type}`;
          let errorDetails = '';

          if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            const validationErrors = error.response.data.errors;
            errorDetails = validationErrors
              .map(
                (err) =>
                  `• ${err.field}: ${err.message}${err.value !== undefined ? ` (current value: "${err.value}")` : ''}`
              )
              .join('\n');
            errorMessage = 'Validation Error';

            console.log('[Import] Validation errors detected:', errorDetails);

            // If validation error indicates missing device_id, show friendly message
            const missingDeviceId = validationErrors.some((e) => {
              const field = (e.field || '').toString().toLowerCase();
              const msg = (e.message || '').toString().toLowerCase();
              return (field === 'device_id' || field === 'deviceid') && msg.includes('required');
            });

            if (missingDeviceId) {
              const rowIdentifier = item[Object.keys(item)[0]] || `Row ${i + 2}`;
              setImportProgress({ show: false, current: 0, total: 0, errors: [] });
              if (masterDataImportRef.current) masterDataImportRef.current.value = '';
              setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Import Failed - Missing Device',
                message: `Import failed at row ${i + 2} (${rowIdentifier}):\n\n❌ Validation Errors:\n${errorDetails}\n\n💡 Make sure the Device is registered and try again.`,
              });
              setUserDecision(null);
              setApplyToAll(false);
              return;
            }
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.message) {
            errorMessage = error.message;
          }

          // Detect "Truck not found" error from backend
          const truckNotFoundRegex = /truck not found[:\s]*([0-9]+)/i;
          const truckMsgSource = (
            error.response?.data?.message ||
            error.response?.data?.error ||
            errorMessage ||
            ''
          ).toString();
          const truckMatch = truckNotFoundRegex.exec(truckMsgSource);
          if (truckMatch) {
            const _missingTruckId = truckMatch[1];
            const rowIdentifier = item[Object.keys(item)[0]] || `Row ${i + 2}`;
            setImportProgress({ show: false, current: 0, total: 0, errors: [] });
            if (masterDataImportRef.current) masterDataImportRef.current.value = '';
            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Import Failed - Truck Not Found',
              message: `${errorMessage}\n\nRow: ${i + 2} (${rowIdentifier})\n\nPlease import Trucks first before importing Devices, or update the truck_id in your CSV.`,
            });
            setUserDecision(null);
            setApplyToAll(false);
            return;
          }

          // Detect "Device not found" error from backend
          const deviceNotFoundRegex = /device not found[:\s]*([0-9]+)/i;
          const deviceMsgSource = (
            error.response?.data?.message ||
            error.response?.data?.error ||
            errorMessage ||
            ''
          ).toString();
          const deviceMatch = deviceNotFoundRegex.exec(deviceMsgSource);
          if (deviceMatch) {
            const _missingDeviceId = deviceMatch[1];
            const rowIdentifier = item[Object.keys(item)[0]] || `Row ${i + 2}`;
            setImportProgress({ show: false, current: 0, total: 0, errors: [] });
            if (masterDataImportRef.current) masterDataImportRef.current.value = '';
            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Import Failed - Device Not Found',
              message: `${errorMessage}\n\nRow: ${i + 2} (${rowIdentifier})\n\nPlease import Devices first before importing Sensors, or update the device_id in your CSV.`,
            });
            setUserDecision(null);
            setApplyToAll(false);
            return;
          }
          // Check duplicate condition
          const isDuplicate =
            (errorMessage || '').toLowerCase().includes('already exists') ||
            (errorMessage || '').toLowerCase().includes('already occupied') ||
            (errorMessage || '').toLowerCase().includes('duplicate') ||
            error.response?.status === 409;

          // Check rate limit error
          const isRateLimited =
            error.response?.status === 429 ||
            (errorMessage || '').toLowerCase().includes('too many requests');

          if (isRateLimited) {
            // Use retryAfter from backend response, or default to 15 seconds
            const waitTime = (error.response?.data?.retryAfter || 15) * 1000;
            console.warn(
              `[Rate Limited] Row ${i + 1}, waiting ${waitTime / 1000}s before retry...`
            );

            // Show message to user
            setImportProgress({
              show: true,
              current: i,
              total: items.length,
              errors: [`Rate limit hit, waiting ${waitTime / 1000}s...`],
            });

            await delay(waitTime);
            // Retry this item by decrementing i
            i--;
            continue;
          }

          if (isDuplicate) {
            // Handle duplicate - use refs to get current values
            let decision = userDecisionRef.current;

            // Only ask if we don't have a saved decision yet
            if (decision === null) {
              // Ask user what to do
              const itemIdentifier = item[Object.keys(item)[0]] || `Row ${i + 2}`;
              decision = await askUserDecision(itemIdentifier, errorMessage);

              if (decision === 'cancel') {
                // User cancelled, stop import
                setImportProgress({ show: false, current: 0, total: 0, errors: [] });
                if (masterDataImportRef.current) masterDataImportRef.current.value = '';
                setAlertModal({
                  isOpen: true,
                  type: 'info',
                  title: 'Import Cancelled',
                  message: `Import cancelled by user.\n\n${successCount + updatedCount} record(s) were imported before cancellation.`,
                });
                return;
              }

              // Save decision to both state and ref for immediate use
              setUserDecision(decision);
              userDecisionRef.current = decision;
            }

            if (decision === 'skip') {
              // Skip this duplicate
              skippedCount++;
              setImportProgress((prev) => ({ ...prev, current: i + 1 }));
              continue;
            } else if (decision === 'overwrite') {
              // Try to find and update existing record
              try {
                console.log(`[Overwrite] Searching for existing ${type}...`);
                const searchRes = await managementClient.get(`${endpoints[type]}`);

                // Extract list from response - with null safety
                let list = [];
                const responseData = searchRes?.data;
                if (responseData) {
                  if (type === 'devices') {
                    list =
                      responseData.data?.devices ||
                      responseData.devices ||
                      responseData.data ||
                      responseData;
                  } else if (type === 'sensors') {
                    list =
                      responseData.data?.sensors ||
                      responseData.sensors ||
                      responseData.data ||
                      responseData;
                  } else if (type === 'trucks') {
                    list =
                      responseData.data?.trucks ||
                      responseData.trucks ||
                      responseData.data ||
                      responseData;
                  } else if (type === 'drivers') {
                    list =
                      responseData.data?.drivers ||
                      responseData.drivers ||
                      responseData.data ||
                      responseData;
                  } else if (type === 'vendors') {
                    list =
                      responseData.data?.vendors ||
                      responseData.vendors ||
                      responseData.data ||
                      responseData;
                  }
                }

                // Ensure list is array and filter nulls
                if (!Array.isArray(list)) {
                  list = [];
                }
                list = list.filter((item) => item != null && typeof item === 'object');

                console.log(`[Overwrite] Found ${list.length} valid items`);

                // Find existing record based on unique field (with null checks)
                let existingId = null;
                if (type === 'devices' || type === 'sensors') {
                  const found = list.find((d) => d && d.sn && item.sn && d.sn === item.sn);
                  existingId = found?.id || null;
                } else if (type === 'trucks') {
                  const found = list.find(
                    (t) => t && t.plate && item.plate && t.plate === item.plate
                  );
                  existingId = found?.id || null;
                } else if (type === 'drivers') {
                  const found = list.find((d) => d && d.name && item.name && d.name === item.name);
                  existingId = found?.id || null;
                } else if (type === 'vendors') {
                  const found = list.find(
                    (v) =>
                      v &&
                      (v.name_vendor || v.name) &&
                      item.name_vendor &&
                      (v.name_vendor === item.name_vendor || v.name === item.name_vendor)
                  );
                  existingId = found?.id || null;
                }

                console.log(`[Overwrite] Found existing ID:`, existingId);

                if (existingId) {
                  // Use the original transformedItem that was already prepared
                  await managementClient.put(`${endpoints[type]}/${existingId}`, transformedItem);
                  console.log(`[Overwrite] Update successful`);
                  updatedCount++;
                  await delay(300);
                } else {
                  // Could not find existing entity
                  console.warn('[Overwrite] Could not find existing record to update');
                  skippedCount++;
                }
              } catch (updateErr) {
                console.error('[Overwrite] Update failed:', updateErr);
                // If update fails, count as skipped
                skippedCount++;
              }
              setImportProgress((prev) => ({ ...prev, current: i + 1 }));
              continue;
            }
          } else {
            // Non-duplicate error: stop import and show error
            setImportProgress({ show: false, current: 0, total: 0, errors: [] });
            if (masterDataImportRef.current) {
              masterDataImportRef.current.value = '';
            }

            const rowIdentifier = item[Object.keys(item)[0]] || `Row ${i + 2}`;

            // Build comprehensive error message
            let errorMsg = `Import stopped at row ${i + 2}`;
            if (rowIdentifier !== `Row ${i + 2}`) {
              errorMsg += ` (${rowIdentifier})`;
            }
            errorMsg += ':\n\n';

            // Add validation errors or general error message
            if (errorDetails) {
              errorMsg += `❌ Validation Errors:\n${errorDetails}`;
            } else {
              errorMsg += `❌ Error: ${errorMessage}`;
            }

            // Add success info if any
            if (successCount + updatedCount > 0) {
              errorMsg += `\n\n✅ ${successCount + updatedCount} record(s) were successfully imported before this error.`;
            }

            errorMsg += '\n\n💡 Please fix the data and try again.';

            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Import Failed',
              message: errorMsg,
            });

            // Reset states
            setApplyToAll(false);
            setUserDecision(null);
            return;
          }

          if (isDuplicate) {
            // This block is handled above with modal - should not reach here
            console.error('[Import] Unexpected: Reached old duplicate code block');
            skippedCount++;
            setImportProgress((prev) => ({ ...prev, current: i + 1 }));
            continue;
          } else {
            // Non-duplicate error: stop import and show error
            setImportProgress({ show: false, current: 0, total: 0, errors: [] });
            if (masterDataImportRef.current) {
              masterDataImportRef.current.value = '';
            }

            const rowIdentifier = item[Object.keys(item)[0]] || `Row ${i + 2}`;

            // Build comprehensive error message
            let errorMsg = `Import stopped at row ${i + 2}`;
            if (rowIdentifier !== `Row ${i + 2}`) {
              errorMsg += ` (${rowIdentifier})`;
            }
            errorMsg += ':\n\n';

            // Add validation errors or general error message
            if (errorDetails) {
              errorMsg += `❌ Validation Errors:\n${errorDetails}`;
            } else {
              errorMsg += `❌ Error: ${errorMessage}`;
            }

            // Add success info if any
            if (successCount + updatedCount > 0) {
              errorMsg += `\n\n✅ ${successCount + updatedCount} record(s) were successfully imported before this error.`;
            }

            errorMsg += '\n\n💡 Please fix the data in your CSV file and try again.';

            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Import Failed - Validation Error',
              message: errorMsg,
            });

            // Reset states
            setApplyToAll(false);
            setUserDecision(null);
            return;
          }
        }
        setImportProgress((prev) => ({ ...prev, current: i + 1 }));
      }

      // Finish import successfully
      setTimeout(() => {
        setImportProgress({ show: false, current: 0, total: 0, errors: [] });
      }, 2000);

      // Build result message
      const totalProcessed = successCount + updatedCount + skippedCount;

      let message = `Import Complete!\n\n`;
      message += `✅ Successfully Created: ${successCount}\n`;
      if (updatedCount > 0) message += `🔄 Successfully Updated: ${updatedCount}\n`;
      if (skippedCount > 0) message += `⏭️ Skipped (already exists): ${skippedCount}\n`;
      message += `\n📊 Total Rows Processed: ${totalProcessed} of ${items.length}`;

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: '✅ Import Success',
        message: message,
      });

      if (masterDataImportRef.current) {
        masterDataImportRef.current.value = '';
      }

      // Reset states
      setApplyToAll(false);
      setUserDecision(null);
    } catch (error) {
      console.error(`Failed to import ${type}:`, error);
      setImportProgress({ show: false, current: 0, total: 0, errors: [] });
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Import Failed',
        message: `Failed to process CSV file: ${error.message}`,
      });
      // Reset states
      setApplyToAll(false);
      setUserDecision(null);
    }
  };

  if (!profile) {
    return (
      <TailwindLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <CircleStackIcon className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  if (!isAdminRole(profile?.role)) {
    return (
      <TailwindLayout>
        <div className="h-full flex items-center justify-center bg-white">
          <div className="text-center py-12">
            <CircleStackIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Restricted</h3>
            <p className="mt-2 text-sm text-gray-500">
              Only administrators can manage master data.
            </p>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  return (
    <TailwindLayout>
      <div className="h-full overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CircleStackIcon className="h-8 w-8 mr-3 text-purple-600" />
              Master Data Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Bulk import and export master data for devices, sensors, trucks, drivers, and vendors.
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
            {/* Instructions Panel */}
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Bulk Import/Export Instructions
              </h4>
              <ul className="text-xs text-purple-800 space-y-1 ml-7">
                <li>• Select data type below (Devices, Sensors, Trucks, Drivers, or Vendors)</li>
                <li>• Download template CSV for the selected type</li>
                <li>• Fill in the data according to the template format</li>
                <li>• Import CSV to create multiple records at once</li>
                <li>• Export existing data for backup or reference</li>
              </ul>
            </div>

            {/* Import Order Warning */}
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
              <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                ⚠️ IMPORTANT: Import Order Sequence
              </h4>
              <p className="text-xs text-amber-900 mb-3 font-medium">
                Data must be imported in the correct order due to dependencies. Follow this sequence:
              </p>
              <div className="flex items-center justify-center mb-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                  <div className="bg-indigo-100 border-2 border-indigo-400 px-3 py-2 rounded-lg shadow-sm">
                    1️⃣ Vendors
                  </div>
                  <span className="text-amber-700">→</span>
                  <div className="bg-purple-100 border-2 border-purple-400 px-3 py-2 rounded-lg shadow-sm">
                    2️⃣ Drivers
                  </div>
                  <span className="text-amber-700">→</span>
                  <div className="bg-orange-100 border-2 border-orange-400 px-3 py-2 rounded-lg shadow-sm">
                    3️⃣ Trucks
                  </div>
                  <span className="text-amber-700">→</span>
                  <div className="bg-blue-100 border-2 border-blue-400 px-3 py-2 rounded-lg shadow-sm">
                    4️⃣ Devices
                  </div>
                  <span className="text-amber-700">→</span>
                  <div className="bg-green-100 border-2 border-green-400 px-3 py-2 rounded-lg shadow-sm">
                    5️⃣ Sensors
                  </div>
                </div>
              </div>
              <div className="bg-white/50 p-3 rounded border border-amber-200">
                <p className="text-xs text-amber-900 mb-2 font-semibold">Why this order matters:</p>
                <ul className="text-xs text-amber-800 space-y-1 ml-4">
                  <li>• <strong>Vendors first:</strong> Drivers and Trucks require valid vendor_id</li>
                  <li>• <strong>Trucks before Devices:</strong> Devices require valid truck_id</li>
                  <li>• <strong>Devices before Sensors:</strong> Sensors require valid device_id</li>
                </ul>
                <p className="text-xs text-amber-900 mt-3 font-medium">
                  ❌ Importing out of order will result in errors due to missing references.
                </p>
              </div>
            </div>

            {/* Data Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Data Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'devices', name: 'Devices', icon: CpuChipIcon, color: 'blue' },
                  { id: 'sensors', name: 'Sensors', icon: SignalIcon, color: 'green' },
                  { id: 'trucks', name: 'Trucks', icon: TruckIcon, color: 'orange' },
                  { id: 'drivers', name: 'Drivers', icon: UserIcon, color: 'purple' },
                  { id: 'vendors', name: 'Vendors', icon: BuildingOfficeIcon, color: 'indigo' },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedDataType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedDataType(type.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Icon
                        className={`h-8 w-8 mb-2 ${
                          isSelected ? `text-${type.color}-600` : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? `text-${type.color}-700` : 'text-gray-600'
                        }`}
                      >
                        {type.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Import Progress Bar */}
            {importProgress.show && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Importing {selectedDataType}...
                  </span>
                  <span className="text-sm text-blue-700">
                    {importProgress.current} / {importProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Download Template */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-3">
                  <DocumentArrowDownIcon className="h-6 w-6 text-gray-600 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-900">Download Template</h4>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Get CSV template with example data for {selectedDataType}
                </p>
                <button
                  onClick={() => handleExportMasterDataTemplate(selectedDataType)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Download Template
                </button>
              </div>

              {/* Export Data */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
                <div className="flex items-center mb-3">
                  <ArrowDownTrayIcon className="h-6 w-6 text-emerald-600 mr-2" />
                  <h4 className="text-sm font-semibold text-emerald-900">Export Data</h4>
                </div>
                <p className="text-xs text-emerald-700 mb-4">
                  Download all existing {selectedDataType} to CSV file
                </p>
                <button
                  onClick={() => handleExportMasterData(selectedDataType)}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Export {selectedDataType}
                </button>
              </div>

              {/* Import Data */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center mb-3">
                  <ArrowUpTrayIcon className="h-6 w-6 text-indigo-600 mr-2" />
                  <h4 className="text-sm font-semibold text-indigo-900">Import Data</h4>
                </div>
                <p className="text-xs text-indigo-700 mb-3">
                  Upload CSV file to create multiple {selectedDataType}
                </p>

                {/* Import Mode Selector */}
                <button
                  onClick={() => masterDataImportRef.current?.click()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Import CSV
                </button>
                <input
                  ref={masterDataImportRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleImportMasterData(e, selectedDataType)}
                />
              </div>
            </div>

            {/* Data Format Reference */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                CSV Format for{' '}
                {selectedDataType.charAt(0).toUpperCase() + selectedDataType.slice(1)}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      {getMasterDataTemplate(selectedDataType).headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      {getMasterDataTemplate(selectedDataType).example.map((value, idx) => (
                        <td key={idx} className="px-3 py-2 text-gray-600 border-b border-gray-200">
                          {value}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Note:</strong> The first row must contain the column names (headers), the
                following rows are the data.
                <br />
                <strong>✓ Column order is flexible</strong> - what matters is that the column names
                must match the example above.
              </p>
            </div>

            {/* Field Requirements & Validation Rules */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Field Requirements & Validation
              </h4>

              {selectedDataType === 'devices' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">sn:</span>
                      <span className="text-red-700 font-medium">
                        Required, unique Serial Number (max 50 chars) e.g: DEV001
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">truck_id:</span>
                      <span className="text-red-700 font-medium">
                        Required, truck ID (must exist in database)
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">sim_number:</span>
                      <span>Optional, device SIM card number (max 50 chars)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">status:</span>
                      <span>
                        Optional, default: active (options: active, inactive, maintenance)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDataType === 'sensors' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">sn:</span>
                      <span className="text-red-700 font-medium">
                        Required, unique Serial Number (max 50 chars) e.g: SENS001
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">device_id:</span>
                      <span className="text-red-700 font-medium">
                        Required, device ID (must exist in database)
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">tireNo:</span>
                      <span className="text-red-700 font-medium">
                        Required, tire position (number 1-10)
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">simNumber:</span>
                      <span>Optional, SIM number for sensor (max 50 chars)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">sensorNo:</span>
                      <span>Optional, sensor number (number)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">status:</span>
                      <span>
                        Optional, default: active (options: active, inactive, maintenance)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDataType === 'trucks' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">name:</span>
                      <span className="text-red-700 font-medium">
                        Required, truck name/ID (max 255 chars) e.g: TRUCK-01
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">plate:</span>
                      <span className="text-red-700 font-medium">
                        Required, license plate (max 50 chars), unique. E.g: B 1234 XYZ
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">vin:</span>
                      <span>Optional, VIN 5 characters (letters & numbers), unique</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">model:</span>
                      <span>Optional, truck model (Hino Ranger, Isuzu Giga, etc)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">year:</span>
                      <span>Optional, 4-digit year (e.g: 2023)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">type:</span>
                      <span>Optional, truck type (Dump Truck, Box Truck, etc)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">vendor_id:</span>
                      <span>Optional, vendor ID (must exist in database)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">status:</span>
                      <span>
                        Optional, default: active (options: active, inactive, maintenance)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDataType === 'drivers' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">name:</span>
                      <span className="text-red-700 font-medium">
                        Required, driver full name (max 255 chars)
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">license_number:</span>
                      <span className="text-red-700 font-medium">
                        Required, license number (max 50 chars) e.g: SIM-A-12345
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">license_type:</span>
                      <span className="text-red-700 font-medium">
                        Required, license type (A/B1/B2/C) max 20 chars
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">license_expiry:</span>
                      <span className="text-red-700 font-medium">
                        Required, license expiry date (format: YYYY-MM-DD)
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">phone:</span>
                      <span>Optional, phone number (format: +62 812 3456 7890)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">email:</span>
                      <span>Optional, valid email (example@domain.com)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">vendor_id:</span>
                      <span>Optional, vendor ID (must exist in database)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">status:</span>
                      <span>Optional, default: active (options: active, inactive, on_leave)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDataType === 'vendors' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">name_vendor:</span>
                      <span className="text-red-700 font-medium">
                        Required, vendor name (max 255 chars)
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">address:</span>
                      <span>Optional, vendor full address</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">telephone:</span>
                      <span>Optional, phone number (max 50 chars)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">email:</span>
                      <span>Optional, vendor email (max 255 chars)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">contact_person:</span>
                      <span>Optional, contact person name (max 255 chars)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-blue-300">
                <p className="text-xs text-blue-800">
                  <strong>⚠️ Important:</strong> Fields marked in red are REQUIRED or have specific
                  format requirements. Make sure data matches the format to avoid import errors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Handling Modal */}
      <DuplicateModal
        isOpen={duplicateModal.isOpen}
        itemName={duplicateModal.itemName}
        dataType={duplicateModal.dataType}
        errorMessage={duplicateModal.errorMessage}
        onSkip={duplicateModal.onSkip}
        onOverwrite={duplicateModal.onOverwrite}
        onCancel={duplicateModal.onCancel}
        showApplyAll={true}
        applyToAll={applyToAll}
        onApplyAllChange={setApplyToAll}
      />

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
};

export default MasterData;
