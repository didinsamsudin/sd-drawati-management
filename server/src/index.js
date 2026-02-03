/**
 * Express Server - Manajemen SD Drawati
 * Main entry point for backend API
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import fsPromises from 'fs/promises'
import archiver from 'archiver'

// Load Environment Variables
dotenv.config()

import { parseExcelFile } from './services/excelParser.js'
import {
    transformForFormStockOpname,
    transformForLaporanPersediaan,
    transformForBeritaAcara
} from './services/dataTransformer.js'
import {
    generateFormStockOpname,
    generateLaporanPersediaan
} from './services/excelGenerator.js'
import {
    generateBAStockOpname,
    generateBAST
} from './services/docxGenerator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Determine environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL

// Use /tmp for serverless environments, local folders for dev
const OUTPUT_DIR = isProduction ? '/tmp' : path.join(__dirname, '../outputs')
// Database also needs to be temp or persistent (in Vercel it will reset, but prevent crash)
const DATABASE_DIR = isProduction ? '/tmp' : path.join(__dirname, '../../database')

// Ensure output directory exists (Vercel /tmp always exists, but good practice)
if (!fs.existsSync(OUTPUT_DIR)) {
    try {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    } catch (e) {
        console.warn('Could not create output dir, assuming exists:', e)
    }
}

// Security Middleware
app.use(helmet())

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
    next()
})

// CORS
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
            cb(null, true)
        } else {
            cb(new Error('Invalid file type. Only .xlsx files are allowed.'))
        }
    }
})

// In-memory storage for parsed data (Session storage)
const sessions = new Map()

/**
 * POST /api/upload
 */
app.post(['/api/upload', '/upload'], upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

        console.log(`[UPLOAD] Received: ${req.file.originalname}`)
        const result = await parseExcelFile(req.file.buffer)
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        sessions.set(sessionId, {
            fileName: req.file.originalname,
            parsedData: result,
            uploadedAt: new Date().toISOString()
        })

        // Cleanup old sessions
        for (const [sid, session] of sessions.entries()) {
            if (Date.now() - new Date(session.uploadedAt).getTime() > 3600000) sessions.delete(sid)
        }

        res.json({
            success: true,
            sessionId,
            metadata: result.metadata,
            validation: result.validation,
            dataPreview: result.data  // Send ALL data for full verification
        })
    } catch (error) {
        console.error('[UPLOAD ERROR]', error)
        res.status(500).json({ error: 'Failed to parse file', message: error.message })
    }
})

/**
 * POST /api/transform
 */
app.post(['/api/transform', '/transform'], async (req, res) => {
    try {
        const { sessionId, saldoAwal = {} } = req.body
        if (!sessionId || !sessions.has(sessionId)) return res.status(400).json({ error: 'Invalid session' })

        const session = sessions.get(sessionId)
        const rawData = session.parsedData.data

        const formStock = transformForFormStockOpname(rawData, saldoAwal)
        const laporan = transformForLaporanPersediaan(rawData, saldoAwal)
        const ba = transformForBeritaAcara(rawData, saldoAwal)

        res.json({
            success: true,
            transformed: {
                formStockOpname: { rows: formStock.data.length, totals: formStock.totals },
                laporanPersediaan: { rows: laporan.data.length, totals: laporan.totals },
                beritaAcara: { rows: ba.data.length, totals: ba.totals }
            }
        })
    } catch (error) {
        console.error('[TRANSFORM ERROR]', error)
        res.status(500).json({ error: 'Transformation failed', message: error.message })
    }
})

/**
 * POST /api/generate
 * Generate all output files and zip them
 */
