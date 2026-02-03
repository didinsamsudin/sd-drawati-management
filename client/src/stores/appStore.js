import { create } from 'zustand'

const useAppStore = create((set) => ({
    // Navigation
    currentStep: 1,
    setCurrentStep: (step) => set({ currentStep: step }),

    // Upload data
    uploadedFile: null,
    setUploadedFile: (file) => set({ uploadedFile: file }),

    // Parsed data from Excel
    parsedData: null,
    setParsedData: (data) => set({ parsedData: data }),

    // Configuration
    config: null,
    setConfig: (config) => set({ config }),

    // Saldo Awal
    saldoAwal: {},
    setSaldoAwal: (saldoAwal) => set({ saldoAwal }),

    // ===== ZERO HARDCODE: Dynamic Report Date =====
    // User can set this via date picker - defaults to end of current year
    tanggalLaporan: null, // ISO string format (e.g., "2025-12-31")
    setTanggalLaporan: (date) => set({ tanggalLaporan: date }),

    // ===== ZERO HARDCODE: Scanned Pejabat from Excel Footer =====
    scannedPejabat: null,
    setScannedPejabat: (pejabat) => set({ scannedPejabat: pejabat }),

    // ===== ZERO HARDCODE: Scanned Year from Excel =====
    scannedTahun: null,
    setScannedTahun: (tahun) => set({ scannedTahun: tahun }),

    // Generated files URLs
    generatedFiles: null,
    setGeneratedFiles: (files) => set({ generatedFiles: files }),

    // Progress
    progress: 0,
    setProgress: (progress) => set({ progress }),

    // Error handling
    error: null,
    setError: (error) => set({ error }),

    // Reset all
    reset: () =>
        set({
            currentStep: 1,
            uploadedFile: null,
            parsedData: null,
            saldoAwal: {},
            tanggalLaporan: null,
            scannedPejabat: null,
            scannedTahun: null,
            generatedFiles: null,
            progress: 0,
            error: null,
        }),
}))

export default useAppStore
