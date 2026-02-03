import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

const templateDir = 'd:\\01. JOB\\mang-asep\\manajemen-sd-drawati\\server\\templates';
const files = ['ba_stock_opname_template.docx', 'bast_template.docx'];

files.forEach(file => {
    try {
        console.log(`Testing ${file}...`);
        const content = fs.readFileSync(path.join(templateDir, file), 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

        // Mock data
        doc.render({
            nomor_surat: 'TEST',
            tanggal_terbilang: 'TEST',
            barang: []
        });

        const buf = doc.getZip().generate({ type: 'nodebuffer' });
        console.log(`✅ ${file} passed! Output size: ${buf.length}`);
    } catch (e) {
        console.error(`❌ ${file} FAILED:`);
        if (e.properties && e.properties.errors) {
            e.properties.errors.forEach(err => console.error('  DocxError:', err));
        } else {
            console.error(e);
        }
    }
});
