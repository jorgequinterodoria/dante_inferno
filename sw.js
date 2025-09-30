/**
 * Service Worker for Inferno Pixelado: La Redención de Dante
 * Provides offline functionality and asset caching
 */

const CACHE_NAME = 'dante-inferno-v1.0.0';
const CACHE_VERSION = '1.0.0';

// Assets to cache for offline functionality
const ASSETS_TO_CACHE = [
    // Core files
    '/',
    '/index.html',
    
    // Stylesheets
    '/css/styles.css',
    
    // JavaScript modules
    '/js/main.js',
    '/js/engine/gameEngine.js',
    '/js/engine/renderer.js',
    '/js/engine/inputManager.js',
    '/js/engine/audioManager.js',
    '/js/engine/audioService.js',
    '/js/engine/colors.js',
    '/js/engine/sprites.js',
    
    // Game logic
    '/js/game/player.js',
    '/js/game/maze.js',
    '/js/game/levelManager.js',
    '/js/game/objectives.js',
    '/js/game/narrativeManager.js',
    
    // UI modules
    '/js/ui/progressPanel.js',
    '/js/ui/menuSystem.js',
    '/js/ui/dialogSystem.js',
    
    // Data modules
    '/js/data/saveManager.js',
    '/js/data/gameData.js',
    '/js/data/levelData.js',
    '/js/data/audioData.js',
    
    // Audio files
    '/audio/music/menu_theme.mp3',
    '/audio/music/level_1_forest.mp3',
    '/audio/music/level_2_limbo.mp3',
    '/audio/music/level_3_lust.mp3',
    '/audio/music/level_4_gluttony.mp3',
    '/audio/music/level_5_greed.mp3',
    '/audio/music/level_6_wrath.mp3',
    '/audio/music/level_7_heresy.mp3',
    '/audio/music/level_8_violence.mp3',
    '/audio/music/level_9_fraud.mp3',
    '/audio/music/level_10_treachery.mp3',
    
    '/audio/sfx/ambient_forest.mp3',
    '/audio/sfx/ambient_hell.mp3',
    '/audio/sfx/button_click.mp3',
    '/audio/sfx/error.mp3',
    '/audio/sfx/exit_unlocked.mp3',
    '/audio/sfx/fragment_collected.mp3',
    '/audio/sfx/level_complete.mp3',
    '/audio/sfx/menu_back.mp3',
    '/audio/sfx/menu_navigate.mp3',
    '/audio/sfx/menu_select.mp3',
    '/audio/sfx/move_blocked.mp3',
    '/audio/sfx/move_step.mp3',
    '/audio/sfx/success.mp3',
    '/audio/sfx/virgilio_found.mp3'
];

// Network timeout for fetch requests
const NETWORK_TIMEOUT = 3000;

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] All assets cached successfully');
                // Force activation of new service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache assets:', error);
                // Continue installation even if some assets fail to cache
                return Promise.resolve();
            })
    );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Delete old caches
                const deletePromises = cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    });
                
                return Promise.all(deletePromises);
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                // Take control of all clients immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event Handler - Implements cache-first strategy with network fallback
 */
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        handleFetchRequest(event.request)
    );
});

/**
 * Handle fetch requests with offline-first strategy
 */
async function handleFetchRequest(request) {
    try {
        // Try cache first for better performance
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            
            // For HTML files, try to update cache in background
            if (request.destination === 'document') {
                updateCacheInBackground(request);
            }
            
            return cachedResponse;
        }
        
        // If not in cache, try network with timeout
        console.log('[SW] Fetching from network:', request.url);
        const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            await cacheResponse(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('[SW] Fetch failed:', request.url, error);
        
        // Return offline fallback for HTML requests
        if (request.destination === 'document') {
            return getOfflineFallback();
        }
        
        // For other resources, return a basic error response
        return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * Fetch with timeout to prevent hanging requests
 */
function fetchWithTimeout(request, timeout) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout')), timeout);
        })
    ]);
}

/**
 * Cache a response
 */
async function cacheResponse(request, response) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
        console.log('[SW] Cached response for:', request.url);
    } catch (error) {
        console.warn('[SW] Failed to cache response:', request.url, error);
    }
}

/**
 * Update cache in background for HTML files
 */
async function updateCacheInBackground(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            await cacheResponse(request, networkResponse);
            console.log('[SW] Background cache update completed for:', request.url);
        }
    } catch (error) {
        console.log('[SW] Background cache update failed:', request.url, error);
    }
}

/**
 * Get offline fallback page
 */
async function getOfflineFallback() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html');
        
        if (cachedIndex) {
            return cachedIndex;
        }
        
        // Create a basic offline page if index.html is not cached
        return new Response(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Inferno Pixelado - Sin Conexión</title>
                <style>
                    body { 
                        font-family: monospace; 
                        text-align: center; 
                        padding: 50px; 
                        background: #2d1810; 
                        color: #FFD700; 
                    }
                    .offline-message { 
                        max-width: 500px; 
                        margin: 0 auto; 
                    }
                    button { 
                        background: #8B4513; 
                        color: #FFD700; 
                        border: none; 
                        padding: 10px 20px; 
                        margin: 10px; 
                        cursor: pointer; 
                        font-family: monospace;
                    }
                </style>
            </head>
            <body>
                <div class="offline-message">
                    <h1>Sin Conexión</h1>
                    <p>No se puede conectar a Internet, pero el juego debería funcionar sin conexión.</p>
                    <p>Intenta recargar la página o verifica tu conexión.</p>
                    <button onclick="location.reload()">Reintentar</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
        
    } catch (error) {
        console.error('[SW] Failed to get offline fallback:', error);
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Handle background sync for save data
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-save') {
        console.log('[SW] Background sync triggered for save data');
        event.waitUntil(handleBackgroundSync());
    }
});

/**
 * Handle background sync operations
 */
async function handleBackgroundSync() {
    try {
        // Check if there's pending save data to sync
        const clients = await self.clients.matchAll();
        
        clients.forEach(client => {
            client.postMessage({
                type: 'BACKGROUND_SYNC',
                action: 'SYNC_SAVE_DATA'
            });
        });
        
        console.log('[SW] Background sync completed');
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_VERSION });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
            break;
            
        case 'CACHE_STATUS':
            getCacheStatus().then((status) => {
                event.ports[0].postMessage(status);
            });
            break;
            
        default:
            console.log('[SW] Unknown message type:', type);
    }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
        await Promise.all(deletePromises);
        console.log('[SW] All caches cleared');
    } catch (error) {
        console.error('[SW] Failed to clear caches:', error);
        throw error;
    }
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedRequests = await cache.keys();
        
        return {
            cacheName: CACHE_NAME,
            version: CACHE_VERSION,
            cachedAssets: cachedRequests.length,
            totalAssets: ASSETS_TO_CACHE.length,
            cacheComplete: cachedRequests.length >= ASSETS_TO_CACHE.length
        };
    } catch (error) {
        console.error('[SW] Failed to get cache status:', error);
        return {
            cacheName: CACHE_NAME,
            version: CACHE_VERSION,
            cachedAssets: 0,
            totalAssets: ASSETS_TO_CACHE.length,
            cacheComplete: false,
            error: error.message
        };
    }
}

console.log('[SW] Service worker script loaded');