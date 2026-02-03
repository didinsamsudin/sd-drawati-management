import { useState, useEffect } from 'react'
import { Building2, ChevronRight, UserCircle2, School } from 'lucide-react'
import useAppStore from '../stores/appStore'
import { getConfig, updateConfig } from '../lib/api'

function ConfigForm() {
    const { config, setConfig, setCurrentStep } = useAppStore()
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [formData, setFormData] = useState(config || {
        sekolah: {
            nama: 'SDN DRAWATI 04',
            alamat: 'Jalan Sukasari No. 14 Desa Drawati Kecamatan Paseh',
        },
        pejabat: {
            kepala_sekolah: { nama: '', nip: '' },
            pengurus_barang: { nama: '', nip: '' }
        }
    })

    useEffect(() => {
        setIsLoading(true)
        setLoadError(null)
        // Load config from API
        getConfig()
            .then(response => {
                setFormData(response.data)
                setConfig(response.data)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to load config:', err)
                setLoadError('Gagal memuat data konfigurasi. Pastikan server berjalan.')
                setIsLoading(false)
                // Fallback to existing config or defaults if offline
                if (config) setFormData(config)
            })
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()

        // 1. Update local store immediately so next step has data
        setConfig(formData)

        // 2. Try to persist to server in background (fire and forget)
        updateConfig(formData).catch(err => {
            console.error('Background save failed:', err)
        })

        // 3. Navigate immediately
        setCurrentStep(4)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Konfigurasi Data Sekolah</h2>
                    <p className="mt-1 text-slate-500">
                        Informasi ini akan digunakan sebagai kop surat dan penandatangan dokumen.
                    </p>
                </div>
                {loadError && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-200">
                        {loadError}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sekolah Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-fit">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                            <School className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Identitas Sekolah</h3>
                            <p className="text-xs text-slate-400">Nama dan alamat lengkap instansi</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nama Sekolah
                            </label>
                            <input
                                type="text"
                                value={formData.sekolah?.nama || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    sekolah: { ...formData.sekolah, nama: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                placeholder="Contoh: SDN DRAWATI 04"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Alamat Lengkap
                            </label>
                            <textarea
                                value={formData.sekolah?.alamat || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    sekolah: { ...formData.sekolah, alamat: e.target.value }
                                })}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400 resize-none"
                                placeholder="Jalan..."
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Pejabat Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-fit">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
                            <UserCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Pejabat Penandatangan</h3>
                            <p className="text-xs text-slate-400">Kepala Sekolah & Pengurus Barang</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Kepala Sekolah */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1">
                                Kepala Sekolah
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={formData.pejabat?.kepala_sekolah?.nama || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            pejabat: { ...formData.pejabat, kepala_sekolah: { ...formData.pejabat?.kepala_sekolah, nama: e.target.value } }
                                        })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">NIP</label>
                                    <input
                                        type="text"
                                        value={formData.pejabat?.kepala_sekolah?.nip || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            pejabat: { ...formData.pejabat, kepala_sekolah: { ...formData.pejabat?.kepala_sekolah, nip: e.target.value } }
                                        })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pengurus Barang */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-1">
                                Pengurus Barang
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={formData.pejabat?.pengurus_barang?.nama || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            pejabat: { ...formData.pejabat, pengurus_barang: { ...formData.pejabat?.pengurus_barang, nama: e.target.value } }
                                        })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">NIP</label>
                                    <input
                                        type="text"
                                        value={formData.pejabat?.pengurus_barang?.nip || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            pejabat: { ...formData.pejabat, pengurus_barang: { ...formData.pejabat?.pengurus_barang, nip: e.target.value } }
                                        })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Action Bar */}
                <div className="lg:col-span-2 pt-4 flex justify-end transform transition-all">
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Simpan & Lanjutkan
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    )
}

export default ConfigForm
