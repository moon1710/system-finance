'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CuentaBancaria {
    id: string
    tipoCuenta: string
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
        tipoCuenta: string
        nombreBanco?: string
        clabe?: string
        numeroCuenta?: string
        emailPaypal?: string
    }
}

export default function RetirosPage() {
    const [retiros, setRetiros] = useState<Retiro[]>([])
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        monto: '',
        cuentaId: '',
        notas: ''
    })
    const [submitLoading, setSubmitLoading] = useState(false)
    const router = useRouter()

    // Cargar datos iniciales
    useEffect(() => {
        Promise.all([
            fetchRetiros(),
            fetchCuentas()
        ]).finally(() => setLoading(false))
    }, [])

    const fetchRetiros = async () => {
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
        setFormData({
            monto: '',
            cuentaId: '',
            notas: ''
        })
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

    const formatEstado = (estado: string, requiereRevision: boolean) => {
        let className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full '

        switch (estado) {
            case 'Pendiente':
                className += requiereRevision
                    ? 'bg-yellow-100 text-yellow-800'
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
        switch (cuentaBancaria.tipoCuenta) {
            case 'nacional':
                return `${cuentaBancaria.nombreBanco} - ****${cuentaBancaria.clabe?.slice(-4)}`
            case 'internacional':
                return `${cuentaBancaria.nombreBanco} - ****${cuentaBancaria.numeroCuenta?.slice(-4)}`
            case 'paypal':
                return `PayPal - ${cuentaBancaria.emailPaypal}`
            default:
                return 'Información no disponible'
        }
    }

    const descargarComprobante = async (retiroId: string) => {
        try {
            const res = await fetch(`/api/retiros/${retiroId}/comprobante`)

            if (!res.ok) {
                const error = await res.json()
                alert(error.error || 'Error al descargar comprobante')
                return
            }

            // Crear blob y descargar
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `comprobante_retiro_${retiroId}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            alert('Error al descargar el comprobante')
        }
    }

    if (loading) return <div className="p-8">Cargando...</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mis Retiros</h1>
                <button
                    onClick={() => {
                        if (cuentas.length === 0) {
                            alert('Primero debes agregar al menos una cuenta bancaria')
                            router.push('/artista/cuentas')
                            return
                        }
                        resetForm()
                        setShowModal(true)
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    + Solicitar Retiro
                </button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">Pendientes</h3>
                    <p className="text-2xl font-bold text-blue-900">
                        {retiros.filter(r => r.estado === 'Pendiente').length}
                    </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-800">Procesando</h3>
                    <p className="text-2xl font-bold text-orange-900">
                        {retiros.filter(r => r.estado === 'Procesando').length}
                    </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800">Completados</h3>
                    <p className="text-2xl font-bold text-green-900">
                        {retiros.filter(r => r.estado === 'Completado').length}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-800">Total Retirado</h3>
                    <p className="text-2xl font-bold text-gray-900">
                        ${retiros
                            .filter(r => r.estado === 'Completado')
                            .reduce((sum, r) => sum + r.montoSolicitado, 0)
                            .toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Lista de retiros */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {retiros.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No tienes solicitudes de retiro.
                        <br />
                        {cuentas.length === 0 ? (
                            <>
                                <button
                                    onClick={() => router.push('/artista/cuentas')}
                                    className="mt-4 text-blue-600 hover:text-blue-800 underline"
                                >
                                    Agregar una cuenta bancaria para empezar
                                </button>
                            </>
                        ) : (
                            'Crea tu primera solicitud de retiro.'
                        )}
                    </div>
                ) : (
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Monto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cuenta Destino
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {retiros.map((retiro) => (
                                <tr key={retiro.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                        #{retiro.id.slice(-8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                        ${retiro.montoSolicitado.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {formatCuentaInfo(retiro.cuentaBancaria)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatEstado(retiro.estado, retiro.requiereRevision)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(retiro.fechaSolicitud).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        {retiro.estado === 'Completado' && retiro.urlComprobante && (
                                            <button
                                                onClick={() => descargarComprobante(retiro.id)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Descargar
                                            </button>
                                        )}
                                        {retiro.estado === 'Rechazado' && retiro.notasAdmin && (
                                            <button
                                                onClick={() => alert(`Motivo: ${retiro.notasAdmin}`)}
                                                className="text-red-600 hover:text-red-900"
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

            {/* Modal para crear retiro */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Nueva Solicitud de Retiro</h2>

                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>Requisitos:</strong> Monto mínimo $100 USD.
                                Máximo 3 solicitudes pendientes.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Monto (USD) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="100"
                                    step="0.01"
                                    value={formData.monto}
                                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="1500.00"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Cuenta Bancaria Destino *
                                </label>
                                <select
                                    required
                                    value={formData.cuentaId}
                                    onChange={(e) => setFormData({ ...formData, cuentaId: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Selecciona una cuenta...</option>
                                    {cuentas.map((cuenta) => (
                                        <option key={cuenta.id} value={cuenta.id}>
                                            {cuenta.esPredeterminada ? '⭐ ' : ''}
                                            {cuenta.tipoCuenta === 'nacional' && `${cuenta.nombreBanco} - ****${cuenta.clabe?.slice(-4)}`}
                                            {cuenta.tipoCuenta === 'internacional' && `${cuenta.nombreBanco} - ****${cuenta.numeroCuenta?.slice(-4)}`}
                                            {cuenta.tipoCuenta === 'paypal' && `PayPal - ${cuenta.emailPaypal}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Notas (Opcional)
                                </label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Información adicional sobre el retiro..."
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.notas.length}/500 caracteres
                                </p>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                    disabled={submitLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                    disabled={submitLoading}
                                >
                                    {submitLoading ? 'Creando...' : 'Crear Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}