'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader,
    Wallet,
    Clock,
    FileUp,
    Download,
    Eye,
    ChevronDown,
    RefreshCw,
    ShieldAlert,
    TrendingUp,
    DollarSign,
    Users,
    Filter,
    X,
    Upload,
    FileText,
    Calendar,
    AlertCircle,
    Search
} from 'lucide-react'

// --- Interfaces ---
interface Alerta {
    id: string
    tipo: string
    mensaje: string
    resuelta: boolean
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
    cuentaBancaria: {
        tipoCuenta: string
        nombreBanco?: string
        nombreTitular: string
    }
    alertas: Alerta[]
}

interface Estadisticas {
    total: number
    pendientes: number
    procesando: number
    completados: number
    rechazados: number
    conAlertas: number
    montoTotalPendiente: number
    montoTotalCompletado: number
}

// --- Componentes de UI ---
const StatCard = ({ icon: Icon, title, value, color, secondaryValue, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer group"
    >
        <div className="flex justify-between items-center mb-1.5">
            <div className={`p-1.5 rounded-md ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            {trend && (
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-1 py-0.5 rounded-full">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    {trend}
                </div>
            )}
        </div>
        <div>
            <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-0.5">{title}</h3>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            {secondaryValue && (
                <p className="text-xs text-slate-500">{secondaryValue}</p>
            )}
        </div>
    </motion.div>
)

const formatCurrency = (amount) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const getStatusConfig = (estado) => {
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

const StatusBadge = ({ estado, alertas = [] }) => {
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

// --- Componente de Solicitud Card ---
const SolicitudCard = ({ solicitud, onAction }) => {
    const { id, usuario, montoSolicitado, estado, alertas, cuentaBancaria, urlComprobante, notasAdmin, fechaSolicitud } = solicitud

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
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(fechaSolicitud).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <StatusBadge estado={estado} alertas={alertas} />
                </div>

                {/* Información principal */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Monto</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(montoSolicitado)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Cuenta</p>
                        <p className="text-sm font-medium text-slate-700 capitalize">{cuentaBancaria.tipoCuenta}</p>
                        <p className="text-xs text-slate-500">{cuentaBancaria.nombreTitular}</p>
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
                            href={urlComprobante}
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

// --- Lógica de agrupación por fecha ---
const groupSolicitudesByDate = (solicitudes) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const getDayKey = (date) => {
        const d = new Date(date)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
    }

    const todayTime = getDayKey(today)
    const yesterdayTime = getDayKey(yesterday)

    const groups = solicitudes.reduce((acc, solicitud) => {
        const date = new Date(solicitud.fechaSolicitud)
        const dayKey = getDayKey(date)

        let groupTitle
        if (dayKey === todayTime) {
            groupTitle = 'Hoy'
        } else if (dayKey === yesterdayTime) {
            groupTitle = 'Ayer'
        } else {
            groupTitle = date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        }

        if (!acc[groupTitle]) {
            acc[groupTitle] = []
        }
        acc[groupTitle].push(solicitud)
        return acc
    }, {})

    return groups
}

// --- Componente principal ---
export default function AdminRetirosPage() {
    // --- Estados ---
    const [solicitudes, setSolicitudes] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [soloAlertas, setSoloAlertas] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [showRechazarModal, setShowRechazarModal] = useState(false)
    const [showComprobanteModal, setShowComprobanteModal] = useState(false)
    const [showReasonModal, setShowReasonModal] = useState(false)
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState('')
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [archivoComprobante, setArchivoComprobante] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [reasonToShow, setReasonToShow] = useState('')
    const router = useRouter()

    // --- Fetch de datos ---
    const fetchSolicitudes = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/retiros')

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/login')
                } else {
                    throw new Error('Error al cargar las solicitudes.')
                }
                return
            }

            const data = await res.json()

            const mappedSolicitudes = data.retiros
                .map(r => ({
                    id: r.id,
                    montoSolicitado: parseFloat(r.montoSolicitado),
                    estado: r.estado,
                    fechaSolicitud: r.fechaSolicitud,
                    fechaActualizacion: r.fechaActualizacion,
                    notasAdmin: r.notasAdmin || undefined,
                    urlComprobante: r.urlComprobante || undefined,
                    usuario: r.usuario,
                    cuentaBancaria: r.cuentaBancaria,
                    alertas: r.alertas || [],
                }))
                .sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())

            setSolicitudes(mappedSolicitudes)

            const statsData = {
                total: data.stats.total,
                pendientes: data.stats.pendientes,
                conAlertas: data.stats.conAlertas,
                procesando: data.stats.procesando ?? mappedSolicitudes.filter(s => s.estado === 'Procesando').length,
                completados: data.stats.completados ?? mappedSolicitudes.filter(s => s.estado === 'Completado').length,
                rechazados: data.stats.rechazados ?? mappedSolicitudes.filter(s => s.estado === 'Rechazado').length,
                montoTotalPendiente: mappedSolicitudes.filter(s => s.estado === 'Pendiente').reduce((sum, s) => sum + s.montoSolicitado, 0),
                montoTotalCompletado: mappedSolicitudes.filter(s => s.estado === 'Completado').reduce((sum, s) => sum + s.montoSolicitado, 0),
            }
            setEstadisticas(statsData)

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchSolicitudes()
    }, [fetchSolicitudes])

    // --- Filtrado ---
    const filteredSolicitudes = useMemo(() => {
        return solicitudes.filter(solicitud => {
            const estadoMatch = filtroEstado ? solicitud.estado === filtroEstado : true
            const alertasMatch = soloAlertas ? solicitud.alertas?.length > 0 : true

            // Búsqueda por nombre, email o fecha
            const busquedaMatch = busqueda ? (
                solicitud.usuario.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
                solicitud.usuario.email.toLowerCase().includes(busqueda.toLowerCase()) ||
                new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES').includes(busqueda) ||
                solicitud.id.toLowerCase().includes(busqueda.toLowerCase())
            ) : true

            return estadoMatch && alertasMatch && busquedaMatch
        })
    }, [solicitudes, filtroEstado, soloAlertas, busqueda])

    const groupedSolicitudes = useMemo(() =>
        groupSolicitudesByDate(filteredSolicitudes),
        [filteredSolicitudes]
    )

    // --- Acciones ---
    const aprobarRetiro = async (retiroId) => {
        if (!confirm('¿Estás seguro de aprobar este retiro?')) return

        setSubmitLoading(true)
        try {
            const res = await fetch(`/api/retiros/${retiroId}/aprobar`, {
                method: 'PUT',
            })
            const data = await res.json()

            if (res.ok) {
                alert('Retiro aprobado exitosamente.')
                fetchSolicitudes()
            } else {
                alert(data.error || 'Error al aprobar el retiro.')
            }
        } catch (error) {
            alert('Error de red al intentar aprobar el retiro.')
        } finally {
            setSubmitLoading(false)
        }
    }

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
                fetchSolicitudes()
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
                fetchSolicitudes()
            } else {
                alert(data.error || 'Error al subir el comprobante.')
            }
        } catch (error) {
            alert('Error de red al intentar subir el comprobante.')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleCardAction = (type, data) => {
        switch (type) {
            case 'approve':
                aprobarRetiro(data)
                break
            case 'reject':
                setSolicitudSeleccionada(data.id)
                setShowRechazarModal(true)
                break
            case 'upload':
                setSolicitudSeleccionada(data.id)
                setShowComprobanteModal(true)
                break
            case 'viewReason':
                setReasonToShow(data.motivo)
                setShowReasonModal(true)
                break
        }
    }

    if (loading && !estadisticas) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                />
                <p className="mt-6 text-slate-600 text-lg">Cargando panel de retiros...</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-b border-slate-200 px-6 py-4"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Panel de Retiros</h1>
                        <p className="text-slate-600 text-sm">Gestiona y supervisa todas las solicitudes de retiro</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={fetchSolicitudes}
                        className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </motion.button>
                </div>
            </motion.header>

            <div className="p-4">
                {/* Estadísticas */}
                {estadisticas && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            icon={Wallet}
                            title="Total"
                            value={estadisticas.total}
                            color="text-slate-600"
                        />
                        <StatCard
                            icon={Clock}
                            title="Pendientes"
                            value={estadisticas.pendientes}
                            color="text-blue-600"
                            secondaryValue={formatCurrency(estadisticas.montoTotalPendiente)}
                        />
                        <StatCard
                            icon={CheckCircle2}
                            title="Completados"
                            value={estadisticas.completados}
                            color="text-green-600"
                            secondaryValue={formatCurrency(estadisticas.montoTotalCompletado)}
                        />
                        <StatCard
                            icon={ShieldAlert}
                            title="Con Alertas"
                            value={estadisticas.conAlertas}
                            color="text-red-600"
                        />
                    </div>
                )}

                {/* Filtros */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6"
                >
                    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">Filtros:</span>
                        </div>

                        {/* Campo de búsqueda */}
                        <div className="relative flex-1 lg:flex-initial lg:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por artista, email, fecha o ID..."
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-1.5 pl-9 pr-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {busqueda && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setBusqueda('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
                                >
                                    <X className="w-3 h-3" />
                                </motion.button>
                            )}
                        </div>

                        <div className="relative">
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[140px]"
                            >
                                <option value="">Todos los estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Procesando">Procesando</option>
                                <option value="Completado">Completado</option>
                                <option value="Rechazado">Rechazado</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSoloAlertas(!soloAlertas)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${soloAlertas
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                }`}
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {soloAlertas ? 'Solo alertas' : 'Mostrar alertas'}
                        </motion.button>

                        {/* Indicador de resultados */}
                        <div className="text-sm text-slate-500 ml-auto">
                            {filteredSolicitudes.length} de {solicitudes.length} solicitudes
                        </div>
                    </div>
                </motion.div>

                {/* Lista de solicitudes */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"
                            />
                        </div>
                    ) : Object.keys(groupedSolicitudes).length > 0 ? (
                        <AnimatePresence>
                            {Object.entries(groupedSolicitudes).map(([dateGroup, solicitudesGroup]) => (
                                <motion.div
                                    key={dateGroup}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.h2
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"
                                    >
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        {dateGroup}
                                        <span className="text-sm font-normal text-slate-500">
                                            ({solicitudesGroup.length})
                                        </span>
                                    </motion.h2>
                                    <div className="grid gap-3">
                                        {solicitudesGroup.map((solicitud) => (
                                            <SolicitudCard
                                                key={solicitud.id}
                                                solicitud={solicitud}
                                                onAction={handleCardAction}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center bg-white rounded-xl p-8 border border-slate-200"
                        >
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Wallet className="w-6 h-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">No hay solicitudes</h3>
                            <p className="text-slate-500 text-sm">No se encontraron solicitudes que coincidan con los filtros aplicados.</p>
                        </motion.div>
                    )}
                </div>
            </div>

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
        </div>
    )
}