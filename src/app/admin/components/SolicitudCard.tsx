// /src/components/admin/SolicitudCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Wallet,
    Clock,
    RefreshCw,
    Upload,
    FileText,
    Calendar,
    Eye,
    Copy,
    Check
} from 'lucide-react'
import paisesData from '@/data/paises.json'

// --- Interfaces ---
interface Alerta {
    id: string
    tipo: string
    mensaje: string
    resuelta: boolean
}

interface CuentaBancaria {
    tipoCuenta: string
    nombreBanco?: string
    nombreTitular: string
    clabe?: string
    numeroRuta?: string
    numeroCuenta?: string
    swift?: string
    emailPaypal?: string
    pais?: string
}

interface Solicitud {
    id: string
    montoSolicitado: number
    estado: 'Pendiente' | 'Procesando' | 'Completado' | 'Rechazado'
    fechaSolicitud: string
    fechaActualizacion: string
    notasAdmin?: string
    urlComprobante?: string
    usuario: {
        nombreCompleto: string
        email: string
    }
    cuentaBancaria: CuentaBancaria
    alertas: Alerta[]
}

// --- Utility Functions ---
const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const getStatusConfig = (estado: string) => {
    const configs = {
        Pendiente: {
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            icon: Clock,
            label: 'Pendiente'
        },
        Procesando: {
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            icon: RefreshCw,
            label: 'Procesando'
        },
        Completado: {
            color: 'bg-green-50 text-green-700 border-green-200',
            icon: CheckCircle2,
            label: 'Completado'
        },
        Rechazado: {
            color: 'bg-red-50 text-red-700 border-red-200',
            icon: XCircle,
            label: 'Rechazado'
        }
    }
    return configs[estado] || configs.Pendiente
}

// --- Components ---
const StatusBadge = ({ estado, alertas = [] }: { estado: string, alertas: Alerta[] }) => {
    const config = getStatusConfig(estado)
    const StatusIcon = config.icon
    const hasAlerts = alertas.length > 0

    return (
        <div className="flex items-center gap-2">
            <motion.div
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}
            >
                <StatusIcon className="w-4 h-4" />
                {config.label}
            </motion.div>
            {hasAlerts && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200"
                >
                    <AlertTriangle className="w-3 h-3" />
                    {alertas.length}
                </motion.div>
            )}
        </div>
    )
}

const CopyButton = ({
    text,
    field,
    copiedField,
    onCopy,
    className = ""
}: {
    text: string
    field: string
    copiedField: string | null
    onCopy: (text: string, field: string) => void
    className?: string
}) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onCopy(text, field)}
        className={`ml-2 p-1 text-slate-400 hover:text-slate-600 rounded ${className}`}
        title="Copiar"
    >
        {copiedField === field ? (
            <Check className="w-3 h-3 text-green-500" />
        ) : (
            <Copy className="w-3 h-3" />
        )}
    </motion.button>
)

