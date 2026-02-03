import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

const templateDir = 'd:\\01. JOB\\mang-asep\\manajemen-sd-drawati\\server\\templates';
const files = ['ba_stock_opname_template.docx', 'bast_template.docx'];

files.forEach(file => {
    try {
        console.log(`\n--- Inspecting ${file} ---`);
        const content = fs.readFileSync(path.join(templateDir, file), 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

        const text = doc.getFullText();
        // Simple regex to find things that look like tags {example}
        const matches = text.match(/\{[^}]+\}/g);

        console.log('Detected Tags in Text:', matches ? matches : 'NONE FOUND');
        console.log('Partial Raw Text Preview:', text.substring(0, 500));

    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});
