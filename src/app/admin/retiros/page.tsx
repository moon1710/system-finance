'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Solicitud {
    id: string
    montoSolicitado: number
    estado: 'Pendiente' | 'Procesando' | 'Completado' | 'Rechazado'
    requiereRevision: boolean
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
    }
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

export default function AdminRetirosPage() {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
    const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [soloAlertas, setSoloAlertas] = useState(false)
    const [showRechazarModal, setShowRechazarModal] = useState(false)
    const [showComprobanteModal, setShowComprobanteModal] = useState(false)
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<string>('')
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchSolicitudes()
    }, [filtroEstado, soloAlertas])

    const fetchSolicitudes = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filtroEstado) params.append('estado', filtroEstado)
            if (soloAlertas) params.append('alertas', 'true')

            const res = await fetch(`/api/admin/retiros?${params}`)
            if (!res.ok) {
                if (res.status === 401) router.push('/login')
                return
            }
            const data = await res.json()
            setSolicitudes(data.solicitudes || [])
            setEstadisticas(data.estadisticas || null)
        } catch (error) {
            console.error('Error al obtener solicitudes:', error)
        } finally {
            setLoading(false)
        }
    }

    const aprobarRetiro = async (retiroId: string) => {
        if (!confirm('¿Estás seguro de aprobar este retiro?')) return

        try {
            setSubmitLoading(true)
            const res = await fetch(`/api/retiros/${retiroId}/aprobar`, {
                method: 'PUT'
            })

            const data = await res.json()

            if (res.ok) {
                alert('Retiro aprobado exitosamente')
                fetchSolicitudes()
            } else {
                alert(data.error || 'Error al aprobar retiro')
            }
        } catch (error) {
            alert('Error al aprobar retiro')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleRechazar = async () => {
        if (!motivoRechazo.trim()) {
            alert('El motivo de rechazo es requerido')
            return
        }

        try {
            setSubmitLoading(true)
            const res = await fetch(`/api/retiros/${solicitudSeleccionada}/rechazar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo: motivoRechazo })
            })

            const data = await res.json()

            if (res.ok) {
                alert('Retiro rechazado exitosamente')
                setShowRechazarModal(false)
                setMotivoRechazo('')
                setSolicitudSeleccionada('')
                fetchSolicitudes()
            } else {
                alert(data.error || 'Error al rechazar retiro')
            }
        } catch (error) {
            alert('Error al rechazar retiro')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleSubirComprobante = async () => {
        if (!archivoComprobante) {
            alert('Selecciona un archivo de comprobante')
            return
        }

        try {
            setSubmitLoading(true)
            const formData = new FormData()
            formData.append('comprobante', archivoComprobante)

            const res = await fetch(`/api/retiros/${solicitudSeleccionada}/comprobante`, {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (res.ok) {
                alert('Comprobante subido y retiro completado exitosamente')
                setShowComprobanteModal(false)
                setArchivoComprobante(null)
                setSolicitudSeleccionada('')
                fetchSolicitudes()
            } else {
                alert(data.error || 'Error al subir comprobante')
            }
        } catch (error) {
            alert('Error al subir comprobante')
        } finally {
            setSubmitLoading(false)
        }
    }

    const formatEstado = (estado: string, requiereRevision: boolean) => {
        let className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full '

        switch (estado) {
            case 'Pendiente':
                className += requiereRevision
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-blue-100 text-blue-800'
                return (
                    <span className={className}>
                        {estado} {requiereRevision && '⚠️'}
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

    const formatCuentaInfo = (cuentaBancaria: any) => {
        return `${cuentaBancaria.tipoCuenta} - ${cuentaBancaria.nombreBanco || 'Sin banco'}`
    }

    if (loading) return <div className="p-8">Cargando...</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestión de Retiros</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setSoloAlertas(!soloAlertas)}
                        className={`px-4 py-2 rounded text-sm font-medium ${soloAlertas
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {soloAlertas ? '🚨 Mostrando Alertas' : 'Ver Solo Alertas'}
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            {estadisticas && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <h3 className="text-xs font-medium text-gray-600">Total</h3>
                        <p className="text-xl font-bold text-gray-900">{estadisticas.total}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <h3 className="text-xs font-medium text-blue-600">Pendientes</h3>
                        <p className="text-xl font-bold text-blue-900">{estadisticas.pendientes}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                        <h3 className="text-xs font-medium text-orange-600">Procesando</h3>
                        <p className="text-xl font-bold text-orange-900">{estadisticas.procesando}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                        <h3 className="text-xs font-medium text-green-600">Completados</h3>
                        <p className="text-xl font-bold text-green-900">{estadisticas.completados}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                        <h3 className="text-xs font-medium text-red-600">Rechazados</h3>
                        <p className="text-xl font-bold text-red-900">{estadisticas.rechazados}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                        <h3 className="text-xs font-medium text-yellow-600">Con Alertas</h3>
                        <p className="text-xl font-bold text-yellow-900">{estadisticas.conAlertas}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <h3 className="text-xs font-medium text-purple-600">Pendiente $</h3>
                        <p className="text-lg font-bold text-purple-900">
                            ${estadisticas.montoTotalPendiente.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-lg">
                        <h3 className="text-xs font-medium text-teal-600">Completado $</h3>
                        <p className="text-lg font-bold text-teal-900">
                            ${estadisticas.montoTotalCompletado.toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filtrar por Estado
                        </label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Procesando">Procesando</option>
                            <option value="Completado">Completado</option>
                            <option value="Rechazado">Rechazado</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="alertas"
                            checked={soloAlertas}
                            onChange={(e) => setSoloAlertas(e.target.checked)}
                            className="mr-2"
                        />
                        <label htmlFor="alertas" className="text-sm font-medium text-gray-700">
                            Solo mostrar alertas
                        </label>
                    </div>
                </div>
            </div>

            {/* Lista de solicitudes */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {solicitudes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {soloAlertas
                            ? 'No hay solicitudes con alertas en este momento.'
                            : 'No hay solicitudes de retiro que mostrar.'
                        }
                    </div>
                ) : (
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Artista
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Monto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Cuenta
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {solicitudes.map((solicitud) => (
                                <tr
                                    key={solicitud.id}
                                    className={solicitud.requiereRevision ? 'bg-yellow-50' : ''}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                        #{solicitud.id.slice(-8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {solicitud.usuario.nombreCompleto}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {solicitud.usuario.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                        ${solicitud.montoSolicitado.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {formatCuentaInfo(solicitud.cuentaBancaria)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatEstado(solicitud.estado, solicitud.requiereRevision)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(solicitud.fechaSolicitud).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        {solicitud.estado === 'Pendiente' && (
                                            <>
                                                <button
                                                    onClick={() => aprobarRetiro(solicitud.id)}
                                                    disabled={submitLoading}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSolicitudSeleccionada(solicitud.id)
                                                        setShowRechazarModal(true)
                                                    }}
                                                    disabled={submitLoading}
                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
                                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                            >
                                                Subir Comprobante
                                            </button>
                                        )}
                                        {solicitud.estado === 'Rechazado' && solicitud.notasAdmin && (
                                            <button
                                                onClick={() => alert(`Motivo: ${solicitud.notasAdmin}`)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Ver Motivo
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal para rechazar */}
            {showRechazarModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4 text-red-800">Rechazar Solicitud</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo del rechazo *
                            </label>
                            <textarea
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                                rows={4}
                                placeholder="Explica detalladamente por qué se rechaza esta solicitud..."
                                maxLength={1000}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {motivoRechazo.length}/1000 caracteres (mínimo 10)
                            </p>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowRechazarModal(false)
                                    setMotivoRechazo('')
                                    setSolicitudSeleccionada('')
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={submitLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRechazar}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                disabled={submitLoading || motivoRechazo.trim().length < 10}
                            >
                                {submitLoading ? 'Rechazando...' : 'Rechazar Solicitud'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para subir comprobante */}
            {showComprobanteModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4 text-green-800">Subir Comprobante</h2>

                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>Formatos permitidos:</strong> PDF, JPG, PNG<br />
                                <strong>Tamaño máximo:</strong> 5MB
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Archivo de comprobante *
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setArchivoComprobante(e.target.files?.[0] || null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                required
                            />
                            {archivoComprobante && (
                                <p className="text-sm text-green-600 mt-1">
                                    ✓ {archivoComprobante.name} ({(archivoComprobante.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowComprobanteModal(false)
                                    setArchivoComprobante(null)
                                    setSolicitudSeleccionada('')
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={submitLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubirComprobante}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
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