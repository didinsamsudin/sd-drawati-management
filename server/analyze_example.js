import ExcelJS from 'exceljs';
import path from 'path';

const filePath = 'd:\\01. JOB\\mang-asep\\file output\\FORM STOCK OPNAME SDN DRAWATI 04.xlsx';

async function analyze() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    console.log(`Sheet Name: ${worksheet.name}`);
    console.log('--- First 50 Rows ---');

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 50) return;
        const values = row.values;
        // Clean up values for easier reading
        const cleaned = Array.isArray(values) ? values.map(v => v === null ? '' : v) : values;
        console.log(`Row ${rowNumber}:`, JSON.stringify(cleaned));
    });
}

analyze().catch(console.error);
