/**
 * Spanish Error Messages and User Experience Utilities
 * Provides comprehensive error messages in Spanish for better user experience
 * Requirements: 5.4, 8.4 - Spanish error messages and proper error handling
 */

export const ErrorMessages = {
    // Game Initialization Errors
    CANVAS_NOT_FOUND: 'No se pudo encontrar el elemento canvas del juego. Por favor, recarga la página.',
    CANVAS_NOT_SUPPORTED: 'Tu navegador no soporta Canvas HTML5. Por favor, actualiza tu navegador.',
    WEBGL_NOT_SUPPORTED: 'Tu navegador no soporta WebGL. Algunas funciones visuales pueden no funcionar correctamente.',
    AUDIO_NOT_SUPPORTED: 'Tu navegador no soporta audio. El juego funcionará sin sonido.',
    
    // Save/Load Errors
    SAVE_FAILED: 'No se pudo guardar el progreso del juego. Verifica que tengas espacio disponible en tu navegador.',
    LOAD_FAILED: 'No se pudo cargar el juego guardado. El archivo puede estar corrupto.',
    SAVE_CORRUPTED: 'Los datos guardados están corruptos. Se iniciará un nuevo juego.',
    SAVE_VERSION_INCOMPATIBLE: 'La versión del juego guardado no es compatible. Se iniciará un nuevo juego.',
    LOCALSTORAGE_FULL: 'El almacenamiento del navegador está lleno. Libera espacio o borra datos antiguos.',
    LOCALSTORAGE_UNAVAILABLE: 'El almacenamiento local no está disponible. El progreso no se guardará.',
    
    // Network and Offline Errors
    OFFLINE_MODE: 'Estás jugando sin conexión. Algunas funciones pueden no estar disponibles.',
    CONNECTION_LOST: 'Se perdió la conexión a internet. El juego continuará funcionando sin conexión.',
    RESOURCE_LOAD_FAILED: 'No se pudieron cargar algunos recursos del juego. Verifica tu conexión.',
    
    // Game Logic Errors
    LEVEL_LOAD_FAILED: 'No se pudo cargar el nivel. Inténtalo de nuevo.',
    MAZE_GENERATION_FAILED: 'Error al generar el laberinto. Se intentará de nuevo.',
    INVALID_MOVE: 'Movimiento no válido. No puedes moverte en esa dirección.',
    OBJECTIVE_ERROR: 'Error al procesar los objetivos del nivel.',
    
    // Audio Errors
    AUDIO_LOAD_FAILED: 'No se pudo cargar el audio. El juego continuará sin sonido.',
    AUDIO_PLAY_FAILED: 'Error al reproducir audio. Verifica la configuración de sonido.',
    AUDIO_CONTEXT_FAILED: 'No se pudo inicializar el contexto de audio.',
    
    // Performance Errors
    LOW_PERFORMANCE: 'Rendimiento bajo detectado. Considera cerrar otras aplicaciones.',
    MEMORY_WARNING: 'Uso alto de memoria detectado. El juego puede funcionar más lento.',
    FRAME_RATE_LOW: 'Velocidad de fotogramas baja. Ajusta la configuración gráfica.',
    
    // User Input Errors
    INVALID_INPUT: 'Entrada no válida. Por favor, inténtalo de nuevo.',
    INPUT_TOO_FAST: 'Entrada demasiado rápida. Espera un momento antes de continuar.',
    
    // Generic Errors
    UNKNOWN_ERROR: 'Ha ocurrido un error inesperado. Por favor, recarga la página.',
    FEATURE_NOT_AVAILABLE: 'Esta función no está disponible en tu navegador.',
    PERMISSION_DENIED: 'Permisos denegados. Algunas funciones pueden no funcionar.',
    
    // Recovery Suggestions
    RELOAD_SUGGESTION: 'Si el problema persiste, intenta recargar la página.',
    BROWSER_UPDATE_SUGGESTION: 'Considera actualizar tu navegador para una mejor experiencia.',
    CLEAR_CACHE_SUGGESTION: 'Intenta limpiar la caché del navegador si experimentas problemas.',
    
    // Success Messages
    GAME_SAVED: 'Juego guardado exitosamente.',
    GAME_LOADED: 'Juego cargado exitosamente.',
    LEVEL_COMPLETED: 'Nivel completado. ¡Excelente trabajo!',
    OBJECTIVE_COMPLETED: 'Objetivo completado.',
    FRAGMENT_COLLECTED: 'Fragmento recolectado.',
    VIRGILIO_FOUND: '¡Has encontrado a Virgilio!',
    EXIT_UNLOCKED: 'La salida ha sido desbloqueada.',
    
    // Tutorial and Help Messages
    TUTORIAL_MOVEMENT: 'Usa WASD o las flechas del teclado para moverte por el laberinto.',
    TUTORIAL_OBJECTIVES: 'Encuentra a Virgilio, recolecta todos los fragmentos y llega a la salida.',
    TUTORIAL_SAVE: 'Tu progreso se guarda automáticamente.',
    HELP_STUCK: 'Si te quedas atascado, puedes reiniciar el nivel desde el menú.',
    HELP_PERFORMANCE: 'Si el juego va lento, cierra otras pestañas del navegador.',
    
    // Menu Messages
    CONFIRM_NEW_GAME: '¿Estás seguro de que quieres comenzar un nuevo juego? Se perderá el progreso actual.',
    CONFIRM_RESET: '¿Estás seguro de que quieres reiniciar desde cero? Se perderán todos los datos guardados.',
    CONFIRM_EXIT: '¿Estás seguro de que quieres salir del juego?',
    
    // Level-specific Messages
    LEVEL_INTRO: 'Bienvenido al {levelName}. {description}',
    LEVEL_COMPLETE: 'Has completado {levelName}. Preparándote para el siguiente círculo...',
    GAME_COMPLETE: '¡Felicitaciones! Has completado tu viaje a través del Infierno de Dante.',
    
    // Settings Messages
    VOLUME_CHANGED: 'Volumen ajustado a {volume}%.',
    DIFFICULTY_CHANGED: 'Dificultad cambiada a {difficulty}.',
    SETTINGS_SAVED: 'Configuración guardada.',
    SETTINGS_RESET: 'Configuración restablecida a valores predeterminados.'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

/**
 * Error Handler Class
 * Manages error display and user feedback in Spanish
 */
export class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.isShowingError = false;
        this.errorContainer = null;
        this.createErrorContainer();
    }

    /**
     * Create error display container
     */
    createErrorContainer() {
        this.errorContainer = document.createElement('div');
        this.errorContainer.className = 'error-overlay';
        this.errorContainer.style.display = 'none';
        document.body.appendChild(this.errorContainer);
    }

    /**
     * Show error message to user
     * @param {string} message - Error message key or custom message
     * @param {string} severity - Error severity level
     * @param {Object} params - Parameters for message interpolation
     * @param {Function} callback - Optional callback after user acknowledges error
     */
    showError(message, severity = ErrorSeverity.ERROR, params = {}, callback = null) {
        const errorMessage = this.getErrorMessage(message, params);
        const errorData = {
            message: errorMessage,
            severity,
            callback,
            timestamp: Date.now()
        };

        if (this.isShowingError) {
            this.errorQueue.push(errorData);
            return;
        }

        this.displayError(errorData);
    }

    /**
     * Get localized error message
     * @param {string} messageKey - Message key or custom message
     * @param {Object} params - Parameters for interpolation
     * @returns {string} - Localized message
     */
    getErrorMessage(messageKey, params = {}) {
        let message = ErrorMessages[messageKey] || messageKey;
        
        // Simple parameter interpolation
        Object.keys(params).forEach(key => {
            message = message.replace(`{${key}}`, params[key]);
        });
        
        return message;
    }

    /**
     * Display error to user
     * @param {Object} errorData - Error data object
     */
    displayError(errorData) {
        this.isShowingError = true;
        
        const { message, severity, callback } = errorData;
        
        this.errorContainer.innerHTML = `
            <div class="error-content ${severity}">
                <h2>${this.getSeverityTitle(severity)}</h2>
                <p>${message}</p>
                <div class="error-actions">
                    <button id="errorOkBtn" class="error-button primary">Entendido</button>
                    ${severity === ErrorSeverity.CRITICAL ? 
                        '<button id="errorReloadBtn" class="error-button secondary">Recargar Página</button>' : 
                        ''}
                </div>
            </div>
        `;
        
        this.errorContainer.style.display = 'flex';
        
        // Set up event listeners
        const okBtn = document.getElementById('errorOkBtn');
        const reloadBtn = document.getElementById('errorReloadBtn');
        
        okBtn.addEventListener('click', () => {
            this.hideError();
            if (callback) callback();
        });
        
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }
        
        // Auto-hide for info messages
        if (severity === ErrorSeverity.INFO) {
            setTimeout(() => {
                if (this.isShowingError) {
                    this.hideError();
                    if (callback) callback();
                }
            }, 3000);
        }
        
        // Log error for debugging
        console.error(`[${severity.toUpperCase()}] ${message}`);
    }

    /**
     * Hide current error and show next in queue
     */
    hideError() {
        this.errorContainer.style.display = 'none';
        this.isShowingError = false;
        
        // Show next error in queue
        if (this.errorQueue.length > 0) {
            const nextError = this.errorQueue.shift();
            setTimeout(() => this.displayError(nextError), 100);
        }
    }

    /**
     * Get severity title in Spanish
     * @param {string} severity - Error severity
     * @returns {string} - Spanish title
     */
    getSeverityTitle(severity) {
        const titles = {
            [ErrorSeverity.INFO]: 'Información',
            [ErrorSeverity.WARNING]: 'Advertencia',
            [ErrorSeverity.ERROR]: 'Error',
            [ErrorSeverity.CRITICAL]: 'Error Crítico'
        };
        return titles[severity] || 'Aviso';
    }

    /**
     * Show success message
     * @param {string} message - Success message key or custom message
     * @param {Object} params - Parameters for interpolation
     */
    showSuccess(message, params = {}) {
        this.showError(message, ErrorSeverity.INFO, params);
    }

    /**
     * Show warning message
     * @param {string} message - Warning message key or custom message
     * @param {Object} params - Parameters for interpolation
     */
    showWarning(message, params = {}) {
        this.showError(message, ErrorSeverity.WARNING, params);
    }

    /**
     * Clear all queued errors
     */
    clearQueue() {
        this.errorQueue = [];
    }

    /**
     * Check if error is currently being displayed
     * @returns {boolean} - True if error is showing
     */
    isDisplayingError() {
        return this.isShowingError;
    }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler();

