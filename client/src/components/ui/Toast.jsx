import { useEffect } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000)
        return () => clearTimeout(timer)
    }, [onClose])

    if (!message) return null

    return (
        <div className={clsx(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0",
            type === 'success' ? "bg-white border-l-4 border-green-500 text-gray-800" : "bg-white border-l-4 border-red-500 text-gray-800"
        )}>
            {type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
                <AlertCircle className="w-6 h-6 text-red-500" />
            )}

            <p className="font-medium text-sm pr-4">{message}</p>

            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
