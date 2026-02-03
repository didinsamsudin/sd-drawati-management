/**
 * API Client
 * Axios wrapper for backend communication
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
})

/**
 * Upload and parse Excel file
 * @param {File} file
 * @returns {Promise} Response with sessionId and parsed data preview
 */
export async function uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    return response
}

/**
 * Transform data for preview
 * @param {string} sessionId
 * @param {Object} saldoAwal
 * @returns {Promise} Transformed data preview
 */
export async function transformData(sessionId, saldoAwal = {}) {
    const response = await api.post('/transform', {
        sessionId,
        saldoAwal,
    })

    return response
}

/**
 * Generate all output files
 * @param {string} sessionId
 * @param {Object} saldoAwal
 * @param {Object} config
 * @returns {Promise} Download URL for ZIP file
 */
export async function generateFiles(sessionId, saldoAwal = {}, config = {}) {
    const response = await api.post('/generate', {
        sessionId,
        saldoAwal,
        config,
    })

    return response
}

/**
 * Get school configuration
 * @returns {Promise} School config object
 */
export async function getConfig() {
    const response = await api.get('/config')
    return response
}

/**
 * Update school configuration
 * @param {Object} config
 * @returns {Promise} Update confirmation
 */
export async function updateConfig(config) {
    const response = await api.put('/config', config)
    return response
}

/**
 * Health check
 * @returns {Promise} Server health status
 */
export async function healthCheck() {
    const response = await api.get('/health')
    return response
}

export default api
