// services/config.js - Configuración global de la aplicación
import errorCapture from './errorCapture';

// Variable para almacenar la configuración en memoria
let appConfig = null;
let configLoaded = false;
let pendingPromises = [];

/**
 * Carga la configuración desde el backend
 * Solo se carga una vez y se cachea en memoria
 */
export async function loadConfig() {
    // Si ya está cargada, devolver la configuración cacheada
    if (appConfig !== null) {
        errorCapture.logAction('Config', 'CONFIG_LOADED', 'Configuración desde caché', {
            project_name: appConfig.PROJECT_NAME,
            version: appConfig.APP_VERSION
        });
        return appConfig;
    }

    // Si ya se está cargando, esperar a que termine
    if (configLoaded === false && pendingPromises.length > 0) {
        errorCapture.logAction('Config', 'CONFIG_LOADING_WAIT', 'Esperando carga de configuración en curso');
        return new Promise((resolve) => {
            pendingPromises.push(resolve);
        });
    }

    configLoaded = false;
    errorCapture.logAction('Config', 'CONFIG_FETCH_START', 'Iniciando carga de configuración desde backend');
    
    try {
        const response = await fetch('/api/config/');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Validar que la configuración tenga los campos necesarios
        appConfig = {
            PROJECT_NAME: config.PROJECT_NAME || 'DermAlert IA',
            LOGO_ICON: config.LOGO_ICON || 'medical-outline',
            APP_VERSION: config.APP_VERSION || '1.0.0',
            status: config.status || 'ok'
        };
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('appConfig', JSON.stringify(appConfig));
        
        errorCapture.logAction('Config', 'CONFIG_FETCH_SUCCESS', 'Configuración cargada exitosamente', {
            project_name: appConfig.PROJECT_NAME,
            logo_icon: appConfig.LOGO_ICON,
            app_version: appConfig.APP_VERSION,
            status: appConfig.status
        });
        
        // Resolver todas las promesas pendientes
        pendingPromises.forEach(resolve => resolve(appConfig));
        pendingPromises = [];
        
        return appConfig;
        
    } catch (error) {
        errorCapture.logError('Config', 'CONFIG_FETCH_ERROR', 'Error cargando configuración', {
            error_message: error.message,
            error_stack: error.stack
        });
        
        // Intentar cargar desde localStorage como fallback
        const cachedConfig = localStorage.getItem('appConfig');
        if (cachedConfig) {
            try {
                appConfig = JSON.parse(cachedConfig);
                errorCapture.logWarning('Config', 'CONFIG_CACHE_FALLBACK', 'Usando configuración cacheada desde localStorage', {
                    project_name: appConfig.PROJECT_NAME,
                    version: appConfig.APP_VERSION
                });
                return appConfig;
            } catch (e) {
                errorCapture.logError('Config', 'CONFIG_CACHE_PARSE_ERROR', 'Error parseando configuración cacheada', {
                    error: e.message
                });
            }
        }
        
        // Valores por defecto si todo falla
        appConfig = {
            PROJECT_NAME: 'DermAlert IA',
            LOGO_ICON: 'medical-outline',
            APP_VERSION: '1.0.0',
            status: 'error'
        };
        
        errorCapture.logWarning('Config', 'CONFIG_DEFAULT_FALLBACK', 'Usando valores por defecto para configuración', {
            project_name: appConfig.PROJECT_NAME,
            version: appConfig.APP_VERSION
        });
        
        pendingPromises.forEach(resolve => resolve(appConfig));
        pendingPromises = [];
        
        return appConfig;
    } finally {
        configLoaded = true;
    }
}

/**
 * Obtiene la configuración (cargada o en caché)
 * Si no está cargada, la carga automáticamente
 */
export async function getConfig() {
    if (appConfig !== null) {
        return appConfig;
    }
    return await loadConfig();
}

/**
 * Obtiene el nombre del proyecto
 */
export async function getProjectName() {
    const config = await getConfig();
    return config.PROJECT_NAME;
}

/**
 * Obtiene el icono del proyecto
 */
export async function getLogoIcon() {
    const config = await getConfig();
    return config.LOGO_ICON;
}

/**
 * Obtiene la versión del proyecto
 */
export async function getAppVersion() {
    const config = await getConfig();
    return config.APP_VERSION;
}

/**
 * Obtiene la configuración de forma síncrona (si ya está cargada)
 * Útil para usar en componentes que ya saben que la configuración está lista
 */
export function getConfigSync() {
    if (appConfig === null) {
        // Intentar cargar desde localStorage
        const cached = localStorage.getItem('appConfig');
        if (cached) {
            try {
                appConfig = JSON.parse(cached);
                errorCapture.logAction('Config', 'CONFIG_SYNC_LOAD', 'Configuración cargada síncronamente desde localStorage');
            } catch (e) {
                errorCapture.logError('Config', 'CONFIG_SYNC_PARSE_ERROR', 'Error parseando configuración síncrona', {
                    error: e.message
                });
            }
        }
    }
    return appConfig || {
        PROJECT_NAME: 'DermAlert IA',
        LOGO_ICON: 'medical-outline',
        APP_VERSION: '1.0.0'
    };
}

/**
 * Obtiene el nombre del proyecto de forma síncrona
 */
export function getProjectNameSync() {
    return getConfigSync().PROJECT_NAME;
}

/**
 * Obtiene la versión del proyecto de forma síncrona
 */
export function getAppVersionSync() {
    return getConfigSync().APP_VERSION;
}

/**
 * Obtiene el icono del proyecto de forma síncrona
 */
export function getLogoIconSync() {
    return getConfigSync().LOGO_ICON;
}

// Exportar un objeto con todo para conveniencia
const config = {
    loadConfig,
    getConfig,
    getProjectName,
    getLogoIcon,
    getAppVersion,
    getConfigSync,
    getProjectNameSync,
    getAppVersionSync,
    getLogoIconSync
};

export default config;