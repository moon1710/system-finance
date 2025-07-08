'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

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

interface RetiroAPI {
    id: string
    usuarioId: string
    cuentaBancariaId: string
    montoSolicitado: string
    estado: 'Pendiente' | 'Procesando' | 'Completado' | 'Rechazado'
    urlComprobante: string | null
    notasAdmin: string | null
    fechaSolicitud: string
    fechaActualizacion: string
    usuario: {
        id: string
        nombreCompleto: string
        email: string
    }
    cuentaBancaria: {
        tipoCuenta: string
        nombreTitular: string
    }
    alertas: {
        id: string
        retiroId: string
        tipo: string
        mensaje: string
        resuelta: boolean
        createdAt: string
        updatedAt: string
    }[]
}

interface StatsAPI {
    total: number
    pendientes: number
    conAlertas: number
    procesando?: number
    completados?: number
    rechazados?: number
}

interface RetirosAPIResponse {
    success: boolean
    retiros: RetiroAPI[]
    stats: StatsAPI
}

// --- Componente principal ---
export default function AdminRetirosPage() {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
    const [estadisticas, setEstadisticas] = useState<Estadisticas>({
        total: 0,
        pendientes: 0,
        procesando: 0,
        completados: 0,
        rechazados: 0,
        conAlertas: 0,
        montoTotalPendiente: 0,
        montoTotalCompletado: 0,
    })
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState<
        'Pendiente' | 'Procesando' | 'Completado' | 'Rechazado' | ''
    >('')
    const [soloAlertas, setSoloAlertas] = useState(false)
    const [showRechazarModal, setShowRechazarModal] = useState(false)
    const [showComprobanteModal, setShowComprobanteModal] = useState(false)
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<string>('')
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const router = useRouter()

    const fetchSolicitudes = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filtroEstado) params.append('estado', filtroEstado)
            if (soloAlertas) params.append('alertas', 'true')

            const res = await fetch(`/api/admin/retiros?${params.toString()}`)

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/login')
                } else {
                    console.error('Error al obtener solicitudes:', res.status, await res.text())
                    alert('Error al cargar las solicitudes. Intente de nuevo.')
                }
                return
            }

            const data: RetirosAPIResponse = await res.json()

            const mappedSolicitudes: Solicitud[] = data.retiros.map((retiro) => ({
                id: retiro.id,
                montoSolicitado: parseFloat(retiro.montoSolicitado),
                estado: retiro.estado,
                fechaSolicitud: retiro.fechaSolicitud,
                fechaActualizacion: retiro.fechaActualizacion,
                notasAdmin: retiro.notasAdmin || undefined,
                urlComprobante: retiro.urlComprobante || undefined,
                usuario: {
                    nombreCompleto: retiro.usuario.nombreCompleto,
                    email: retiro.usuario.email,
                },
                cuentaBancaria: {
                    tipoCuenta: retiro.cuentaBancaria.tipoCuenta,
                    nombreTitular: retiro.cuentaBancaria.nombreTitular,
                },
                alertas: retiro.alertas.map((alerta) => ({
                    id: alerta.id,
                    tipo: alerta.tipo,
                    mensaje: alerta.mensaje,
                    resuelta: alerta.resuelta,
                })),
            }))

            const stats: Estadisticas = {
                total: data.stats.total,
                pendientes: data.stats.pendientes,
                conAlertas: data.stats.conAlertas,
                procesando: data.stats.procesando || mappedSolicitudes.filter((s) => s.estado === 'Procesando').length,
                completados: data.stats.completados || mappedSolicitudes.filter((s) => s.estado === 'Completado').length,
                rechazados: data.stats.rechazados || mappedSolicitudes.filter((s) => s.estado === 'Rechazado').length,
                montoTotalPendiente: mappedSolicitudes
                    .filter((s) => s.estado === 'Pendiente')
                    .reduce((sum, s) => sum + s.montoSolicitado, 0),
                montoTotalCompletado: mappedSolicitudes
                    .filter((s) => s.estado === 'Completado')
                    .reduce((sum, s) => sum + s.montoSolicitado, 0),
            }

            setSolicitudes(mappedSolicitudes)
            setEstadisticas(stats)
        } catch (error) {
            console.error('Error al obtener solicitudes:', error)
            alert('Error de conexión al servidor.')
        } finally {
            setLoading(false)
        }
    }, [filtroEstado, soloAlertas, router])

    useEffect(() => {
        fetchSolicitudes()
    }, [fetchSolicitudes])

    const aprobarRetiro = async (retiroId: string) => {
        if (!confirm('¿Estás seguro de **aprobar** este retiro?')) return

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
            // 5MB
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

    // --- Funciones de Formato para la UI ---
    const formatEstado = (estado: Solicitud['estado'], alertas: Alerta[]) => {
        const tieneAlertas = alertas && alertas.length > 0
        let className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full '

        switch (estado) {
            case 'Pendiente':
                className += tieneAlertas
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-blue-100 text-blue-800'
                return (
                    <span className={className}>
                        {estado} {tieneAlertas && `⚠️ (${alertas.length})`}
                    </span>
                )
            case 'Procesando':
                className += 'bg-orange-100 text-orange-800'
                break
            case 'Completado':
                className += 'bg-green-100 text-green-800'
                break
            case 'Rechazado':
                className += 'bg-red-100 text-red-800'
                break
            default:
                className += 'bg-gray-100 text-gray-800'
        }
        return <span className={className}>{estado}</span>
    }

    const formatCuentaInfo = (cuentaBancaria: Solicitud['cuentaBancaria']) => {
        const tipo = cuentaBancaria.tipoCuenta || 'Sin tipo'
        const titular = cuentaBancaria.nombreTitular || 'Sin titular'
        return (
            <div>
                <div className="text-sm font-medium text-gray-900 capitalize">{tipo}</div>
                <div className="text-xs text-gray-500">{titular}</div>
            </div>
        )
    }

    if (loading)
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    <p className="mt-4 text-gray-600 text-lg">Cargando solicitudes de retiro...</p>
                </div>
            </div>
        )

    return (
        <div className="p-6 sm:p-8 md:p-12 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-black flex items-center">
                    <span className="mr-3">💰</span>Gestión de Retiros
                </h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setSoloAlertas(!soloAlertas)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out flex items-center shadow-sm
                        ${soloAlertas
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                            }`}
                    >
                        {soloAlertas ? '🚨 Mostrando Solo Alertas' : 'Ver Solo Alertas'}
                    </button>
                </div>
            </div>

            {/* --- Sección de Estadísticas --- */}
            {estadisticas && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex items-center space-x-3">
                        <span className="text-2xl">📈</span>
                        <div>
                            <h3 className="text-xs font-medium text-gray-600 uppercase">Total</h3>
                            <p className="text-xl font-bold text-gray-900">{estadisticas.total}</p>
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl shadow-md border border-blue-200 flex items-center space-x-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                            <h3 className="text-xs font-medium text-blue-600 uppercase">Pendientes</h3>
                            <p className="text-xl font-bold text-blue-900">{estadisticas.pendientes}</p>
                        </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl shadow-md border border-orange-200 flex items-center space-x-3">
                        <span className="text-2xl">⚙️</span>
                        <div>
                            <h3 className="text-xs font-medium text-orange-600 uppercase">Procesando</h3>
                            <p className="text-xl font-bold text-orange-900">{estadisticas.procesando}</p>
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl shadow-md border border-green-200 flex items-center space-x-3">
                        <span className="text-2xl">✅</span>
                        <div>
                            <h3 className="text-xs font-medium text-green-600 uppercase">Completados</h3>
                            <p className="text-xl font-bold text-green-900">{estadisticas.completados}</p>
                        </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl shadow-md border border-red-200 flex items-center space-x-3">
                        <span className="text-2xl">❌</span>
                        <div>
                            <h3 className="text-xs font-medium text-red-600 uppercase">Rechazados</h3>
                            <p className="text-xl font-bold text-red-900">{estadisticas.rechazados}</p>
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl shadow-md border border-yellow-200 flex items-center space-x-3">
                        <span className="text-2xl">🚨</span>
                        <div>
                            <h3 className="text-xs font-medium text-yellow-600 uppercase">Con Alertas</h3>
                            <p className="text-xl font-bold text-yellow-900">{estadisticas.conAlertas}</p>
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl shadow-md border border-purple-200 flex items-center space-x-3">
                        <span className="text-2xl">💸</span>
                        <div>
                            <h3 className="text-xs font-medium text-purple-600 uppercase">Monto Pendiente</h3>
                            <p className="text-lg font-bold text-gray-900">
                                ${estadisticas.montoTotalPendiente.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-xl shadow-md border border-teal-200 flex items-center space-x-3">
                        <span className="text-2xl">💰</span>
                        <div>
                            <h3 className="text-xs font-medium text-teal-600 uppercase">Monto Completado</h3>
                            <p className="text-lg font-bold text-gray-900">
                                ${estadisticas.montoTotalCompletado.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Sección de Filtros --- */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200">
                <div className="flex flex-wrap gap-6 items-center">
                    <div>
                        <label
                            htmlFor="filtroEstado"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Filtrar por Estado:
                        </label>
                        <select
                            id="filtroEstado"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value as Solicitud['estado'] | '')}
                            className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                        >
                            <option value="">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Procesando">Procesando</option>
                            <option value="Completado">Completado</option>
                            <option value="Rechazado">Rechazado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- Lista de solicitudes --- */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                {solicitudes.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 text-lg">
                        <p className="mb-2">No hay solicitudes de retiro que coincidan con los filtros aplicados.</p>
                        <p className="text-sm">Intenta ajustar los filtros o verifica si hay nuevas solicitudes.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Artista
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Monto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cuenta Bancaria
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Alertas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Solicitud
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {solicitudes.map((solicitud) => (
                                    <tr
                                        key={solicitud.id}
                                        className={`hover:bg-gray-50 transition-colors duration-150 ${solicitud.alertas && solicitud.alertas.length > 0 ? 'bg-yellow-50' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-mono text-gray-800">
                                            #{solicitud.id.slice(-8)}
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {solicitud.usuario.nombreCompleto}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {solicitud.usuario.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap text-base font-bold text-black">
                                            ${solicitud.montoSolicitado.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap text-sm">
                                            {formatCuentaInfo(solicitud.cuentaBancaria)}
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                            {formatEstado(solicitud.estado, solicitud.alertas || [])}
                                        </td>
                                        <td className="px-6 py-3.5 text-sm">
                                            {solicitud.alertas && solicitud.alertas.length > 0 ? (
                                                <div className="space-y-1">
                                                    {solicitud.alertas.map((alerta) => (
                                                        <div key={alerta.id} className="relative inline-block group">
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help
                                                                ${alerta.tipo === 'MONTO_ALTO'
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : alerta.tipo === 'RETIROS_MULTIPLES'
                                                                            ? 'bg-orange-100 text-orange-800'
                                                                            : 'bg-yellow-100 text-yellow-800'
                                                                    }`}
                                                            >
                                                                {alerta.tipo === 'MONTO_ALTO' && '💰 Monto Alto'}
                                                                {alerta.tipo === 'RETIROS_MULTIPLES' && '🔄 Retiros Múltiples'}
                                                                {alerta.tipo === 'CUENTA_NUEVA' && '🆕 Cuenta Nueva'}
                                                            </span>
                                                            <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 group-hover:block transition-opacity duration-200 z-10 w-max pointer-events-none">
                                                                {alerta.mensaje}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Sin alertas</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap text-sm space-x-2">
                                            {solicitud.estado === 'Pendiente' && (
                                                <>
                                                    <button
                                                        onClick={() => aprobarRetiro(solicitud.id)}
                                                        disabled={submitLoading}
                                                        className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSolicitudSeleccionada(solicitud.id)
                                                            setShowRechazarModal(true)
                                                        }}
                                                        disabled={submitLoading}
                                                        className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                            {solicitud.estado === 'Procesando' && (
                                                <button
                                                    onClick={() => {
                                                        setSolicitudSeleccionada(solicitud.id)
                                                        setShowComprobanteModal(true)
                                                    }}
                                                    disabled={submitLoading}
                                                    className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Subir Comprobante
                                                </button>
                                            )}
                                            {solicitud.estado === 'Completado' && solicitud.urlComprobante && (
                                                <a
                                                    href={solicitud.urlComprobante}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    Ver Comprobante
                                                </a>
                                            )}
                                            {solicitud.estado === 'Rechazado' && solicitud.notasAdmin && (
                                                <button
                                                    onClick={() => alert(`Motivo del Rechazo:\n${solicitud.notasAdmin}`)}
                                                    className="text-gray-600 hover:text-gray-800 font-medium"
                                                >
                                                    Ver Motivo
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- Modal para rechazar solicitud --- */}
            {showRechazarModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-7 w-full max-w-md shadow-xl border border-gray-200">
                        <h2 className="text-2xl font-bold mb-5 text-red-700 flex items-center">
                            <span className="mr-3">🚫</span> Rechazar Solicitud
                        </h2>

                        <div className="mb-5">
                            <label htmlFor="motivoRechazo" className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo del rechazo <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="motivoRechazo"
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2.5 text-sm text-gray-900"
                                rows={4}
                                placeholder="Explica detalladamente por qué se rechaza esta solicitud (mínimo 10 caracteres)..."
                                maxLength={1000}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {motivoRechazo.length}/1000 caracteres (mínimo 10)
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRechazarModal(false)
                                    setMotivoRechazo('')
                                    setSolicitudSeleccionada('')
                                }}
                                className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                disabled={submitLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRechazar}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={submitLoading || motivoRechazo.trim().length < 10}
                            >
                                {submitLoading ? 'Rechazando...' : 'Rechazar Solicitud'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal para subir comprobante --- */}
            {showComprobanteModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-7 w-full max-w-md shadow-xl border border-gray-200">
                        <h2 className="text-2xl font-bold mb-5 text-green-700 flex items-center">
                            <span className="mr-3">⬆️</span> Subir Comprobante
                        </h2>

                        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
                            <p>
                                <strong>Formatos permitidos:</strong> PDF, JPG, PNG
                            </p>
                            <p>
                                <strong>Tamaño máximo:</strong> 5MB
                            </p>
                        </div>

                        <div className="mb-5">
                            <label htmlFor="comprobanteFile" className="block text-sm font-medium text-gray-700 mb-2">
                                Archivo de comprobante <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="comprobanteFile"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setArchivoComprobante(e.target.files?.[0] || null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                required
                            />
                            {archivoComprobante && (
                                <p className="text-sm text-green-600 mt-1">
                                    ✓ {archivoComprobante.name} (
                                    {(archivoComprobante.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowComprobanteModal(false)
                                    setArchivoComprobante(null)
                                    setSolicitudSeleccionada('')
                                }}
                                className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                disabled={submitLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubirComprobante}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={submitLoading || !archivoComprobante}
                            >
                                {submitLoading ? 'Subiendo...' : 'Subir y Completar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}