// --- Función para generar información completa ---
const generateAccountInfo = (cuenta: CuentaBancaria, nombreArtista: string, monto: number, retiroId: string) => {
    const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    let info = `=== INFORMACIÓN DE TRANSFERENCIA ===\n`
    info += `Fecha: ${fecha}\n`
    info += `Artista: ${nombreArtista}\n`
    info += `Monto: ${formatCurrency(monto)}\n`
    info += `Titular: ${cuenta.nombreTitular}\n`
    info += `Tipo de cuenta: ${cuenta.tipoCuenta.toUpperCase()}\n\n`

    // === CUENTA NACIONAL (MÉXICO) ===
    if (cuenta.tipoCuenta === 'nacional') {
        info += `=== DATOS BANCARIOS MÉXICO ===\n`

        if (cuenta.nombreBanco) {
            info += `Banco: ${cuenta.nombreBanco}\n`
        }

        if (cuenta.clabe) {
            info += `CLABE: ${cuenta.clabe}\n`
            info += `CLABE (con espacios): ${cuenta.clabe.replace(/(.{4})/g, '$1 ').trim()}\n`
        }

        if (cuenta.numeroCuenta) {
            info += `Número de Cuenta: ${cuenta.numeroCuenta}\n`
        }

        info += `\n=== INSTRUCCIONES TRANSFERENCIA MÉXICO ===\n`
        info += `1. Usar CLABE para transferencias SPEI\n`
        info += `2. Verificar nombre del titular exacto\n`
        info += `3. Guardar comprobante de transferencia\n`
    }

    // === CUENTA INTERNACIONAL (USA/EUROPA) ===
    else if (cuenta.tipoCuenta === 'internacional') {
        info += `=== DATOS BANCARIOS INTERNACIONAL ===\n`

        if (cuenta.nombreBanco) {
            info += `Banco: ${cuenta.nombreBanco}\n`
        }

        if (cuenta.numeroRuta) {
            info += `Routing Number (ABA): ${cuenta.numeroRuta}\n`
        }

        if (cuenta.numeroCuenta) {
            info += `Número de Cuenta: ${cuenta.numeroCuenta}\n`
        }

        if (cuenta.swift) {
            info += `Código SWIFT/BIC: ${cuenta.swift}\n`
        }

        info += `\n=== INFORMACIÓN ADICIONAL ===\n`
        info += `Titular: ${cuenta.nombreTitular}\n`
        info += `Moneda: USD (Dólares Americanos)\n`

        info += `\n=== INSTRUCCIONES WIRE TRANSFER ===\n`
        info += `1. Usar Routing Number para transferencias ACH (domésticas USA)\n`
        info += `2. Usar SWIFT para transferencias internacionales\n`
        info += `3. Verificar fees de transferencia internacional\n`
        info += `4. Tiempo estimado: 1-5 días hábiles\n`
        info += `5. Guardar número de referencia de la transferencia\n`
    }

    // === CUENTA PAYPAL ===
    else if (cuenta.tipoCuenta === 'paypal') {
        info += `=== DATOS PAYPAL ===\n`

        if (cuenta.emailPaypal) {
            info += `Email PayPal: ${cuenta.emailPaypal}\n`
        }

        info += `Titular: ${cuenta.nombreTitular}\n`
        info += `Plataforma: PayPal\n`

        info += `\n=== INSTRUCCIONES PAYPAL ===\n`
        info += `1. Enviar dinero como "Amigos y Familia" (si aplica)\n`
        info += `2. O usar "Bienes y Servicios" según política\n`
        info += `3. Verificar email exacto del destinatario\n`
        info += `4. Incluir nota con referencia del pago\n`
        info += `5. Capturar pantalla de confirmación\n`
        info += `6. Verificar que no haya límites en la cuenta destino\n`
    }

    // === INFORMACIÓN GENERAL PARA TODAS LAS CUENTAS ===
    info += `\n=== REFERENCIAS IMPORTANTES ===\n`
    info += `ID Retiro: ${retiroId}\n`
    info += `Concepto: Pago de regalías - ${nombreArtista}\n`
    info += `Fecha de solicitud: ${fecha}\n`

    info += `\n=== CHECKLIST POST-TRANSFERENCIA ===\n`
    info += `[ ] Transferencia realizada\n`
    info += `[ ] Comprobante guardado\n`
    info += `[ ] Comprobante subido al sistema\n`
    info += `[ ] Artista notificado\n`
    info += `[ ] Estado actualizado a "Completado"\n`

    return info
}

// --- Componente principal ---
interface SolicitudCardProps {
    solicitud: Solicitud
    onAction: (type: string, data: any) => void
}

