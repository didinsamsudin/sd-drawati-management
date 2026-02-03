import ExcelJS from 'exceljs';
import fs from 'fs';

const filePath = 'd:\\01. JOB\\mang-asep\\file output\\FORM STOCK OPNAME SDN DRAWATI 04.xlsx';

async function analyze() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    console.log(`Sheet Name: ${worksheet.name}`);

    // Print first 20 rows to see headers and structure
    console.log('--- HEADERS / TOP 20 ROWS ---');
    for (let i = 1; i <= 20; i++) {
        const row = worksheet.getRow(i);
        const values = row.values;
        // Clean values: skip text formatting objects, just show text/result
        const cleaned = Array.isArray(values) ? values.map(v => {
            if (v && typeof v === 'object') {
                if (v.result !== undefined) return `[Formula=${v.formula} Res=${v.result}]`;
                if (v.richText) return v.richText.map(t => t.text).join('');
                return JSON.stringify(v);
            }
            return v;
        }) : values;
        console.log(`Row ${i}:`, JSON.stringify(cleaned));
    }

    // Try to find Category Headers deeper in the file
    console.log('\n--- SCANNING FOR CATEGORIES ---');
    worksheet.eachRow((row, rowNumber) => {
        const text = row.values && row.values.join(' ').toLowerCase();
        if (text && (
            text.includes('alat tulis') ||
            text.includes('cetakan') ||
            text.includes('lain - lain') ||
            text.includes('jumlah saldo')
        )) {
            console.log(`MATCH Row ${rowNumber}:`, JSON.stringify(row.values));
        }
    });
}

analyze().catch(console.error);
