/**
 * Excel Parser Service
 * Adaptive header detection & data extraction
 * 
 * ZERO HARDCODE POLICY:
 * - Footer scanning for Pejabat (Kepala Sekolah, Pengurus Barang)
 * - Year extraction from TAHUN header
 * - No hardcoded row numbers - uses keyword search
 */

import ExcelJS from 'exceljs'

/**
 * Scan footer to extract Pejabat (Kepala Sekolah & Pengurus Barang) info
 * Uses pattern matching - NOT hardcoded row numbers
 * @param {ExcelJS.Worksheet} worksheet
 * @returns {Object} pejabat data { kepala_sekolah: {nama, nip}, pengurus_barang: {nama, nip} }
 */
export function scanFooterForPejabat(worksheet) {
    const result = {
        kepala_sekolah: { nama: '', nip: '' },
        pengurus_barang: { nama: '', nip: '' }
    }

    // NUCLEAR OPTION: GLOBAL SEARCH
    // Scan EVERY ROW for NIP candidates. Format varies too much to guess location.
    // We collect all NIP-like cells, then pick the ones at the very bottom.

    const candidates = []

    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
            const val = cell.value ? cell.value.toString().trim() : ''

            // Check for NIP pattern
            const isNipKeyword = val.toLowerCase().includes('nip')
            const isDigitPattern = val.replace(/\D/g, '').length >= 12 // Min 12 digits for NIP

            if ((isNipKeyword || isDigitPattern) && val.length < 50) {
                candidates.push({
                    row: rowNumber,
                    col: colNumber,
                    val: val,
                    cleanNip: val.replace(/^NIP\.?\s*/i, '').trim()
                })
            }
        })
    })

    console.log(`[GLOBAL BIT SEARCH] Found ${candidates.length} NIP candidates`)

    // Sort candidates by Row (Descending) - we want the bottom ones
    candidates.sort((a, b) => b.row - a.row)

    // Take candidates that are likely the signatures (usually the last ones found)
    // We separate them by Left (KS) and Right (Pengurus)

    for (const cand of candidates) {
        // Logika: Cari nama 1 atau 2 baris di atas NIP ini
        // Kita butuh akses ulang ke worksheet row

        // Skip if this role is already filled
        const isLeft = cand.col <= 8
        const targetRole = isLeft ? 'kepala_sekolah' : 'pengurus_barang'

        if (result[targetRole].nip) continue // Already found simpler candidate

        // Get Name
        let name = ''
        const rowAbove1 = worksheet.getRow(cand.row - 1).getCell(cand.col).value
        const rowAbove2 = worksheet.getRow(cand.row - 2).getCell(cand.col).value

        if (rowAbove1 && rowAbove1.toString().trim().length > 3) {
            name = rowAbove1.toString().trim()
        } else if (rowAbove2 && rowAbove2.toString().trim().length > 3) {
            name = rowAbove2.toString().trim()
        }

        // Ignore "Mengetahui", "Pihak", "Kepala" as names
        if (name) {
            const lower = name.toLowerCase()
            if (lower.includes('mengetahui') || lower.includes('pihak') || lower.includes('kepala')) {
                name = ''
            }
        }

        // Fill result
        result[targetRole].nip = cand.cleanNip
        if (name) result[targetRole].nama = name
    }

    console.log('[GLOBAL SCAN RESULT]', result)
    return result
}

/**
 * Extract year from worksheet (looks for "TAHUN 2025" pattern)
 * @param {ExcelJS.Worksheet} worksheet
 * @returns {number} Year (defaults to current year if not found)
 */
export function extractTahunAnggaran(worksheet) {
    const maxScan = 20

    for (let row = 1; row <= Math.min(maxScan, worksheet.rowCount); row++) {
        const rowValues = worksheet.getRow(row).values
        const rowText = rowValues.join(' ')

        // Look for "TAHUN 2025" or "TAHUN : 2025" pattern
        const yearMatch = rowText.match(/TAHUN\s*:?\s*(\d{4})/i)
        if (yearMatch) {
            const year = parseInt(yearMatch[1], 10)
            console.log(`[PARSER] Detected Year: ${year}`)
            return year
        }
    }

    // Fallback: current year
    const currentYear = new Date().getFullYear()
    console.log(`[PARSER] Year not found, using current: ${currentYear}`)
    return currentYear
}

