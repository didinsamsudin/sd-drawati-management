/**
 * Data Transformer Service
 * Transform parsed data for output files
 * 
 * IMPORTANT: NO AGGREGATION - Each row in input = Each row in output
 * Preview data = Output data (synchronized)
 */

/**
 * Transform raw data to standard format for output
 * NO AGGREGATION - each row stays as individual entry
 * @param {Array} rawData - Parsed Excel data
 * @param {Object} saldoAwal - Initial stock data (optional)
 * @returns {Array} Transformed data (1:1 mapping)
 */
export function transformToOutputFormat(rawData, saldoAwal = {}) {
    return rawData.map((row, index) => {
        const uraian = row.Uraian?.toString().trim() || ''
        const spesifikasi = row.Spesifikasi?.toString().trim() || ''

        // Display name includes spesifikasi if exists
        const displayName = spesifikasi ? `${uraian} - ${spesifikasi}` : uraian

        return {
            no: index + 1,
            jenis_barang: displayName,
            jenis_barang_short: uraian,
            kategori: row.Kategori || 'Persediaan Lain - Lain',
            satuan: row.Satuan || '',
            spesifikasi: spesifikasi,
            saldo_awal: {
                jumlah: saldoAwal[uraian]?.jumlah || 0,
                harga: saldoAwal[uraian]?.harga || 0,
                total: (saldoAwal[uraian]?.jumlah || 0) * (saldoAwal[uraian]?.harga || 0)
            },
            pengadaan: {
                jumlah: Number(row.Pengadaan_Jumlah_Barang) || 0,
                harga: Number(row.Pengadaan_Harga_Satuan) || 0,
                total: Number(row.Pengadaan_Total) || 0
            },
            penggunaan: {
                jumlah: Number(row.Penggunaan_Jumlah_Barang) || 0,
                harga: Number(row.Penggunaan_Harga_Satuan) || 0,
                total: Number(row.Penggunaan_Total) || 0
            },
            sisa: {
                jumlah: Number(row.Sisa_Jumlah_Barang) || 0,
                harga: Number(row.Sisa_Harga_Satuan) || 0,
                total: Number(row.Sisa_Total) || 0
            }
        }
    })
}

/**
 * Filter data for items with remaining stock (sisa > 0)
 * NO AGGREGATION - returns individual rows
 * @param {Array} rawData - Parsed Excel data
 * @returns {Array} Filtered data with only items that have stock remaining
 */
export function filterSisaBarang(rawData) {
    return rawData
        .filter(row => {
            const sisaJumlah = Number(row.Sisa_Jumlah_Barang) || 0
            return sisaJumlah > 0
        })
        .map((row, index) => ({
            no: index + 1,
            nama_barang: row.Uraian,
            spesifikasi: row.Spesifikasi || '',
            jumlah: Number(row.Sisa_Jumlah_Barang) || 0,
            harga_satuan: Number(row.Sisa_Harga_Satuan) || 0,
            nilai_total: Number(row.Sisa_Total) || 0,
            satuan: row.Satuan || 'buah',
            kategori: row.Kategori || 'Persediaan Lain - Lain'
        }))
}

/**
 * Calculate totals for a dataset
 * @param {Array} data
 * @returns {Object} Total calculations
 */
export function calculateTotals(data) {
    let totalPengadaan = 0
    let totalPenggunaan = 0
    let totalSisa = 0

    data.forEach(item => {
        if (item.pengadaan) {
            totalPengadaan += item.pengadaan.total || 0
        }
        if (item.penggunaan) {
            totalPenggunaan += item.penggunaan.total || 0
        }
        if (item.sisa) {
            totalSisa += item.sisa.total || 0
        }
        // Alternative format (for filterSisaBarang output)
        if (item.nilai_total) {
            totalSisa += item.nilai_total
        }
    })

    return {
        total_pengadaan: totalPengadaan,
        total_penggunaan: totalPenggunaan,
        total_sisa: totalSisa,
        jumlah_item: data.length
    }
}

/**
 * Transform raw data for FORM STOCK OPNAME
 * NO AGGREGATION - each input row = each output row
 * @param {Array} rawData
 * @param {Object} saldoAwal
 * @returns {Object} Transformed data with metadata
 */
export function transformForFormStockOpname(rawData, saldoAwal = {}) {
    const transformed = transformToOutputFormat(rawData, saldoAwal)
    const totals = calculateTotals(transformed)

    return {
        data: transformed,
        totals
    }
}

/**
 * Transform raw data for LAPORAN PERSEDIAAN (filtered sisa > 0)
 * NO AGGREGATION - returns individual rows with sisa > 0
 * @param {Array} rawData
 * @param {Object} saldoAwal
 * @returns {Object} Transformed data with metadata
 */
export function transformForLaporanPersediaan(rawData, saldoAwal = {}) {
    const filtered = filterSisaBarang(rawData)
    const totals = calculateTotals(filtered)

    return {
        data: filtered,
        totals
    }
}

/**
 * Transform data for BA STOCK OPNAME & BAST
 * Same as Laporan Persediaan (individual rows with sisa > 0)
 * @param {Array} rawData
 * @param {Object} saldoAwal
 * @returns {Object} Transformed data with metadata
 */
export function transformForBeritaAcara(rawData, saldoAwal = {}) {
    return transformForLaporanPersediaan(rawData, saldoAwal)
}
