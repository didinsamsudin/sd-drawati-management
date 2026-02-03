import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Calendar } from 'lucide-react'
import useAppStore from '../stores/appStore'
import { uploadFile } from '../lib/api'

function FileUploader() {
    const {
        uploadedFile,
        setUploadedFile,
        setParsedData,
        setCurrentStep,
        setError,
        tanggalLaporan,
        setTanggalLaporan,
        setScannedPejabat,
        setScannedTahun
    } = useAppStore()

    // Default to end of current year if not set
    const [localDate, setLocalDate] = useState(() => {
        if (tanggalLaporan) return tanggalLaporan
        const now = new Date()
        return `${now.getFullYear()}-12-31`
    })

    // Sync to store when localDate changes
    useEffect(() => {
        setTanggalLaporan(localDate)
    }, [localDate, setTanggalLaporan])

    const onDrop = useCallback(
        async (acceptedFiles) => {
            const file = acceptedFiles[0]
            if (!file) return

            setError(null)
            setUploadedFile(file)

            // Upload and parse
            try {
                const response = await uploadFile(file)
                setParsedData(response.data)

                // ===== ZERO HARDCODE: Save scanned Pejabat & Tahun =====
                if (response.data.scannedPejabat) {
                    setScannedPejabat(response.data.scannedPejabat)
                    console.log('[ZERO HARDCODE] Scanned Pejabat:', response.data.scannedPejabat)
                }
                if (response.data.scannedTahun) {
                    setScannedTahun(response.data.scannedTahun)
                    // Auto-update date to match detected year
                    setLocalDate(`${response.data.scannedTahun}-12-31`)
                    console.log('[ZERO HARDCODE] Scanned Tahun:', response.data.scannedTahun)
                }

                // Auto-proceed to next step after 1.5 second for visual confirmation
                setTimeout(() => {
                    setCurrentStep(2)
                }, 1500)
            } catch (error) {
                console.error('Upload error:', error)
                setError(error.response?.data?.message || 'Gagal upload file. Pastikan format Excel benar.')
                setUploadedFile(null)
            }
        },
        [setUploadedFile, setParsedData, setCurrentStep, setError, setScannedPejabat, setScannedTahun]
    )

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB
    })

    // Format date for display
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="max-w-3xl mx-auto text-center space-y-10">
            <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-2">
                    <Upload className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Data Laporan</h2>
                <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                    Silakan upload file <span className="font-semibold text-slate-700">Laporan Beban Persediaan</span> dalam format Excel (.xlsx) untuk mulai memproses.
                </p>
            </div>

            {/* ===== DATE PICKER SECTION ===== */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-amber-900">Tanggal Laporan</h3>
                        <p className="text-xs text-amber-600">Pilih tanggal periode laporan (biasanya akhir tahun)</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <input
                        type="date"
                        value={localDate}
                        onChange={(e) => setLocalDate(e.target.value)}
                        className="px-4 py-3 rounded-xl border-2 border-amber-300 bg-white text-slate-800 font-semibold text-center 
                                   focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                                   transition-all duration-200 w-full sm:w-auto"
                    />
                    <div className="text-sm text-amber-700 font-medium bg-white/60 px-4 py-2 rounded-lg">
                        {formatDisplayDate(localDate)}
                    </div>
                </div>
            </div>

            {/* Dropzone Area */}
            <div
                {...getRootProps()}
                className={`
                    group relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer
                    ${isDragActive && !isDragReject
                        ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl shadow-blue-100'
                        : isDragReject
                            ? 'border-red-500 bg-red-50/50'
                            : uploadedFile
                                ? 'border-green-500 bg-green-50/30'
                                : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-white hover:shadow-lg hover:shadow-slate-100'
                    }
                `}
            >
                <input {...getInputProps()} />

                <div className="py-16 px-6 relative z-10 transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="flex flex-col items-center gap-6">
                        {/* Dynamic Icon State */}
                        <div className={`
                            w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500
                            ${uploadedFile
                                ? 'bg-green-100 text-green-600 scale-110 shadow-inner'
                                : isDragActive
                                    ? 'bg-blue-100 text-blue-600 scale-110 animate-bounce'
                                    : 'bg-white text-slate-300 shadow-sm'
                            }
                        `}>
                            {uploadedFile ? (
                                <CheckCircle2 className="w-12 h-12" />
                            ) : isDragReject ? (
                                <AlertCircle className="w-12 h-12 text-red-500" />
                            ) : (
                                <FileSpreadsheet className="w-10 h-10" />
                            )}
                        </div>

                        {/* Text Instructions */}
                        <div className="space-y-2">
                            {uploadedFile ? (
                                <>
                                    <h3 className="text-xl font-bold text-green-700">Upload Berhasil!</h3>
                                    <div className="flex items-center gap-2 justify-center text-green-600 bg-white/60 py-1 px-3 rounded-full border border-green-100 mx-auto w-fit">
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span className="font-medium text-sm">{uploadedFile.name}</span>
                                    </div>
                                    <p className="text-sm text-green-600 pt-2 animate-pulse">Mengalihkan ke preview...</p>
                                </>
                            ) : isDragActive ? (
                                <>
                                    <h3 className="text-xl font-bold text-blue-700">Lepaskan file sekarang</h3>
                                    <p className="text-blue-500 font-medium">Data akan diproses otomatis</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                                        Drag & drop file Excel di sini
                                    </h3>
                                    <p className="text-slate-500">
                                        atau <span className="text-blue-600 font-semibold underline decoration-2 decoration-blue-200 underline-offset-2">klik untuk browse</span> komputer Anda
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Decoration Circles (Optional visual flair) */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-t from-green-100 to-transparent rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-2xl pointer-events-none"></div>
            </div>

            {/* Footer Info */}
            {!uploadedFile && (
                <div className="flex justify-center gap-8 text-xs font-medium text-slate-400 uppercase tracking-widest pt-4">
                    <span className="flex items-center gap-1.5 hover:text-slate-600 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Auto-Detect Header
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-slate-600 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Auto-Scan Pejabat
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-slate-600 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Secure Process
                    </span>
                </div>
            )}
        </div>
    )
}

export default FileUploader