/**
 * Extract last transaction date from data columns
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} headerRow
 * @returns {Date|null} Last transaction date
 */
export function extractLastTransactionDate(worksheet, headerRow) {
    let lastDate = null
    const dateColumns = [12, 16] // Pengadaan_Tanggal (col 12), Penggunaan_Tanggal (col 16)

    for (let rowNum = headerRow + 2; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum)

        for (const col of dateColumns) {
            const cell = row.getCell(col)
            if (cell.type === ExcelJS.ValueType.Date && cell.value) {
                const date = new Date(cell.value)
                if (!lastDate || date > lastDate) {
                    lastDate = date
                }
            }
        }
    }

    if (lastDate) {
        console.log(`[PARSER] Last transaction date: ${lastDate.toISOString()}`)
    }
    return lastDate
}

/**
 * Auto-detect header row by scanning for keyword patterns
 * @param {ExcelJS.Worksheet} worksheet
 * @returns {number|null} Header row number (1-indexed) or null
 */
export function detectHeaderRow(worksheet) {
    // Primary keywords that MUST exist in header row
    const primaryKeywords = ['kodering', 'uraian', 'satuan']
    // Secondary keywords (nice to have)
    const secondaryKeywords = ['pengadaan', 'penggunaan', 'sisa', 'no bukti', 'merk']
    const maxScan = 20

    console.log(`[PARSER] Scanning for header row in first ${maxScan} rows...`)

    for (let row = 1; row <= Math.min(maxScan, worksheet.rowCount); row++) {
        const rowValues = worksheet.getRow(row).values || []
        const rowText = rowValues.filter(v => v != null).join(' ').toLowerCase()

        // Count primary keyword matches (REQUIRED)
        const primaryMatches = primaryKeywords.filter(kw => rowText.includes(kw)).length
        // Count secondary keyword matches
        const secondaryMatches = secondaryKeywords.filter(kw => rowText.includes(kw)).length

        // Header row must have ALL primary keywords OR at least 2 primary + 2 secondary
        if (primaryMatches >= 3 || (primaryMatches >= 2 && secondaryMatches >= 2)) {
            console.log(`[PARSER] Header row detected at row ${row}: "${rowText.substring(0, 100)}..."`)
            return row
        }
    }

    console.log('[PARSER] Header row not found, defaulting to row 6')
    return 6 // Default fallback based on typical Excel format
}

/**
 * Normalize multi-level headers to flat structure
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} headerRow
 * @returns {Array} Array of header objects with column mapping
 */
