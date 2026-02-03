import { useState, useEffect } from 'react'
import { FileSpreadsheet, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, List, Eye, EyeOff, Filter, BarChart3, Table2 } from 'lucide-react'
import useAppStore from '../stores/appStore'

function DataPreview() {
    const { parsedData, setCurrentStep, uploadedFile } = useAppStore()
    const [showAllRows, setShowAllRows] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [viewMode, setViewMode] = useState('simple') // 'simple' or 'full'
    const rowsPerPage = 20

    if (!parsedData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FileSpreadsheet className="w-16 h-16 mb-4 opacity-50" />
                <p>Belum ada data yang diupload.</p>
            </div>
        )
    }

    const handleNext = () => {
        setCurrentStep(3)
    }

    const handleBack = () => {
        setCurrentStep(1)
    }

    // Get all data from dataPreview
    const allData = parsedData.dataPreview || []

    // Get unique categories
    const categories = [...new Set(allData.map(row => row.Kategori || 'Lain-lain'))]

    // Filter data by category
    const filteredData = selectedCategory === 'all'
        ? allData
        : allData.filter(row => row.Kategori === selectedCategory)

    // Calculate category stats
    const categoryStats = categories.map(cat => ({
        name: cat,
        count: allData.filter(row => row.Kategori === cat).length
    }))

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage)
    const startIdx = (currentPage - 1) * rowsPerPage
    const displayedData = showAllRows ? filteredData : filteredData.slice(startIdx, startIdx + rowsPerPage)

    // Format currency
    const formatCurrency = (val) => {
        if (val == null || val === '') return '-'
        return new Intl.NumberFormat('id-ID').format(val)
    }

    // Format date
    const formatDate = (val) => {
        if (!val) return '-'
        if (val instanceof Date) {
            return val.toLocaleDateString('id-ID')
        }
        return String(val).substring(0, 10)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verifikasi Data</h2>
                    <p className="mt-1 text-slate-500">
                        Periksa kelengkapan data yang telah di-parsing dari Excel.
                    </p>
                </div>
                <div className="bg-slate-100 rounded-lg px-4 py-2 flex items-center gap-3 border border-slate-200">
                    <div className="bg-white p-1.5 rounded-md shadow-sm">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Source File</p>
                        <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{uploadedFile?.name}</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">Total Baris</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">{allData.length}</p>
                </div>

                {categoryStats.slice(0, 3).map((stat, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                        <p className="text-xs text-slate-500 font-medium truncate mb-1">{stat.name}</p>
                        <p className="text-2xl font-bold text-slate-800">{stat.count}</p>
                        <p className="text-xs text-slate-400">items</p>
                    </div>
                ))}
            </div>

            {/* Filter & View Controls */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        >
                            <option value="all">Semua Kategori ({allData.length})</option>
                            {categories.map((cat, idx) => (
                                <option key={idx} value={cat}>
                                    {cat} ({allData.filter(r => r.Kategori === cat).length})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('simple')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'simple' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Ringkas
                        </button>
                        <button
                            onClick={() => setViewMode('full')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'full' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Lengkap
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAllRows(!showAllRows)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showAllRows
                            ? 'bg-brand-100 text-brand-700 border border-brand-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                    >
                        {showAllRows ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showAllRows ? 'Pagination' : 'Semua'}
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Table2 className="w-4 h-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-700">
                            {showAllRows ? 'Semua Data' : `Halaman ${currentPage} dari ${totalPages}`}
                        </h3>
                    </div>
                    <span className="text-xs font-medium bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full text-blue-700">
                        {displayedData.length} dari {filteredData.length} baris
                    </span>
                </div>

                <div className={`overflow-x-auto ${showAllRows ? 'max-h-[600px] overflow-y-scroll border-2 border-blue-200' : ''}`} style={showAllRows ? { scrollbarWidth: 'auto' } : {}}>
                    {viewMode === 'simple' ? (
                        /* SIMPLE VIEW - Hanya kolom penting */
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    <th className="px-3 py-3 w-10 text-center">#</th>
                                    <th className="px-3 py-3">Uraian Barang</th>
                                    <th className="px-3 py-3">Satuan</th>
                                    <th className="px-3 py-3 text-right">Pengadaan</th>
                                    <th className="px-3 py-3 text-right">Penggunaan</th>
                                    <th className="px-3 py-3 text-right">Sisa</th>
                                    <th className="px-3 py-3">Kategori</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-xs">
                                            {showAllRows ? idx + 1 : startIdx + idx + 1}
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-slate-700 max-w-[180px] truncate" title={row.Uraian}>
                                            {row.Uraian || <span className="text-red-400 italic">Kosong!</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-500 text-sm">{row.Satuan || '-'}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-sm text-slate-600">
                                            {row.Pengadaan_Jumlah_Barang ?? '-'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-sm text-slate-600">
                                            {row.Penggunaan_Jumlah_Barang ?? '-'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-blue-600">
                                            {row.Sisa_Jumlah_Barang ?? '-'}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs">
                                            <span className={`px-2 py-0.5 rounded-full font-medium ${row.Kategori?.includes('ATK') ? 'bg-green-100 text-green-700' :
                                                row.Kategori?.includes('Cetakan') ? 'bg-purple-100 text-purple-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {row.Kategori?.split(' ').slice(0, 2).join(' ') || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* FULL VIEW - SEMUA KOLOM */
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider font-semibold">
                                    <th className="px-2 py-2 text-center border-r border-slate-700">#</th>
                                    <th className="px-2 py-2 border-r border-slate-700">Uraian</th>
                                    <th className="px-2 py-2 border-r border-slate-700">Satuan</th>
                                    <th colSpan="4" className="px-2 py-2 text-center bg-emerald-700 border-r border-slate-700">
                                        PENGADAAN 2025
                                    </th>
                                    <th colSpan="4" className="px-2 py-2 text-center bg-amber-700 border-r border-slate-700">
                                        PENGGUNAAN 2025
                                    </th>
                                    <th colSpan="3" className="px-2 py-2 text-center bg-blue-700 border-r border-slate-700">
                                        SISA BARANG
                                    </th>
                                    <th className="px-2 py-2 text-center">Ket</th>
                                </tr>
                                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase text-slate-600 font-semibold">
                                    <th className="px-2 py-1.5"></th>
                                    <th className="px-2 py-1.5"></th>
                                    <th className="px-2 py-1.5"></th>
                                    {/* Pengadaan */}
                                    <th className="px-2 py-1.5 text-right bg-emerald-50">Qty</th>
                                    <th className="px-2 py-1.5 text-right bg-emerald-50">Harga</th>
                                    <th className="px-2 py-1.5 text-right bg-emerald-50">Total</th>
                                    <th className="px-2 py-1.5 text-center bg-emerald-50">Tgl</th>
                                    {/* Penggunaan */}
                                    <th className="px-2 py-1.5 text-right bg-amber-50">Qty</th>
                                    <th className="px-2 py-1.5 text-right bg-amber-50">Harga</th>
                                    <th className="px-2 py-1.5 text-right bg-amber-50">Total</th>
                                    <th className="px-2 py-1.5 text-center bg-amber-50">Tgl</th>
                                    {/* Sisa */}
                                    <th className="px-2 py-1.5 text-right bg-blue-50">Qty</th>
                                    <th className="px-2 py-1.5 text-right bg-blue-50">Harga</th>
                                    <th className="px-2 py-1.5 text-right bg-blue-50">Total</th>
                                    <th className="px-2 py-1.5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-2 py-2 text-center text-slate-400 font-mono border-r border-slate-100">
                                            {showAllRows ? idx + 1 : startIdx + idx + 1}
                                        </td>
                                        <td className="px-2 py-2 font-medium text-slate-700 max-w-[150px] truncate border-r border-slate-100" title={row.Uraian}>
                                            {row.Uraian || '-'}
                                        </td>
                                        <td className="px-2 py-2 text-slate-500 border-r border-slate-100">{row.Satuan || '-'}</td>
                                        {/* Pengadaan */}
                                        <td className="px-2 py-2 text-right font-mono text-slate-600 bg-emerald-50/30">
                                            {row.Pengadaan_Jumlah_Barang ?? '-'}
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-slate-600 bg-emerald-50/30">
                                            {formatCurrency(row.Pengadaan_Harga_Satuan)}
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-slate-600 bg-emerald-50/30">
                                            {formatCurrency(row.Pengadaan_Total)}
                                        </td>
                                        <td className="px-2 py-2 text-center text-slate-500 bg-emerald-50/30 border-r border-slate-100">
                                            {formatDate(row.Pengadaan_Tanggal)}
                                        </td>
                                        {/* Penggunaan */}
                                        <td className="px-2 py-2 text-right font-mono text-slate-600 bg-amber-50/30">
                                            {row.Penggunaan_Jumlah_Barang ?? '-'}
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-slate-600 bg-amber-50/30">
                                            {formatCurrency(row.Penggunaan_Harga_Satuan)}
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-slate-600 bg-amber-50/30">
                                            {formatCurrency(row.Penggunaan_Total)}
                                        </td>
                                        <td className="px-2 py-2 text-center text-slate-500 bg-amber-50/30 border-r border-slate-100">
                                            {formatDate(row.Penggunaan_Tanggal)}
                                        </td>
                                        {/* Sisa */}
                                        <td className="px-2 py-2 text-right font-mono font-bold text-blue-600 bg-blue-50/30">
                                            {row.Sisa_Jumlah_Barang ?? '-'}
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-slate-600 bg-blue-50/30">
                                            {formatCurrency(row.Sisa_Harga_Satuan)}
                                        </td>
                                        <td className="px-2 py-2 text-right font-mono text-slate-600 bg-blue-50/30 border-r border-slate-100">
                                            {formatCurrency(row.Sisa_Total)}
                                        </td>
                                        <td className="px-2 py-2 text-slate-400 max-w-[60px] truncate" title={row.Keterangan}>
                                            {row.Keterangan || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!showAllRows && totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Total {filteredData.length} baris data
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum = i + 1
                                if (totalPages > 5) {
                                    if (currentPage > 3) {
                                        pageNum = currentPage - 2 + i
                                    }
                                    if (pageNum > totalPages) pageNum = totalPages - 4 + i
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${currentPage === pageNum
                                            ? 'bg-brand-600 text-white'
                                            : 'border border-slate-200 hover:bg-white text-slate-600'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Verification Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800">Verifikasi Manual</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Total <strong>{allData.length} baris</strong> data terdeteksi.
                            Gunakan mode <strong>"Lengkap"</strong> untuk melihat semua kolom:
                            Pengadaan (Qty, Harga, Total, Tgl), Penggunaan (Qty, Harga, Total, Tgl), dan Sisa Barang.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Upload Ulang
                </button>
                <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:shadow-brand-300 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    Data Sudah Benar, Lanjut
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

export default DataPreview
