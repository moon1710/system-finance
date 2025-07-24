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
    Check,
    User,
    Building
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
    nombreTitular: string
    nombreBanco?: string
    clabe?: string
    tipoCuentaNacional?: string
    numeroCuenta?: string
    swift?: string
    codigoABA?: string
    tipoCuentaInternacional?: string
    pais?: string
    emailPaypal?: string
    direccionBeneficiario?: string
    ciudadBeneficiario?: string
    estadoBeneficiario?: string
    codigoPostalBeneficiario?: string
    paisBeneficiario?: string
    direccionBanco?: string
    ciudadBanco?: string
    estadoBanco?: string
    codigoPostalBanco?: string
    paisBanco?: string
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

const formatMySQLDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getStatusConfig = (estado: string) => {
    const configs = {
        Pendiente: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, label: 'Pendiente' },
        Procesando: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: RefreshCw, label: 'Procesando' },
        Completado: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2, label: 'Completado' },
        Rechazado: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Rechazado' }
    }
    return configs[estado] || configs.Pendiente
}

const getPaisNombre = (code?: string) => {
    if (!code) return undefined;
    return paisesData.find(p => p.code === code)?.name || code;
}

const generateAccountInfo = (cuenta: CuentaBancaria, nombreArtista: string, monto: number, retiroId: string, solicitudDate: string) => {
    const formattedSolicitudDate = formatMySQLDateTime(solicitudDate);
    let info = `=== INFORMACIÓN DE TRANSFERENCIA ===\n`;
    info += `Fecha Solicitud: ${formattedSolicitudDate}\n`;
    info += `Artista: ${nombreArtista}\n`;
    info += `Monto: ${formatCurrency(monto)}\n`;
    info += `ID Retiro: ${retiroId}\n\n`;

    info += `=== DATOS DEL BENEFICIARIO ===\n`;
    info += `Titular: ${cuenta.nombreTitular}\n`;
    if (cuenta.direccionBeneficiario) {
        const direccionCompleta = [
            cuenta.direccionBeneficiario,
            cuenta.ciudadBeneficiario,
            cuenta.estadoBeneficiario,
            cuenta.codigoPostalBeneficiario,
            getPaisNombre(cuenta.paisBeneficiario)
        ].filter(Boolean).join(', ');
        info += `Dirección Beneficiario: ${direccionCompleta}\n`;
    }
    info += `\n`;

    info += `=== DATOS DE LA CUENTA (${cuenta.tipoCuenta.toUpperCase()}) ===\n`;

    if (cuenta.tipoCuenta === 'nacional') {
        if (cuenta.nombreBanco) info += `Banco: ${cuenta.nombreBanco}\n`;
        if (cuenta.clabe) info += `CLABE: ${cuenta.clabe}\n`;
        if (cuenta.numeroCuenta) info += `Número de Cuenta: ${cuenta.numeroCuenta}\n`;
        if (cuenta.tipoCuentaNacional) info += `Tipo de Cuenta (Banco): ${cuenta.tipoCuentaNacional}\n`;
    } else if (cuenta.tipoCuenta === 'internacional') {
        if (cuenta.nombreBanco) info += `Banco: ${cuenta.nombreBanco}\n`;
        if (cuenta.swift) info += `Código SWIFT/BIC: ${cuenta.swift}\n`;
        if (cuenta.codigoABA) info += `Routing Number (ABA): ${cuenta.codigoABA}\n`;
        if (cuenta.numeroCuenta) info += `Número de Cuenta: ${cuenta.numeroCuenta}\n`;
        if (cuenta.tipoCuentaInternacional) info += `Tipo de Cuenta (Banco): ${cuenta.tipoCuentaInternacional}\n`;
        if (cuenta.direccionBanco) {
            const direccionBanco = [
                cuenta.direccionBanco,
                cuenta.ciudadBanco,
                cuenta.estadoBanco,
                cuenta.codigoPostalBanco,
                getPaisNombre(cuenta.paisBanco)
            ].filter(Boolean).join(', ');
            info += `Dirección Banco: ${direccionBanco}\n`;
        }
    } else if (cuenta.tipoCuenta === 'paypal') {
        if (cuenta.emailPaypal) info += `Email PayPal: ${cuenta.emailPaypal}\n`;
    }

    info += `\n=== CHECKLIST ===\n`;
    info += `[ ] Verificar datos del titular y la cuenta.\n`;
    info += `[ ] Realizar transferencia.\n`;
    info += `[ ] Guardar y subir comprobante.\n`;
    info += `[ ] Actualizar estado a "Completado".\n`;

    return info;
}

