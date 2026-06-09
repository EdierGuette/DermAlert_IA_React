// services/api.js - Conexión con el backend Django
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Obtener token de autenticación
const getToken = () => localStorage.getItem('token');

// Headers por defecto
const getHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Token ${token}` })
    };
};

// ============ AUTH ENDPOINTS ============
export const authAPI = {
    // Registro de usuario
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return response.json();
    },

    // Login
    login: async (credentials) => {
        const response = await fetch(`${API_BASE_URL}/api/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return response.json();
    },

    // Logout
    logout: async () => {
        const response = await fetch(`${API_BASE_URL}/api/logout/`, {
            method: 'POST',
            headers: getHeaders()
        });
        return response.json();
    },

    // Verificar contraseña (para acciones protegidas)
    verifyPassword: async (password) => {
        const response = await fetch(`${API_BASE_URL}/api/verify-password/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ password })
        });
        return response.json();
    }
};

// ============ DIAGNÓSTICO ENDPOINTS ============
export const diagnosticoAPI = {
    // Predecir imagen (análisis IA)
    predict: async (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${API_BASE_URL}/api/predict/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${getToken()}`
            },
            body: formData
        });
        return response.json();
    },

    // Obtener todos los diagnósticos del usuario
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/api/diagnosticos/`, {
            headers: getHeaders()
        });
        return response.json();
    },

    // Obtener diagnóstico por ID
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/diagnosticos/${id}/`, {
            headers: getHeaders()
        });
        return response.json();
    },

    // Eliminar diagnóstico
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/diagnosticos/${id}/delete/`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return response.json();
    },

    // Buscar diagnósticos
    search: async (type, value) => {
        const response = await fetch(`${API_BASE_URL}/api/search-diagnosticos/?type=${type}&value=${value}`, {
            headers: getHeaders()
        });
        return response.json();
    }
};

// ============ LANDING PAGE ENDPOINTS (públicos) ============
export const landingAPI = {
    // Enviar mensaje de contacto
    enviarContacto: async (data) => {
        const response = await fetch(`${API_BASE_URL}/api/enviar-contacto/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Obtener estadísticas públicas
    getEstadisticas: async () => {
        const response = await fetch(`${API_BASE_URL}/api/estadisticas/`);
        return response.json();
    }
};

export default {
    authAPI,
    diagnosticoAPI,
    landingAPI
};