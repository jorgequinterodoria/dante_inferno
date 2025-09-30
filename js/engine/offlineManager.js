/**
 * Offline Manager
 * Handles service worker registration, offline detection, and cache management
 */

export class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.serviceWorker = null;
        this.cacheStatus = null;
        this.offlineCallbacks = [];
        this.onlineCallbacks = [];
        
        // Offline detection
        this.setupOfflineDetection();
        
        // Service worker support check
        this.serviceWorkerSupported = 'serviceWorker' in navigator;
        
        console.log('OfflineManager initialized');
        console.log(`Online status: ${this.isOnline}`);
        console.log(`Service Worker supported: ${this.serviceWorkerSupported}`);
    }

    /**
     * Initialize offline functionality
     */
    async init() {
        try {
            if (this.serviceWorkerSupported) {
                await this.registerServiceWorker();
                await this.checkCacheStatus();
            } else {
                console.warn('Service Worker not supported - limited offline functionality');
            }
            
            // Verify localStorage functionality
            this.verifyLocalStorage();
            
            console.log('OfflineManager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize OfflineManager:', error);
            throw error;
        }
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            this.serviceWorker = registration;
            
            console.log('Service Worker registered successfully');
            console.log('Scope:', registration.scope);
            
            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
                console.log('Service Worker update found');
                this.handleServiceWorkerUpdate(registration);
            });
            
            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });
            
            // Check if service worker is already controlling the page
            if (navigator.serviceWorker.controller) {
                console.log('Service Worker is controlling the page');
            }
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    /**
     * Handle service worker updates
     */
    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                console.log('New service worker available');
                this.showUpdateAvailable();
            }
        });
    }

    /**
     * Handle messages from service worker
     */
    handleServiceWorkerMessage(event) {
        const { type, action, data } = event.data;
        
        switch (type) {
            case 'BACKGROUND_SYNC':
                if (action === 'SYNC_SAVE_DATA') {
                    console.log('Background sync requested for save data');
                    // Trigger save data sync if needed
                    this.triggerSaveDataSync();
                }
                break;
                
            default:
                console.log('Unknown service worker message:', event.data);
        }
    }

    /**
     * Show update available notification
     */
    showUpdateAvailable() {
        // Create update notification
        const updateNotification = document.createElement('div');
        updateNotification.className = 'update-notification';
        updateNotification.innerHTML = `
            <div class="update-content">
                <p>Nueva versión disponible</p>
                <button id="updateBtn">Actualizar</button>
                <button id="dismissBtn">Más tarde</button>
            </div>
        `;
        
        document.body.appendChild(updateNotification);
        
        // Handle update button
        document.getElementById('updateBtn').addEventListener('click', () => {
            this.applyUpdate();
            updateNotification.remove();
        });
        
        // Handle dismiss button
        document.getElementById('dismissBtn').addEventListener('click', () => {
            updateNotification.remove();
        });
    }

    /**
     * Apply service worker update
     */
    async applyUpdate() {
        try {
            if (this.serviceWorker && this.serviceWorker.waiting) {
                // Tell the waiting service worker to skip waiting
                this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
                
                // Reload the page to activate the new service worker
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to apply update:', error);
        }
    }

    /**
     * Setup offline/online detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('Connection restored');
            this.isOnline = true;
            this.onlineCallbacks.forEach(callback => callback());
        });
        
        window.addEventListener('offline', () => {
            console.log('Connection lost');
            this.isOnline = false;
            this.offlineCallbacks.forEach(callback => callback());
        });
        
        // Additional connection check using fetch
        this.startConnectionMonitoring();
    }

    /**
     * Start periodic connection monitoring
     */
    startConnectionMonitoring() {
        setInterval(async () => {
            const wasOnline = this.isOnline;
            this.isOnline = await this.checkConnection();
            
            if (wasOnline !== this.isOnline) {
                if (this.isOnline) {
                    console.log('Connection restored (detected via monitoring)');
                    this.onlineCallbacks.forEach(callback => callback());
                } else {
                    console.log('Connection lost (detected via monitoring)');
                    this.offlineCallbacks.forEach(callback => callback());
                }
            }
        }, 30000); // Check every 30 seconds
    }

    /**
     * Check actual connection by attempting to fetch a small resource
     */
    async checkConnection() {
        try {
            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Verify localStorage functionality
     */
    verifyLocalStorage() {
        try {
            const testKey = 'dante_inferno_test';
            const testValue = 'test_value';
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (retrieved !== testValue) {
                throw new Error('localStorage read/write test failed');
            }
            
            console.log('localStorage functionality verified');
            
        } catch (error) {
            console.error('localStorage not available:', error);
            throw new Error('localStorage is required for offline functionality');
        }
    }

    /**
     * Check cache status
     */
    async checkCacheStatus() {
        if (!this.serviceWorkerSupported) return null;
        
        try {
            const messageChannel = new MessageChannel();
            
            const statusPromise = new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
            });
            
            navigator.serviceWorker.controller?.postMessage(
                { type: 'CACHE_STATUS' },
                [messageChannel.port2]
            );
            
            this.cacheStatus = await statusPromise;
            console.log('Cache status:', this.cacheStatus);
            
            return this.cacheStatus;
            
        } catch (error) {
            console.error('Failed to check cache status:', error);
            return null;
        }
    }

    /**
     * Clear all caches
     */
    async clearCache() {
        if (!this.serviceWorkerSupported) {
            console.warn('Cannot clear cache - Service Worker not supported');
            return false;
        }
        
        try {
            const messageChannel = new MessageChannel();
            
            const clearPromise = new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
            });
            
            navigator.serviceWorker.controller?.postMessage(
                { type: 'CLEAR_CACHE' },
                [messageChannel.port2]
            );
            
            const result = await clearPromise;
            
            if (result.success) {
                console.log('Cache cleared successfully');
                this.cacheStatus = null;
                return true;
            } else {
                console.error('Failed to clear cache:', result.error);
                return false;
            }
            
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }

    /**
     * Get offline status
     */
    isOffline() {
        return !this.isOnline;
    }

    /**
     * Get cache information
     */
    getCacheInfo() {
        return this.cacheStatus;
    }

    /**
     * Add callback for when going offline
     */
    onOffline(callback) {
        this.offlineCallbacks.push(callback);
    }

    /**
     * Add callback for when coming online
     */
    onOnline(callback) {
        this.onlineCallbacks.push(callback);
    }

    /**
     * Remove offline callback
     */
    removeOfflineCallback(callback) {
        const index = this.offlineCallbacks.indexOf(callback);
        if (index > -1) {
            this.offlineCallbacks.splice(index, 1);
        }
    }

    /**
     * Remove online callback
     */
    removeOnlineCallback(callback) {
        const index = this.onlineCallbacks.indexOf(callback);
        if (index > -1) {
            this.onlineCallbacks.splice(index, 1);
        }
    }

    /**
     * Trigger save data sync
     */
    triggerSaveDataSync() {
        // This would be called by the game engine when save data needs to be synced
        console.log('Save data sync triggered');
        
        // In a real implementation, this might sync save data to a server
        // For this offline-first game, we just ensure localStorage is working
        try {
            const saveData = localStorage.getItem('dante_inferno_save');
            if (saveData) {
                console.log('Save data verified in localStorage');
            }
        } catch (error) {
            console.error('Save data sync failed:', error);
        }
    }

    /**
     * Handle offline scenarios with user feedback
     */
    handleOfflineScenario(operation) {
        if (this.isOffline()) {
            console.log(`Offline operation: ${operation}`);
            
            // Show offline indicator if not already shown
            this.showOfflineIndicator();
            
            // For save operations, ensure they work with localStorage
            if (operation === 'save') {
                return this.handleOfflineSave();
            }
            
            return true; // Most operations should work offline
        }
        
        return true;
    }

    /**
     * Handle offline save operations
     */
    handleOfflineSave() {
        try {
            // Verify localStorage is still available
            this.verifyLocalStorage();
            return true;
        } catch (error) {
            console.error('Offline save failed:', error);
            this.showOfflineError('No se pudo guardar el progreso sin conexión');
            return false;
        }
    }

    /**
     * Show offline indicator
     */
    showOfflineIndicator() {
        let indicator = document.getElementById('offlineIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offlineIndicator';
            indicator.className = 'offline-indicator';
            indicator.innerHTML = '📡 Sin conexión - Modo offline';
            document.body.appendChild(indicator);
        }
        
        indicator.style.display = 'block';
        
        // Hide when back online
        const hideWhenOnline = () => {
            if (this.isOnline) {
                indicator.style.display = 'none';
                this.removeOnlineCallback(hideWhenOnline);
            }
        };
        
        this.onOnline(hideWhenOnline);
    }

    /**
     * Show offline error message
     */
    showOfflineError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'offline-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">Cerrar</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Get service worker version
     */
    async getVersion() {
        if (!this.serviceWorkerSupported) return null;
        
        try {
            const messageChannel = new MessageChannel();
            
            const versionPromise = new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.version);
                };
            });
            
            navigator.serviceWorker.controller?.postMessage(
                { type: 'GET_VERSION' },
                [messageChannel.port2]
            );
            
            return await versionPromise;
            
        } catch (error) {
            console.error('Failed to get service worker version:', error);
            return null;
        }
    }
}