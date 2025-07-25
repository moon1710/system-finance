'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    RefreshCw,
    Clock,
    Loader,
    CheckCircle,
    XCircle,
    Download,
    HelpCircle,
    DollarSign,
    Landmark,
    MessageSquare,
    AlertTriangle,
} from 'lucide-react'

// -----------------------------------------------------------------------------
// --- INTERFACES Y TIPOS ---
// (En un proyecto más grande, esto podría ir en un archivo `interfaces.ts`)
// -----------------------------------------------------------------------------
interface CuentaBancaria {
    id: string
    tipoCuenta: 'nacional' | 'internacional' | 'paypal'
    nombreBanco?: string
    clabe?: string
    numeroCuenta?: string
    emailPaypal?: string
    esPredeterminada: boolean
}

interface Retiro {
    id: string
    montoSolicitado: number
    estado: 'Pendiente' | 'Procesando' | 'Completado' | 'Rechazado'
    requiereRevision: boolean
    fechaSolicitud: string
    fechaActualizacion: string
    notasAdmin?: string
    urlComprobante?: string
    cuentaBancaria: {
        tipoCuenta: 'nacional' | 'internacional' | 'paypal'
        nombreBanco?: string
        clabe?: string
        numeroCuenta?: string
        emailPaypal?: string
    }
}

interface MobileRetiroCardProps {
    retiro: Retiro
    onDescargar: (id: string) => void
    onVerMotivo: (motivo: string) => void
}

interface RetiroModalProps {
    show: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent) => void
    formData: { monto: string; cuentaId: string; notas: string }
    setFormData: React.Dispatch<React.SetStateAction<{ monto: string; cuentaId: string; notas: string }>>
    cuentas: CuentaBancaria[]
    submitLoading: boolean
}


// -----------------------------------------------------------------------------
// --- FUNCIONES HELPERS ---
// (En un proyecto más grande, esto podría ir en un archivo `utils/formatters.ts`)
// -----------------------------------------------------------------------------
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

const formatEstado = (estado: Retiro['estado'], requiereRevision: boolean) => {
    let className = 'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full '
    let icon = null;

    switch (estado) {
        case 'Pendiente':
            className += 'bg-blue-100 text-blue-800'
            icon = <Clock className="w-3 h-3 mr-1.5" />
            break;
        case 'Procesando':
            className += 'bg-orange-100 text-orange-800'
            icon = <Loader className="w-3 h-3 mr-1.5 animate-spin" />
            break
        case 'Completado':
            className += 'bg-green-100 text-green-800'
            icon = <CheckCircle className="w-3 h-3 mr-1.5" />
            break
        case 'Rechazado':
            className += 'bg-red-100 text-red-800'
            icon = <XCircle className="w-3 h-3 mr-1.5" />
            break
        default:
            className += 'bg-gray-100 text-gray-800'
            icon = <HelpCircle className="w-3 h-3 mr-1.5" />
    }

    return (
        <span className={className}>
            {icon}
            {estado}
            {estado === 'Pendiente' && requiereRevision && <span className="ml-1.5" title="Requiere Revisión">⚠️</span>}
        </span>
    )
}


// -----------------------------------------------------------------------------
// --- SUB-COMPONENTES DE LA PÁGINA ---
// (En un proyecto más grande, cada uno iría en su propio archivo en /components)
// -----------------------------------------------------------------------------

// --- COMPONENTE DE TARJETA PARA MÓVIL ---
const MobileRetiroCard = ({ retiro, onDescargar, onVerMotivo }: MobileRetiroCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-4"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-lg text-gray-800">${retiro.montoSolicitado.toLocaleString()}</p>
                <p className="text-xs text-gray-500 font-mono">#{retiro.id.slice(-8)}</p>
            </div>
            {formatEstado(retiro.estado, retiro.requiereRevision)}
        </div>
        <div>
            <p className="text-xs text-gray-500">Cuenta Destino</p>
            <p className="font-medium text-sm text-gray-800">{formatCuentaInfo(retiro.cuentaBancaria)}</p>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Solicitado: {new Date(retiro.fechaSolicitud).toLocaleDateString('es-MX')}</span>
            <span>Últ. Act: {new Date(retiro.fechaActualizacion).toLocaleDateString('es-MX')}</span>
        </div>

        {(retiro.estado === 'Completado' || retiro.estado === 'Rechazado') && (
            <div className="border-t border-gray-200 pt-3 flex justify-end items-center gap-2">
                {retiro.estado === 'Completado' && retiro.urlComprobante && (
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => onDescargar(retiro.id)} className="flex items-center text-xs px-3 py-1.5 rounded-md bg-green-500 text-white hover:bg-green-600">
                        <Download className="w-3 h-3 mr-1.5" />
                        Comprobante
                    </motion.button>
                )}
                {retiro.estado === 'Rechazado' && retiro.notasAdmin && (
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => onVerMotivo(retiro.notasAdmin || '')} className="flex items-center text-xs px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600">
                        <HelpCircle className="w-3 h-3 mr-1.5" />
                        Ver Motivo
                    </motion.button>
                )}
            </div>
        )}
    </motion.div>
);


