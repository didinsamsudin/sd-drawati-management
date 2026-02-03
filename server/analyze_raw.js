import ExcelJS from 'exceljs';
import fs from 'fs';

const filePath = 'd:\\01. JOB\\mang-asep\\file mentah\\Laporan Beban Persediaan - SDN DRAWATI 04 - 31-01-2026.xlsx';

async function analyze() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    console.log(`Sheet Name: ${worksheet.name}`);

    // Scan all rows to find category patterns
    console.log('\n--- SCANNING RAW FILE FOR CATEGORIES ---');
    worksheet.eachRow((row, rowNumber) => {
        const text = row.values && Array.isArray(row.values) ? row.values.join(' ').toLowerCase() : '';
        if (text && (
            text.includes('alat tulis') ||
            text.includes('cetakan') ||
            text.includes('lain - lain') ||
            text.includes('belanja') // Often "Belanja Alat Tulis Kantor"
        )) {
            console.log(`MATCH Row ${rowNumber}:`, JSON.stringify(row.values));
        }
    });

    // Also look for "Kodering" column examples
    console.log('\n--- KODERING SAMPLES ---');
    let count = 0;
    worksheet.eachRow((row, rowNumber) => {
        if (count < 10 && rowNumber > 10) {
            // Assuming Col 2 is Kodering based on previous analysis
            const val = row.getCell(2).value;
            if (val) {
                console.log(`Row ${rowNumber} Col 2: ${val}`);
                count++;
            }
        }
    });
}

analyze().catch(console.error);