export default function SolicitudCard({ solicitud, onAction }: SolicitudCardProps) {
    const { id, usuario, montoSolicitado, estado, alertas, cuentaBancaria, urlComprobante, notasAdmin, fechaSolicitud } = solicitud
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
        } catch (err) {
            console.error('Error al copiar:', err)
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300 group"
        >
            {/* Header con usuario y estado */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {usuario.nombreCompleto}
                        </h3>
                        <p className="text-slate-500 text-sm">{usuario.email}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(fechaSolicitud).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <div className="flex items-center gap-1">
                                <p className="text-xs text-slate-400">ID:</p>
                                <p className="text-xs text-slate-600 font-mono">{id.slice(-8)}</p>
                                <CopyButton
                                    text={id}
                                    field="id"
                                    copiedField={copiedField}
                                    onCopy={copyToClipboard}
                                    className="p-0.5"
                                />
                            </div>
                        </div>
                    </div>
                    <StatusBadge estado={estado} alertas={alertas} />
                </div>

                {/* Información principal */}
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Monto</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(montoSolicitado)}</p>
                    </div>

                    {/* Información detallada de la cuenta */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-slate-500" />
                                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                                    Cuenta {cuentaBancaria.tipoCuenta}
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const accountInfo = generateAccountInfo(cuentaBancaria, usuario.nombreCompleto, montoSolicitado, id)
                                    copyToClipboard(accountInfo, 'account-full')
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                                title="Copiar toda la información"
                            >
                                {copiedField === 'account-full' ? (
                                    <>
                                        <Check className="w-3 h-3 text-green-500" />
                                        <span className="text-green-600">Copiado</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copiar todo</span>
                                    </>
                                )}
                            </motion.button>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-slate-500">Titular</p>
                                <div className="flex items-center">
                                    <p className="text-sm font-medium text-slate-700">{cuentaBancaria.nombreTitular}</p>
                                    <CopyButton
                                        text={cuentaBancaria.nombreTitular}
                                        field="titular"
                                        copiedField={copiedField}
                                        onCopy={copyToClipboard}
                                    />
                                </div>
                            </div>

                            {/* Información específica por tipo de cuenta */}
                            {cuentaBancaria.tipoCuenta === 'nacional' && (
                                <>
                                    {cuentaBancaria.nombreBanco && (
                                        <div>
                                            <p className="text-xs text-slate-500">Banco</p>
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-slate-700">{cuentaBancaria.nombreBanco}</p>
                                                <CopyButton
                                                    text={cuentaBancaria.nombreBanco}
                                                    field="banco"
                                                    copiedField={copiedField}
                                                    onCopy={copyToClipboard}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {cuentaBancaria.clabe && (
                                        <div>
                                            <p className="text-xs text-slate-500">CLABE</p>
                                            <div className="flex items-center">
                                                <p className="text-sm font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded border">
                                                    {cuentaBancaria.clabe}
                                                </p>
                                                <CopyButton
                                                    text={cuentaBancaria.clabe}
                                                    field="clabe"
                                                    copiedField={copiedField}
                                                    onCopy={copyToClipboard}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {cuentaBancaria.tipoCuenta === 'internacional' && (
                                <>
                                    {cuentaBancaria.nombreBanco && (
                                        <div>
                                            <p className="text-xs text-slate-500">Banco</p>
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-slate-700">{cuentaBancaria.nombreBanco}</p>
                                                <CopyButton
                                                    text={cuentaBancaria.nombreBanco}
                                                    field="banco"
                                                    copiedField={copiedField}
                                                    onCopy={copyToClipboard}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {cuentaBancaria.pais && (
                                        <div>
                                            <p className="text-xs text-slate-500">País</p>
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {(() => {
                                                        const paisEncontrado = paisesData.find(p => p.code === cuentaBancaria.pais)
                                                        return paisEncontrado ? paisEncontrado.name : cuentaBancaria.pais
                                                    })()}
                                                </p>
                                                <CopyButton text={cuentaBancaria.pais} field="pais" />
                                            </div>
                                        </div>
                                    )}
                                    {cuentaBancaria.numeroRuta && (
                                        <div>
                                            <p className="text-xs text-slate-500">Routing Number</p>
                                            <div className="flex items-center">
                                                <p className="text-sm font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded border">
                                                    {cuentaBancaria.numeroRuta}
                                                </p>
                                                <CopyButton
                                                    text={cuentaBancaria.numeroRuta}
                                                    field="routing"
                                                    copiedField={copiedField}
                                                    onCopy={copyToClipboard}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {cuentaBancaria.numeroCuenta && (
                                        <div>
                                            <p className="text-xs text-slate-500">Número de Cuenta</p>
                                            <div className="flex items-center">
                                                <p className="text-sm font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded border">
                                                    {cuentaBancaria.numeroCuenta}
                                                </p>
                                                <CopyButton
                                                    text={cuentaBancaria.numeroCuenta}
                                                    field="cuenta"
                                                    copiedField={copiedField}
                                                    onCopy={copyToClipboard}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {cuentaBancaria.swift && (
                                        <div>
                                            <p className="text-xs text-slate-500">SWIFT</p>
                                            <div className="flex items-center">
                                                <p className="text-sm font-mono font-medium text-slate-900 bg-white px-2 py-1 rounded border">
                                                    {cuentaBancaria.swift}
                                                </p>
                                                <CopyButton
                                                    text={cuentaBancaria.swift}
                                                    field="swift"
                                                    copiedField={copiedField}
                                                    onCopy={copyToClipboard}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {cuentaBancaria.tipoCuenta === 'paypal' && cuentaBancaria.emailPaypal && (
                                <div>
                                    <p className="text-xs text-slate-500">Email PayPal</p>
                                    <div className="flex items-center">
                                        <p className="text-sm font-medium text-slate-900 bg-white px-2 py-1 rounded border">
                                            {cuentaBancaria.emailPaypal}
                                        </p>
                                        <CopyButton
                                            text={cuentaBancaria.emailPaypal}
                                            field="paypal"
                                            copiedField={copiedField}
                                            onCopy={copyToClipboard}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Alertas */}
                {alertas && alertas.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-800">Alertas detectadas</span>
                        </div>
                        <div className="space-y-0.5">
                            {alertas.map((alerta) => (
                                <p key={alerta.id} className="text-xs text-yellow-700">
                                    • {alerta.mensaje}
                                </p>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Actions */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
                <div className="flex items-center justify-end gap-2">
                    {estado === 'Pendiente' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onAction('approve', id)}
                                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Aprobar
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onAction('reject', solicitud)}
                                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                Rechazar
                            </motion.button>
                        </>
                    )}
                    {estado === 'Procesando' && (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onAction('upload', solicitud)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Subir Comprobante
                        </motion.button>
                    )}
                    {estado === 'Completado' && urlComprobante && (
                        <motion.a
                            whileHover={{ scale: 1.03 }}
                            href={`/api/retiros/${id}/comprobante`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Ver Comprobante
                        </motion.a>
                    )}
                    {estado === 'Rechazado' && notasAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onAction('viewReason', { motivo: notasAdmin })}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Ver Motivo
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}