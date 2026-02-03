import { useState, useEffect } from 'react'
import { Download, CheckCircle2, Loader2, FileText, FileSpreadsheet, AlertTriangle, ArrowRight } from 'lucide-react'
import useAppStore from '../stores/appStore'
import { generateFiles } from '../lib/api'

function GenerateProgress() {
    const {
        parsedData,
        saldoAwal,
        config,
        setGeneratedFiles,
        setProgress,
        generatedFiles,
        progress,
        setCurrentStep: setAppStep,
        // ===== ZERO HARDCODE: Get dynamic data =====
        tanggalLaporan,
        scannedPejabat,
        scannedTahun
    } = useAppStore()
    const [status, setStatus] = useState(generatedFiles ? 'success' : 'idle')
    const [currentStep, setCurrentStep] = useState('Initiating process...')
    const [error, setError] = useState(null)
    const [logs, setLogs] = useState([])

    useEffect(() => {
        // Validation check
        if (!parsedData || !parsedData.sessionId) {
            setError('Sesi kedaluwarsa. Mohon upload ulang file.')
            setStatus('error')
            return
        }

        if (!generatedFiles) {
            handleGenerate()
        }
    }, [])

    const addLog = (message) => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }])
        setCurrentStep(message)
    }

    const handleGenerate = async () => {
        if (!parsedData) return
        setStatus('processing')
        setProgress(5)
        setLogs([])

        try {
            addLog('Starting engine...')
            await new Promise(r => setTimeout(r, 600))

            addLog('Parsing Excel structure...')
            setProgress(25)
            await new Promise(r => setTimeout(r, 800))

            addLog('Validating data integrity...')
            setProgress(40)
            await new Promise(r => setTimeout(r, 600))

            addLog('Aggregating inventory items...')
            setProgress(60)
            await new Promise(r => setTimeout(r, 800))

            addLog('Generating output files...')
            setProgress(80)

            // ===== ZERO HARDCODE: Merge scanned pejabat into config =====
            const mergedConfig = {
                ...config,
                pejabat: {
                    ...config?.pejabat,
                    // Override with scanned data if available
                    kepala_sekolah: scannedPejabat?.kepala_sekolah?.nama
                        ? scannedPejabat.kepala_sekolah
                        : config?.pejabat?.kepala_sekolah,
                    pengurus_barang: scannedPejabat?.pengurus_barang?.nama
                        ? scannedPejabat.pengurus_barang
                        : config?.pejabat?.pengurus_barang,
                },
                // ===== ZERO HARDCODE: Add dynamic date & year =====
                tanggalLaporan: tanggalLaporan,
                tahunAnggaran: scannedTahun || new Date().getFullYear()
            }

            // Actual API call with dynamic config
            const response = await generateFiles(
                parsedData.sessionId,
                saldoAwal,
                mergedConfig
            )

            if (response.data.success) {
                setProgress(100)
                addLog('Finalizing archives...')
                await new Promise(r => setTimeout(r, 500))
                setGeneratedFiles(response.data)
                setStatus('success')
                addLog('Process completed successfully')
            } else {
                throw new Error(response.data.message || 'Generation failed')
            }

        } catch (err) {
            console.error('Generation error:', err)
            setError(err.message || 'Gagal generate file. Silakan coba lagi.')
            setStatus('error')
            addLog('Error occurred: ' + err.message)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {status === 'success' ? 'Dokumen Siap' : 'Memproses Data'}
                </h2>
                <p className="mt-2 text-slate-500">
                    {status === 'success'
                        ? 'Semua file telah berhasil digenerate dan siap diunduh.'
                        : 'Sistem sedang melakukan kalkulasi dan formatting dokumen otomatis.'}
                </p>
            </div>

            {/* Main Card Area */}
            <div className="relative">
                {status === 'processing' && (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-inner">
                        <div className="flex flex-col items-center justify-center py-10 space-y-8">
                            {/* Loader Spinner */}
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-slate-200"></div>
                                <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold text-blue-700">{progress}%</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-center">
                                <h3 className="text-lg font-semibold text-slate-800 animate-pulse transition-all duration-300">
                                    {currentStep}
                                </h3>
                                <p className="text-sm text-slate-400">Mohon tunggu sebentar...</p>
                            </div>
                        </div>

                        {/* Logs Terminal */}
                        <div className="mt-8 bg-slate-900 rounded-xl p-4 font-mono text-xs text-green-400 h-32 overflow-y-auto shadow-lg custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 opacity-90 border-b border-white/5 pb-1 mb-1 last:border-0">
                                    <span className="text-slate-500">[{log.time}]</span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                            <div className="animate-pulse">_</div>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Success Banner */}
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-200/50 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4 shadow-sm">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-green-900 mb-2">Generate Sukses!</h3>
                                <p className="text-green-700 max-w-lg mx-auto">
                                    Sistem telah berhasil membuat Laporan Persediaan, Stock Opname, dan Berita Acara sesuai format yang berlaku.
                                </p>
                            </div>
                        </div>

                        {/* File Grid */}
                        {/* File Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    name: 'FORM STOCK OPNAME',
                                    ext: 'xlsx',
                                    icon: FileSpreadsheet,
                                    color: 'text-green-600',
                                    bg: 'bg-green-50',
                                    border: 'border-green-100',
                                    url: generatedFiles?.files?.formStock,
                                    active: true
                                },
                                {
                                    name: 'LAPORAN PERSEDIAAN',
                                    ext: 'xlsx',
                                    icon: FileSpreadsheet,
                                    color: 'text-gray-400',
                                    bg: 'bg-gray-50',
                                    border: 'border-gray-100',
                                    active: false,
                                    comingSoon: true
                                },
                                {
                                    name: 'BA STOCK OPNAME',
                                    ext: 'docx',
                                    icon: FileText,
                                    color: 'text-gray-400',
                                    bg: 'bg-gray-50',
                                    border: 'border-gray-100',
                                    active: false,
                                    comingSoon: true
                                },
                                {
                                    name: 'BAST & SURAT',
                                    ext: 'docx',
                                    icon: FileText,
                                    color: 'text-gray-400',
                                    bg: 'bg-gray-50',
                                    border: 'border-gray-100',
                                    active: false,
                                    comingSoon: true
                                }
                            ].map((file, idx) => (
                                <button
                                    key={idx}
                                    disabled={!file.active}
                                    onClick={() => {
                                        // Map index to key
                                        const keys = ['formStock', 'laporanPersediaan', 'baStock', 'bast']
                                        const key = keys[idx]

                                        // METHOD 1: Base64 (Serverless / Vercel Safe)
                                        if (key && generatedFiles?.filesContent?.[key]) {
                                            try {
                                                const b64 = generatedFiles.filesContent[key]
                                                const binaryString = window.atob(b64)
                                                const bytes = new Uint8Array(binaryString.length)
                                                for (let i = 0; i < binaryString.length; i++) {
                                                    bytes[i] = binaryString.charCodeAt(i)
                                                }
                                                // Determine mime type based on extension
                                                const isDocx = file.ext === 'docx'
                                                const mime = isDocx
                                                    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                                    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

                                                const blob = new Blob([bytes], { type: mime })
                                                const url = window.URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url

                                                // Get filename from URL or default
                                                const remotePath = generatedFiles.files[key] || ''
                                                const fileName = remotePath.split('/').pop() || `${key}.${file.ext}`

                                                a.download = fileName
                                                document.body.appendChild(a)
                                                a.click()
                                                window.URL.revokeObjectURL(url)
                                                document.body.removeChild(a)
                                                return
                                            } catch (e) {
                                                console.error("Base64 download failed", e)
                                            }
                                        }

                                        // METHOD 2: Direct Link (Local Dev / Fallback)
                                        if (file.active && file.url) {
                                            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                                            // 1. Get API URL from Env or default
                                            let apiUrl = import.meta.env.VITE_API_URL || '';

                                            // 2. PARANOID SAFETY CHECK: 
                                            // If we are NOT on localhost (e.g. Vercel), but the API URL is set to localhost, IGNORE IT.
                                            // This fixes cases where .env or Vercel Settings have 'http://localhost:3000' hardcoded.
                                            if (!isLocal && apiUrl.includes('localhost')) {
                                                console.warn('[DOWNLOAD] Treating localhost API URL as invalid for production');
                                                apiUrl = '';
                                            }

                                            // 3. Fallback to Origin or Localhost
                                            if (!apiUrl) {
                                                apiUrl = isLocal ? 'http://localhost:3000' : window.location.origin;
                                            }

                                            // 4. Clean and Join
                                            let cleanBase = apiUrl;
                                            if (cleanBase && cleanBase.endsWith('/')) cleanBase = cleanBase.slice(0, -1);
                                            if (cleanBase && cleanBase.endsWith('/api')) cleanBase = cleanBase.slice(0, -4);

                                            // 5. Open URL
                                            const finalUrl = `${cleanBase}${file.url}`;
                                            console.log('[DOWNLOAD] Opening:', finalUrl);
                                            window.open(finalUrl, '_blank');
                                        }
                                    }}
                                    className={`flex items-center gap-4 p-4 rounded-xl border ${file.border} ${file.bg} ${file.active ? 'hover:shadow-md cursor-pointer' : 'opacity-80 cursor-not-allowed'} transition-all text-left w-full group relative overflow-hidden`}
                                >
                                    <div className={`p-2 bg-white rounded-lg shadow-sm ${file.color}`}>
                                        <file.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`font-bold text-sm ${file.active ? 'text-slate-800 group-hover:text-blue-600' : 'text-slate-500'}`}>{file.name}</h4>
                                            {file.comingSoon && (
                                                <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold ml-2">
                                                    COMING SOON
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-xs font-mono uppercase bg-white px-2 py-0.5 rounded border ${file.active ? 'text-slate-500 border-slate-100' : 'text-gray-400 border-gray-100'}`}>
                                            .{file.ext}
                                        </span>
                                    </div>
                                    {file.active && (
                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download className={`w-5 h-5 ${file.color}`} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Action Area */}
                        {/* Action Area */}
                        <div className="flex flex-col items-center gap-4 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    const files = useAppStore.getState().generatedFiles

                                    // METHOD 1: Base64 Download (Serverless / Vercel Safe)
                                    if (files?.fileContent) {
                                        try {
                                            const binaryString = window.atob(files.fileContent);
                                            const bytes = new Uint8Array(binaryString.length);
                                            for (let i = 0; i < binaryString.length; i++) {
                                                bytes[i] = binaryString.charCodeAt(i);
                                            }
                                            const blob = new Blob([bytes], { type: 'application/zip' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = files.fileName || 'Stock_Opname.zip';
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
                                            return;
                                        } catch (e) {
                                            console.error("Base64 download failed", e);
                                            alert("Download error: " + e.message);
                                        }
                                    }

                                    // METHOD 2: Direct Link Fallback (Local Development)
                                    if (files?.downloadUrl) {
                                        // Use dynamic base URL, not localhost
                                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
                                        const cleanBase = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl

                                        // downloadUrl already contains /api/download...
                                        // If downloadUrl starts with /, append to origin.
                                        // If API is on different domain, prepend API host.

                                        // Simple robust fix:
                                        // If we are in prod (Vercel), we must use the Base64 method above.
                                        // If we are here, it means backend didn't send Base64.
                                        const url = `${cleanBase}${files.downloadUrl}`
                                        window.open(url, '_blank')
                                    }
                                }}
                                className="group relative overflow-hidden px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                            >
                                <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <Download className="w-6 h-6" />
                                    <span className="text-lg">Download Semua File (ZIP)</span>
                                </div>
                            </button>
                            <p className="text-xs text-slate-400">
                                *File ZIP akan berisi semua dokumen yang dibutuhkan
                            </p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-red-900 mb-2">Gagal Memproses Data</h3>
                        <p className="text-red-700 max-w-md mx-auto mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-white border border-red-200 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GenerateProgress
