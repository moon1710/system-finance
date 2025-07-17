// Archivo: RetiroModal.tsx o dentro de RetirosPage.tsx

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Landmark, MessageSquare, AlertTriangle, Loader } from 'lucide-react'

// --- INTERFACES Y TIPOS ---
interface CuentaBancaria {
    id: string
    tipoCuenta: 'nacional' | 'internacional' | 'paypal'
    nombreBanco?: string
    clabe?: string
    numeroCuenta?: string
    emailPaypal?: string
    esPredeterminada: boolean
    pais?: string
}

interface RetiroModalProps {
    show: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent) => void
    formData: { monto: string; cuentaId: string; notas: string }
    setFormData: React.Dispatch<React.SetStateAction<any>>
    cuentas: CuentaBancaria[]
    submitLoading: boolean
}

// --- HELPERS REUTILIZABLES ---
const formatCuentaInfo = (cuenta: any) => {
    switch (cuenta.tipoCuenta) {
        case 'nacional':
            return `${cuenta.nombreBanco} - ****${cuenta.clabe?.slice(-4)}`
        case 'internacional':
            return `${cuenta.nombreBanco} - ****${cuenta.numeroCuenta?.slice(-4)}`
        case 'paypal':
            return `PayPal - ${cuenta.emailPaypal}`
        default:
            return 'Información no disponible'
    }
}

// --- COMPONENTES DE FORMULARIO CON ICONOS ---
const FormInput = ({ label, icon, id, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">{icon}</div>
            <input id={id} className="block w-full rounded-lg border-gray-300 bg-white py-2.5 pl-11 pr-4 text-gray-800 shadow-sm transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" {...props} />
        </div>
    </div>
)

const FormSelect = ({ label, icon, id, children, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">{icon}</div>
            <select id={id} className="block w-full appearance-none rounded-lg border-gray-300 bg-white py-2.5 pl-11 pr-4 text-gray-800 shadow-sm transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" {...props}>
                {children}
            </select>
        </div>
    </div>
)

const FormTextarea = ({ label, icon, id, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className="relative">
            <div className="pointer-events-none absolute top-3.5 left-0 flex items-center pl-3.5">{icon}</div>
            <textarea id={id} className="block w-full rounded-lg border-gray-300 bg-white py-2.5 pl-11 pr-4 text-gray-800 shadow-sm transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" {...props} />
        </div>
    </div>
)

// --- COMPONENTE PRINCIPAL DEL MODAL ---
const RetiroModal: React.FC<RetiroModalProps> = ({ show, onClose, onSubmit, formData, setFormData, cuentas, submitLoading }) => {
    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative w-full max-w-lg bg-gray-50 rounded-2xl shadow-xl border flex flex-col max-h-[90vh]"
                    >
                        <header className="flex items-center justify-between p-5 border-b shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">Solicitar Retiro</h2>
                            <button className="text-gray-500 hover:text-gray-800" onClick={onClose}><X /></button>
                        </header>

                        <form id="retiro-form" onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto" autoComplete="off">
                            <div className="bg-blue-100/60 border border-blue-200 text-blue-800 text-sm rounded-lg p-3 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-bold">Requisitos a cumplir:</h3>
                                    <ul className="list-disc list-inside mt-1">
                                        <li>Monto mínimo de retiro: **$100.00 USD**.</li>
                                        <li>Máximo 3 solicitudes pendientes simultáneamente.</li>
                                    </ul>
                                </div>
                            </div>

                            <FormInput
                                label="Monto a retirar (USD) *"
                                id="monto"
                                icon={<DollarSign className="text-gray-400 w-5 h-5" />}
                                type="number"
                                required
                                min="100"
                                step="0.01"
                                placeholder="1500.00"
                                value={formData.monto}
                                onChange={(e: any) => setFormData({ ...formData, monto: e.target.value })}
                            />
                            <FormSelect
                                label="Cuenta de destino *"
                                id="cuentaId"
                                icon={<Landmark className="text-gray-400 w-5 h-5" />}
                                required
                                value={formData.cuentaId}
                                onChange={(e: any) => setFormData({ ...formData, cuentaId: e.target.value })}
                            >
                                <option value="" disabled>Selecciona una cuenta bancaria...</option>
                                {cuentas.map((cuenta) => (
                                    <option key={cuenta.id} value={cuenta.id}>
                                        {cuenta.esPredeterminada ? '⭐ ' : ''}
                                        {formatCuentaInfo(cuenta)}
                                    </option>
                                ))}
                            </FormSelect>

                            <FormTextarea
                                label="Notas (Opcional)"
                                id="notas"
                                icon={<MessageSquare className="text-gray-400 w-5 h-5" />}
                                rows={3}
                                placeholder="Información adicional para el equipo de finanzas..."
                                maxLength={500}
                                value={formData.notas}
                                onChange={(e: any) => setFormData({ ...formData, notas: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 text-right -mt-3">{formData.notas.length}/500</p>
                        </form>

                        <footer className="flex items-center justify-end gap-3 p-4 border-t bg-gray-100/50 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border rounded-lg hover:bg-gray-100 disabled:opacity-60"
                                disabled={submitLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="retiro-form"
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center min-w-[140px]"
                                disabled={submitLoading}
                            >
                                {submitLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Confirmar Solicitud'}
                            </button>
                        </footer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// Si decides usar un archivo separado, no olvides exportarlo:
export default RetiroModal;