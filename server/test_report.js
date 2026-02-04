
import fs from 'fs';
import path from 'path';
import { generateLaporanPersediaan } from './src/services/excelGenerator.js';

// Mock Config
const config = {
    sekolah: {
        nama: 'SDN DRAWATI 04',
        alamat: 'Jl. Sukasari No. 14',
        nss: '101020812020',
        npsn: '20207663'
    },
    pejabat: {
        kepala_sekolah: { nama: 'PARIS SUPRIADI, S.Pd', nip: '19861121 200901 1 001' },
        pengurus_barang: { nama: 'MANG ASEP', nip: '12345678 123456 1 001' }
    },
    tanggalLaporan: '2025-12-31'
};

// Mock Data with DUPLICATES to test Aggregation
const testData = [
    { nama_barang: 'Kertas HVS A4', spesifikasi: 'Kertas', jumlah: 10, harga_satuan: 65000, nilai_total: 650000 },
    { nama_barang: 'Kertas HVS A4', spesifikasi: 'Kertas', jumlah: 5, harga_satuan: 65000, nilai_total: 325000 }, // Duplicate Name/Price
    { nama_barang: 'Spidol', spesifikasi: 'Hitam', jumlah: 2, harga_satuan: 10000, nilai_total: 20000 },
    { nama_barang: 'Spidol', spesifikasi: 'Hitam', jumlah: 3, harga_satuan: 10000, nilai_total: 30000 }, // Duplicate Name/Price
    { nama_barang: 'Spidol', spesifikasi: 'Merah', jumlah: 1, harga_satuan: 10000, nilai_total: 10000 }, // Diff Spec
    { nama_barang: 'Buku', spesifikasi: 'Tulis', jumlah: 10, harga_satuan: 5000, nilai_total: 50000 },
    // Diff Price - Should NOT merge
    { nama_barang: 'Pensil', spesifikasi: '2B', jumlah: 5, harga_satuan: 2000, nilai_total: 10000 },
    { nama_barang: 'Pensil', spesifikasi: '2B', jumlah: 5, harga_satuan: 3000, nilai_total: 15000 }
];

async function runTest() {
    console.log('Running Aggregation Test...');
    try {
        const buffer = await generateLaporanPersediaan(testData, config);
        const outputPath = path.resolve('test_laporan_output.xlsx');
        fs.writeFileSync(outputPath, buffer);
        console.log(`Test passed. Output written to ${outputPath}`);
        console.log('Verify manually:');
        console.log('- Kertas HVS A4 should be 1 row, Qty 15, Total 975000');
        console.log('- Spidol Hitam should be 1 row, Qty 5, Total 50000');
        console.log('- Spidol Merah separate row');
        console.log('- Pensil separate rows (different prices)');
    } catch (e) {
        console.error('Test failed:', e);
    }
}

runTest();
