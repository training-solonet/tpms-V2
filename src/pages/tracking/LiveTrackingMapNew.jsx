/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState, useCallback } from 'react'; // Import React hooks untuk state management
import { useNavigate } from 'react-router-dom'; // Import useNavigate untuk routing
import { TruckIcon, ClockIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Import ikon-ikon UI
import BaseTrackingMap from './BaseTrackingMap'; // Import komponen peta dasar
import TirePressureDisplay from '../../components/dashboard/TirePressureDisplay'; // Import komponen display tekanan ban
import TruckImage from '../../components/common/TruckImage.jsx'; // Import komponen truck image
import { trackingAPI } from 'services/tracking'; // BE1 Tracking API

// WebSocket URL from environment variable with fallback
const WS_URL = import.meta.env.VITE_TRACKING_WS_URL;

const LiveTrackingMapNew = () => {
  const navigate = useNavigate(); // Hook untuk navigasi
  const [map, setMap] = useState(null); // State untuk menyimpan instance peta Leaflet
  const [mapUtils, setMapUtils] = useState(null); // State untuk utility functions peta
  const [vehicles, setVehicles] = useState([]); // State untuk daftar semua kendaraan
  const [selectedVehicle, setSelectedVehicle] = useState(null); // State untuk kendaraan yang sedang dipilih
  const [showVehicleCard, setShowVehicleCard] = useState(false); // Toggle visibility card info kendaraan
  const [showFilterDropdown, setShowFilterDropdown] = useState(false); // Toggle visibility dropdown filter
  const [loading, setLoading] = useState(true); // State loading saat fetch data
  const [setError] = useState(null); // State untuk menyimpan error (jika ada)

  const [clusterSelections, setClusterSelections] = useState(
    // State untuk filter cluster berdasarkan range nomor truk
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999']) // Default: semua cluster aktif
  );
  const [vehicleRoutes, setVehicleRoutes] = useState({}); // State untuk menyimpan history rute tiap kendaraan
  const [vehicleDevices, setVehicleDevices] = useState({}); // Track device_id per truck untuk detect reassignment
  const [isTrackingActive] = useState(true); // State tracking aktif/pause (default aktif)
  const [timeRange] = useState('24h'); // State range waktu untuk history (default 24 jam)
  const [, setSelectedDevice] = useState(null); // State untuk device IoT yang dipilih
  const [, setSelectedDeviceStatus] = useState(null); // State untuk status device IoT

  const markersRef = useRef({}); // Ref untuk menyimpan semua marker kendaraan di peta
  const markersLayerRef = useRef(null); // Ref untuk layer group yang berisi semua marker
  const liveRouteLineRef = useRef(null); // Ref untuk polyline rute yang sedang ditampilkan
  const liveRouteMarkersRef = useRef({ start: null, end: null }); // Ref untuk marker start & end point rute
  const wsRef = useRef(null); // Ref untuk koneksi WebSocket
  const wsSubscribedRef = useRef(false); // Flag apakah sudah subscribe ke WebSocket
  const wsReconnectAttempts = useRef(0); // Counter reconnection attempts
  const wsReconnectTimeout = useRef(null); // Timeout untuk reconnection
  const lastHideStateRef = useRef(null); // Ref untuk menyimpan state visibility terakhir
  const rafRef = useRef(null); // Ref untuk requestAnimationFrame (animasi smooth)
  const focusHandledRef = useRef(false); // Flag untuk mencegah fokus berulang dari URL parameter
  const [backendOnline, setBackendOnline] = useState(false); // State status koneksi backend API
  const [wsStatus, setWsStatus] = useState('disconnected'); // State status koneksi WebSocket
  const currentShiftDateRef = useRef(null); // Ref untuk menyimpan shift dan tanggal saat ini

  // Fungsi untuk menentukan shift berdasarkan waktu saat ini
  const getCurrentShift = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    
    // Shift Siang: 06:00 - 16:00 (6 AM - 4 PM)
    // Shift Malam: 16:00 - 06:00 (4 PM - 6 AM next day)
    
    if (hour >= 6 && hour < 16) {
      return 'day'; // Shift Siang
    } else {
      return 'night'; // Shift Malam
    }
  }, []);

  // Fungsi untuk mendapatkan identifier unik untuk hari dan shift saat ini
  const getCurrentShiftDate = useCallback(() => {
    const now = new Date();
    const shift = getCurrentShift();
    
    // Untuk shift malam (16:00-06:00), jam 00:00-05:59 masih dianggap bagian dari hari sebelumnya
    let effectiveDate = new Date(now);
    if (shift === 'night' && now.getHours() < 6) {
      effectiveDate.setDate(effectiveDate.getDate() - 1);
    }
    
    const dateStr = effectiveDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    return `${dateStr}-${shift}`; // Format: "2025-12-23-day" atau "2025-12-23-night"
  }, [getCurrentShift]);

  // Fungsi untuk cek apakah shift atau hari sudah berganti
  const checkShiftDateChange = useCallback(() => {
    const currentShiftDate = getCurrentShiftDate();
    
    if (currentShiftDateRef.current === null) {
      // Inisialisasi pertama kali
      currentShiftDateRef.current = currentShiftDate;
      console.log(`📅 Initialized shift tracking: ${currentShiftDate}`);
      return false;
    }
    
    if (currentShiftDateRef.current !== currentShiftDate) {
      console.log(`🔄 Shift/Date changed from ${currentShiftDateRef.current} to ${currentShiftDate}`);
      currentShiftDateRef.current = currentShiftDate;
      return true; // Ada perubahan shift/hari
    }
    
    return false; // Tidak ada perubahan
  }, [getCurrentShiftDate]);

  // Fungsi helper untuk normalisasi ID truk menjadi lowercase
  const normalizeTruckId = (id) => String(id || '').toLowerCase();

  // Resolve ID kendaraan menjadi UUID truck yang digunakan mapping device
  const resolveTruckUUID = (vehicleId) => {
    if (!vehicleId) return null; // Return null jika tidak ada vehicleId
    const idStr = String(vehicleId); // Konversi ke string
    if (idStr.length === 36 && idStr.includes('-')) return idStr; // Jika sudah format UUID, return langsung
    return idStr; // Return ID apa adanya jika bukan UUID
  };

  // Fungsi untuk ekstrak nomor truk dari ID atau nama
  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null; // Return null jika tidak ada input
    const str = String(idOrName); // Konversi ke string
    // Untuk serial number TPMS, ambil 3 digit terakhir
    if (str.length > 6) {
      return str.slice(-3); // Ambil 3 karakter terakhir
    }
    const m = str.match(/(\d{1,4})/); // Cari pattern angka 1-4 digit
    return m ? parseInt(m[1], 10) : null; // Parse ke integer atau return null
  };

  // Fungsi untuk cek apakah truk termasuk dalam cluster yang dipilih
  const inSelectedCluster = useCallback(
    (truckId) => {
      if (!clusterSelections || clusterSelections.size === 0) return true; // Jika tidak ada filter, tampilkan semua
      const n = extractTruckNumber(truckId); // Ekstrak nomor truk
      if (n == null) return false; // Jika tidak bisa ekstrak nomor, hide
      for (const key of clusterSelections) {
        // Loop setiap range yang dipilih
        const [lo, hi] = key.split('-').map(Number); // Parse range min-max
        if (n >= lo && n <= hi) return true; // Jika nomor dalam range, return true
      }
      return false; // Jika tidak ada range yang match, return false
    },
    [clusterSelections] // Re-run jika clusterSelections berubah
  );

  // Terapkan styling marker berdasarkan zoom dan viewport peta
  const applyMarkerZoomStyling = useCallback(() => {
    // Temporarily disabled to prevent glitches - markers will use default size
    if (!map) return; // Keluar jika map belum ready

    // Simple visibility check without scaling to prevent position glitches
    Object.values(markersRef.current).forEach((marker) => {
      // Loop semua marker
      try {
        const element = marker.getElement?.(); // Dapatkan DOM element marker
        if (element) {
          element.style.visibility = 'visible'; // Set visibility menjadi visible
        }
      } catch (err) {
        // Ignore errors for markers that might be removed
      }
    });
  }, [map]); // Re-run jika map berubah

  // Load data kendaraan live dari Tracking API backend
  const loadVehiclesFromBackend = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading live vehicles from Tracking API...');
      
      const response = await trackingAPI.getLiveTracking();
      console.log('📡 Tracking API response:', response);
      
      if (response && response.success && Array.isArray(response.data?.trucks)) {
        const trucks = response.data.trucks;
        
        const items = trucks
          .map((truck) => {
            // Extract truck data from API response
            const id = truck.truck_id ? String(truck.truck_id) : null;
            const location = truck.location;
            
            // Validate location data
            if (!location || !location.latitude || !location.longitude) {
              console.warn(`⚠️ No location data for truck ${id}`);
              return null;
            }
            
            const lat = parseFloat(location.latitude);
            const lng = parseFloat(location.longitude);
            
            // Validate coordinates are within reasonable bounds
            const isValidLat = isFinite(lat) && lat >= -90 && lat <= 90;
            const isValidLng = isFinite(lng) && lng >= -180 && lng <= 180;
            
            if (!id || !isValidLat || !isValidLng) {
              console.warn(`⚠️ Invalid coordinates for truck ${id}: lat=${lat}, lng=${lng}`);
              return null;
            }
            
            console.log(`📍 Truck ${id} (${truck.plate_number}) position: [${lat}, ${lng}]`);
            
            // Calculate average battery from device
            const battery = truck.device?.battery?.average || 0;
            
            // Map sensors to tireData format
            const tireData = (truck.sensors || []).map((sensor) => ({
              tireNo: sensor.tireNo,
              sensorNo: sensor.sensorNo,
              tempValue: sensor.tempValue,
              tirepValue: sensor.tirepValue,
              exType: sensor.exType,
              bat: sensor.bat,
            }));
            
            console.log(`🔧 Truck ${id} tire data:`, {
              sensorCount: truck.sensors?.length || 0,
              tireDataCount: tireData.length,
              summary: truck.sensor_summary,
              sampleData: tireData.slice(0, 2) // Log first 2 sensors as sample
            });
            
            return {
              id,
              truckNumber: truck.truck_id,
              truckName: truck.truck_name,
              plateNumber: truck.plate_number,
              model: truck.model,
              type: truck.type,
              position: [lat, lng],
              status: truck.status || 'active',
              speed: 0,
              heading: 0,
              fuel: 0,
              battery: battery,
              signal: truck.device?.status === 'active' ? 'good' : 'unknown',
              lastUpdate: location.last_update ? new Date(location.last_update) : new Date(),
              tireData: tireData,
              driver: truck.driver,
              device: truck.device,
              sensorSummary: truck.sensor_summary,
            };
          })
          .filter(Boolean);
        
        console.log(`✅ Loaded ${items.length} trucks from Tracking API`);
        setVehicles(items);
        setBackendOnline(true);
        
        // Cek apakah shift atau hari sudah berganti
        const shiftChanged = checkShiftDateChange();
        
        // Update vehicle routes with current positions
        setVehicleRoutes((prevRoutes) => {
          // Jika shift/hari berganti, reset semua rute
          if (shiftChanged) {
            console.log('🔄 Shift/Date changed - clearing all vehicle routes');
            const newRoutes = {};
            items.forEach((vehicle) => {
              // Mulai rute baru hanya dengan posisi saat ini
              newRoutes[vehicle.id] = [vehicle.position];
              console.log(`📍 Reset route for ${vehicle.id}: new shift/date`);
            });
            return newRoutes;
          }
          
          // Jika masih di shift/hari yang sama, update rute seperti biasa
          const newRoutes = { ...prevRoutes };
          items.forEach((vehicle) => {
            const existingRoute = prevRoutes[vehicle.id] || [];
            const lastPos = existingRoute[existingRoute.length - 1];
            
            // Only add new position if it's different from the last one
            const isSamePosition = lastPos && 
              Math.abs(lastPos[0] - vehicle.position[0]) < 0.00001 &&
              Math.abs(lastPos[1] - vehicle.position[1]) < 0.00001;
            
            if (!isSamePosition) {
              // Add new position to route - FULL route for current shift (no limit)
              newRoutes[vehicle.id] = [...existingRoute, vehicle.position];
            } else {
              // Keep existing route
              newRoutes[vehicle.id] = existingRoute;
            }
          });
          
          // Remove routes for vehicles no longer in current data (cleanup stale data)
          Object.keys(prevRoutes).forEach(vehicleId => {
            if (!items.find(v => v.id === vehicleId)) {
              delete newRoutes[vehicleId];
            }
          });
          
          return newRoutes;
        });
        
        // 🔍 DETECT DEVICE REASSIGNMENT and clear old routes
        setVehicleDevices((prevDevices) => {
          const newDevices = {};
          
          items.forEach((vehicle) => {
            const currentDeviceId = vehicle.device?.id;
            const previousDeviceId = prevDevices[vehicle.id];
            
            if (currentDeviceId) {
              // Check if device changed for this truck
              if (previousDeviceId && previousDeviceId !== currentDeviceId) {
                console.log(`🔄 DEVICE CHANGED for truck ${vehicle.id}: ${previousDeviceId} → ${currentDeviceId}`);
                console.log(`🧹 Clearing old route to prevent route mixing...`);
                
                // Clear route for this truck since device changed
                setVehicleRoutes(prev => ({
                  ...prev,
                  [vehicle.id]: [vehicle.position] // Start fresh with current position only
                }));
              }
              
              newDevices[vehicle.id] = currentDeviceId;
            }
          });
          
          return newDevices;
        });
      } else {
        console.error('❌ Tracking API failed, no vehicles loaded');
        throw new Error(response?.message || 'Failed to load vehicles from Tracking API');
      }
    } catch (error) {
      console.error('❌ Failed to load truck data from backend:', error);
      setVehicles([]);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, [checkShiftDateChange]); // Add dependency for checkShiftDateChange

  // Setup WebSocket connection for real-time updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const connectWebSocket = useCallback(() => {
    // Clear any pending reconnection timeout
    if (wsReconnectTimeout.current) {
      clearTimeout(wsReconnectTimeout.current);
      wsReconnectTimeout.current = null;
    }

    // Close existing connection if any
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.warn('Error closing WebSocket:', e);
      }
      wsRef.current = null;
      wsSubscribedRef.current = false;
    }

    // Check if WebSocket URL is configured
    if (!WS_URL) {
      console.warn('⚠️ WebSocket URL not configured, using polling fallback');
      setWsStatus('disabled');
      return;
    }

    try {
      console.log('🔌 Connecting to WebSocket:', WS_URL, `(attempt ${wsReconnectAttempts.current + 1})`);
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setWsStatus('connected');
        wsReconnectAttempts.current = 0; // Reset counter on success
        
        // Subscribe to truck updates channel
        try {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'truck_updates'
          }));
          wsSubscribedRef.current = true;
          console.log('📡 Subscribed to truck_updates channel');
        } catch (e) {
          console.error('Failed to subscribe:', e);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          if (message.type === 'connection_accepted') {
            console.log('✅ Connection accepted:', message.clientId);
          } else if (message.type === 'truck_locations_update') {
            // Real-time truck location update
            handleTruckLocationUpdate(message.data);
          } else if (message.type === 'pong') {
            // Ping/pong response (keep connection alive)
            console.log('🏓 Pong received');
          }
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        // Only log once per connection attempt to avoid console spam
        if (wsReconnectAttempts.current === 0) {
          console.error('❌ WebSocket connection failed (likely server unavailable)');
        }
        setWsStatus('error');
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setWsStatus('disconnected');
        wsSubscribedRef.current = false;
        wsRef.current = null;
        
        // Only reconnect if not a normal closure and not exceeded max attempts
        const MAX_RECONNECT_ATTEMPTS = 3; // Reduced from 10 to 3
        if (event.code !== 1000 && wsReconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          wsReconnectAttempts.current++;
          
          // Exponential backoff: 3s, 6s, 12s
          const delay = Math.min(3000 * Math.pow(2, wsReconnectAttempts.current - 1), 12000);
          
          console.log(`🔄 Will reconnect in ${delay/1000}s (attempt ${wsReconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          wsReconnectTimeout.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, delay);
        } else if (wsReconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
          console.warn('⚠️ WebSocket failed after 3 attempts. Using polling only.');
          console.warn('💡 Live tracking will continue via REST API polling (3s interval)');
          setWsStatus('failed');
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setWsStatus('error');
    }
  },);

  // Handle real-time truck location update from WebSocket
  const handleTruckLocationUpdate = useCallback((data) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔥 [${timestamp}] WebSocket UPDATE received:`, data);
    
    const truck = data;
    const id = truck.truckId ? String(truck.truckId) : null;
    const location = truck.location;
    
    // Validate location data
    if (!location || !location.lat || !location.long) {
      console.warn(`⚠️ Invalid location data for truck ${id}`);
      return;
    }
    
    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.long);
    
    // Validate coordinates
    const isValidLat = isFinite(lat) && lat >= -90 && lat <= 90;
    const isValidLng = isFinite(lng) && lng >= -180 && lng <= 180;
    
    if (!id || !isValidLat || !isValidLng) {
      console.warn(`⚠️ Invalid coordinates for truck ${id}`);
      return;
    }
    
    // Calculate average battery from device
    const battery = truck.device?.bat1 || truck.device?.bat2 || truck.device?.bat3 || 0;
    
    // Map sensors to tireData format
    const tireData = (truck.sensors || []).map((sensor) => ({
      tireNo: sensor.tireNo,
      sensorNo: sensor.sensorNo,
      tempValue: sensor.tempValue,
      tirepValue: sensor.tirepValue,
      exType: sensor.exType,
      bat: sensor.bat,
    }));
    
    const vehicleData = {
      id,
      truckNumber: truck.truckId,
      truckName: truck.plate,
      plateNumber: truck.plate,
      model: '',
      type: '',
      position: [lat, lng],
      status: 'active',
      speed: 0,
      heading: 0,
      fuel: 0,
      battery: battery,
      signal: 'good',
      lastUpdate: new Date(location.recorded_at || Date.now()),
      tireData: tireData,
      driver: null,
      device: truck.device,
      sensorSummary: null,
    };
    
    // Update vehicles state
    setVehicles(prev => {
      const existingIndex = prev.findIndex(v => v.id === id);
      if (existingIndex >= 0) {
        // Update existing vehicle
        const updated = [...prev];
        console.log(`✅ Vehicle ${id} updated via WebSocket at [${lat}, ${lng}]`);
        return updated;
      } else {
        // Add new vehicle
        console.log(`✅ New vehicle ${id} added via WebSocket at [${lat}, ${lng}]`);
        // Add new vehicle
        return [...prev, vehicleData];
      }
    });
    
    // Cek apakah shift atau hari sudah berganti
    const shiftChanged = checkShiftDateChange();
    
    // 🔍 Check if device changed for this truck (device reassignment detection)
    setVehicleDevices((prevDevices) => {
      const currentDeviceId = truck.device?.id;
      const previousDeviceId = prevDevices[id];
      
      if (currentDeviceId && previousDeviceId && previousDeviceId !== currentDeviceId) {
        console.log(`🔄 DEVICE CHANGED via WebSocket for truck ${id}: ${previousDeviceId} → ${currentDeviceId}`);
        console.log(`🧹 Clearing old route to prevent mixing...`);
        
        // Clear route immediately
        setVehicleRoutes(prev => ({
          ...prev,
          [id]: [vehicleData.position] // Fresh start with current position only
        }));
        
        return {
          ...prevDevices,
          [id]: currentDeviceId
        };
      }
      
      if (currentDeviceId) {
        return {
          ...prevDevices,
          [id]: currentDeviceId
        };
      }
      
      return prevDevices;
    });
    
    // Update vehicle routes
    setVehicleRoutes(prevRoutes => {
      if (shiftChanged) {
        // Reset all routes on shift change
        console.log('🔄 Shift/Date changed - resetting route for truck', id);
        return {
          ...prevRoutes,
          [id]: [vehicleData.position]
        };
      }
      
      const existingRoute = prevRoutes[id] || [];
      const lastPos = existingRoute[existingRoute.length - 1];
      
      // Only add if position changed
      const isSamePosition = lastPos && 
        Math.abs(lastPos[0] - vehicleData.position[0]) < 0.00001 &&
        Math.abs(lastPos[1] - vehicleData.position[1]) < 0.00001;
      
      if (!isSamePosition) {
        return {
          ...prevRoutes,
          [id]: [...existingRoute, vehicleData.position]
        };
      }
      
      return prevRoutes;
    });
    
    // Update selectedVehicle if it's the same truck
    setSelectedVehicle(prev => {
      if (prev && prev.id === id) {
        return vehicleData;
      }
      return prev;
    });
    
    setBackendOnline(true);
  }, [checkShiftDateChange]);

  // Handler saat peta siap digunakan
  const onMapReady = (mapInstance, utils) => {
    setMap(mapInstance); // Simpan instance map ke state
    setMapUtils(utils); // Simpan utility functions ke state
    try {
      const L = window.L || require('leaflet'); // eslint-disable-line no-undef
      // Ambil library Leaflet
      if (!markersLayerRef.current) {
        // Jika layer markers belum dibuat
        markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(mapInstance); // Buat layer group untuk markers
      }
    } catch (err) {
      void err; // Abaikan error
    }

    // Apply marker styling on zoom/move - OPTIMIZED with debouncing
    // Only use 'zoomend' and 'moveend' to reduce re-renders
    // Remove 'zoom' and 'move' events that fire continuously during animation
    mapInstance.on('zoomend', () => applyMarkerZoomStyling()); // Only after zoom completes
    mapInstance.on('moveend', () => applyMarkerZoomStyling()); // Only after pan completes
  };

  // Load truck data from backend only (INITIAL LOAD)
  // This runs ONCE on page load to get initial data
  // After that, WebSocket handles all real-time updates
  useEffect(() => {
    loadVehiclesFromBackend(); // Panggil fungsi load data kendaraan
  }, [timeRange, mapUtils, loadVehiclesFromBackend]); // Re-run saat timeRange atau mapUtils berubah

  // WebSocket connection for real-time updates WITH polling fallback
  useEffect(() => {
    console.log('🚀 Initializing WebSocket for real-time tracking...');
    console.log('🔄 Fallback polling enabled (3s interval) for reliability');
    
    // Reset reconnection counter on mount
    wsReconnectAttempts.current = 0;
    
    // Connect WebSocket for real-time updates (best case)
    connectWebSocket();
    
    // Fallback polling - ensures app works even if WebSocket fails
    // This will provide updates every 3 seconds via REST API
    const fallbackInterval = setInterval(() => {
      if (wsStatus !== 'connected') {
        console.log(`🔄 Polling fallback (WS: ${wsStatus})`);
      }
      loadVehiclesFromBackend();
    }, 3000); // Poll every 3 seconds
    
    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch (e) {
          console.warn('Failed to send ping:', e);
        }
      }
    }, 30000);
    
    return () => {
      console.log('🗑️ Cleaning up WebSocket connection');
      clearInterval(fallbackInterval);
      clearInterval(pingInterval);
      
      // Clear any pending reconnection timeout
      if (wsReconnectTimeout.current) {
        clearTimeout(wsReconnectTimeout.current);
        wsReconnectTimeout.current = null;
      }
      
      // Close WebSocket on unmount
      if (wsRef.current) {
        try {
          // Use code 1000 for normal closure to prevent reconnection
          wsRef.current.close(1000, 'Component unmounting');
        } catch (e) {
          console.warn('Error closing WebSocket:', e);
        }
        wsRef.current = null;
      }
      
      wsSubscribedRef.current = false;
      wsReconnectAttempts.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - do NOT add wsStatus to prevent infinite loop

  // Check for shift/date changes every minute
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const shiftChanged = checkShiftDateChange();
      if (shiftChanged) {
        console.log('⏰ Shift/Date changed detected - clearing routes, device tracking, and reloading data');
        // Clear all routes and device tracking
        setVehicleRoutes({});
        setVehicleDevices({}); // Force redetection of devices
        // Reload data
        loadVehiclesFromBackend();
      }
    }, 60000); // Check every 1 minute

    return () => clearInterval(checkInterval);
  }, [checkShiftDateChange, loadVehiclesFromBackend]);

  // Initialize shift tracking and clear old routes on mount
  useEffect(() => {
    console.log('🚀 Initializing LiveTracking for current shift/date');
    console.log('🧹 Force clearing all routes and device tracking on page load');
    // Force clear everything on page load to prevent stale data
    setVehicleRoutes({});
    setVehicleDevices({});
    const currentShift = getCurrentShiftDate();
    currentShiftDateRef.current = currentShift;
    console.log(`📅 Current shift: ${currentShift}`);
    
    // Clear ALL old routes from previous sessions/shifts - only show today's shift routes
    console.log('🧹 Clearing all old routes - starting fresh for current shift');
    setVehicleRoutes({});
  }, [getCurrentShiftDate]);

  // Auto-update selectedVehicle with latest data when vehicles state changes (for modal/popup)
  useEffect(() => {
    if (selectedVehicle && showVehicleCard && vehicles.length > 0) {
      // Find updated vehicle data from vehicles array
      const updatedVehicle = vehicles.find(v => v.id === selectedVehicle.id);
      
      if (updatedVehicle) {
        // Update selectedVehicle with fresh data (position, tireData, etc.)
        setSelectedVehicle(updatedVehicle);
        console.log(`🔄 Auto-updated selectedVehicle data for ${updatedVehicle.id} (modal open)`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]); // Triggered every 3s when API data refreshes - selectedVehicle not in deps to avoid loop

  // WebSocket setup (disabled until WS integration is configured)
  useEffect(() => {
    setWsStatus('disconnected'); // Set status WebSocket disconnected (fitur belum aktif)
  }, []); // Hanya run sekali saat mount

  // Backend connection monitor
  useEffect(() => {
    setBackendOnline(true); // Set backend online (monitoring connection)
  }, []); // Hanya run sekali saat mount

  // Update selectedVehicle with latest data when vehicles state changes
  useEffect(() => {
    if (selectedVehicle && vehicles.length > 0) {
      // Find the updated vehicle data from the vehicles array
      const updatedVehicle = vehicles.find(v => v.id === selectedVehicle.id);
      
      if (updatedVehicle) {
        // Check if tire data actually changed
        const oldTireData = JSON.stringify(selectedVehicle.tireData || []);
        const newTireData = JSON.stringify(updatedVehicle.tireData || []);
        
        if (oldTireData !== newTireData) {
          console.log(`🔄 Tire data updated for ${updatedVehicle.id}:`, {
            oldCount: selectedVehicle.tireData?.length || 0,
            newCount: updatedVehicle.tireData?.length || 0,
            newData: updatedVehicle.tireData
          });
        }
        
        // Update selectedVehicle with fresh data (including tireData, position, etc.)
        setSelectedVehicle(updatedVehicle);
        console.log(`🔄 Updated selectedVehicle data for ${updatedVehicle.id} at ${new Date().toLocaleTimeString()}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]); // Re-run when vehicles data updates (every 30s) - selectedVehicle intentionally not in deps to avoid infinite loop

  // DISABLED: Frontend dummy movement simulation
  // Backend should provide real-time location updates via API polling (every 30s)
  // Frontend should NOT simulate movement independently to avoid data mismatch
  /*
  useEffect(() => {
    if (!isTrackingActive || !mapUtils) return;
    const centroid = mapUtils.polygonCentroid(mapUtils.polygonLatLng);
    const interval = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          if (vehicle.status !== 'active') return vehicle;
          const currentRoute = vehicleRoutes[vehicle.id] || [];
          const lastPos = currentRoute[currentRoute.length - 1] || vehicle.position;
          const baseBearing = vehicle.heading ?? 90;
          const rawDrift = (Math.random() - 0.5) * 2;
          const targetBearing = baseBearing + rawDrift;
          const nextBearing = baseBearing + (targetBearing - baseBearing) * 0.2;
          const stepM = 1;

          let nextPos = mapUtils.moveByMeters(lastPos, stepM, nextBearing);
          if (!mapUtils.pointInPolygon(nextPos, mapUtils.polygonLatLng)) {
            const dy = centroid[0] - lastPos[0];
            const dx = centroid[1] - lastPos[1];
            const bearingToCentroid = (Math.atan2(dx, dy) * 180) / Math.PI;
            nextPos = mapUtils.moveByMeters(lastPos, stepM, bearingToCentroid);
            if (!mapUtils.pointInPolygon(nextPos, mapUtils.polygonLatLng)) {
              nextPos = mapUtils.moveByMeters(lastPos, stepM, (baseBearing + 180) % 360);
            }
          }

          setVehicleRoutes((prev) => {
            const current = prev[vehicle.id] || [];
            const last = current[current.length - 1] || lastPos;
            const moved = mapUtils.haversineMeters(last, nextPos);
            if (moved >= 0.5) {
              const limited = [...current, nextPos].slice(-200);
              return { ...prev, [vehicle.id]: limited };
            }
            return prev;
          });

          return {
            ...vehicle,
            position: nextPos,
            heading: (nextBearing + 360) % 360,
            speed: 3.6,
            lastUpdate: new Date(),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isTrackingActive, vehicleRoutes, mapUtils]);
  */

  // Helper functions
  const formatLastUpdate = (date) => {
    const now = new Date(); // Waktu sekarang
    const diff = Math.floor((now - date) / 1000); // Selisih dalam detik

    if (diff < 60) return `${diff}s ago`; // Jika < 60 detik, tampilkan dalam detik
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; // Jika < 1 jam, tampilkan dalam menit
    return `${Math.floor(diff / 3600)}h ago`; // Tampilkan dalam jam
  };

  // Reconcile markers when data changes (reuse markers for performance)
  useEffect(() => {
    if (map && vehicles) {
      // Jika map dan vehicles sudah ready
      const L = window.L || require('leaflet'); // eslint-disable-line no-undef
      // Ambil library Leaflet
      if (!markersLayerRef.current) {
        // Jika layer markers belum dibuat
        try {
          markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(map); // Buat layer group
        } catch (err) {
          void err; // Abaikan error
        }
      }

      const existing = markersRef.current; // Ambil markers yang sudah ada
      const seen = new Set(); // Set untuk tracking marker yang masih digunakan

      // Filter vehicles berdasarkan cluster selection untuk mendapatkan nomor urut yang benar
      const filteredVehicles = vehicles.filter(vehicle => inSelectedCluster(vehicle.id));

      filteredVehicles.forEach((vehicle, visualIndex) => {
        // Loop setiap kendaraan dengan index urut visual
        const colors = {
          // Palet warna berdasarkan status
          active: '#10b981', // Hijau untuk active
          idle: '#f59e0b', // Oranye untuk idle
          maintenance: '#ef4444', // Merah untuk maintenance
          offline: '#6b7280', // Abu-abu untuk offline
        };

        const truckNum = vehicle.truckNumber || extractTruckNumber(vehicle.id) || ''; // Ekstrak nomor truk dari database (fixed number)
        const visualNum = visualIndex + 1; // Nomor urut visual (#1, #2, #3, dst)
        
        // Simpan visualNum ke vehicle object untuk digunakan di card info
        vehicle._visualNumber = visualNum;
        
        const buildIcon = (
          status // Fungsi untuk build custom icon
        ) =>
          L.divIcon({
            html: `
              <div style="position: relative;">
                <div style="background: ${colors[status] || colors.offline}; color: #ffffff; border: 2px solid #ffffff; border-radius: 6px; padding: 2px 6px; min-width: 26px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
                  ${truckNum}
                </div>
                <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${colors[status] || colors.offline}; margin: 0 auto; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"></div>
              </div>
            `,
          
          //   html: ` 
          //   <div style="position: relative;">
          //     <div style="background: ${colors[status] || colors.offline}; color: #ffffff; border: 2px solid #ffffff; border-radius: 6px; padding: 2px 6px; min-width: 16px; height: 12px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); line-height: 1;">
          //       <span style="font-size: 8px;">${truckNum}</span>
          //     </div>
          //     <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${colors[status] || colors.offline}; margin: 0 auto; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"></div>
          //   </div>
          // `,

          //tambahkan kode dibawah di dalam div style background diatas untuk tambah nomor urut
          //  <span style="font-size: 9px; opacity: 0.8; margin-right: 2px;">#${visualNum}</span>
          // HTML untuk icon dengan nomor urut visual dan nomor truk tetap
            className: 'custom-truck-icon', // Class CSS
            // iconSize: [36, 32], // Ukuran icon sedikit lebih besar untuk menampung 2 nomor
            // iconAnchor: [18, 32], // Anchor point (bottom center)
            //ubah ukuran icon juga ubah ukuran di html diatas
            iconSize: [28, 28], // Ukuran icon sedikit lebih kecil untuk menampung  nomor
            iconAnchor: [14, 28], // Anchor point (bottom center)
          });

        let marker = existing[vehicle.id]; // Cek apakah marker sudah ada
        if (!marker) {
          // Jika marker belum ada, buat baru
          console.log(`🆕 Creating new marker for ${vehicle.id} at position:`, vehicle.position); // Log pembuatan marker
          marker = L.marker(vehicle.position, {
            // Buat marker baru
            icon: buildIcon(vehicle.status), // Set icon custom
            zIndexOffset: 1000, // Set z-index tinggi
            pane: 'markersPane', // Tambahkan ke pane markers
            // Add options to prevent positioning issues
            keyboard: false, // Disable keyboard navigation
            riseOnHover: false, // Jangan naikkan z-index saat hover
          });
          marker.addTo(map); // Tambahkan marker ke peta
          existing[vehicle.id] = marker; // Simpan referensi marker
          marker._status = vehicle.status; // Simpan status untuk tracking perubahan

          // Add click handler only once when creating marker
          marker.on('click', async () => {
            // Event handler saat marker diklik
            
            // ALWAYS clear previous route lines and markers to prevent stacking
            try {
              if (liveRouteLineRef.current && map) {
                map.removeLayer(liveRouteLineRef.current);
                liveRouteLineRef.current = null;
              }
              if (liveRouteMarkersRef.current.start && map) {
                map.removeLayer(liveRouteMarkersRef.current.start);
                liveRouteMarkersRef.current.start = null;
              }
            } catch (err) {
              console.warn('Error clearing route:', err);
            }
            
            setSelectedVehicle(vehicle); // Set kendaraan yang dipilih
            setShowVehicleCard(true); // Tampilkan card info kendaraan

            // Clear IoT device info (no dummy lookups)
            setSelectedDevice(null); // Clear device info
            setSelectedDeviceStatus(null); // Clear device status

            // Show live route for this vehicle
            try {

              const L = window.L || require('leaflet'); // eslint-disable-line no-undef
              // Ambil library Leaflet

              let routeHistory = vehicleRoutes[vehicle.id] || []; // Ambil history rute dari state
              
              // 🔍 CRITICAL FIX: Check if current device matches the one we're tracking
              // If device changed (reassignment), clear old route and reload from backend
              const currentDeviceId = vehicle.device?.id;
              const trackedDeviceId = vehicleDevices[vehicle.id];
              
              if (currentDeviceId && trackedDeviceId && currentDeviceId !== trackedDeviceId) {
                console.log(`🔄 Device mismatch detected! Tracked: ${trackedDeviceId}, Current: ${currentDeviceId}`);
                console.log(`🧹 Clearing old route and reloading from backend...`);
                routeHistory = []; // Force clear route history
                
                // Update tracked device
                setVehicleDevices(prev => ({
                  ...prev,
                  [vehicle.id]: currentDeviceId
                }));
              } else if (currentDeviceId && !trackedDeviceId) {
                // First time seeing this device for this truck, record it
                setVehicleDevices(prev => ({
                  ...prev,
                  [vehicle.id]: currentDeviceId
                }));
              }

              if (routeHistory.length <= 1) {
                // Jika rute belum ada/kurang, coba load dari backend untuk shift saat ini
                try {
                  // Get current shift date untuk filter
                  const currentShiftDate = getCurrentShiftDate();
                  console.log(`📅 Loading route for ${vehicle.id} from current shift: ${currentShiftDate}`);
                  
                  // Load route history from backend for TODAY's shift only
                  const histRes = await trackingAPI.getTruckTracking(vehicle.id, 1000); // Load banyak untuk full route
                  
                  if (histRes.success && histRes.data?.location_history) {
                    // Filter location history untuk shift/tanggal saat ini
                    const now = new Date();
                    const shiftStartTime = new Date();
                    
                    // Tentukan waktu mulai shift saat ini
                    const currentShift = getCurrentShift();
                    if (currentShift === 'day') {
                      // Shift siang: 06:00 hari ini
                      shiftStartTime.setHours(6, 0, 0, 0);
                    } else {
                      // Shift malam: 16:00 hari ini atau kemarin
                      if (now.getHours() >= 16) {
                        // Masih hari ini, mulai jam 16:00
                        shiftStartTime.setHours(16, 0, 0, 0);
                      } else {
                        // Sudah lewat tengah malam, mulai dari jam 16:00 kemarin
                        shiftStartTime.setDate(shiftStartTime.getDate() - 1);
                        shiftStartTime.setHours(16, 0, 0, 0);
                      }
                    }
                    
                    console.log(`🕒 Filtering routes from: ${shiftStartTime.toISOString()}`);
                    
                    // Sort by timestamp ascending (oldest first), then map coordinates
                    const sortedHistory = histRes.data.location_history
                      .filter(loc => {
                        // Filter hanya data dari shift saat ini
                        const locTime = new Date(loc.recorded_at || loc.created_at);
                        return locTime >= shiftStartTime;
                      })
                      .sort((a, b) => {
                        // Sort by timestamp ascending (oldest first)
                        const timeA = new Date(a.recorded_at || a.created_at).getTime();
                        const timeB = new Date(b.recorded_at || b.created_at).getTime();
                        return timeA - timeB;
                      });
                    
                    // Map sorted history to coordinates
                    const coords = sortedHistory
                      .map((loc) => {
                        const lat = parseFloat(loc.latitude);
                        const lng = parseFloat(loc.longitude);
                        return isFinite(lat) && isFinite(lng) ? [lat, lng] : null;
                      })
                      .filter(Boolean); // Filter out nilai null
                      
                    if (coords.length > 0) {
                      console.log(`✅ Loaded ${coords.length} route points from current shift`);
                      routeHistory = coords;
                      // Update vehicleRoutes state dengan data dari backend
                      setVehicleRoutes(prev => ({
                        ...prev,
                        [vehicle.id]: coords
                      }));
                    } else {
                      console.log('⚠️ No route data found for current shift, using current position');
                      routeHistory = [vehicle.position]; // Gunakan posisi saat ini
                    }
                  }
                } catch (e) {
                  console.warn('Failed to load route history from backend:', e);
                  // Fallback ke posisi saat ini
                  routeHistory = [vehicle.position];
                }
              }

              if (Array.isArray(routeHistory) && routeHistory.length > 1) {
                // Jika ada rute dengan minimal 2 point
                
                // IMPORTANT: Remove old polyline before creating new one (prevent stacking)
                if (liveRouteLineRef.current) {
                  try {
                    map.removeLayer(liveRouteLineRef.current);
                    liveRouteLineRef.current = null;
                  } catch (err) {
                    console.warn('Error removing old polyline:', err);
                  }
                }
                
                const routeColor = '#2563eb'; // Warna biru untuk rute
                liveRouteLineRef.current = L.polyline(routeHistory, {
                  // Buat polyline untuk rute
                  color: routeColor, // Warna garis
                  weight: 3, // Ketebalan garis
                  opacity: 0.9, // Transparansi
                  smoothFactor: 2, // Faktor smoothing
                  lineJoin: 'round', // Join style
                  lineCap: 'round', // Cap style
                  pane: 'routesPane', // Pane untuk rute
                }).addTo(map); // Tambahkan ke peta

                // Remove old START marker before creating new one
                if (liveRouteMarkersRef.current.start) {
                  try {
                    map.removeLayer(liveRouteMarkersRef.current.start);
                    liveRouteMarkersRef.current.start = null;
                  } catch (err) {
                    console.warn('Error removing old START marker:', err);
                  }
                }
                // Note: END marker cleanup removed - no longer used

                // START marker: White circle with blue border (at route beginning)
                const startIcon = L.divIcon({
                  html: `<div style="background:white;border:3px solid ${routeColor};border-radius:50%;width:16px;height:16px;box-shadow:0 2px 4px rgba(0,0,0,0.3);z-index:1000;"></div>`,
                  className: 'live-route-start',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8], // Center anchor for precise positioning
                });

                liveRouteMarkersRef.current.start = L.marker(routeHistory[0], {
                  icon: startIcon,
                  pane: 'markerPane', // Use markerPane for higher z-index
                  zIndexOffset: 1000, // Ensure it appears above route line
                }).addTo(map);
                
                // Note: END marker removed - current position shown by truck icon with number

                try {
                  map.fitBounds(liveRouteLineRef.current.getBounds().pad(0.05)); // Zoom ke bounds rute dengan padding 5%
                } catch (err) {
                  void err; // Abaikan error
                }
              }
            } catch (e) {
              console.warn('Failed to show live route:', e); // Log error
            }
          });
        } else {
          // Jika marker sudah ada sebelumnya
          // Update existing marker position and icon
          console.log(`🔄 Updating marker ${vehicle.id} to position:`, vehicle.position); // Log update marker

          // Update position cleanly without timeout to prevent glitches
          try {
            marker.setLatLng(vehicle.position); // Update posisi marker
          } catch (err) {
            console.warn('Failed to update marker position:', err); // Log error
          }

          if (marker._status !== vehicle.status) {
            // Jika status berubah
            marker.setIcon(buildIcon(vehicle.status)); // Update icon dengan warna baru
            marker._status = vehicle.status; // Update status tracking
          }
        }

        // Ensure visible
        try {
          const el = marker.getElement?.(); // Ambil DOM element marker
          if (el) el.style.visibility = 'visible'; // Set visibility menjadi visible
        } catch (err) {
          void err; // Abaikan error
        }

        seen.add(vehicle.id); // Tandai marker ini sebagai sudah diproses
      });

      // Remove markers that are no longer present
      Object.keys(existing).forEach((id) => {
        // Loop semua marker yang ada
        if (!seen.has(id)) {
          // Jika marker tidak ada di data vehicles terbaru
          try {
            const m = existing[id]; // Ambil marker
            if (m && map.hasLayer(m)) {
              // Jika marker ada di peta
              map.removeLayer(m); // Hapus dari peta
            }
          } catch (err) {
            void err; // Abaikan error
          }
          delete existing[id]; // Hapus dari object existing
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, vehicles, clusterSelections, inSelectedCluster, vehicleRoutes, timeRange, selectedVehicle]); // Re-run jika dependencies berubah

  // Re-apply marker zoom styling whenever map or selection changes
  useEffect(() => {
    applyMarkerZoomStyling(); // Terapkan styling marker
  }, [map, vehicles, clusterSelections, applyMarkerZoomStyling]); // Re-run jika dependencies berubah

  // Update live route line when vehicleRoutes changes for selected vehicle (smooth update)
  useEffect(() => {
    if (!map || !selectedVehicle || !showVehicleCard) return; // Only update if vehicle card is shown
    
    let routeHistory = vehicleRoutes[selectedVehicle.id];
    if (!routeHistory || routeHistory.length === 0) return; // Need at least 1 point
    
    try {
      const L = window.L || require('leaflet'); // eslint-disable-line no-undef
      
      // 🔥 CRITICAL FIX: Filter out any stale route points that are too far from current position
      // This prevents the long blue line issue when old data gets mixed
      const currentMarker = markersRef.current[selectedVehicle.id];
      if (!currentMarker) {
        console.warn(`⚠️ No marker found for ${selectedVehicle.id}`);
        return;
      }
      
      const markerPos = currentMarker.getLatLng();
      const currentPosition = [markerPos.lat, markerPos.lng];
      
      // Filter route points: only keep points within reasonable distance (e.g., 50km from current position)
      // This removes any stale data from old device assignment
      const MAX_DISTANCE_KM = 50;
      const filteredRoute = routeHistory.filter((point, idx) => {
        // Always keep first and last point
        if (idx === 0 || idx === routeHistory.length - 1) return true;
        
        // Calculate distance from current position
        const R = 6371; // Earth radius in km
        const dLat = (point[0] - currentPosition[0]) * Math.PI / 180;
        const dLon = (point[1] - currentPosition[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(currentPosition[0] * Math.PI / 180) * Math.cos(point[0] * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance <= MAX_DISTANCE_KM;
      });
      
      // If too many points filtered out, clear the entire route (likely stale data)
      if (filteredRoute.length < routeHistory.length * 0.5 && routeHistory.length > 10) {
        console.warn(`🧹 Filtered out ${routeHistory.length - filteredRoute.length} stale route points for ${selectedVehicle.id}`);
        // Clear stale route from state
        setVehicleRoutes(prev => ({
          ...prev,
          [selectedVehicle.id]: [currentPosition]
        }));
        return;
      }
      
      routeHistory = filteredRoute;
      
      // Build final route: all history points except last + current marker position
      // This guarantees the line ends exactly at the marker
      let finalRoute;
      if (routeHistory.length === 1) {
        // Only one point, use current marker position
        finalRoute = [currentPosition];
      } else {
        // Multiple points: keep all except last, then add current marker position
        finalRoute = [...routeHistory.slice(0, -1), currentPosition];
      }
      
      if (finalRoute.length < 2) {
        // Need at least 2 points to draw a line
        return;
      }
      
      // Update or recreate polyline with final route points
      if (liveRouteLineRef.current && map.hasLayer(liveRouteLineRef.current)) {
        // Polyline exists and is on map - just update coordinates
        liveRouteLineRef.current.setLatLngs(finalRoute);
        console.log(`📍 Updated route line for ${selectedVehicle.id}: ${finalRoute.length} points (ending at marker)`);
      } else {
        // Polyline missing or removed - recreate it
        console.log(`🔄 Recreating route line for ${selectedVehicle.id}: ${finalRoute.length} points`);
        
        const routeColor = '#2563eb'; // Blue color
        liveRouteLineRef.current = L.polyline(finalRoute, {
          color: routeColor,
          weight: 3,
          opacity: 0.9,
          smoothFactor: 1, // Reduced smoothing to keep line precise
          lineJoin: 'round',
          lineCap: 'round',
          pane: 'routesPane',
        }).addTo(map);
      }
      
      // Update START marker position if it exists (no recreation to avoid duplicates)
      if (liveRouteMarkersRef.current.start && map.hasLayer(liveRouteMarkersRef.current.start)) {
        const startPoint = finalRoute[0]; // Oldest point (first in sorted array)
        liveRouteMarkersRef.current.start.setLatLng(startPoint);
        console.log(`📍 Updated START marker to oldest point: [${startPoint[0]}, ${startPoint[1]}]`);
      }
      
      // Note: No END marker - removed as per requirement
      // Current position is shown by the truck icon with number
    } catch (e) {
      console.warn('Failed to update/recreate live route:', e);
    }
  }, [map, selectedVehicle, showVehicleCard, vehicleRoutes]); // Re-run when routes update (every 3s)

  // Handle focus via URL param ?focus=<truck>
  useEffect(() => {
    if (!map || vehicles.length === 0 || focusHandledRef.current) return; // Keluar jika belum ready atau sudah dihandle
    try {
      const params = new URLSearchParams(window.location.search || ''); // Parse URL query params
      const focus = params.get('focus'); // Ambil parameter 'focus'
      if (!focus) return; // Keluar jika tidak ada parameter focus
      const target = // Cari kendaraan berdasarkan ID
        vehicles.find((v) => String(v.id) === focus) || // Cari exact match
        vehicles.find((v) => String(v.id).toLowerCase().includes(String(focus).toLowerCase())); // Cari partial match
      if (!target) return; // Keluar jika kendaraan tidak ditemukan
      const marker = markersRef.current[target.id]; // Ambil marker kendaraan
      if (marker) {
        // Jika marker sudah ada di peta
        try {
          marker.fire('click'); // Trigger click event marker
        } catch (err) {
          void err; // Abaikan error
        }
        try {
          map.setView(target.position, Math.max(map.getZoom(), 16), { animate: true }); // Zoom ke kendaraan (min zoom 16)
        } catch (err) {
          void err; // Abaikan error
        }
      } else {
        // Jika marker belum ada (fallback)
        // Fallback: set directly
        setSelectedVehicle(target); // Set kendaraan yang dipilih
        setShowVehicleCard(true); // Tampilkan card
        try {
          map.setView(target.position, Math.max(map.getZoom(), 16), { animate: true }); // Zoom ke kendaraan
        } catch (err) {
          void err; // Abaikan error
        }
      }
      focusHandledRef.current = true; // Tandai sudah dihandle (prevent duplicate)
    } catch (err) {
      void err; // Abaikan error
    }
  }, [map, vehicles]); // Re-run jika map atau vehicles berubah

  const additionalControls = // JSX untuk kontrol tambahan di header peta
    (
      <>
        {/* Status Indikator: LIVE/PAUSED */}
        <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} // Dot hijau berkedip jika live, merah jika paused
          ></div>
          <span className="text-xs text-gray-700 font-medium">
            {isTrackingActive ? 'LIVE' : 'PAUSED'} {/* Label status */}
          </span>
          <span className="text-xs text-gray-500 font-normal">
            • {vehicles.filter(v => inSelectedCluster(v.id)).length} trucks {/* Jumlah kendaraan yang ditampilkan sesuai filter */}
          </span>
        </div>
        {/* Status Indikator: API Online/Offline */}
        <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`} // Dot hijau jika online, merah jika offline
          ></div>
          <span className="text-xs text-gray-700 font-medium">
            API {backendOnline ? 'Online' : 'Offline'} {/* Label status API */}
          </span>
        </div>
        {/* Status Indikator: WebSocket */}
        <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' : wsStatus === 'connecting' || wsStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'}`} // Hijau=connected, kuning=connecting, merah=disconnected
          ></div>
          <span className="text-xs text-gray-700 font-medium">WS {wsStatus}</span>{' '}
          {/* Label status WebSocket */}
        </div>

        {/* Indikator Shift Saat Ini */}
        <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
          <ClockIcon className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-700 font-medium">
            Shift {getCurrentShift() === 'day' ? 'Siang' : 'Malam'} | {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
          </span>
        </div>

        {/* Filter Dropdown */}
        <div className="relative border-l border-gray-300 pl-3">
          {' '}
          {/* Container dropdown filter */}
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)} // Toggle visibility dropdown
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            aria-label="Open filter options"
          >
            <FunnelIcon className="w-3 h-3" /> {/* Icon filter */}
            Filter {/* Label button */}
          </button>
          {showFilterDropdown && ( // Tampilkan dropdown jika showFilterDropdown true
            <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 z-50">
              {' '}
              {/* Panel dropdown */}
              <div className="text-xs font-medium text-gray-700 mb-2">Cluster (Truck No)</div>{' '}
              {/* Header dropdown */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                {' '}
                {/* Container checkbox list */}
                {['1-199', '200-399', '400-599', '600-799', '800-999'].map(
                  (
                    range // Loop setiap range cluster
                  ) => (
                    <label
                      key={range}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      {' '}
                      {/* Label checkbox */}
                      <input
                        type="checkbox" // Checkbox input
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={clusterSelections.has(range)} // Checked jika range ada di Set
                        onChange={(e) => {
                          // Handler saat checkbox diubah
                          setClusterSelections((prev) => {
                            // Update state clusterSelections
                            const next = new Set(prev); // Copy Set lama
                            if (e.target.checked)
                              next.add(range); // Tambahkan range jika checked
                            else next.delete(range); // Hapus range jika unchecked
                            return next; // Return Set baru
                          });
                        }}
                        disabled={loading} // Disable saat loading
                      />
                      <span>{range}</span> {/* Label range */}
                    </label>
                  )
                )}
              </div>
              <div className="mt-2 text-[10px] text-gray-500">Unchecked ranges are hidden</div>{' '}
              {/* Info text */}
            </div>
          )}
        </div>
      </>
    );

  return (
    // Return JSX component
    <>
      <BaseTrackingMap // Komponen peta dasar
        onMapReady={onMapReady} // Callback saat peta ready
        additionalControls={additionalControls} // Kontrol tambahan (status indicators & filter)
        showCompass={true} // Tampilkan compass
        showMapStyleToggle={true} // Tampilkan toggle style peta
        showAutoCenter={true} // Tampilkan tombol auto center
        showFitRoutes={false} // Sembunyikan tombol fit routes
      >
        {/* Vehicle Info Card */}
        {showVehicleCard &&
          selectedVehicle && ( // Tampilkan card jika ada kendaraan yang dipilih
            <div
              className="absolute bg-white rounded-xl shadow-lg border border-gray-200 p-5 w-[380px] max-h-[calc(100vh-220px)] overflow-y-auto z-50" // Card container dengan scroll
              style={{ left: '24px', top: '80px' }} // Posisi card di kiri atas peta
            >
              {/* Vehicle banner image */}
              <div className="mb-4 overflow-hidden rounded-lg border border-gray-100">
                {' '}
                {/* Container gambar banner */}
                <TruckImage 
                  id={selectedVehicle.id} 
                  width={380} 
                  height={200}
                  alt={selectedVehicle.truckName || selectedVehicle.plateNumber || 'Truck'}
                  className="h-48 w-full object-cover"
                />
              </div>
              {/* Header */}
              <div className="flex items-start justify-between">
                {' '}
                {/* Container header card */}
                <div>
                  {' '}
                  {/* Info kendaraan */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">
                      {selectedVehicle._visualNumber || '?'}
                    </span>
                    <h4 className="text-lg font-semibold text-gray-900 leading-tight">
                      {selectedVehicle.truckName || selectedVehicle.plateNumber || selectedVehicle.id} {/* Nama truck */}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500 ml-8">
                    {selectedVehicle.plateNumber && <span className="font-medium">{selectedVehicle.plateNumber}</span>}
                    {selectedVehicle.truckNumber && (
                      <span className="ml-2 text-gray-400">• Truck #{selectedVehicle.truckNumber}</span>
                    )}
                    {selectedVehicle.driver?.name && (
                      <span className="ml-2">• Driver: {selectedVehicle.driver.name}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 ml-8">
                    <ClockIcon className="w-3 h-3 inline mr-1" />
                    Shift {getCurrentShift() === 'day' ? 'Siang' : 'Malam'} • Rute hari ini
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {' '}
                  {/* Container status badge dan tombol close */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
                      selectedVehicle.status === 'active' // Badge status dengan warna kondisional
                        ? 'bg-green-50 text-green-700 border-green-200' // Hijau untuk active
                        : selectedVehicle.status === 'idle'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200' // Kuning untuk idle
                          : 'bg-gray-50 text-gray-700 border-gray-200' // Abu-abu untuk lainnya
                    }`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        // Dot status indicator
                        selectedVehicle.status === 'active'
                          ? 'bg-green-500' // Hijau untuk active
                          : selectedVehicle.status === 'idle'
                            ? 'bg-yellow-500' // Kuning untuk idle
                            : 'bg-gray-400' // Abu-abu untuk lainnya
                      }`}
                    />
                    {selectedVehicle.status} {/* Label status */}
                  </span>
                  <button
                    onClick={() => {
                      // Handler saat tombol close diklik
                      setShowVehicleCard(false); // Sembunyikan card
                      setSelectedVehicle(null); // Clear kendaraan yang dipilih
                      if (liveRouteLineRef.current && map) {
                        // Jika ada rute yang ditampilkan
                        try {
                          map.removeLayer(liveRouteLineRef.current); // Hapus polyline rute
                        } catch {
                          /* empty */
                        }
                        liveRouteLineRef.current = null; // Reset referensi
                      }
                      if (liveRouteMarkersRef.current.start)
                        // Jika ada marker start
                        try {
                          map.removeLayer(liveRouteMarkersRef.current.start); // Hapus marker start
                        } catch {
                          /* empty */
                        }
                      // Note: END marker cleanup removed - no longer used
                    }}
                    className="p-1.5 rounded-md hover:bg-gray-100" // Button styling
                    aria-label="Close vehicle card"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" /> {/* Icon close (X) */}
                  </button>
                </div>
              </div>

              {/* Key metrics - quick scan rows with icons */}

              {/* Tire Pressure Display */}
              <div className="mt-5">
                {' '}
                {/* Container display tekanan ban */}
                <div className="rounded-lg border border-gray-200 p-3">
                  {' '}
                  {/* Card border */}
                  {/* Last Update Info */}
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Data TPMS</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs text-gray-500">
                        Update: {selectedVehicle?.lastUpdate ? 
                          new Date(selectedVehicle.lastUpdate).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          }) 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <TirePressureDisplay // Komponen untuk menampilkan tekanan ban TPMS
                    selectedTruckId={selectedVehicle?.id} // Pass truck ID
                    tireData={selectedVehicle?.tireData} // Pass data tekanan ban
                    showHeader={true} // Tampilkan header komponen
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-5">
                {' '}
                {/* Container tombol CTA */}
                <button
                  onClick={() => navigate(`/history-tracking?focus=${encodeURIComponent(String(selectedVehicle?.id || ''))}`)} // Navigasi ke halaman history dengan parameter focus
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <span>View Route History</span> {/* Label tombol */}
                </button>
              </div>
            </div>
          )}
      </BaseTrackingMap>

      {/* Click outside to close filter dropdown */}
      {showFilterDropdown && ( // Overlay untuk close dropdown saat klik di luar
        <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} /> // Full screen invisible overlay
      )}
    </>
  );
};

export default LiveTrackingMapNew; // Export komponen
