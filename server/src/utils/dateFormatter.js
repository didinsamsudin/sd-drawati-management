/**
 * Date Formatter Utility
 * Convert dates to Indonesian "terbilang" format
 */

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export const BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Convert number to Indonesian words
 */
export function angkaTerbilang(angka) {
    const bilangan = [
        '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
        'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
        'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'
    ]

    if (angka < 20) {
        return bilangan[angka]
    }

    if (angka < 100) {
        const puluhan = Math.floor(angka / 10)
        const satuan = angka % 10
        const namaPuluhan = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh',
            'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh']
        return `${namaPuluhan[puluhan]} ${bilangan[satuan]}`.trim()
    }

    if (angka < 1000) {
        const ratus = Math.floor(angka / 100)
        const sisa = angka % 100
        const prefix = ratus === 1 ? 'seratus' : `${bilangan[ratus]} ratus`
        return sisa === 0 ? prefix : `${prefix} ${angkaTerbilang(sisa)}`
    }

    if (angka < 1000000) {
        const ribu = Math.floor(angka / 1000)
        const sisa = angka % 1000
        const prefix = ribu === 1 ? 'seribu' : `${angkaTerbilang(ribu)} ribu`
        return sisa === 0 ? prefix : `${prefix} ${angkaTerbilang(sisa)}`
    }

    // For years > 1000
    const ribu = Math.floor(angka / 1000)
    const sisa = angka % 1000
    return `${angkaTerbilang(ribu)} ribu ${angkaTerbilang(sisa)}`.trim()
}

/**
 * Format date to Indonesian "terbilang" format
 * Example: "Rabu tanggal tiga puluh satu bulan Desember tahun dua ribu dua puluh lima"
 */
export function formatTanggalTerbilang(date) {
    const d = new Date(date)

    const namaHari = HARI[d.getDay()]
    const tanggal = d.getDate()
    const namaBulan = BULAN[d.getMonth()]
    const tahun = d.getFullYear()

    const tanggalTerbilang = angkaTerbilang(tanggal)
    const tahunTerbilang = angkaTerbilang(tahun)

    return `${namaHari} tanggal ${tanggalTerbilang} bulan ${namaBulan} tahun ${tahunTerbilang}`
}

/**
 * Get current date in Indonesian short format
 * Example: "31 Desember 2025"
 */
export function formatTanggalSingkat(date) {
    const d = new Date(date)
    return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Get month and year for document title
 * Example: "Desember 2025"
 */
export function getBulanTahun(date) {
    const d = new Date(date)
    return `${BULAN[d.getMonth()]} ${d.getFullYear()}`
}
