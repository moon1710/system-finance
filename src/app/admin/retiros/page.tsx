// /src/app/admin/retiros/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Wallet,
    Clock,
    RefreshCw,
    ShieldAlert,
    TrendingUp,
    CheckCircle2,
    Filter,
    Search,
    X,
    ChevronDown,
    AlertTriangle,
    Calendar
} from 'lucide-react'

// Components
import SolicitudCard from '../components/SolicitudCard'
import ModalesAdmin from '../components/ModalesAdmin'

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
        clabe?: string
        numeroRuta?: string
        numeroCuenta?: string
        swift?: string
        emailPaypal?: string
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

// --- Utility Functions ---
const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const groupSolicitudesByDate = (solicitudes: Solicitud[]) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const getDayKey = (date: Date) => {
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
    }, {} as Record<string, Solicitud[]>)

    return groups
}

// --- StatCard Component ---
const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
    secondaryValue,
    trend
}: {
    icon: any
    title: string
    value: number
    color: string
    secondaryValue?: string
    trend?: string
}) => (
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

// --- Main Component ---
export default function AdminRetirosPage() {
    // --- Estados ---
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
    const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [soloAlertas, setSoloAlertas] = useState(false)
    const [busqueda, setBusqueda] = useState('')

    // Estados para modales
    const [showRechazarModal, setShowRechazarModal] = useState(false)
    const [showComprobanteModal, setShowComprobanteModal] = useState(false)
    const [showReasonModal, setShowReasonModal] = useState(false)
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState('')
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null)
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
                .map((r: any) => ({
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
                .sort((a: any, b: any) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())

            setSolicitudes(mappedSolicitudes)

            const statsData = {
                total: data.stats.total,
                pendientes: data.stats.pendientes,
                conAlertas: data.stats.conAlertas,
                procesando: data.stats.procesando ?? mappedSolicitudes.filter((s: any) => s.estado === 'Procesando').length,
                completados: data.stats.completados ?? mappedSolicitudes.filter((s: any) => s.estado === 'Completado').length,
                rechazados: data.stats.rechazados ?? mappedSolicitudes.filter((s: any) => s.estado === 'Rechazado').length,
                montoTotalPendiente: mappedSolicitudes.filter((s: any) => s.estado === 'Pendiente').reduce((sum: number, s: any) => sum + s.montoSolicitado, 0),
                montoTotalCompletado: mappedSolicitudes.filter((s: any) => s.estado === 'Completado').reduce((sum: number, s: any) => sum + s.montoSolicitado, 0),
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
    const aprobarRetiro = async (retiroId: string) => {
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

    const handleCardAction = (type: string, data: any) => {
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

            {/* Modales */}
            <ModalesAdmin
                showRechazarModal={showRechazarModal}
                setShowRechazarModal={setShowRechazarModal}
                showComprobanteModal={showComprobanteModal}
                setShowComprobanteModal={setShowComprobanteModal}
                showReasonModal={showReasonModal}
                setShowReasonModal={setShowReasonModal}
                solicitudSeleccionada={solicitudSeleccionada}
                setSolicitudSeleccionada={setSolicitudSeleccionada}
                motivoRechazo={motivoRechazo}
                setMotivoRechazo={setMotivoRechazo}
                archivoComprobante={archivoComprobante}
                setArchivoComprobante={setArchivoComprobante}
                submitLoading={submitLoading}
                setSubmitLoading={setSubmitLoading}
                reasonToShow={reasonToShow}
                onRefresh={fetchSolicitudes}
            />
        </div>
    )
}