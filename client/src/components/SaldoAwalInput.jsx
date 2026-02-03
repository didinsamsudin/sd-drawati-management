import { useState, useEffect } from 'react'
import { Database, ChevronRight, Calculator, Coins, ArrowRightSquare } from 'lucide-react'
import useAppStore from '../stores/appStore'

function SaldoAwalInput() {
    const { parsedData, saldoAwal, setSaldoAwal, setCurrentStep } = useAppStore()
    const [items, setItems] = useState([])

    useEffect(() => {
        // Extract unique jenis barang from parsed data
        if (parsedData?.dataPreview) {
            const uniqueItems = {}
            parsedData.dataPreview.forEach(row => {
                const key = row.Uraian
                if (key && !uniqueItems[key]) {
                    uniqueItems[key] = {
                        jenis_barang: key,
                        satuan: row.Satuan,
                        jumlah: saldoAwal[key]?.jumlah || 0,
                        harga: saldoAwal[key]?.harga || 0
                    }
                }
            })
            setItems(Object.values(uniqueItems))
        }
    }, [parsedData, saldoAwal])

    const handleUpdate = (index, field, value) => {
        const updated = [...items]
        updated[index][field] = parseFloat(value) || 0
        setItems(updated)
    }

    const handleSubmit = () => {
        // Convert to object format
        const saldoAwalObject = {}
        items.forEach(item => {
            saldoAwalObject[item.jenis_barang] = {
                jumlah: item.jumlah,
                harga: item.harga
            }
        })
        setSaldoAwal(saldoAwalObject)
        setCurrentStep(5)
    }

    const handleSkip = () => {
        setSaldoAwal({})
        setCurrentStep(5)
    }

    const totalValuation = items.reduce((sum, item) => sum + (item.jumlah * item.harga), 0)

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Input Saldo Awal</h2>
                    <p className="mt-1 text-slate-500">
                        Masukkan sisa stok tahun lalu (2024). Data ini opsional.
                    </p>
                </div>
                <div className="bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-4">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                        <Coins className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Total Nilai Aset</p>
                        <p className="text-xl font-bold font-mono">
                            Rp {totalValuation.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Input Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-[500px] overflow-y-auto relative custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                                <th className="px-6 py-4">Jenis Barang</th>
                                <th className="px-6 py-4 w-24 text-center">Satuan</th>
                                <th className="px-6 py-4 w-32">Jumlah</th>
                                <th className="px-6 py-4 w-40">Harga Satuan</th>
                                <th className="px-6 py-4 w-40 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-3 font-medium text-slate-700">
                                        {item.jenis_barang}
                                    </td>
                                    <td className="px-6 py-3 text-center text-slate-500 text-sm bg-slate-50/50">
                                        {item.satuan}
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="number"
                                            value={item.jumlah}
                                            onChange={(e) => handleUpdate(index, 'jumlah', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono transition-all text-center"
                                            min="0"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rp</span>
                                            <input
                                                type="number"
                                                value={item.harga}
                                                onChange={(e) => handleUpdate(index, 'harga', e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono transition-all text-right"
                                                min="0"
                                                placeholder="0"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-sm font-bold text-slate-700 bg-slate-50/30">
                                        {(item.jumlah * item.harga).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span>Menampilkan {items.length} jenis barang</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        <span>Otomatis dihitung</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
                <button
                    onClick={handleSkip}
                    className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-all text-sm flex items-center gap-2"
                >
                    <ArrowRightSquare className="w-4 h-4" />
                    Lewati (Set Semua 0)
                </button>
                <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    Simpan & Generate File
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

export default SaldoAwalInput