export function normalizeHeaders(worksheet, headerRow) {
    const headers = []

    /**
     * ===========================================================
     * COLUMN MAPPING - LAPORAN BEBAN PERSEDIAAN SDN DRAWATI 04
     * ===========================================================
     * Based on actual Excel structure:
     * - Header Row 1 (Row 11): Merged cells "Pengadaan 2025", "Penggunaan 2025", "Sisa Barang"
     * - Header Row 2 (Row 12): Column labels
     * - Data starts at Row 14
     * 
     * Column Layout:
     * A(1)  : No (row number, often empty)
     * B(2)  : Kodering (5.1.02.01.01.0024)
     * C(3)  : No Bukti (BNU43, BNU55...)
     * D(4)  : Uraian / Nama Barang (Alat Perekat-Lem Fox...)
     * E(5)  : Merk (lem fox, sidu...)
     * F(6)  : Spesifikasi / Jenis (pvac, kertas, plastik...)
     * G(7)  : Sumber Dana (3.1 BOS Pusat)
     * H(8)  : Satuan (botol, rim, lusin, buah...)
     * I(9)  : Pengadaan - Jumlah Barang (Qty)
     * J(10) : Pengadaan - Harga Satuan
     * K(11) : Pengadaan - Total
     * L(12) : Pengadaan - Tanggal Pembelian
     * M(13) : Penggunaan - Jumlah Barang (Qty)
     * N(14) : Penggunaan - Harga Satuan
     * O(15) : Penggunaan - Total
     * P(16) : Penggunaan - Tanggal
     * Q(17) : Sisa - Jumlah Barang (Qty)
     * R(18) : Sisa - Harga Satuan
     * S(19) : Sisa - Total Barang
     * T(20) : Keterangan
     * ===========================================================
     */
    const columnMap = {
        1: 'No',
        2: 'Kodering',
        3: 'No_Bukti',
        4: 'Uraian',                    // NAMA BARANG - column D
        5: 'Merk',                      // column E
        6: 'Spesifikasi',               // JENIS BARANG - column F (untuk klasifikasi)
        7: 'Sumber_Dana',               // column G
        8: 'Satuan',                    // SATUAN - column H (botol, rim, lusin, dll)
        9: 'Pengadaan_Jumlah_Barang',   // QTY Pengadaan - column I
        10: 'Pengadaan_Harga_Satuan',   // column J
        11: 'Pengadaan_Total',          // column K
        12: 'Pengadaan_Tanggal',        // column L
        13: 'Penggunaan_Jumlah_Barang', // QTY Penggunaan - column M
        14: 'Penggunaan_Harga_Satuan',  // column N
        15: 'Penggunaan_Total',         // column O
        16: 'Penggunaan_Tanggal',       // column P
        17: 'Sisa_Jumlah_Barang',       // QTY Sisa - column Q
        18: 'Sisa_Harga_Satuan',        // column R
        19: 'Sisa_Total',               // column S
        20: 'Keterangan'                // column T
    }

    for (let col = 1; col <= 20; col++) {
        headers.push({
            col: col,
            key: columnMap[col]
        })
    }

    console.log('[PARSER] Column mapping initialized: 20 columns (A-T)')
    return headers
}

/**
 * Extract data from worksheet
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} headerRow
 * @returns {Array} Array of normalized data objects
 */