// --- Components ---
const StatusBadge = ({ estado, alertas = [] }: { estado: string, alertas: Alerta[] }) => {
    const config = getStatusConfig(estado)
    const StatusIcon = config.icon
    return (
        <div className="flex items-center gap-2">
            <motion.div
                whileHover={{ scale: 1.02 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}
            >
                <StatusIcon className="w-4 h-4" />
                {config.label}
            </motion.div>
            {alertas.length > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200"
                >
                    <AlertTriangle className="w-3 h-3" />
                    {alertas.length}
                </motion.div>
            )}
        </div>
    )
}

const CopyButton = ({ text, field, copiedField, onCopy, className = "" }: {
    text: string;
    field: string;
    copiedField: string | null;
    onCopy: (text: string, field: string) => void;
    className?: string;
}) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onCopy(text, field)}
        className={`ml-2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors ${className}`}
        title="Copiar"
    >
        {copiedField === field ?
            <Check className="w-3 h-3 text-green-500" /> :
            <Copy className="w-3 h-3" />
        }
    </motion.button>
)

const DataField = ({ label, value, fieldName, onCopy, copiedField, isMono = false }: {
    label: string;
    value?: string;
    fieldName: string;
    onCopy: (text: string, field: string) => void;
    copiedField: string | null;
    isMono?: boolean;
}) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <div className="flex items-center">
                <p className={`text-sm font-medium text-slate-700 ${isMono ? 'font-mono bg-white px-2 py-1 rounded border text-xs' : ''}`}>
                    {value}
                </p>
                <CopyButton text={value} field={fieldName} copiedField={copiedField} onCopy={onCopy} />
            </div>
        </div>
    );
};

