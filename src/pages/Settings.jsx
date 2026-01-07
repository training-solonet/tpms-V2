// src/pages/Settings.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import managementClient from '../services/management/config';
import TailwindLayout from '../components/layout/TailwindLayout';
import AlertModal from '../components/common/AlertModal';
import ImportPreviewModal from '../components/common/ImportPreviewModal';
import {
  UserIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  BellIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  ChatBubbleLeftIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
    phone: '',
    department: '',
    bio: '',
    status: 'active',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const fileInputRef = useRef(null);
  const csvImportRef = useRef(null);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [forceUpdate, setForceUpdate] = useState(0);
  const [importProgress, setImportProgress] = useState({
    show: false,
    current: 0,
    total: 0,
    errors: [],
  });
  const [importMode, setImportMode] = useState('skip'); // 'skip' or 'overwrite'
  const [importPreview, setImportPreview] = useState({
    show: false,
    data: [],
    file: null,
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const BASE_URL = API_URL.replace('/api', ''); // Base URL without /api for static files

  // Helper to decode JWT token
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
      const tokenPayload = decodeToken(currentToken);

      console.log('🔍 Fetching profile with managementClient...');
      console.log('📍 API URL:', API_URL);
      console.log('🔑 Token from storage:', currentToken?.substring(0, 30) + '...');
      console.log('🔓 Decoded Token Payload:', tokenPayload);
      console.log(
        '👤 User ID in token:',
        tokenPayload?.userId || tokenPayload?.id || tokenPayload?.sub
      );
      console.log('👤 User from storage:', localStorage.getItem('user'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  IMPORTANT: Check if User ID in token matches Profile ID below');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (!currentToken) {
        console.error('❌ No token found - redirecting to login');
        localStorage.clear();
        window.location.href = '/login';
        return;
      }

      // Clear profile state before fetching to force fresh render
      setProfile(null);

      // managementClient automatically injects fresh token from localStorage
      // Add timestamp to prevent caching + cache control headers
      const response = await managementClient.get(`/users/me?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      console.log('📦 Full response from managementClient:', response);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Handle different response structures from backend
      // managementClient response interceptor returns response.data directly
      // So response here could be: { success: true, data: {...} } OR just { id, email, ... }
      let rawData;

      if (response.success && response.data) {
        // Backend response: { success: true, data: { user data } }
        rawData = response.data;
      } else if (response.user) {
        // Backend response: { user: { user data } }
        rawData = response.user;
      } else if (response.id && response.email) {
        // Backend response: { id, email, ... } (direct user object)
        rawData = response;
      } else {
        console.error('❌ Unexpected response structure:', response);
        throw new Error('Invalid response structure');
      }

      console.log('📦 Raw user data extracted:', rawData);

      // Normalize data format to match documentation (FRONTEND_USER_MANAGEMENT_INTEGRATION.md)
      // Backend may send: firstName/first_name, lastName/last_name, or name field
      // This ensures consistent data structure regardless of backend format
      const normalizedData = {
        id: rawData.id,
        username: rawData.username || rawData.email?.split('@')[0] || '',
        firstName: rawData.firstName || rawData.first_name || rawData.name?.split(' ')[0] || '',
        lastName:
          rawData.lastName ||
          rawData.last_name ||
          rawData.name?.split(' ').slice(1).join(' ') ||
          '',
        email: rawData.email || '',
        role: rawData.role || '',
        phone: rawData.phone || null,
        department: rawData.department || null,
        bio: rawData.bio || null,
        avatar: rawData.avatar || null,
        status: rawData.status || 'active',
        two_factor_enabled: rawData.two_factor_enabled || rawData.twoFactorEnabled || false,
        created_at: rawData.created_at || rawData.createdAt,
        updated_at: rawData.updated_at || rawData.updatedAt,
      };

      console.log('✅ Normalized profile data:', normalizedData);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 RESULT: Profile ID =', normalizedData.id, '| Email =', normalizedData.email);
      console.log('⚠️  If ID is wrong, the token might be for a different user!');
      console.log('⚠️  Try: Click "Clear & Logout" button, then login again');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      setProfile(normalizedData);
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ API URL:', API_URL);

      // If 401, clear everything and redirect
      if (error.response?.status === 401) {
        console.log('🔒 Unauthorized - clearing storage and redirecting');
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }, [API_URL]);

  useEffect(() => {
    console.log('🚀 Settings component mounted - fetching profile');
    // Force fetch profile on mount
    fetchProfile();

    // Also log current auth state
    console.log('📊 Current auth state:', {
      authToken: localStorage.getItem('authToken')?.substring(0, 30),
      token: localStorage.getItem('token')?.substring(0, 30),
      user: localStorage.getItem('user'),
    });
  }, [fetchProfile, forceUpdate]);

  // Listen for storage changes (when user logs in/out in another tab or component)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'token' || e.key === 'user') {
        console.log('🔄 Storage changed for key:', e.key);
        console.log('🔄 New value:', e.newValue?.substring(0, 30));
        // Clear profile first
        setProfile(null);
        // Wait for storage to settle
        setTimeout(() => {
          fetchProfile();
        }, 50);
      }
    };

    // Listen for custom event when login happens
    const handleLoginSuccess = () => {
      console.log('🔄 Login success detected, refetching profile...');
      // Clear profile first to force re-render
      setProfile(null);
      // Wait a bit for localStorage to be fully updated
      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
        fetchProfile();
      }, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('loginSuccess', handleLoginSuccess);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, [fetchProfile]);

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'File Too Large',
        message: 'File size cannot exceed 5MB',
      });
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Invalid File Type',
        message: 'Only image files are allowed (jpeg, jpg, png, gif, webp)',
      });
      return;
    }

    try {
      const fd = new FormData();
      fd.append('avatar', file);
      // managementClient automatically injects token
      const response = await managementClient.post('/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProfile();

      // Update user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (response.data?.avatar) {
        currentUser.avatar = response.data.avatar;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Avatar uploaded successfully',
      });

      // Force page reload to update header
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.message || 'Failed to upload avatar',
      });
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) return;
    try {
      // managementClient automatically injects token
      await managementClient.delete('/users/me/avatar');
      await fetchProfile();

      // Update user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      currentUser.avatar = null;
      localStorage.setItem('user', JSON.stringify(currentUser));

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Avatar deleted successfully',
      });

      // Force page reload to update header
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: error.response?.data?.message || 'Failed to delete avatar',
      });
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleToggleTwoFactor = async (enabled) => {
    try {
      // managementClient automatically injects token
      const response = await managementClient.patch('/users/me/two-factor', { enabled });
      setProfile((prev) => ({
        ...prev,
        two_factor_enabled: response.data?.data?.two_factor_enabled,
      }));
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Failed to toggle two-factor:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Failed',
        message: error.response?.data?.message || 'Failed to toggle two-factor',
      });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Check if user is admin or superadmin
    if (!isAdminRole(profile?.role)) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Access Denied',
        message: 'Only administrators can create new user accounts',
      });
      return;
    }

    try {
      // managementClient automatically injects token
      await managementClient.post('/users', newUserForm, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'User created successfully!',
      });
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        role: 'operator',
        phone: '',
        department: '',
        bio: '',
        status: 'active',
      });
    } catch (error) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Failed',
        message: error.response?.data?.message || 'Failed to create user',
      });
    }
  };

  // Helper function to check if user has admin privileges
  const isAdminRole = (role) => {
    if (!role) return false;
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'admin' || normalizedRole === 'superadmin';
  };

  // Export CSV Template for bulk user import
  const handleExportTemplate = () => {
    const headers = ['name', 'email', 'password', 'role', 'phone', 'department', 'bio', 'status'];
    const exampleRow = [
      'John Doe',
      'john.doe@example.com',
      'password123',
      'operator',
      '+62 812 3456 7890',
      'IT & Systems',
      'Fleet operator',
      'active',
    ];
    const csvContent = [
      headers.join(','),
      exampleRow.join(','),
      // Add empty row for user to fill
      ',,,,,,,',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `user_import_template_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export all users to CSV
  const handleExportUsers = async () => {
    try {
      const response = await managementClient.get('/users');
      const users = response.data || response.users || response || [];

      if (users.length === 0) {
        setAlertModal({
          isOpen: true,
          type: 'info',
          title: 'No Data',
          message: 'No users found to export',
        });
        return;
      }

      const headers = ['name', 'email', 'role', 'phone', 'department', 'bio', 'status'];
      const csvRows = [headers.join(',')];

      users.forEach((user) => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '';
        const row = [
          `"${name}"`,
          user.email || '',
          user.role || '',
          user.phone || '',
          user.department || '',
          `"${(user.bio || '').replace(/"/g, '""')}"`,
          user.status || 'active',
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Export Success',
        message: `Successfully exported ${users.length} users`,
      });
    } catch (error) {
      console.error('Failed to export users:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Export Failed',
        message: error.response?.data?.message || 'Failed to export users',
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
        // Validate required fields and format
        const email = row.email?.trim();
        const role = row.role?.toLowerCase().trim();
        
        // Only add if email is valid and role is allowed
        if (email && email.includes('@')) {
          // Validate role
          if (!role || ['admin', 'operator', 'viewer'].includes(role)) {
            data.push(row);
          } else {
            console.warn(`Invalid role "${row.role}" for ${email}, skipping row`);
          }
        }
      }
    }

    return data;
  };

  // Import users from CSV - Show preview first
  const handleImportCSV = async (e) => {
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
      const users = parseCSV(text);

      if (users.length === 0) {
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'No Data',
          message: 'No valid user data found in CSV file',
        });
        return;
      }

      // Show preview and ask for confirmation
      setImportPreview({
        show: true,
        data: users,
        file: file.name,
      });
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Parse Failed',
        message: 'Failed to read CSV file: ' + error.message,
      });
    }
  };

  // Actually execute the import after confirmation
  const executeImport = async () => {
    const users = importPreview.data;
    
    // Hide preview
    setImportPreview({ show: false, data: [], file: null });

    // Show progress
    setImportProgress({ show: true, current: 0, total: users.length, errors: [] });

    let successCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    const errors = [];

    try {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        // Validate email format
        if (!user.email || !user.email.includes('@')) {
          errors.push({
            row: i + 2,
            email: user.email || 'N/A',
            error: 'Invalid email format',
          });
          setImportProgress((prev) => ({ ...prev, current: i + 1 }));
          continue;
        }
        try {
          // Validate password length for new users
          const password = user.password || 'default123';
          if (password.length < 6) {
            errors.push({
              row: i + 2,
              email: user.email,
              error: 'Password must be at least 6 characters',
            });
            setImportProgress((prev) => ({ ...prev, current: i + 1 }));
            continue;
          }
          
          // Try to create new user
          await managementClient.post('/users', {
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            password: password,
            role: user.role || 'admin',
            phone: user.phone || null,
            department: user.department || null,
            bio: user.bio || null,
            status: user.status || 'active',
          });
          successCount++;
        } catch (error) {
          // Check if error is duplicate email
          // Backend returns: {success: false, message: "Email already exists"}
          const errorMessage = error.response?.data?.message || error.message || '';
          const isDuplicate =
            errorMessage.toLowerCase().includes('email') &&
            (errorMessage.toLowerCase().includes('exists') ||
              errorMessage.toLowerCase().includes('already') ||
              errorMessage.toLowerCase().includes('unique') ||
              errorMessage.toLowerCase().includes('duplicate'));

          console.log('🔍 Import error for', user.email, ':', errorMessage, '| isDuplicate:', isDuplicate);

          if (isDuplicate) {
            if (importMode === 'skip') {
              // Skip duplicate
              skippedCount++;
              errors.push({
                row: i + 2,
                email: user.email,
                error: 'Skipped (email already exists)',
                type: 'skipped',
              });
            } else if (importMode === 'overwrite') {
              // Try to update existing user
              try {
                // First, get existing user by email
                const existingUsers = await managementClient.get('/users');
                const existingUser = (
                  existingUsers.data ||
                  existingUsers.users ||
                  existingUsers ||
                  []
                ).find((u) => u.email === user.email);

                if (existingUser) {
                  // Update the existing user
                  console.log('🔄 Updating user:', existingUser.id, user.email);
                  await managementClient.put(`/users/${existingUser.id}`, {
                    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    role: user.role || 'admin',
                    phone: user.phone || null,
                    department: user.department || null,
                    bio: user.bio || null,
                    status: user.status || 'active',
                    // Note: password not updated for security
                  });
                  updatedCount++;
                  console.log('✅ Successfully updated:', user.email);
                } else {
                  errors.push({
                    row: i + 2,
                    email: user.email,
                    error: 'User exists but could not be found for update',
                    type: 'failed',
                  });
                }
              } catch (updateError) {
                console.error('❌ Failed to update user:', user.email, updateError.response?.data);
                errors.push({
                  row: i + 2,
                  email: user.email,
                  error: updateError.response?.data?.message || updateError.message || 'Failed to update existing user',
                  type: 'failed',
                });
              }
            }
          } else {
            // Other errors (not duplicate)
            console.error('❌ Other error for', user.email, ':', errorMessage);
            errors.push({
              row: i + 2,
              email: user.email,
              error: errorMessage || 'Failed to create user',
              type: 'failed',
            });
          }
        }
        setImportProgress((prev) => ({ ...prev, current: i + 1 }));
      }
    } catch (error) {
      console.error('Critical error during import:', error);
      setImportProgress({ show: false, current: 0, total: 0, errors: [] });
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Import Failed',
        message: 'A critical error occurred during import: ' + error.message,
      });
      return;
    }

    // Hide progress
    setTimeout(() => {
      setImportProgress({ show: false, current: 0, total: 0, errors: [] });
    }, 2000);

      // Show result
      const failedCount = errors.filter((e) => e.type !== 'skipped').length;
      const skippedErrors = errors.filter((e) => e.type === 'skipped');
      const failedErrors = errors.filter((e) => e.type !== 'skipped');

      let message = `Import Complete:\n\n`;
      message += `✅ Created: ${successCount}\n`;
      if (updatedCount > 0) message += `🔄 Updated: ${updatedCount}\n`;
      if (skippedCount > 0) message += `⏭️ Skipped: ${skippedCount}\n`;
      if (failedCount > 0) message += `❌ Failed: ${failedCount}\n`;
      message += `\nTotal: ${users.length} rows`;

      // Show ALL errors (both skipped and failed)
      const hasAnyIssues = errors.length > 0;

      if (hasAnyIssues) {
        message += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━';
        if (skippedErrors.length > 0) {
          message += '\n\n⏭️ Skipped (Mode: Skip Duplicates):\n';
          message += skippedErrors.map((e) => `• Row ${e.row} (${e.email}): ${e.error}`).join('\n');
        }
        if (failedErrors.length > 0) {
          message += '\n\n❌ Failed:\n';
          message += failedErrors.map((e) => `• Row ${e.row} (${e.email}): ${e.error}`).join('\n');
        }
      }

      setAlertModal({
        isOpen: true,
        type: failedCount > 0 ? 'warning' : skippedCount > 0 ? 'info' : 'success',
        title: 'Import Complete',
        message: message,
      });

    // Reset file input
    if (csvImportRef.current) {
      csvImportRef.current.value = '';
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Current password is required',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Invalid Password',
        message: 'New password must be at least 6 characters',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Password Mismatch',
        message: 'Passwords do not match',
      });
      return;
    }

    try {
      await managementClient.patch('/users/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Password changed successfully!',
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Failed',
        message: error.response?.data?.message || 'Failed to change password',
      });
    }
  };

  // Filter tabs based on user role - only admin/superadmin can see Create Account tab
  const tabs = [
    { id: 'profile', name: 'My Profile', icon: UserIcon },
    ...(isAdminRole(profile?.role)
      ? [{ id: 'create', name: 'Create Account', icon: UserPlusIcon }]
      : []),
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    // { id: 'notifications', name: 'Notifications', icon: BellIcon }
  ];

  return (
    <TailwindLayout>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
      <div className="h-full overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your profile information and system access credentials.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  fetchProfile();
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh Profile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                {/* DEBUG INFO */}
                {/* <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                  <div className="font-semibold text-blue-900 mb-2">🐛 Debug Info:</div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Token (first 30):</span>
                      <div className="text-blue-800 font-mono break-all text-[10px]">
                        {localStorage.getItem('authToken')?.substring(0, 30) || 'No token'}...
                      </div>
                    </div>
                    <div className="border-t border-blue-200 pt-2">
                      <span className="font-semibold">Token Payload:</span>
                      <pre className="text-blue-800 overflow-auto max-h-24 mt-1 text-[10px]">
{JSON.stringify(decodeToken(localStorage.getItem('authToken') || localStorage.getItem('token')), null, 2)}
                      </pre>
                    </div>
                    <div className="border-t border-blue-200 pt-2">
                      <span className="font-semibold">Profile Data (User ID: {profile?.id}):</span>
                      <pre className="text-blue-800 overflow-auto max-h-32 mt-1 text-[10px]">
{JSON.stringify(profile, null, 2)}
                      </pre>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          console.log('🔄 Force refresh triggered');
                          setForceUpdate(prev => prev + 1);
                          fetchProfile();
                        }}
                        className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                      >
                        Force Refresh
                      </button>
                      <button
                        onClick={() => {
                          console.log('🧹 Clearing all localStorage and logging out');
                          localStorage.clear();
                          window.location.href = '/login';
                        }}
                        className="flex-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium"
                      >
                        Clear & Logout
                      </button>
                    </div>
                  </div>
                </div> */}

                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div
                      className="h-28 w-28 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-md overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {profile?.avatar ? (
                        <img
                          src={
                            profile.avatar.startsWith('http')
                              ? profile.avatar
                              : `${BASE_URL}${profile.avatar}`
                          }
                          alt="Avatar"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load avatar:', profile.avatar);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>
                          {profile?.firstName?.charAt(0) || 'U'}
                          {profile?.lastName?.charAt(0) || ''}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow-md border border-gray-200 text-gray-500 group-hover:text-indigo-600 transition-colors pointer-events-none">
                      <PencilSquareIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    {profile?.firstName && profile?.lastName
                      ? `${profile.firstName} ${profile.lastName}`
                      : profile?.firstName || profile?.email || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">{profile?.role || 'User'}</p>
                  {profile?.email && <p className="text-xs text-gray-400 mt-1">{profile.email}</p>}
                  <div className="mt-4 flex space-x-2 w-full justify-center">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium border ${
                        profile?.status === 'active'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : profile?.status === 'inactive'
                            ? 'bg-gray-100 text-gray-700 border-gray-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                      }`}
                    >
                      {profile?.status || 'active'}
                    </span>
                  </div>
                </div>

                {/* Role Permissions */}
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Role Permissions
                  </h4>
                  <div className="space-y-2">
                    {['Full System Access', 'Manage Users', 'Fleet Configuration'].map(
                      (permission) => (
                        <div key={permission} className="flex items-center text-sm text-gray-600">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          {permission}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Avatar Controls */}
                {profile?.avatar && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <button
                      onClick={handleDeleteAvatar}
                      className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 border border-red-200"
                    >
                      Delete Avatar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information (Display Only) */}
              {activeTab === 'profile' && (
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                      My Profile Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile?.username && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                          {profile.username}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                        {profile?.firstName || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                        {profile?.lastName || '-'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        {profile?.email || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                        {profile?.phone || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                        {profile?.department || (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200 capitalize font-medium">
                        {profile?.role || 'User'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Status
                      </label>
                      <p
                        className={`text-sm font-medium px-3 py-2.5 rounded-lg border capitalize ${
                          profile?.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : profile?.status === 'inactive'
                              ? 'bg-gray-50 text-gray-700 border-gray-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {profile?.status || 'active'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio / Role Description
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200 min-h-[80px]">
                        {profile?.bio || 'No bio provided'}
                      </p>
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Two-Factor Authentication
                      </label>
                      <p className={`text-sm font-medium px-3 py-2.5 rounded-lg border ${
                        profile?.two_factor_enabled 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {profile?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div> */}
                    {profile?.created_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Created
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                          {new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                    {profile?.updated_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Updated
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                          {new Date(profile.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Create New User Section */}
              {activeTab === 'create' && (
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                  {!isAdminRole(profile?.role) ? (
                    <div className="text-center py-12">
                      <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">
                        Access Restricted
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Only administrators can create new user accounts.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <span className="w-1 h-6 bg-indigo-400 rounded-full mr-3"></span>
                          Create New User Account
                        </h3>

                        {/* Export/Import Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleExportTemplate}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            title="Download CSV template for bulk import"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
                            Download Template
                          </button>
                          <button
                            type="button"
                            onClick={handleExportUsers}
                            className="inline-flex items-center px-3 py-2 border border-emerald-300 shadow-sm text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            title="Export all users to CSV"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                            Export Users
                          </button>

                          {/* Import Mode Selector */}
                          <select
                            value={importMode}
                            onChange={(e) => setImportMode(e.target.value)}
                            className="px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            title="Choose how to handle duplicate emails"
                          >
                            <option value="skip">Skip Duplicates</option>
                            <option value="overwrite">Overwrite Duplicates</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => csvImportRef.current?.click()}
                            className="inline-flex items-center px-3 py-2 border border-indigo-300 shadow-sm text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            title="Import users from CSV file"
                          >
                            <ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />
                            Import CSV
                          </button>
                          <input
                            ref={csvImportRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleImportCSV}
                          />
                        </div>
                      </div>

                      {/* Import Progress Bar */}
                      {importProgress.show && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">
                              Importing users...
                            </span>
                            <span className="text-sm text-blue-700">
                              {importProgress.current} / {importProgress.total}
                            </span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${(importProgress.current / importProgress.total) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center">
                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Bulk Import Instructions
                        </h4>
                        <ul className="text-xs text-amber-800 space-y-1 ml-7">
                          <li>
                            • Click <strong>"Download Template"</strong> to get CSV template with
                            example data
                          </li>
                          <li>
                            • Fill in user data (name, email, password, role, phone, department,
                            bio, status)
                          </li>
                          <li>
                            • Valid roles:{' '}
                            <code className="px-1 py-0.5 bg-amber-100 rounded">operator</code>,{' '}
                            <code className="px-1 py-0.5 bg-amber-100 rounded">viewer</code>,{' '}
                            <code className="px-1 py-0.5 bg-amber-100 rounded">admin</code>
                          </li>
                          <li>
                            • Click <strong>"Import CSV"</strong> to upload and create all users at
                            once
                          </li>
                          <li>
                            • Use <strong>"Export Users"</strong> to download existing users for
                            reference
                          </li>
                        </ul>
                      </div>

                      <form onSubmit={handleCreateUser}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={newUserForm.name}
                              onChange={handleNewUserChange}
                              required
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label
                              htmlFor="newEmail"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="email"
                                id="newEmail"
                                name="email"
                                value={newUserForm.email}
                                onChange={handleNewUserChange}
                                required
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                                placeholder="user@example.com"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label
                              htmlFor="password"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Password <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              id="password"
                              name="password"
                              value={newUserForm.password}
                              onChange={handleNewUserChange}
                              required
                              minLength={6}
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                              placeholder="Minimum 6 characters"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="role"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Role <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="role"
                              name="role"
                              value={newUserForm.role}
                              onChange={handleNewUserChange}
                              required
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                            >
                              {/* <option value="operator">Operator</option>
                          <option value="viewer">Viewer</option> */}
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="status"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Status
                            </label>
                            <select
                              id="status"
                              name="status"
                              value={newUserForm.status}
                              onChange={handleNewUserChange}
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="newPhone"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Phone Number
                            </label>
                            <input
                              type="text"
                              id="newPhone"
                              name="phone"
                              value={newUserForm.phone}
                              onChange={handleNewUserChange}
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                              placeholder="+62 812 3456 7890"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="newDepartment"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Department
                            </label>
                            <input
                              type="text"
                              id="newDepartment"
                              name="department"
                              value={newUserForm.department}
                              onChange={handleNewUserChange}
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                              placeholder="IT & Systems"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label
                              htmlFor="newBio"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Bio / Role Description
                            </label>
                            <textarea
                              id="newBio"
                              name="bio"
                              value={newUserForm.bio}
                              onChange={handleNewUserChange}
                              rows="3"
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-900 px-3 py-2"
                              placeholder="Brief description of user role..."
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() =>
                                setNewUserForm({
                                  name: '',
                                  email: '',
                                  password: '',
                                  role: 'operator',
                                  phone: '',
                                  department: '',
                                  bio: '',
                                  status: 'active',
                                })
                              }
                              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Reset Form
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                              <UserPlusIcon className="h-5 w-5 mr-2" />
                              Create User
                            </button>
                          </div>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                    Security Settings
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Change Password</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Update your password to keep your account secure.
                      </p>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Current Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            required
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            New Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            required
                            minLength={6}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                            placeholder="Minimum 6 characters"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Confirm New Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                            minLength={6}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg bg-white text-gray-900 py-2.5 px-3"
                            placeholder="Re-enter new password"
                          />
                        </div>
                        <div className="flex space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                              })
                            }
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Reset
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            Update Password
                          </button>
                        </div>
                      </form>
                    </div>
                    {/* <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Session Management</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Manage your active sessions and sign out from all devices.
                      </p>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                        Sign Out All Sessions
                      </button>
                    </div> */}
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {/* {activeTab === 'notifications' && (
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Email Notifications', description: 'Receive email updates about fleet activities' },
                      { title: 'Push Notifications', description: 'Get instant alerts on your device' },
                      { title: 'SMS Alerts', description: 'Receive critical alerts via SMS' },
                      { title: 'Weekly Reports', description: 'Get weekly summary reports via email' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      {/* <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center group">
          <ChatBubbleLeftIcon className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div> */}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
        confirmText="OK"
      />

      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={importPreview.show}
        data={importPreview.data}
        fileName={importPreview.file}
        importMode={importMode}
        onCancel={() => {
          setImportPreview({ show: false, data: [], file: null });
          if (csvImportRef.current) {
            csvImportRef.current.value = '';
          }
        }}
        onConfirm={executeImport}
      />
    </TailwindLayout>
  );
};

export default Settings;
