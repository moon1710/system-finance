// /src/components/admin/ModalesAdmin.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
    XCircle,
    Upload,
    Eye,
    X,
    AlertCircle,
    FileText
} from 'lucide-react'

interface ModalesAdminProps {
    showRechazarModal: boolean
    setShowRechazarModal: (show: boolean) => void
    showComprobanteModal: boolean
    setShowComprobanteModal: (show: boolean) => void
    showReasonModal: boolean
    setShowReasonModal: (show: boolean) => void
    solicitudSeleccionada: string
    setSolicitudSeleccionada: (id: string) => void
    motivoRechazo: string
    setMotivoRechazo: (motivo: string) => void
    archivoComprobante: File | null
    setArchivoComprobante: (file: File | null) => void
    submitLoading: boolean
    setSubmitLoading: (loading: boolean) => void
    reasonToShow: string
    onRefresh: () => void
}

export default function ModalesAdmin({
    showRechazarModal,
    setShowRechazarModal,
    showComprobanteModal,
    setShowComprobanteModal,
    showReasonModal,
    setShowReasonModal,
    solicitudSeleccionada,
    setSolicitudSeleccionada,
    motivoRechazo,
    setMotivoRechazo,
    archivoComprobante,
    setArchivoComprobante,
    submitLoading,
    setSubmitLoading,
    reasonToShow,
    onRefresh
}: ModalesAdminProps) {

    const handleRechazar = async () => {
        if (!motivoRechazo.trim() || motivoRechazo.trim().length < 10) {
            alert('El motivo de rechazo debe tener al menos 10 caracteres.')
            return
        }

        setSubmitLoading(true)
        try {
            const res = await fetch(`/api/retiros/${solicitudSeleccionada}/rechazar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo: motivoRechazo }),
            })
            const data = await res.json()

            if (res.ok) {
                alert('Retiro rechazado exitosamente.')
                setShowRechazarModal(false)
                setMotivoRechazo('')
                setSolicitudSeleccionada('')
                onRefresh()
            } else {
                alert(data.error || 'Error al rechazar el retiro.')
            }
        } catch (error) {
            alert('Error de red al intentar rechazar el retiro.')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleSubirComprobante = async () => {
        if (!archivoComprobante) {
            alert('Debes seleccionar un archivo de comprobante.')
            return
        }

        if (archivoComprobante.size > 5 * 1024 * 1024) {
            alert('El archivo es demasiado grande. Tamaño máximo permitido es 5MB.')
            return
        }

        setSubmitLoading(true)
        try {
            const formData = new FormData()
            formData.append('comprobante', archivoComprobante)

            const res = await fetch(`/api/retiros/${solicitudSeleccionada}/comprobante`, {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()

            if (res.ok) {
                alert('Comprobante subido y retiro completado exitosamente.')
                setShowComprobanteModal(false)
                setArchivoComprobante(null)
                setSolicitudSeleccionada('')
                onRefresh()
            } else {
                alert(data.error || 'Error al subir el comprobante.')
            }
        } catch (error) {
            alert('Error de red al intentar subir el comprobante.')
        } finally {
            setSubmitLoading(false)
        }
    }

    return (
        <>
            {/* Modal de Rechazo */}
            <AnimatePresence>
                {showRechazarModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-xl p-5 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                                    <XCircle className="w-5 h-5" />
                                    Rechazar Solicitud
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowRechazarModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Motivo del rechazo <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={motivoRechazo}
                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                    rows={3}
                                    placeholder="Explica detalladamente por qué se rechaza esta solicitud..."
                                    maxLength={1000}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {motivoRechazo.length}/1000 caracteres (mínimo 10)
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowRechazarModal(false)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm"
                                    disabled={submitLoading}
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleRechazar}
                                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                                    disabled={submitLoading || motivoRechazo.trim().length < 10}
                                >
                                    {submitLoading ? 'Rechazando...' : 'Rechazar'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Subir Comprobante */}
            <AnimatePresence>
                {showComprobanteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-xl p-5 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Subir Comprobante
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowComprobanteModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">Requisitos</span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    • Formatos: PDF, JPG, PNG<br />
                                    • Tamaño máximo: 5MB
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Archivo de comprobante <span className="text-red-500">*</span>
                                </label>
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    className="relative border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors"
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setArchivoComprobante(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {archivoComprobante ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm font-medium">{archivoComprobante.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <Upload className="w-6 h-6 text-slate-400" />
                                            <span className="text-sm text-slate-600">Haz clic para seleccionar archivo</span>
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowComprobanteModal(false)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm"
                                    disabled={submitLoading}
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSubirComprobante}
                                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                                    disabled={submitLoading || !archivoComprobante}
                                >
                                    {submitLoading ? 'Subiendo...' : 'Subir y Completar'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Ver Motivo */}
            <AnimatePresence>
                {showReasonModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-xl p-5 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    Motivo de Rechazo
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowReasonModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-slate-700 leading-relaxed text-sm">{reasonToShow}</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowReasonModal(false)}
                                className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
                            >
                                Cerrar
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}