/**
 * Excel Generator Service
 * Generate Excel output files using exceljs
 */

import ExcelJS from 'exceljs'

/**
 * Add school header (kop surat) to worksheet
 */
function addKopSurat(worksheet, sekolah) {
    // Merge cells for header
    worksheet.mergeCells('A1:P1')
    worksheet.getCell('A1').value = sekolah.nama
    worksheet.getCell('A1').font = { bold: true, size: 14 }
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:P2')
    worksheet.getCell('A2').value = sekolah.alamat
    worksheet.getCell('A2').font = { size: 10 }
    worksheet.getCell('A2').alignment = { horizontal: 'center' }

    worksheet.mergeCells('A3:P3')
    worksheet.getCell('A3').value = `NSS: ${sekolah.nss || '-'} | NPSN: ${sekolah.npsn || '-'}`
    worksheet.getCell('A3').font = { size: 9 }
    worksheet.getCell('A3').alignment = { horizontal: 'center' }

    // Email Row
    worksheet.mergeCells('A4:P4')
    worksheet.getCell('A4').value = `Email : ${sekolah.email || '-'}`
    worksheet.getCell('A4').font = { size: 9 }
    worksheet.getCell('A4').alignment = { horizontal: 'center' }

    // Empty row
    worksheet.getRow(5).height = 5
}

// ... (existing code for dates)

// ... (existing code for FormStockOpname)

/**
 * Generate LAPORAN PERSEDIAAN
 * ZERO HARDCODE: Uses config.tanggalLaporan
 */
