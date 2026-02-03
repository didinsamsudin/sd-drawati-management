import { transformForFormStockOpname, transformForLaporanPersediaan, transformForBeritaAcara } from './src/services/dataTransformer.js';
import { generateFormStockOpname, generateLaporanPersediaan } from './src/services/excelGenerator.js';
import { generateBAStockOpname, generateBAST } from './src/services/docxGenerator.js';
import fs from 'fs';

// Mock Data
const mockParsedData = [
    { Uraian: 'Pulpen', Satuan: 'Pcs', Pengadaan_Jumlah_Barang: 10, Pengadaan_Total: 50000, Kategori: 'Persediaan Alat Tulis Kantor (ATK)' },
    { Uraian: 'Kertas', Satuan: 'Rim', Pengadaan_Jumlah_Barang: 5, Pengadaan_Total: 250000, Kategori: 'Persediaan Barang Cetakan' },
    { Uraian: 'Kursi', Satuan: 'Buah', Pengadaan_Jumlah_Barang: 2, Pengadaan_Total: 1000000, Kategori: 'Persediaan Lain - Lain' }
];

const mockConfig = {
    sekolah: { nama: 'SDN TEST', alamat: 'JL TEST', nss: '123', npsn: '456', kabupaten: 'BANDUNG' },
    pejabat: {
        kepala_sekolah: { nama: 'KS', nip: '111' },
        pengurus_barang: { nama: 'PB', nip: '222' },
        pihak_pertama: { nama: 'P1', nip: '333' }
    },
    nomor_surat: { prefix_ba: '028', prefix_bast: '029' }
};

const mockSaldoAwal = {};

async function test() {
    try {
        console.log('1. Transforming Data...');
        const dataFormStock = transformForFormStockOpname(mockParsedData, mockSaldoAwal);
        const dataLaporan = transformForLaporanPersediaan(mockParsedData, mockSaldoAwal);
        const dataBA = transformForBeritaAcara(mockParsedData, mockSaldoAwal);
        console.log('   Data Transformed OK');

        console.log('2. Generating Form Stock Opname (Excel)...');
        await generateFormStockOpname(dataFormStock.data, mockConfig);
        console.log('   Form Stock Opname OK');

        console.log('3. Generating Laporan Persediaan (Excel)...');
        await generateLaporanPersediaan(dataLaporan.data, mockConfig);
        console.log('   Laporan Persediaan OK');

        console.log('4. Generating BA Stock Opname (Docx)...');
        await generateBAStockOpname(dataBA, mockConfig);
        console.log('   BA Stock Opname OK');

        console.log('5. Generating BAST (Docx)...');
        await generateBAST(dataBA, mockConfig);
        console.log('   BAST OK');

        console.log('✅ ALL SYSTEMS NORMAL');
    } catch (e) {
        console.error('❌ FAILURE DETECTED:');
        console.error(e);
        process.exit(1);
    }
}

test();