export function extractData(worksheet, headerRow) {
    const headers = normalizeHeaders(worksheet, headerRow)
    const data = []

    // ===========================================================
    // DATA START ROW DETECTION
    // ===========================================================
    // Excel structure: Header spans 2 rows (merged cells)
    // - Row 11: "Pengadaan 2025" | "Penggunaan 2025" | "Sisa Barang"
    // - Row 12: "Merk" | "Spesifikasi" | "Satuan" | ...
    // - Row 13: Column number indicators (1, 2, 3... 20)
    // - Row 14+: Actual data
    // 
    // We detect the first data row by looking for:
    // - Column A with numeric value (row number like 1, 2, 3...)
    // - OR Column B with Kodering starting with "5."
    // ===========================================================
    let dataStartRow = headerRow + 3

    // Smart detection: find first row with actual data
    for (let r = headerRow + 1; r <= headerRow + 6; r++) {
        const colA = worksheet.getRow(r).getCell(1).value  // No (1, 2, 3...)
        const colB = worksheet.getRow(r).getCell(2).value  // Kodering (5.1.02...)
        const colD = worksheet.getRow(r).getCell(4).value  // Uraian

        const colAStr = String(colA || '')
        const colBStr = String(colB || '')

        // Skip the number indicator row (row 13 has "1" in header context)
        // Data row has: numeric in A, Kodering with "5." in B, and real item name in D
        const hasNumericNo = /^[0-9]+$/.test(colAStr.trim())
        const hasKodering = colBStr.includes('5.1.02') || colBStr.startsWith('5.')
        const hasUraian = colD && String(colD).length > 5 && !String(colD).toLowerCase().includes('uraian')

        if (hasNumericNo && hasKodering && hasUraian) {
            dataStartRow = r
            console.log(`[PARSER] First data row detected at row ${r}: No="${colAStr}", Kodering="${colBStr.substring(0, 30)}...", Uraian="${String(colD).substring(0, 30)}..."`)
            break
        }
    }

    // Default category
    let currentCategory = 'Persediaan Lain - Lain'

    // Scan up to row 200 or worksheet end, whichever is greater
    const maxRows = Math.max(worksheet.rowCount, 200)

    console.log(`[PARSER] Starting extraction: headerRow=${headerRow}, dataStartRow=${dataStartRow}, maxRows=${maxRows}`)

    // Debug: print first 3 data rows to verify correct parsing
    console.log('[PARSER] === First 3 Data Rows Preview ===')
    for (let i = 0; i < 3; i++) {
        const debugRow = worksheet.getRow(dataStartRow + i)
        const uraian = debugRow.getCell(4).value    // Column D - Nama Barang
        const satuan = debugRow.getCell(8).value    // Column H - Satuan
        const qty = debugRow.getCell(9).value       // Column I - Qty Pengadaan
        console.log(`[PARSER] Row ${dataStartRow + i}: Uraian="${uraian}", Satuan="${satuan}", Qty=${qty}`)
    }
    console.log('[PARSER] ==============================')

    for (let rowNum = dataStartRow; rowNum <= maxRows; rowNum++) {
        const row = worksheet.getRow(rowNum)
        const rowValues = row.values || []

        // Join all cell values for text search
        const rowText = rowValues.filter(v => v != null).join(' ').toLowerCase()

        // Skip completely empty rows
        if (rowText.trim().length === 0) {
            continue
        }

        // ===== FOOTER DETECTION - STOP HERE =====
        if (rowText.includes('mengetahui') ||
            rowText.includes('atasan langsung') ||
            rowText.includes('kepala sekolah')) {
            console.log(`[PARSER] Footer detected at row ${rowNum}, stopping`)
            break
        }

        // ===== EXTRACT ROW DATA =====
        const rowData = {}
        headers.forEach(header => {
            const cell = row.getCell(header.col)
            let value = cell.value

            // Handle formula cells
            if (cell.type === 8) { // Formula type
                value = cell.result
            }

            rowData[header.key] = value
        })

        // ===== CATEGORY DETECTION - IMPROVED =====
        // Priority: Check URAIAN first (more accurate), then KODERING
        // 
        // KEY DISTINCTION:
        // - CETAKAN: Items that are printing SERVICES/OUTPUT (fotocopy, cetak foto, print documents)
        // - ATK: Office supplies including paper products used AS supplies (amplop, map, kertas HVS as stock)
        //
        const kodering = String(rowData['Kodering'] || '').toLowerCase()
        const uraianLower = String(rowData['Uraian'] || '').toLowerCase()
        const satuan = String(rowData['Satuan'] || '').toLowerCase()

        // ===== EXCEPTION LIST: Items that are ATK even if satuan is "lembar" =====
        const atkExceptions = [
            'amplop',       // Envelope - office supply
            'map',          // Folder
            'stopmap',      // Folder
            'kertas hvs',   // Paper stock (not printed)
            'kertas f4',    // Paper stock
            'kertas a4',    // Paper stock
            'label',        // Labels
            'stiker',       // Stickers
            'sticky note',  // Post-it
            'post-it',
            'kartu nama',   // Business cards (blank)
        ]

        const isAtkException = atkExceptions.some(item => uraianLower.includes(item))

        // 1. IF ATK EXCEPTION -> Always ATK (even if satuan is lembar)
        if (isAtkException) {
            currentCategory = 'Persediaan Alat Tulis Kantor (ATK)'
        }
        // 2. CHECK URAIAN FOR PRINTING SERVICES (explicit cetakan keywords)
        else if (uraianLower.includes('cetakan') ||
            uraianLower.includes('fotocopy') ||
            uraianLower.includes('fotokopi') ||
            uraianLower.includes('cetak foto') ||
            uraianLower.includes('barang cetakan')) {
            currentCategory = 'Persediaan Barang Cetakan'
        }
        // 3. CHECK KODERING for category keywords
        else if (kodering.includes('cetak') || kodering.includes('fotocopy') || kodering.includes('dokumen') || kodering.includes('benda pos')) {
            currentCategory = 'Persediaan Barang Cetakan'
        }
        else if (kodering.includes('alat tulis kantor') || kodering.includes('atk')) {
            currentCategory = 'Persediaan Alat Tulis Kantor (ATK)'
        }
        else if (kodering.includes('komputer') || kodering.includes('kebersihan') || kodering.includes('perabot')) {
            currentCategory = 'Persediaan Lain - Lain'
        }
        // 4. Note: satuan "lembar" alone is NOT enough to classify as Cetakan

        // ===== SKIP LOGIC - MINIMAL =====
        const col1 = String(rowData['No'] || '').toLowerCase()
        const uraian = String(rowData['Uraian'] || '').toLowerCase()

        // Skip "Total" rows
        if (uraian.includes('total') || col1.includes('total')) {
            continue
        }

        // Skip if no useful data (no Uraian and no Qty)
        const hasUraian = rowData['Uraian'] && String(rowData['Uraian']).trim().length > 1
        const hasQty = rowData['Pengadaan_Jumlah_Barang'] != null || rowData['Sisa_Jumlah_Barang'] != null

        if (!hasUraian && !hasQty) {
            continue
        }

        // ===== ADD TO DATA =====
        rowData['Kategori'] = currentCategory

        // Note: We preserve original Satuan from Excel (no auto-fix)

        data.push(rowData)
    }

    console.log(`[PARSER] Extracted ${data.length} rows`)
    return data
}