// --- COMPONENTES DE FORMULARIO PARA EL MODAL ---
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


// --- COMPONENTE DE MODAL DE RETIRO ---
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
                            <button className="text-gray-500 hover:text-gray-800" onClick={onClose}><XCircle /></button>
                        </header>

                        <form id="retiro-form" onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto" autoComplete="off">
                            <div className="bg-blue-100/60 border border-blue-200 text-blue-800 text-sm rounded-lg p-3 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-bold">Requisitos a cumplir:</h3>
                                    <ul className="list-disc list-inside mt-1">
                                        <li>Monto mínimo de retiro: $100.00 USD.</li>
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


// -----------------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
// -----------------------------------------------------------------------------
export default function RetirosPage() {
    const [retiros, setRetiros] = useState<Retiro[]>([])
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ monto: '', cuentaId: '', notas: '' })
    const [submitLoading, setSubmitLoading] = useState(false)
    const [filterType, setFilterType] = useState('activos'); // 'activos' | 'historial'
    const router = useRouter()

    useEffect(() => {
        Promise.all([
            fetchRetiros(),
            fetchCuentas()
        ]).finally(() => setLoading(false))
    }, [])

    const fetchRetiros = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/retiros')
            if (!res.ok) {
                if (res.status === 401) router.push('/login')
                return
            }
            const data = await res.json()
            setRetiros(data.retiros || [])
        } catch (error) {
            console.error('Error al obtener retiros:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchCuentas = async () => {
        try {
            const res = await fetch('/api/cuentas')
            if (!res.ok) return
            const data = await res.json()
            setCuentas(data.cuentas || [])
        } catch (error) {
            console.error('Error al obtener cuentas:', error)
        }
    }

    const resetForm = () => {
        setFormData({ monto: '', cuentaId: '', notas: '' })
    }

    const handleOpenModal = () => {
        if (cuentas.length === 0) {
            alert('Primero debes agregar al menos una cuenta bancaria para solicitar un retiro.')
            router.push('/artista/cuentas')
            return
        }
        resetForm()
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitLoading(true)
        try {
            const res = await fetch('/api/retiros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monto: parseFloat(formData.monto),
                    cuentaId: formData.cuentaId,
                    notas: formData.notas || undefined
                })
            })
            const data = await res.json()
            if (res.ok) {
                let mensaje = data.mensaje
                if (data.alertas && data.alertas.length > 0) {
                    mensaje += '\n\nAlertas: ' + data.alertas.join(', ')
                }
                alert(mensaje)
                setShowModal(false)
                resetForm()
                fetchRetiros()
            } else {
                alert(data.error || 'Error al crear solicitud de retiro')
            }
        } catch (error) {
            alert('Error al crear solicitud de retiro')
        } finally {
            setSubmitLoading(false)
        }
    }

    const descargarComprobante = async (retiroId: string) => {
        try {
            const res = await fetch(`/api/retiros/${retiroId}/comprobante`);

            if (!res.ok) {
                const error = await res.json();
                alert(error.error || 'Error al descargar comprobante');
                return;
            }

            // 1. Obtener el header 'Content-Disposition' de la respuesta.
            const contentDisposition = res.headers.get('Content-Disposition');
            let nombreArchivo = `comprobante_retiro_${retiroId}`; // Fallback

            // 2. Extraer el nombre del archivo con una expresión regular.
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="([^"]+)"/);
                if (match && match[1]) {
                    nombreArchivo = match[1];
                }
            }

            // 3. Crear el blob y la URL de objeto como antes.
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // 4. Usar el nombre de archivo extraído para la descarga.
            a.download = nombreArchivo;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error en la descarga:", error);
            alert('Un error inesperado ocurrió al intentar descargar el comprobante.');
        }
    };

    const handleVerMotivo = (motivo: string) => {
        alert(`Motivo del rechazo:\n\n${motivo}`);
    }

    const metrics = [
        { title: 'Pendientes', value: retiros.filter(r => r.estado === 'Pendiente').length.toString(), icon: Clock },
        { title: 'Procesando', value: retiros.filter(r => r.estado === 'Procesando').length.toString(), icon: Loader },
        { title: 'Completados', value: retiros.filter(r => r.estado === 'Completado').length.toString(), icon: CheckCircle },
        { title: 'Total Retirado (USD)', value: `$${retiros.filter(r => r.estado === 'Completado').reduce((sum, r) => sum + r.montoSolicitado, 0).toLocaleString()}`, icon: DollarSign }
    ];

    const retirosFiltrados = retiros.filter(r => {
        if (filterType === 'activos') {
            return r.estado === 'Pendiente' || r.estado === 'Procesando';
        }
        if (filterType === 'historial') {
            return r.estado === 'Completado' || r.estado === 'Rechazado';
        }
        return true;
    });

    if (loading && retiros.length === 0) {
        return (
            <div className="p-4 md:p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mis Retiros</h1>
                    <p className="text-sm text-gray-500">Solicita y gestiona los retiros de tus ganancias.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <motion.button whileHover={{ scale: 1.05 }} onClick={fetchRetiros} className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-100 transition">
                        <RefreshCw className="w-4 h-4 mr-2" />Actualizar
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={handleOpenModal} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition">
                        <Plus className="w-4 h-4 mr-2" />Solicitar Retiro
                    </motion.button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, index) => (
                    <motion.div key={index} whileHover={{ y: -5 }} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition">
                        <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg bg-blue-100`}>
                                <m.icon className={`w-5 h-5 text-blue-600 ${m.title === 'Procesando' && 'animate-spin'}`} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">{m.value}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{m.title}</p>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setFilterType('activos')} className={`px-4 py-2 text-sm font-medium transition ${filterType === 'activos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        Activos
                    </button>
                    <button onClick={() => setFilterType('historial')} className={`px-4 py-2 text-sm font-medium transition ${filterType === 'historial' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        Historial
                    </button>
                </div>
            </div>

            <div>
                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID Retiro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/5">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-2/5">Cuenta Destino</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/5">Fechas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/5">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {retirosFiltrados.length > 0 ? retirosFiltrados.map((retiro) => (
                                <tr key={retiro.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">#{retiro.id.slice(-8)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${retiro.montoSolicitado.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatCuentaInfo(retiro.cuentaBancaria)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>Sol: {new Date(retiro.fechaSolicitud).toLocaleDateString('es-MX')}</div>
                                        <div>Act: {new Date(retiro.fechaActualizacion).toLocaleDateString('es-MX')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-between">
                                            {formatEstado(retiro.estado, retiro.requiereRevision)}
                                            <div className="flex items-center space-x-2 ml-4">
                                                {retiro.estado === 'Completado' && retiro.urlComprobante && (
                                                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => descargarComprobante(retiro.id)} className="p-2 text-green-600 hover:text-green-800" title="Descargar Comprobante"><Download className="w-4 h-4" /></motion.button>
                                                )}
                                                {retiro.estado === 'Rechazado' && retiro.notasAdmin && (
                                                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleVerMotivo(retiro.notasAdmin || '')} className="p-2 text-red-600 hover:text-red-800" title="Ver Motivo de Rechazo"><HelpCircle className="w-4 h-4" /></motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-500">No se encontraron retiros en esta categoría.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden space-y-4">
                    {retirosFiltrados.length > 0 ? (
                        retirosFiltrados.map(retiro => (
                            <MobileRetiroCard
                                key={retiro.id}
                                retiro={retiro}
                                onDescargar={descargarComprobante}
                                onVerMotivo={handleVerMotivo}
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>No se encontraron retiros en esta categoría.</p>
                        </div>
                    )}
                </div>
            </div>

            <RetiroModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                cuentas={cuentas}
                submitLoading={submitLoading}
            />
        </div>
    )
}