export async function generateLaporanPersediaan(filteredData, config) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    // ===== ZERO HARDCODE: Dynamic date =====
    const tanggalFormatted = formatTanggalIndonesia(config.tanggalLaporan)

    // Kop surat (rows 1-4)
    addKopSurat(worksheet, config.sekolah)

    // Title (Shifted down by 1 due to Email row)
    worksheet.mergeCells('A6:G6')
    const titleCell = worksheet.getCell('A6')
    titleCell.value = 'LAPORAN PERSEDIAAN'
    titleCell.font = { bold: true, size: 14 }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A7:G7')
    // ===== ZERO HARDCODE: Dynamic date =====
    worksheet.getCell('A7').value = `Per ${tanggalFormatted}`
    worksheet.getCell('A7').font = { bold: true, size: 11 }
    worksheet.getCell('A7').alignment = { horizontal: 'center' }

    // Info rows
    worksheet.getCell('A9').value = 'Nama Sekolah'
    worksheet.getCell('B9').value = ': ' + config.sekolah.nama
    worksheet.getCell('A10').value = 'Alamat'
    worksheet.getCell('B10').value = ': ' + config.sekolah.alamat
    worksheet.getCell('A11').value = 'NSS/NPSN'
    worksheet.getCell('B11').value = `: ${config.sekolah.nss || '-'} / ${config.sekolah.npsn || '-'}`

    // Empty rows
    worksheet.getRow(12).height = 5
    worksheet.getRow(13).height = 5
    worksheet.getRow(14).height = 5

    // Headers (row 15)
    const headers = [
        'No',
        'Nama Barang',
        'Spesifikasi',
        'Jumlah',
        'Harga Satuan (Rp)',
        'Nilai Total Persediaan (Rp)',
        'Keterangan'
    ]

    headers.forEach((header, idx) => {
        const cell = worksheet.getCell(15, idx + 1)
        cell.value = header
        cell.font = { bold: true, size: 10 }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD0D0D0' }
        }
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        }
    })

    // Data rows (start from row 16)
    // Reset counters (variables declared above)
    let rowNum = 16
    let totalNilai = 0

    // ... (Aggregation logic remains same, just rowNum started at 16)
    // Need to update the rest of the function to use local rowNum logic properly
    // ...

    // RE-INSERT Aggregation Logic to ensure rowNum sync
    const aggregatedMap = new Map()

    filteredData.forEach(item => {
        const nama = (item.nama_barang || '').trim()
        const spec = (item.spesifikasi || '').trim()
        const harga = Number(item.harga_satuan) || 0
        const key = `${nama.toLowerCase()}|${spec.toLowerCase()}|${harga}`

        if (!aggregatedMap.has(key)) {
            aggregatedMap.set(key, {
                nama_barang: nama,
                spesifikasi: spec,
                jumlah: 0,
                harga_satuan: harga,
                nilai_total: 0
            })
        }

        const existing = aggregatedMap.get(key)
        existing.jumlah += (Number(item.jumlah) || Number(item.pengadaan?.jumlah) || 0)
        existing.nilai_total += (Number(item.nilai_total) || Number(item.pengadaan?.total) || 0)
    })

    const aggregatedSortedData = Array.from(aggregatedMap.values()).sort((a, b) => {
        return a.nama_barang.localeCompare(b.nama_barang)
    })

    aggregatedSortedData.forEach((item, idx) => {
        const row = worksheet.getRow(rowNum)

        // Recalculate Total
        const calculatedTotal = item.jumlah * item.harga_satuan
        const finalTotal = calculatedTotal || item.nilai_total

        row.values = [
            idx + 1,
            item.nama_barang,
            item.spesifikasi,
            item.jumlah,
            item.harga_satuan,
            finalTotal,
            ''
        ]

        totalNilai += finalTotal

        for (let col = 1; col <= 7; col++) {
            const cell = row.getCell(col)
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
            cell.font = { name: 'Arial', size: 10 }

            if ([4, 5, 6].includes(col)) {
                cell.numFmt = '#,##0'
                cell.alignment = { horizontal: 'right' }
            } else if (col === 1) {
                cell.alignment = { horizontal: 'center' }
            } else {
                cell.alignment = { horizontal: 'left', wrapText: true }
            }
        }
        rowNum++
    })

    // Total row
    const totalRow = worksheet.getRow(rowNum)
    totalRow.values = ['', '', 'TOTAL', '', '', totalNilai, '']
    worksheet.mergeCells(`A${rowNum}:B${rowNum}`)

    totalRow.getCell(3).font = { bold: true, name: 'Arial' }
    totalRow.getCell(3).alignment = { horizontal: 'center' }

    totalRow.getCell(6).font = { bold: true, name: 'Arial' }
    totalRow.getCell(6).numFmt = '#,##0'
    totalRow.getCell(6).alignment = { horizontal: 'right' }

    for (let col = 1; col <= 7; col++) {
        totalRow.getCell(col).border = {
            top: { style: 'double' },
            left: { style: 'thin' },
            bottom: { style: 'double' },
            right: { style: 'thin' }
        }
    }

    // Gap for signatures
    rowNum += 3

    // Signatures
    const dateRow = worksheet.getRow(rowNum)
    dateRow.getCell(6).value = `Bandung, ${tanggalFormatted}`
    worksheet.mergeCells(`F${rowNum}:G${rowNum}`)
    dateRow.getCell(6).alignment = { horizontal: 'center' }

    rowNum++
    const titleRow = worksheet.getRow(rowNum)
    titleRow.getCell(2).value = 'PENGURUS BARANG'
    titleRow.getCell(6).value = config.sekolah.nama ? `KEPALA ${config.sekolah.nama}` : 'KEPALA SEKOLAH'
    titleRow.getCell(2).alignment = { horizontal: 'center' }
    titleRow.getCell(6).alignment = { horizontal: 'center' }
    worksheet.mergeCells(`F${rowNum}:G${rowNum}`)

    // INSERT STAMP IMAGE IF EXISTS
    // Assumes image is at 'server/assets/signature_stamp.png'
    try {
        const fs = await import('fs')
        const path = await import('path')
        // Fix: Use process.cwd() to resolve path relative to project root
        // Manually constructed path might be risky, but let's try standard location
        const imagePath = path.resolve(process.cwd(), 'server/assets/signature_stamp.png')

        if (fs.existsSync(imagePath)) {
            const imageId = workbook.addImage({
                filename: imagePath,
                extension: 'png',
            });

            // Position: Over the signature area (Left or Right?)
            // Image looked like a School Stamp (Dinas Pendidikan).
            // Usually stamps go on the LEFT of the Principal's signature (Right Side of Page).
            // Principal is at Col 6.
            // Stamp should be roughly Col 5-6, overlapping.

            worksheet.addImage(imageId, {
                tl: { col: 5, row: rowNum }, // Row num is currently "Gap" start
                ext: { width: 120, height: 120 }
            });
            console.log('Signature stamp added')
        }
    } catch (e) {
        console.warn('Could not add image:', e)
    }

    rowNum += 4

    const nameRow = worksheet.getRow(rowNum)
    nameRow.getCell(2).value = config.pejabat.pengurus_barang.nama
    nameRow.getCell(6).value = config.pejabat.kepala_sekolah.nama
    nameRow.getCell(2).font = { bold: true, underline: true }
    nameRow.getCell(6).font = { bold: true, underline: true }
    nameRow.getCell(2).alignment = { horizontal: 'center' }
    nameRow.getCell(6).alignment = { horizontal: 'center' }
    worksheet.mergeCells(`F${rowNum}:G${rowNum}`)

    rowNum++
    const nipRow = worksheet.getRow(rowNum)
    nipRow.getCell(2).value = `NIP. ${config.pejabat.pengurus_barang.nip}`
    nipRow.getCell(6).value = `NIP. ${config.pejabat.kepala_sekolah.nip}`
    nipRow.getCell(2).alignment = { horizontal: 'center' }
    nipRow.getCell(6).alignment = { horizontal: 'center' }
    worksheet.mergeCells(`F${rowNum}:G${rowNum}`)

    // Column Widths
    worksheet.getColumn(1).width = 5
    worksheet.getColumn(2).width = 35
    worksheet.getColumn(3).width = 25
    worksheet.getColumn(4).width = 12
    worksheet.getColumn(5).width = 18
    worksheet.getColumn(6).width = 22
    worksheet.getColumn(7).width = 15

    worksheet.getRow(15).height = 30 // Header Height

    return workbook.xlsx.writeBuffer()
}

