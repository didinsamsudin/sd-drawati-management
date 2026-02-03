/**
 * DOCX Generator Service
 * Generate DOCX output files using docxtemplater and real templates
 */

import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { formatTanggalTerbilang, formatTanggalSingkat, getBulanTahun, HARI, BULAN, angkaTerbilang } from '../utils/dateFormatter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATE_DIR = path.join(__dirname, '../../templates')

// Ensure template directory exists
if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true })
}

/**
 * Load template and render data
 * @param {string} templateName - Filename like 'ba_template.docx'
 * @param {Object} data - Data to inject
 * @returns {Buffer} Generated docx buffer
 */
function renderTemplate(templateName, data) {
    const templatePath = path.join(TEMPLATE_DIR, templateName)

    // Checking if template exists
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templateName}. Please upload template to server/src/templates/`)
    }

    const content = fs.readFileSync(templatePath, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    })

    doc.render(data)
    return doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    })
}

/**
 * Generate BA STOCK OPNAME
 * ZERO HARDCODE: Uses config.tanggalLaporan
 */
export async function generateBAStockOpname(data, config) {
    // ===== ZERO HARDCODE: Use config date or fallback =====
    const tanggal = config.tanggalLaporan ? new Date(config.tanggalLaporan) : new Date()
    const tahun = config.tahunAnggaran || tanggal.getFullYear()

    // Prepare data for template
    const templateData = {
        nomor_surat: `${config.nomor_surat?.prefix_ba || '421.2/078/BA'}/XII/${tahun}`,
        tanggal_terbilang: formatTanggalTerbilang(tanggal),
        tanggal_singkat: formatTanggalSingkat(tanggal),
        bulan_tahun: getBulanTahun(tanggal),
        tahun: tahun,

        // SMART DATE VARIABLES (Terbilang) - Uses dynamic date
        HARI: HARI[tanggal.getDay()],
        TANGGAL_TEKS: angkaTerbilang(tanggal.getDate()),
        BULAN_TEKS: BULAN[tanggal.getMonth()],
        TAHUN_TEKS: angkaTerbilang(tahun),

        // Sekolah Info (with optional chaining for safety)
        sekolah_nama: config.sekolah?.nama || 'SDN',
        sekolah_alamat: config.sekolah?.alamat || '-',
        sekolah_kabupaten: config.sekolah?.kabupaten || 'Kabupaten',

        // Pejabat Info (Uses scanned data or fallback)
        ks_nama: config.pejabat?.kepala_sekolah?.nama || 'Kepala Sekolah',
        ks_nip: config.pejabat?.kepala_sekolah?.nip || '-',
        pb_nama: config.pejabat?.pengurus_barang?.nama || 'Pengurus Barang',
        pb_nip: config.pejabat?.pengurus_barang?.nip || '-',

        // Table Data
        barang: data.data.map((item, idx) => ({
            no: idx + 1,
            nama_barang: item.nama_barang,
            spesifikasi: item.spesifikasi || '-',
            jumlah: item.jumlah,
            satuan: item.satuan,
            jumlah: item.jumlah,
            satuan: item.satuan,
            nilai_total: item.nilai_total.toLocaleString('id-ID'), // Ensure Indonesian format
        })),

        total_nilai: data.totals.total_nilai.toLocaleString('id-ID')
    }

    try {
        if (!fs.existsSync(path.join(TEMPLATE_DIR, 'ba_stock_opname_template.docx'))) {
            console.warn('[DOCX WARNING] Template BA Stock Opname not found. Skipping DOCX generation.')
            return Buffer.from('Template DOCX tidak ditemukan. Silakan upload template ke server.', 'utf-8')
        }
        return renderTemplate('ba_stock_opname_template.docx', templateData)
    } catch (error) {
        console.error('Template rendering failed:', error)
        return Buffer.from(`Error generating DOCX: ${error.message}`, 'utf-8')
    }
}

/**
 * Generate BAST
 * ZERO HARDCODE: Uses config.tanggalLaporan and config.pejabat (scanned or from config)
 */
export async function generateBAST(data, config) {
    // ===== ZERO HARDCODE: Use config date or fallback =====
    const tanggal = config.tanggalLaporan ? new Date(config.tanggalLaporan) : new Date()
    const tahun = config.tahunAnggaran || tanggal.getFullYear()

    const templateData = {
        nomor_surat: `${config.nomor_surat?.prefix_bast || '421.2/078/BAST'}/XII/${tahun}`,
        tanggal_terbilang: formatTanggalTerbilang(tanggal),
        tanggal_singkat: formatTanggalSingkat(tanggal),
        tahun: tahun,

        // SMART DATE VARIABLES (Terbilang) - Uses dynamic date
        HARI: HARI[tanggal.getDay()],
        TANGGAL_TEKS: angkaTerbilang(tanggal.getDate()),
        BULAN_TEKS: BULAN[tanggal.getMonth()],
        TAHUN_TEKS: angkaTerbilang(tahun),

        // Sekolah Info
        sekolah_nama: config.sekolah?.nama || 'SDN',
        sekolah_kabupaten: config.sekolah?.kabupaten || 'Kabupaten',

        // Pejabat Info (Smart Mapping) - Uses scanned or config data
        // Pihak 1: Yang Menyerahkan (Kepala Sekolah)
        pihak1_nama: config.pejabat?.kepala_sekolah?.nama || 'Kepala Sekolah',
        pihak1_nip: config.pejabat?.kepala_sekolah?.nip || '-',

        // Pihak 2: Yang Menerima (Pengurus Barang)
        pihak2_nama: config.pejabat?.pengurus_barang?.nama || 'Pengurus Barang',
        pihak2_nip: config.pejabat?.pengurus_barang?.nip || '-',

        // Table Data
        barang: data.data.map((item, idx) => ({
            no: idx + 1,
            nama_barang: item.nama_barang,
            spesifikasi: item.spesifikasi || '-',
            jumlah: item.jumlah,
            satuan: item.satuan,
        }))
    }

    try {
        if (!fs.existsSync(path.join(TEMPLATE_DIR, 'bast_template.docx'))) {
            console.warn('[DOCX WARNING] Template BAST not found. Skipping DOCX generation.')
            return Buffer.from('Template DOCX tidak ditemukan. Silakan upload template ke server.', 'utf-8')
        }
        return renderTemplate('bast_template.docx', templateData)
    } catch (error) {
        console.error('Template rendering failed:', error)
        return Buffer.from(`Error generating DOCX: ${error.message}`, 'utf-8')
    }
}
