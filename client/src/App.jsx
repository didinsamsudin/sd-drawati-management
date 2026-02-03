import { useState, useEffect } from 'react'
import { Upload, FileCheck, Settings, Database, Download, CheckCircle2, ChevronRight, School, Info } from 'lucide-react'
import FileUploader from './components/FileUploader'
import DataPreview from './components/DataPreview'
import ConfigForm from './components/ConfigForm'
import GenerateProgress from './components/GenerateProgress'
import PageTransition from './components/PageTransition'
import useAppStore from './stores/appStore'
import { Toast } from './components/ui/Toast'

// Stepper Configuration
const steps = [
    { id: 1, name: 'Upload Laporan', icon: Upload, description: 'Format .xlsx' },
    { id: 2, name: 'Preview Data', icon: FileCheck, description: 'Verifikasi' },
    { id: 3, name: 'Konfigurasi', icon: Settings, description: 'Data Sekolah' },
    { id: 4, name: 'Generate', icon: Download, description: 'Download Files' },
]

function App() {
    const { currentStep, setCurrentStep, error, setError } = useAppStore()
    const [notification, setNotification] = useState(null)

    // Watch for global errors
    useEffect(() => {
        if (error) {
            setNotification({ message: error, type: 'error' })
            // Clear store error after showing toast
            const timer = setTimeout(() => setError(null), 100)
            return () => clearTimeout(timer)
        }
    }, [error, setError])

    // Helper render function
    function renderStep() {
        switch (currentStep) {
            case 1: return <FileUploader />
            case 2: return <DataPreview />
            case 3: return <ConfigForm />
            case 4: return <GenerateProgress />
            default: return <FileUploader />
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] opacity-60 mix-blend-multiply"></div>
                <div className="absolute top-[-100px] right-0 w-[600px] h-[500px] bg-green-100/40 rounded-full blur-[80px] opacity-50 mix-blend-multiply"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-brand-600 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
                            <School className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-indigo-700 tracking-tight">
                                Manajemen SD Drawati
                            </h1>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">
                                SISTEM OTOMASI ASET SEKOLAH
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-blue-700">Production Ready v1.0</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Stepper Section */}
            <section className="relative z-10 bg-white/60 backdrop-blur-sm border-b border-slate-100 py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex justify-between items-center w-full">
                        {/* Connecting Line */}
                        <div className="absolute top-[22px] left-0 w-full h-[2px] bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-600 transition-all duration-700 ease-in-out"
                                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                            ></div>
                        </div>

                        {steps.map((step) => {
                            const isCompleted = currentStep > step.id
                            const isCurrent = currentStep === step.id
                            const Icon = step.icon

                            return (
                                <div key={step.id} className="flex flex-col items-center group cursor-default relative z-10">
                                    <div
                                        className={`
                                            w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-300
                                            ${isCompleted
                                                ? 'bg-brand-600 border-brand-600 shadow-md shadow-brand-200 scale-100'
                                                : isCurrent
                                                    ? 'bg-white border-brand-600 shadow-xl shadow-brand-100 scale-110'
                                                    : 'bg-white border-slate-200 text-slate-300'
                                            }
                                        `}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        ) : (
                                            <Icon className={`w-5 h-5 ${isCurrent ? 'text-brand-600' : 'text-slate-400'}`} />
                                        )}
                                    </div>
                                    <div className="mt-3 text-center">
                                        <p className={`text-sm font-bold transition-colors duration-300 ${isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>
                                            {step.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Card Container */}
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative min-h-[500px] transition-all duration-300">
                        <div className="p-8 md:p-12">
                            <PageTransition step={currentStep}>
                                {renderStep()}
                            </PageTransition>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                            <Info className="w-4 h-4" />
                            Butuh bantuan? Hubungi Administrator Sekolah
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-12 border-t border-slate-200 bg-white/50 backdrop-blur-sm py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm font-medium">© 2026 SDN DRAWATI 04. All rights reserved.</p>
                    <p className="text-xs text-slate-400 mt-2">Developed for excellence in education management.</p>
                </div>
            </footer>

            {/* Toasts */}
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    )
}

export default App