const AddressBlock = ({ title, icon: Icon, address }: {
    title: string;
    icon: React.ElementType;
    address: any;
}) => {
    const { direccion, ciudad, estado, codigoPostal, paisCode } = address;
    const paisNombre = paisCode ? getPaisNombre(paisCode) : undefined;
    if (!direccion && !ciudad && !estado && !codigoPostal && !paisNombre) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</h4>
            </div>
            <div className="space-y-1 pl-5 text-sm text-slate-600">
                {direccion && <p>{direccion}</p>}
                {(ciudad || estado || codigoPostal) &&
                    <p>{[ciudad, estado, codigoPostal].filter(Boolean).join(', ')}</p>
                }
                {paisNombre && <p className="text-slate-500">{paisNombre}</p>}
            </div>
        </div>
    );
};

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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200"
        >
            {/* Header */}
            <div className="p-4">
                {/* Header Info - Más compacto */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between sm:block">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate text-lg">
                                    {usuario.nombreCompleto}
                                </h3>
                                <p className="text-slate-500 text-sm truncate">{usuario.email}</p>
                            </div>
                            {/* Amount integrado en header para móviles */}
                            <div className="sm:hidden flex-shrink-0 text-right ml-3">
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(montoSolicitado)}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatMySQLDateTime(fechaSolicitud)}
                            </p>
                            <div className="flex items-center gap-1">
                                <p className="text-xs text-slate-400">ID:</p>
                                <p className="text-xs text-slate-600 font-mono">{id.slice(-8)}</p>
                                <CopyButton text={id} field="id" copiedField={copiedField} onCopy={copyToClipboard} className="p-0.5" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge estado={estado} alertas={alertas} />
                        {/* Amount para desktop */}
                        <div className="hidden sm:block text-right">
                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(montoSolicitado)}</p>
                        </div>
                    </div>
                </div>

                {/* Account Info - Compacto */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-slate-500" />
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                                Cuenta {cuentaBancaria.tipoCuenta}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                const accountInfo = generateAccountInfo(cuentaBancaria, usuario.nombreCompleto, montoSolicitado, id, fechaSolicitud);
                                copyToClipboard(accountInfo, 'account-full');
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                            title="Copiar toda la información"
                        >
                            {copiedField === 'account-full' ? (
                                <>
                                    <Check className="w-3 h-3 text-green-500" />
                                    <span className="text-green-600 hidden sm:inline">Copiado</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    <span className="hidden sm:inline">Copiar todo</span>
                                </>
                            )}
                        </motion.button>
                    </div>

                    {/* Grid organizado para datos principales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DataField
                            label="Titular"
                            value={cuentaBancaria.nombreTitular}
                            fieldName="titular"
                            onCopy={copyToClipboard}
                            copiedField={copiedField}
                        />

                        {cuentaBancaria.tipoCuenta === 'nacional' && (
                            <>
                                <DataField label="Banco" value={cuentaBancaria.nombreBanco} fieldName="banco" onCopy={copyToClipboard} copiedField={copiedField} />
                                <DataField label="CLABE" value={cuentaBancaria.clabe} fieldName="clabe" onCopy={copyToClipboard} copiedField={copiedField} isMono />
                                <DataField label="Número de Cuenta" value={cuentaBancaria.numeroCuenta} fieldName="cuenta" onCopy={copyToClipboard} copiedField={copiedField} isMono />
                                {cuentaBancaria.tipoCuentaNacional && (
                                    <div className="sm:col-span-2">
                                        <DataField label="Tipo de Cuenta" value={cuentaBancaria.tipoCuentaNacional} fieldName="tipoNacional" onCopy={copyToClipboard} copiedField={copiedField} />
                                    </div>
                                )}
                            </>
                        )}

                        {cuentaBancaria.tipoCuenta === 'internacional' && (
                            <>
                                <DataField label="Banco" value={cuentaBancaria.nombreBanco} fieldName="banco" onCopy={copyToClipboard} copiedField={copiedField} />
                                <DataField label="País del Banco" value={getPaisNombre(cuentaBancaria.pais)} fieldName="pais" onCopy={copyToClipboard} copiedField={copiedField} />
                                <DataField label="SWIFT/BIC" value={cuentaBancaria.swift} fieldName="swift" onCopy={copyToClipboard} copiedField={copiedField} isMono />
                                <DataField label="Routing Number (ABA)" value={cuentaBancaria.codigoABA} fieldName="aba" onCopy={copyToClipboard} copiedField={copiedField} isMono />
                                <DataField label="Número de Cuenta" value={cuentaBancaria.numeroCuenta} fieldName="cuenta" onCopy={copyToClipboard} copiedField={copiedField} isMono />
                                {cuentaBancaria.tipoCuentaInternacional && (
                                    <DataField label="Tipo de Cuenta" value={cuentaBancaria.tipoCuentaInternacional} fieldName="tipoInternacional" onCopy={copyToClipboard} copiedField={copiedField} />
                                )}
                            </>
                        )}

                        {cuentaBancaria.tipoCuenta === 'paypal' && (
                            <div className="sm:col-span-2">
                                <DataField label="Email PayPal" value={cuentaBancaria.emailPaypal} fieldName="paypal" onCopy={copyToClipboard} copiedField={copiedField} isMono />
                            </div>
                        )}
                    </div>

                    {/* Direcciones compactas solo si existen */}
                    {(cuentaBancaria.direccionBeneficiario || cuentaBancaria.direccionBanco) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
                            <AddressBlock
                                title="Dirección del Beneficiario"
                                icon={User}
                                address={{
                                    direccion: cuentaBancaria.direccionBeneficiario,
                                    ciudad: cuentaBancaria.ciudadBeneficiario,
                                    estado: cuentaBancaria.estadoBeneficiario,
                                    codigoPostal: cuentaBancaria.codigoPostalBeneficiario,
                                    paisCode: cuentaBancaria.paisBeneficiario
                                }}
                            />
                            <AddressBlock
                                title="Dirección del Banco"
                                icon={Building}
                                address={{
                                    direccion: cuentaBancaria.direccionBanco,
                                    ciudad: cuentaBancaria.ciudadBanco,
                                    estado: cuentaBancaria.estadoBanco,
                                    codigoPostal: cuentaBancaria.codigoPostalBanco,
                                    paisCode: cuentaBancaria.paisBanco
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Alerts - Más compacto */}
                {alertas && alertas.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">
                                {alertas.length} Alerta{alertas.length > 1 ? 's' : ''} detectada{alertas.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-1">
                            {alertas.map((alerta) => (
                                <p key={alerta.id} className="text-sm text-yellow-700 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                                    {alerta.mensaje}
                                </p>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Actions - Más compacto */}
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {estado === 'Pendiente' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onAction('approve', id)}
                                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">Aprobar</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onAction('reject', solicitud)}
                                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">Rechazar</span>
                            </motion.button>
                        </>
                    )}

                    {estado === 'Procesando' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onAction('upload', solicitud)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Subir</span> Comprobante
                        </motion.button>
                    )}

                    {estado === 'Completado' && urlComprobante && (
                        <motion.a
                            whileHover={{ scale: 1.02 }}
                            href={`/api/retiros/${id}/comprobante`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ver</span> Comprobante
                        </motion.a>
                    )}

                    {estado === 'Rechazado' && notasAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onAction('viewReason', { motivo: notasAdmin })}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-all duration-200 flex items-center gap-1.5"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ver</span> Motivo
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}