app.post(['/api/generate', '/generate'], async (req, res) => {
    try {
        const { sessionId, saldoAwal = {}, config = {} } = req.body
        if (!sessionId || !sessions.has(sessionId)) return res.status(400).json({ error: 'Invalid session' })

        const session = sessions.get(sessionId)
        console.log(`[GENERATE] Processing session ${sessionId}`)

        // 1. Transform Data
        const rawData = session.parsedData.data
        const dataFormStock = transformForFormStockOpname(rawData, saldoAwal)
        const dataLaporan = transformForLaporanPersediaan(rawData, saldoAwal)
        const dataBA = transformForBeritaAcara(rawData, saldoAwal)

        // 2. Generate Files (Buffers)
        // DOCX disabled temporarily to prevent 500 error due to missing templates
        const [bufferFormStock, bufferLaporan] = await Promise.all([
            generateFormStockOpname(dataFormStock.data, config),
            generateLaporanPersediaan(dataLaporan.data, config)
        ])

        // ===== ZERO HARDCODE: Dynamic year for filenames =====
        const tahun = config.tahunAnggaran || new Date().getFullYear()

        // 3. Save individual files
        const timestamp = Date.now()
        const files = {
            formStock: `FORM_STOCK_OPNAME_${tahun}_${timestamp}.xlsx`,
            laporanPersediaan: `LAPORAN_PERSEDIAAN_${tahun}_${timestamp}.xlsx`
        }

        await Promise.all([
            fsPromises.writeFile(path.join(OUTPUT_DIR, files.formStock), bufferFormStock),
            fsPromises.writeFile(path.join(OUTPUT_DIR, files.laporanPersediaan), bufferLaporan)
        ])

        // 4. Create ZIP
        const zipName = `Stock_Opname_${tahun}_${timestamp}.zip`
        const zipPath = path.join(OUTPUT_DIR, zipName)
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        archive.pipe(output)

        // Append files to zip with dynamic year
        archive.file(path.join(OUTPUT_DIR, files.formStock), { name: `FORM STOCK OPNAME ${tahun}.xlsx` })
        archive.file(path.join(OUTPUT_DIR, files.laporanPersediaan), { name: `LAPORAN PERSEDIAAN ${tahun}.xlsx` })

        await archive.finalize()

        // Wait for file to be written
        output.on('close', () => {
            console.log(`[GENERATE] ZIP created: ${zipName} (${archive.pointer()} bytes)`)
            res.json({
                success: true,
                message: 'Files generated successfully',
                downloadUrl: `/api/download/${zipName}`,
                fileName: zipName,
                files: {
                    formStock: `/api/download/${files.formStock}`,
                    laporanPersediaan: `/api/download/${files.laporanPersediaan}`,
                    baStock: `/api/download/${files.baStock}`,
                    bast: `/api/download/${files.bast}`
                }
            })
        })

        output.on('error', (err) => {
            throw err
        })

    } catch (error) {
        console.error('[GENERATE ERROR]', error)
        res.status(500).json({ error: 'Generation failed', message: error.message })
    }
})

/**
 * GET /api/download/:filename
 */
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename
    const filePath = path.join(OUTPUT_DIR, filename)

    // Basic security check to prevent directory traversal
    if (!filename.match(/^[a-zA-Z0-9_.-]+$/)) {
        return res.status(400).json({ error: 'Invalid filename' })
    }

    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('[DOWNLOAD ERROR]', err)
            }
        })
    } else {
        res.status(404).json({ error: 'File not found' })
    }
})

/**
 * GET /api/config
 */
app.get(['/api/config', '/config'], async (req, res) => {
    try {
        const configPath = path.join(DATABASE_DIR, 'config.json')
        let configData

        try {
            const fileContent = await fsPromises.readFile(configPath, 'utf-8')
            configData = JSON.parse(fileContent)
        } catch (e) {
            console.log('[CONFIG] File not found, using default')
            configData = {
                sekolah: { nama: 'SDN DRAWATI 04', alamat: 'Default Address' },
                pejabat: { kepala_sekolah: {}, pengurus_barang: {} }
            }
        }

        res.json(configData)
    } catch (error) {
        console.error('[CONFIG LOAD ERROR]', error)
        res.status(500).json({ error: 'Failed to load config' })
    }
})

/**
 * PUT /api/config
 */
app.put(['/api/config', '/config'], async (req, res) => {
    try {
        const configPath = path.join(DATABASE_DIR, 'config.json')
        await fsPromises.writeFile(configPath, JSON.stringify(req.body, null, 2))
        res.json({ success: true })
    } catch (error) {
        console.error('[CONFIG SAVE ERROR]', error)
        res.status(500).json({ error: 'Failed to save config' })
    }
})

/**
 * Health check
 */
app.get(['/api/health', '/health'], (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), activeSessions: sessions.size })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`)
    console.log(`📂 Output dir: ${OUTPUT_DIR}`)
})

export default app