/**
 * Set up global error handling
 */
export function setupGlobalErrorHandling() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);
        globalErrorHandler.showError('UNKNOWN_ERROR', ErrorSeverity.ERROR);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        globalErrorHandler.showError('UNKNOWN_ERROR', ErrorSeverity.ERROR);
        event.preventDefault();
    });

    // Handle offline/online events
    window.addEventListener('offline', () => {
        globalErrorHandler.showWarning('OFFLINE_MODE');
    });

    window.addEventListener('online', () => {
        globalErrorHandler.showSuccess('CONNECTION_RESTORED');
    });
}

/**
 * Utility function to format error messages with context
 * @param {string} baseMessage - Base error message
 * @param {Object} context - Additional context information
 * @returns {string} - Formatted error message
 */
export function formatErrorWithContext(baseMessage, context = {}) {
    let formattedMessage = baseMessage;
    
    if (context.level) {
        formattedMessage += ` (Nivel: ${context.level})`;
    }
    
    if (context.action) {
        formattedMessage += ` (Acción: ${context.action})`;
    }
    
    if (context.timestamp) {
        const time = new Date(context.timestamp).toLocaleTimeString('es-ES');
        formattedMessage += ` (Hora: ${time})`;
    }
    
    return formattedMessage;
}

/**
 * Create user-friendly error message from technical error
 * @param {Error} error - Technical error object
 * @returns {string} - User-friendly message key
 */
export function mapTechnicalError(error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('canvas')) {
        return 'CANVAS_NOT_SUPPORTED';
    }
    
    if (errorMessage.includes('audio')) {
        return 'AUDIO_NOT_SUPPORTED';
    }
    
    if (errorMessage.includes('localstorage') || errorMessage.includes('quota')) {
        return 'LOCALSTORAGE_FULL';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return 'RESOURCE_LOAD_FAILED';
    }
    
    if (errorMessage.includes('permission')) {
        return 'PERMISSION_DENIED';
    }
    
    return 'UNKNOWN_ERROR';
}