/**
 * Helper to format date in Indonesian
 */
function formatTanggalIndonesia(dateStr) {
    const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

    if (!dateStr) {
        const now = new Date()
        return `31 Desember ${now.getFullYear()}`
    }

    const date = new Date(dateStr)
    return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Generate FORM STOCK OPNAME
 * ZERO HARDCODE: Uses config.tanggalLaporan and config.tahunAnggaran
 */
export async function generateFormStockOpname(aggregatedData, config) {
    const workbook = new ExcelJS.Workbook()

    // ===== ZERO HARDCODE: Dynamic year =====
    const tahun = config.tahunAnggaran || new Date().getFullYear()
    const tanggalFormatted = formatTanggalIndonesia(config.tanggalLaporan)

    const worksheet = workbook.addWorksheet(`Stock Per ${tanggalFormatted.replace(/ /g, '-')}`)

    // Title Section (Matches Image)
    worksheet.mergeCells('A1:Q1') // Empty top margin or just Title

    worksheet.mergeCells('A2:Q2')
    worksheet.getCell('A2').value = 'Lampiran Berita Acara Stock Opname Barang'
    worksheet.getCell('A2').font = { bold: false, size: 11, name: 'Arial' } // Image looks standard
    worksheet.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.mergeCells('A3:Q3')
    // ===== ZERO HARDCODE: Dynamic date =====
    worksheet.getCell('A3').value = `Per ${tanggalFormatted}`
    worksheet.getCell('A3').font = { bold: false, size: 11, name: 'Arial' }
    worksheet.getCell('A3').alignment = { horizontal: 'left' }

    worksheet.mergeCells('A4:Q4')
    worksheet.getCell('A4').value = config.sekolah.nama
    worksheet.getCell('A4').font = { bold: true, size: 11, name: 'Arial' }
    worksheet.getCell('A4').alignment = { horizontal: 'left' }

    // Header Rows (Starts Row 6 in Image Logic, maybe Row 5 in code depending on spacing)
    // Let's stick to the visual: Title takes ~3-4 rows.

    // Main Headers (Row 6)
    worksheet.mergeCells('A6:A7')
    worksheet.getCell('A6').value = 'No'

    worksheet.mergeCells('B6:B7')
    worksheet.getCell('B6').value = 'Jenis Barang'

    worksheet.mergeCells('C6:C7')
    worksheet.getCell('C6').value = 'Satuan'

    worksheet.mergeCells('D6:F6')
    // ===== ZERO HARDCODE: Dynamic year =====
    worksheet.getCell('D6').value = `Saldo Awal Tahun ${tahun}`

    worksheet.mergeCells('G6:I6')
    // ===== ZERO HARDCODE: Dynamic year =====
    worksheet.getCell('G6').value = `Pengadaan Tahun ${tahun}`

    worksheet.mergeCells('J6:K6')
    worksheet.getCell('J6').value = 'Jumlah Saldo awal + Pengadaan'

    worksheet.mergeCells('L6:N6')
    worksheet.getCell('L6').value = 'Penggunaan Barang'

    worksheet.mergeCells('O6:P6')
    worksheet.getCell('O6').value = 'Sisa Barang'

    worksheet.mergeCells('Q6:Q7')
    worksheet.getCell('Q6').value = 'Ket'

    // Sub Headers (Row 7)
    const subHeaders = [
        '', '', '', // A-C merged
        'Jumlah Barang', 'Harga Satuan', 'Jumlah Harga',
        'Jumlah Barang', 'Harga Satuan', 'Jumlah Harga',
        'Barang', 'Harga',
        'Jumlah Barang', 'Harga Satuan', 'Jumlah Harga',
        'Jumlah Barang', 'Jumlah Harga',
        '' // Ket merged
    ]

    subHeaders.forEach((header, idx) => {
        if (header) {
            const cell = worksheet.getCell(7, idx + 1)
            cell.value = header
        }
    })

    // Column Numbers (Row 8)
    for (let i = 1; i <= 17; i++) {
        const cell = worksheet.getCell(8, i)
        cell.value = i
        cell.font = { size: 9, italic: true }
        cell.alignment = { horizontal: 'center' }
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
    }

    // Style Main Headers
    for (let row = 6; row <= 7; row++) {
        for (let col = 1; col <= 17; col++) {
            const cell = worksheet.getCell(row, col)
            cell.font = { bold: true, size: 9, name: 'Arial' }
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
            // Only fill strictly headers
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
        }
    }

    // Data rows (start from row 9)
    let rowNum = 9

    // Helper to write a section
    const writeSection = (title, items) => {
        // Section Header (e.g. A. Persediaan...) 
        // Image shows: "A" in Col 1, Title in Col 2.
        // Let's parse the Title: "A. Persediaan..." -> Letter "A", Title "Persediaan..."
        const parts = title.split('. ')
        const letter = parts[0]
        const name = parts.slice(1).join('. ')

        const headRow = worksheet.getRow(rowNum)
        headRow.getCell(1).value = letter
        headRow.getCell(2).value = name
        headRow.getCell(2).font = { bold: true }
        // Border for section header line? Image shows borders across
        for (let c = 1; c <= 17; c++) {
            headRow.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        }
        rowNum++

        // Items
        items.forEach((item, idx) => {
            const row = worksheet.getRow(rowNum)
            const totalJumlah = item.saldo_awal.jumlah + item.pengadaan.jumlah
            const totalHarga = item.saldo_awal.total + item.pengadaan.total

            row.values = [
                idx + 1,
                item.jenis_barang,
                item.satuan,
                item.saldo_awal.jumlah || '-',
                item.saldo_awal.harga || '-',
                item.saldo_awal.total || '-',
                item.pengadaan.jumlah,
                item.pengadaan.harga,
                item.pengadaan.total,
                totalJumlah,
                totalHarga,
                item.penggunaan.jumlah,
                item.penggunaan.harga,
                item.penggunaan.total,
                item.sisa.jumlah,
                item.sisa.total,
                '' // Ket
            ]

            // Formatting
            for (let col = 1; col <= 17; col++) {
                const cell = row.getCell(col)
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                cell.font = { name: 'Arial', size: 10 }

                if (col >= 4 && col <= 16) {
                    // Number cols
                    if ([4, 7, 10, 12, 15].includes(col)) {
                        // Qty cols
                        cell.numFmt = '#,##0'
                        // Center align qty? Image shows center or right. Let's use Center for Qty.
                        cell.alignment = { horizontal: 'center' }
                    } else {
                        // Money cols
                        cell.numFmt = '#,##0'
                        cell.alignment = { horizontal: 'right' }
                    }

                    // If value is 0 or '-', handle alignment
                    if (cell.value === '-' || cell.value === 0) {
                        cell.value = '-'
                        cell.alignment = { horizontal: 'center' }
                    }
                } else if (col === 1 || col === 3) {
                    cell.alignment = { horizontal: 'center' }
                } else {
                    cell.alignment = { horizontal: 'left' }
                }
            }
            rowNum++
        })

        // Section Subtotal (Jumlah A)
        const subRow = worksheet.getRow(rowNum)
        worksheet.mergeCells(`B${rowNum}:I${rowNum}`) // Image shows "Jumlah" roughly under name? No, Image shows "Jumlah" in Col 2.
        // Actually Image shows "Jumlah" centered or merged in B?
        // Let's stick to placing "Jumlah [Letter]" in Col 2.

        subRow.getCell(2).value = `Jumlah ${letter}`
        subRow.getCell(2).font = { bold: true }
        subRow.getCell(2).alignment = { horizontal: 'center' }

        // Sums
        const colsToSum = [6, 9, 11, 14, 16] // Total Value Columns
        // Note: Image also sums Qty?
        // Image E47 (Qty) = 29.670 (This seems like Qty).
        // Let's Sum Qty columns too: 4, 7, 10, 12, 15
        const allSumCols = [4, 6, 7, 9, 10, 11, 12, 14, 15, 16]

        allSumCols.forEach(colIdx => {
            const sum = items.reduce((acc, curr) => {
                if (colIdx === 4) return acc + curr.saldo_awal.jumlah
                if (colIdx === 6) return acc + curr.saldo_awal.total
                if (colIdx === 7) return acc + curr.pengadaan.jumlah
                if (colIdx === 9) return acc + curr.pengadaan.total
                if (colIdx === 10) return acc + (curr.saldo_awal.jumlah + curr.pengadaan.jumlah)
                if (colIdx === 11) return acc + (curr.saldo_awal.total + curr.pengadaan.total)
                if (colIdx === 12) return acc + curr.penggunaan.jumlah
                if (colIdx === 14) return acc + curr.penggunaan.total
                if (colIdx === 15) return acc + curr.sisa.jumlah
                if (colIdx === 16) return acc + curr.sisa.total
                return acc
            }, 0)

            const cell = subRow.getCell(colIdx)
            cell.value = sum
            cell.numFmt = '#,##0'
            cell.font = { bold: true }
            cell.alignment = (colIdx === 4 || colIdx === 7 || colIdx === 10 || colIdx === 12 || colIdx === 15) ?
                { horizontal: 'center' } : { horizontal: 'right' }
        })

        // Borders for subtotal
        for (let c = 1; c <= 17; c++) {
            subRow.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
            // Fill subtotal row slightly? Image shows white. Keep white.
        }
        rowNum++
    }

    // Aggregation Logic REMOVED as per user request (Step 363)
    // Items should NOT be merged for Stock Opname.
    const finalData = aggregatedData

    // Sort and Group
    const groups = {
        'A': finalData.filter(i => i.kategori && i.kategori.includes('ATK')),
        'B': finalData.filter(i => i.kategori && i.kategori.includes('Cetakan')),
        'C': finalData.filter(i => !i.kategori || (!i.kategori.includes('ATK') && !i.kategori.includes('Cetakan')))
    }

    if (groups['A'].length > 0) writeSection('A. Persediaan Alat Tulis Kantor (ATK)', groups['A'])
    if (groups['B'].length > 0) writeSection('B. Persediaan Barang Cetakan', groups['B'])
    if (groups['C'].length > 0) writeSection('C. Persediaan Lain - Lain', groups['C'])

    // Grand Total
    const grandRow = worksheet.getRow(rowNum)
    worksheet.mergeCells(`A${rowNum}:B${rowNum}`)
    grandRow.getCell(1).value = 'Jumlah SALDO (Harus sama dengan kartu barang)'
    grandRow.getCell(1).font = { bold: true }

    // Sum All
    const allItems = [...groups['A'], ...groups['B'], ...groups['C']]
    const allSumCols = [4, 6, 7, 9, 10, 11, 12, 14, 15, 16]
    allSumCols.forEach(colIdx => {
        const sum = allItems.reduce((acc, curr) => {
            if (colIdx === 4) return acc + curr.saldo_awal.jumlah
            if (colIdx === 6) return acc + curr.saldo_awal.total
            if (colIdx === 7) return acc + curr.pengadaan.jumlah
            if (colIdx === 9) return acc + curr.pengadaan.total
            if (colIdx === 10) return acc + (curr.saldo_awal.jumlah + curr.pengadaan.jumlah)
            if (colIdx === 11) return acc + (curr.saldo_awal.total + curr.pengadaan.total)
            if (colIdx === 12) return acc + curr.penggunaan.jumlah
            if (colIdx === 14) return acc + curr.penggunaan.total
            if (colIdx === 15) return acc + curr.sisa.jumlah
            if (colIdx === 16) return acc + curr.sisa.total
            return acc
        }, 0)

        const cell = grandRow.getCell(colIdx)
        cell.value = sum
        cell.numFmt = '#,##0'
        cell.font = { bold: true }
        cell.alignment = (colIdx === 4 || colIdx === 7 || colIdx === 10 || colIdx === 12 || colIdx === 15) ?
            { horizontal: 'center' } : { horizontal: 'right' }
    })

    // Borders
    for (let c = 1; c <= 17; c++) {
        grandRow.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    }
    rowNum += 3 // Gap

    // Signatures
    const sigRowHeader = worksheet.getRow(rowNum)
    sigRowHeader.getCell(2).value = 'MENGETAHUI :'
    sigRowHeader.getCell(13).value = 'PETUGAS/PENGURUS BARANG PENGGUNA' // Col 13 approx right side
    sigRowHeader.getCell(2).alignment = { horizontal: 'center' }
    sigRowHeader.getCell(13).alignment = { horizontal: 'center' }

    rowNum++
    const sigRowTitle = worksheet.getRow(rowNum)
    sigRowTitle.getCell(2).value = config.sekolah.nama ? `KEPALA ${config.sekolah.nama}` : 'KEPALA SEKOLAH'
    sigRowTitle.getCell(2).alignment = { horizontal: 'center' }

    rowNum += 4 // Gap for signature

    const sigRowName = worksheet.getRow(rowNum)
    sigRowName.getCell(2).value = config.pejabat.kepala_sekolah.nama
    sigRowName.getCell(2).font = { bold: true, underline: true }
    sigRowName.getCell(2).alignment = { horizontal: 'center' }

    sigRowName.getCell(13).value = config.pejabat.pengurus_barang.nama
    sigRowName.getCell(13).font = { bold: true, underline: true }
    sigRowName.getCell(13).alignment = { horizontal: 'center' }

    rowNum++
    const sigRowNip = worksheet.getRow(rowNum)
    sigRowNip.getCell(2).value = `NIP. ${config.pejabat.kepala_sekolah.nip}`
    sigRowNip.getCell(2).alignment = { horizontal: 'center' }

    sigRowNip.getCell(13).value = `NIP. ${config.pejabat.pengurus_barang.nip}`
    sigRowNip.getCell(13).alignment = { horizontal: 'center' }

    // Column Widths
    worksheet.getColumn(1).width = 5   // No
    worksheet.getColumn(2).width = 35  // Jenis Barang (Wider)
    worksheet.getColumn(3).width = 8   // Satuan
    for (let c = 4; c <= 17; c++) worksheet.getColumn(c).width = 13 // Numbers

    return workbook.xlsx.writeBuffer()
}
