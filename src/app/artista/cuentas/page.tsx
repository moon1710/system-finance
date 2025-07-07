'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CuentaBancaria {
    id: string
    tipoCuenta: 'nacional' | 'internacional' | 'paypal'
    nombreBanco?: string
    clabe?: string
    numeroRuta?: string
    numeroCuenta?: string
    swift?: string
    emailPaypal?: string
    nombreTitular: string
    esPredeterminada: boolean
    createdAt: string
}

export default function CuentasPage() {
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | null>(null)
    const [formData, setFormData] = useState({
        tipoCuenta: 'nacional' as 'nacional' | 'internacional' | 'paypal',
        nombreBanco: '',
        clabe: '',
        numeroRuta: '',
        numeroCuenta: '',
        swift: '',
        emailPaypal: '',
        nombreTitular: '',
        esPredeterminada: false
    })
    const router = useRouter()

    // Cargar cuentas
    useEffect(() => {
        fetchCuentas()
    }, [])

    const fetchCuentas = async () => {
        try {
            const res = await fetch('/api/cuentas')
            if (!res.ok) {
                if (res.status === 401) router.push('/login')
                return
            }
            const data = await res.json()
            setCuentas(data.cuentas || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            tipoCuenta: 'nacional',
            nombreBanco: '',
            clabe: '',
            numeroRuta: '',
            numeroCuenta: '',
            swift: '',
            emailPaypal: '',
            nombreTitular: '',
            esPredeterminada: false
        })
        setEditingCuenta(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // Crear objeto limpio según el tipo
            let cleanData: any = {
                tipoCuenta: formData.tipoCuenta,
                nombreTitular: formData.nombreTitular,
                esPredeterminada: formData.esPredeterminada
            }

            // Agregar campos específicos según el tipo
            switch (formData.tipoCuenta) {
                case 'nacional':
                    cleanData.nombreBanco = formData.nombreBanco
                    cleanData.clabe = formData.clabe
                    break
                case 'internacional':
                    cleanData.nombreBanco = formData.nombreBanco
                    cleanData.swift = formData.swift
                    cleanData.numeroCuenta = formData.numeroCuenta
                    // Solo agregar CLABE si tiene valor
                    if (formData.clabe?.trim()) {
                        cleanData.clabe = formData.clabe
                    }
                    break
                case 'paypal':
                    cleanData.emailPaypal = formData.emailPaypal
                    break
            }

            const url = editingCuenta ? `/api/cuentas/${editingCuenta.id}` : '/api/cuentas'
            const method = editingCuenta ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanData)
            })

            const data = await res.json()

            if (res.ok) {
                alert(data.mensaje || `Cuenta ${editingCuenta ? 'actualizada' : 'creada'} exitosamente`)
                setShowModal(false)
                resetForm()
                fetchCuentas()
            } else {
                alert(data.error || `Error al ${editingCuenta ? 'actualizar' : 'crear'} cuenta`)
            }
        } catch (error) {
            alert(`Error al ${editingCuenta ? 'actualizar' : 'crear'} cuenta`)
        }
    }

    const handleEdit = (cuenta: CuentaBancaria) => {
        setEditingCuenta(cuenta)
        setFormData({
            tipoCuenta: cuenta.tipoCuenta,
            nombreBanco: cuenta.nombreBanco || '',
            clabe: cuenta.clabe || '',
            numeroRuta: cuenta.numeroRuta || '',
            numeroCuenta: cuenta.numeroCuenta || '',
            swift: cuenta.swift || '',
            emailPaypal: cuenta.emailPaypal || '',
            nombreTitular: cuenta.nombreTitular,
            esPredeterminada: cuenta.esPredeterminada
        })
        setShowModal(true)
    }

    const handleDelete = async (cuentaId: string) => {
        if (!confirm('¿Estás seguro de eliminar esta cuenta?')) return

        try {
            const res = await fetch(`/api/cuentas/${cuentaId}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (res.ok) {
                alert('Cuenta eliminada exitosamente')
                fetchCuentas()
            } else {
                alert(data.error || 'Error al eliminar cuenta')
            }
        } catch (error) {
            alert('Error al eliminar cuenta')
        }
    }

    const handleSetDefault = async (cuentaId: string) => {
        try {
            const res = await fetch(`/api/cuentas/${cuentaId}/predeterminada`, {
                method: 'PUT'
            })

            const data = await res.json()

            if (res.ok) {
                alert('Cuenta establecida como predeterminada')
                fetchCuentas()
            } else {
                alert(data.error || 'Error al establecer cuenta predeterminada')
            }
        } catch (error) {
            alert('Error al establecer cuenta predeterminada')
        }
    }

    const renderFormFields = () => {
        switch (formData.tipoCuenta) {
            case 'nacional':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Banco *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.nombreBanco}
                                onChange={(e) => setFormData({ ...formData, nombreBanco: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Ej: BBVA México, Banorte, Santander"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                CLABE (18 dígitos) *
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={18}
                                value={formData.clabe}
                                onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="123456789012345678"
                            />
                        </div>
                    </>
                )

            case 'internacional':
                return (
                    <>
                        {/* Campos para USA y otros países */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                País *
                            </label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="USA">Estados Unidos</option>
                                <option value="other">Otro país</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Código SWIFT *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.swift}
                                onChange={(e) => setFormData({ ...formData, swift: e.target.value.toUpperCase() })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="BCMRMXMM"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Número de Cuenta *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.numeroCuenta}
                                onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="123456789012345678"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                CLABE (solo México, 18 dígitos)
                            </label>
                            <input
                                type="text"
                                maxLength={18}
                                value={formData.clabe}
                                onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="123456789012345678"
                            />
                        </div>
                    </>
                )
            case 'paypal':
                return (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Email de PayPal *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.emailPaypal}
                            onChange={(e) => setFormData({ ...formData, emailPaypal: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="tu@email.com"
                        />
                    </div>
                )
        }
    }

    const formatCuentaInfo = (cuenta: CuentaBancaria) => {
        switch (cuenta.tipoCuenta) {
            case 'nacional':
                return `${cuenta.nombreBanco} - ****${cuenta.numeroCuenta?.slice(-4)}`
            case 'internacional':
                return `${cuenta.nombreBanco} - ****${cuenta.numeroCuenta?.slice(-4)} (${cuenta.swift})`
            case 'paypal':
                return `PayPal - ${cuenta.emailPaypal}`
            default:
                return 'Información no disponible'
        }
    }

    if (loading) return <div className="p-8">Cargando...</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mis Cuentas Bancarias</h1>
                <button
                    onClick={() => {
                        resetForm()
                        setShowModal(true)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Agregar Cuenta
                </button>
            </div>

            {/* Lista de cuentas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {cuentas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No tienes cuentas bancarias registradas.
                        <br />
                        Agrega una cuenta para poder solicitar retiros.
                    </div>
                ) : (
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Información
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Titular
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cuentas.map((cuenta) => (
                                <tr key={cuenta.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {cuenta.tipoCuenta}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatCuentaInfo(cuenta)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {cuenta.nombreTitular}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {cuenta.esPredeterminada ? (
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                Predeterminada
                                            </span>
                                        ) : (
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Secundaria
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                        <button
                                            onClick={() => handleEdit(cuenta)}
                                            className="text-blue-600 hover:text-blue-900 text-sm"
                                        >
                                            Editar
                                        </button>
                                        {!cuenta.esPredeterminada && (
                                            <button
                                                onClick={() => handleSetDefault(cuenta.id)}
                                                className="text-green-600 hover:text-green-900 text-sm"
                                            >
                                                Predeterminada
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(cuenta.id)}
                                            className="text-red-600 hover:text-red-900 text-sm"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal para crear/editar cuenta */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4">
                            {editingCuenta ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Tipo de Cuenta *
                                </label>
                                <select
                                    value={formData.tipoCuenta}
                                    onChange={(e) => {
                                        const nuevoTipo = e.target.value as 'nacional' | 'internacional' | 'paypal'

                                        // 🔥 LIMPIAR CAMPOS AL CAMBIAR TIPO:
                                        setFormData({
                                            tipoCuenta: nuevoTipo,
                                            nombreBanco: '',
                                            clabe: '',
                                            numeroRuta: '',
                                            numeroCuenta: '',
                                            swift: '',
                                            emailPaypal: '',
                                            nombreTitular: formData.nombreTitular, // Conservar nombre
                                            esPredeterminada: formData.esPredeterminada // Conservar checkbox
                                        })
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="nacional">Nacional (México)</option>
                                    <option value="internacional">Internacional (USA y otros)</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>

                            {renderFormFields()}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Nombre del Titular *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombreTitular}
                                    onChange={(e) => setFormData({ ...formData, nombreTitular: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Nombre completo del titular"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.esPredeterminada}
                                        onChange={(e) => setFormData({ ...formData, esPredeterminada: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Establecer como cuenta predeterminada</span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {editingCuenta ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}