// errorCapture.js - Captura TODOS los errores de JavaScript y los envía al backend
// Este archivo captura: errores no manejados, promesas rechazadas, console.error

class ErrorCapture {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.setupGlobalErrorHandlers();
        this.setupConsoleInterceptor();
        this.setupFetchInterceptor();
        this.setupRouterInterceptor();
    }

    generateSessionId() {
        return 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    }

    getUsuario() {
        try {
            const user = localStorage.getItem('user');
            if (user) {
                const userData = JSON.parse(user);
                return {
                    id: userData.id,
                    identificacion: userData.identificacion,
                    nombre: `${userData.first_name} ${userData.last_name}`
                };
            }
        } catch (e) {}
        return null;
    }

    getIP() {
        // Intentar obtener IP de APIs externas (opcional, silencioso)
        return '-';
    }

    async sendToBackend(level, component, action, message, data = null) {
        try {
            const token = localStorage.getItem('token');
            const usuario = this.getUsuario();
            
            const payload = {
                level: level,
                component: component,
                action: action,
                message: message,
                data: {
                    ...data,
                    sessionId: this.sessionId,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    screenSize: `${window.innerWidth}x${window.innerHeight}`,
                    timestamp: new Date().toISOString()
                }
            };
            
            if (usuario) {
                payload.data.usuario = usuario;
            }

            // Enviar al backend (sin esperar respuesta)
            fetch('/api/logs/frontend/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Token ${token}` })
                },
                body: JSON.stringify(payload)
            }).catch(() => {
                // Fallo silencioso - no hacer nada
            });
        } catch (e) {
            // Silencio total
        }
    }

    setupGlobalErrorHandlers() {
        // Capturar errores no manejados (window.onerror)
        const self = this;
        
        window.addEventListener('error', (event) => {
            self.sendToBackend(
                'ERROR',
                'ERROR_CAPTURE',
                'UNCAUGHT_ERROR',
                event.message || 'Unknown error',
                {
                    type: 'uncaught_error',
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                }
            );
        });

        // Capturar promesas rechazadas no manejadas
        window.addEventListener('unhandledrejection', (event) => {
            self.sendToBackend(
                'ERROR',
                'ERROR_CAPTURE',
                'UNHANDLED_REJECTION',
                event.reason?.message || 'Unknown promise rejection',
                {
                    type: 'unhandled_rejection',
                    stack: event.reason?.stack,
                    reason: event.reason
                }
            );
        });
    }

    setupConsoleInterceptor() {
        // Interceptar console.error
        const originalConsoleError = console.error;
        const self = this;
        
        console.error = function(...args) {
            const message = args.map(arg => {
                if (arg instanceof Error) return arg.message;
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            
            self.sendToBackend(
                'ERROR',
                'ERROR_CAPTURE',
                'CONSOLE_ERROR',
                message,
                {
                    type: 'console_error',
                    args: args.map(a => String(a)).join(', ')
                }
            );
            
            // Llamar al console.error original
            originalConsoleError.apply(console, args);
        };
    }

    setupFetchInterceptor() {
        // Interceptar errores de fetch
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = function(...args) {
            return originalFetch.apply(this, args).catch((error) => {
                self.sendToBackend(
                    'ERROR',
                    'ERROR_CAPTURE',
                    'FETCH_ERROR',
                    error.message,
                    {
                        type: 'fetch_error',
                        url: args[0],
                        options: args[1]
                    }
                );
                throw error;
            });
        };
    }

    setupRouterInterceptor() {
        // Capturar navegación (cambios de ruta)
        const self = this;
        
        // Para React Router, interceptar el history
        if (window.history && window.history.pushState) {
            const originalPushState = window.history.pushState;
            const originalReplaceState = window.history.replaceState;
            
            window.history.pushState = function(...args) {
                const result = originalPushState.apply(this, args);
                self.sendToBackend(
                    'INFO',
                    'NAVEGACION',
                    'ROUTE_CHANGE',
                    `Navegó a: ${window.location.pathname}`,
                    {
                        type: 'push_state',
                        from: args[2]?.pathname,
                        to: window.location.pathname
                    }
                );
                return result;
            };
            
            window.history.replaceState = function(...args) {
                const result = originalReplaceState.apply(this, args);
                self.sendToBackend(
                    'INFO',
                    'NAVEGACION',
                    'ROUTE_CHANGE',
                    `Navegó a: ${window.location.pathname}`,
                    {
                        type: 'replace_state',
                        to: window.location.pathname
                    }
                );
                return result;
            };
        }
    }

    // Método para capturar acciones manuales desde componentes
    logAction(component, action, message, data = null) {
        this.sendToBackend('INFO', component, action, message, data);
    }

    logError(component, action, message, data = null) {
        this.sendToBackend('ERROR', component, action, message, data);
    }

    logWarning(component, action, message, data = null) {
        this.sendToBackend('WARNING', component, action, message, data);
    }
}

// Inicializar automáticamente
const errorCapture = new ErrorCapture();

// Exportar para usar en componentes (opcional)
export default errorCapture;