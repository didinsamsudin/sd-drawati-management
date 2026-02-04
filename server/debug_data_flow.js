
import fs from 'fs';
import path from 'path';
import { parseExcelFile } from './src/services/excelParser.js';
import { transformForLaporanPersediaan } from './src/services/dataTransformer.js';

const filePath = path.resolve('..', 'file mentah', 'Laporan Beban Persediaan - SDN DRAWATI 04 - 31-01-2026.xlsx');

async function debugFlow() {
    console.log(`[DEBUG] Reading file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error('[DEBUG] File not found!');
        return;
    }

    const buffer = fs.readFileSync(filePath);

    try {
        console.log('[DEBUG] Parsing Excel...');
        const parsed = await parseExcelFile(buffer);
        console.log(`[DEBUG] Parsed ${parsed.data.length} rows`);

        if (parsed.data.length > 0) {
            console.log('[DEBUG] First Row Sample:', JSON.stringify(parsed.data[0], null, 2));

            // Checks sisa columns
            const hasSisa = parsed.data.some(row => row.Sisa_Jumlah_Barang > 0);
            console.log(`[DEBUG] Has Any Row with Sisa_Jumlah_Barang > 0? ${hasSisa}`);

            // Check specific row keys
            const keys = Object.keys(parsed.data[0]);
            console.log('[DEBUG] Row Keys:', keys.join(', '));
        }

        console.log('[DEBUG] Transforming Data...');
        const transformed = transformForLaporanPersediaan(parsed.data);
        console.log(`[DEBUG] Transformed Data Length: ${transformed.data.length}`);

        if (transformed.data.length > 0) {
            console.log('[DEBUG] First Transformed Item:', JSON.stringify(transformed.data[0], null, 2));
        } else {
            console.log('[DEBUG] Transformation resulted in EMPTY data. Check filter logic.');
            // Dig deeper into filter
            const rawSisaValues = parsed.data.map(r => r.Sisa_Jumlah_Barang).slice(0, 10);
            console.log('[DEBUG] Sample Sisa_Jumlah_Barang values from Raw Data:', rawSisaValues);
        }

    } catch (e) {
        console.error('[DEBUG] Error:', e);
    }
}

debugFlow();
