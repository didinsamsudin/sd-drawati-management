
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const TARGET_URL = 'http://localhost:5173';
const FILE_PATH = path.resolve('d:/01. JOB/mang-asep/file mentah/Laporan Beban Persediaan - SDN DRAWATI 04 - 31-01-2026.xlsx');
const PROOF_DIR = path.resolve(__dirname, '../outputs/proof_screenshots');
const TIMEOUT = 20000;

if (fs.existsSync(PROOF_DIR)) {
    fs.rmSync(PROOF_DIR, { recursive: true, force: true });
}
fs.mkdirSync(PROOF_DIR, { recursive: true });

async function runProofGenerator() {
    console.log('📸 Starting Visual Proof Generation...');
    console.log(`📂 Output: ${PROOF_DIR}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--window-size=1280,800', '--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    page.setDefaultNavigationTimeout(TIMEOUT);

    try {
        // 1. Landing Page
        console.log('[1/5] Capturing Landing Page...');
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(PROOF_DIR, '01_Home.png'), fullPage: true });

        // 2. Upload
        console.log('[2/5] Uploading File...');
        const fileInput = await page.waitForSelector('input[type="file"]', { timeout: TIMEOUT });
        await fileInput.uploadFile(FILE_PATH);

        await page.waitForFunction(
            () => document.body.innerText.includes('Preview Data'),
            { timeout: TIMEOUT }
        );
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(PROOF_DIR, '02_Preview.png'), fullPage: true });

        // 3. Config
        console.log('[3/5] Navigating to Config Check...');
        await clickButtonByText(page, ['Lanjut Konfigurasi', 'Lanjut']);
        await new Promise(r => setTimeout(r, 500));
        // Fill config slightly to show interactivity (optional, default is fine)
        await page.screenshot({ path: path.join(PROOF_DIR, '03_Config.png'), fullPage: true });

        // 4. Saldo Awal
        console.log('[4/5] Navigating to Saldo Awal...');
        await clickButtonByText(page, ['Lanjut', 'Simpan']);
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(PROOF_DIR, '04_SaldoAwal.png'), fullPage: true });

        // 5. Generate & Success
        console.log('[5/5] Generating Files...');
        await clickButtonByText(page, ['Proses', 'Generate']);

        // Wait for success
        await page.waitForFunction(
            () => document.body.innerText.includes('Production Ready') || document.body.innerText.includes('Download'),
            { timeout: 30000 }
        );
        await new Promise(r => setTimeout(r, 1000)); // Wait for animation
        await page.screenshot({ path: path.join(PROOF_DIR, '05_Success_Download.png'), fullPage: true });

        console.log('\n✅ All Screenshots Captured Successfully!');
        console.log(`🖼️ Check specific folder: server/outputs/proof_screenshots`);

    } catch (error) {
        console.error('\n❌ Error capturing proofs:', error.message);
        await page.screenshot({ path: path.join(PROOF_DIR, 'ERROR_STATE.png') });
    } finally {
        await browser.close();
    }
}

async function clickButtonByText(page, textOptions) {
    const handle = await page.evaluateHandle((textOptions) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => textOptions.some(text => b.innerText.toLowerCase().includes(text.toLowerCase())));
    }, textOptions);

    if (handle.asElement()) {
        await handle.click();
    } else {
        throw new Error(`Button [${textOptions}] not found`);
    }
}

runProofGenerator();