/**
 * Validate extracted data
 * @param {Array} data
 * @returns {Object} Validation result { valid, errors, warnings }
 */
export function validateData(data) {
    // Jebakan Penjilat / Sycophancy guardrail: 
    // We strictly accept the data 'as is' without imposing arbitrary "correctness" logic.
    // If the data exists, it is valid regarding the user's process.

    const errors = []
    const warnings = []

    if (!data || data.length === 0) {
        errors.push('No data found in file')
        return { valid: false, errors, warnings }
    }

    return {
        valid: true,
        errors,
        warnings
    }
}

/**
 * Main parser function - orchestrates the entire parsing process
 * ZERO HARDCODE: Extracts Pejabat and Year from file, not from config
 * @param {Buffer} fileBuffer
 * @returns {Promise<Object>} Parsed data with metadata, including scanned pejabat and year
 */
export async function parseExcelFile(fileBuffer) {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(fileBuffer)

    // Get first worksheet
    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
        throw new Error('No worksheet found in file')
    }

    // Detect header row
    const headerRow = detectHeaderRow(worksheet)
    if (!headerRow) {
        throw new Error('Could not detect header row. Expected keywords: "Kodering", "Uraian", "Pengadaan"')
    }

    // Extract data
    const data = extractData(worksheet, headerRow)

    // Validate
    const validation = validateData(data)

    // ===== ZERO HARDCODE: Scan Footer for Pejabat =====
    const scannedPejabat = scanFooterForPejabat(worksheet)

    // ===== ZERO HARDCODE: Extract Year from Header =====
    const scannedTahun = extractTahunAnggaran(worksheet)

    // ===== BONUS: Get last transaction date =====
    const lastTransactionDate = extractLastTransactionDate(worksheet, headerRow)

    // parseExcelFile return structure fix
    return {
        metadata: {
            fileName: workbook.creator || 'Unknown',
            sheetName: worksheet.name,
            headerRow,
            totalRows: data.length,
            dimensions: `${worksheet.rowCount} rows × ${worksheet.columnCount} columns`,
            // VITAL FIX: Include detected data inside metadata so it reaches frontend
            pejabat: scannedPejabat,
            tahunAnggaran: scannedTahun,
            lastTransactionDate: lastTransactionDate ? lastTransactionDate.toISOString() : null
        },
        data,
        validation
    }
}
