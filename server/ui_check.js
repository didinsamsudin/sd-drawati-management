import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
    console.log('🕵️ Starting UI Investigation via Local Puppeteer...');

    // Launch browser
    // We use headless: "new" or true. 
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Safer for some envs
    });

    const page = await browser.newPage();

    // Set viewport to a standard desktop size
    await page.setViewport({ width: 1280, height: 800 });

    try {
        const targetUrl = 'http://localhost:5173';
        console.log(`Testing URL: ${targetUrl}`);

        // Navigate
        await page.goto(targetUrl, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        console.log('✅ Page loaded successfully (networkidle0).');

        // Basic Metadata Check
        const title = await page.title();
        console.log(`📄 Page Title: "${title}"`);

        // Check for Root App
        const root = await page.$('#root');
        if (root) {
            console.log('✅ #root element detected.');
        } else {
            console.error('❌ CRITICAL: #root element missing!');
        }

        // Check for Text Content (Sanity Check)
        const content = await page.content();
        if (content.includes('Manajemen SD Drawati')) {
            console.log('✅ App Name "Manajemen SD Drawati" found in DOM.');
        } else {
            console.warn('⚠️ Warning: App Name not found in DOM directly. Client-side rendering might be delayed or failed.');
        }

        // Check for File Uploader specific text
        if (content.includes('Upload Data Laporan') || content.includes('Upload')) {
            console.log('✅ "Upload" section appears to be present.');
        }

        // Take Screenshot
        // Saving to 'server' dir since we run from there
        const screenshotPath = path.join(__dirname, 'ui_investigation_result.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    } catch (error) {
        console.error('❌ Investigation Failed:', error.message);
        if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
            console.error('   -> Check if the client server is running on port 5173.');
        }
    } finally {
        await browser.close();
        console.log('🏁 Investigation script finished.');
    }
})();
