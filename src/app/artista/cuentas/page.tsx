'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompactTable } from '@table-library/react-table-library/compact'
import { FaPlus, FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa'

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

//v2 empieza aca

    // ----------------- TABLE COLUMNS DEFINITION -------------------
    const columns = [
        {
            label: '',
            pinLeft: true,
            renderCell: (item: CuentaBancaria) =>
                item.esPredeterminada ? (
                    <FaStar className="text-yellow-400" title="Predeterminada" />
                ) : (
                    <FaRegStar className="text-gray-400" title="Secundaria" />
                ),
        },
        {
            label: 'Tipo',
            renderCell: (item: CuentaBancaria) => (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {item.tipoCuenta}
                </span>
            ),
        },
        {
            label: 'Información',
            renderCell: (item: CuentaBancaria) => formatCuentaInfo(item),
        },
        {
            label: 'Titular',
            renderCell: (item: CuentaBancaria) => item.nombreTitular,
        },
        {
            label: 'Acciones',
            renderCell: (item: CuentaBancaria) => (
                <div className="flex items-center gap-3">
                    <button
                        title="Editar"
                        className="p-1 rounded hover:bg-blue-50"
                        onClick={() => handleEdit(item)}
                    >
                        <FaEdit className="text-blue-600" />
                    </button>
                    {!item.esPredeterminada && (
                        <button
                            title="Hacer predeterminada"
                            className="p-1 rounded hover:bg-green-50"
                            onClick={() => handleSetDefault(item.id)}
                        >
                            <FaStar className="text-green-600" />
                        </button>
                    )}
                    <button
                        title="Eliminar"
                        className="p-1 rounded hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                    >
                        <FaTrash className="text-red-500" />
                    </button>
                </div>
            ),
        },
    ]
    //v2 termina aca

    if (loading)
        return (
            <div className="p-8 min-h-[70vh] flex items-center justify-center text-lg text-gray-500">
                Cargando...
            </div>
        )

    return (
        <div className="p-6 md:p-10 bg-[#f6f8fa] min-h-screen">
            {/* Topbar + Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                    Mis Cuentas Bancarias
                </h1>
                <button
                    onClick={() => {
                        resetForm()
                        setShowModal(true)
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-2xl font-medium shadow hover:bg-blue-700 transition-all"
                >
                    <FaPlus className="text-lg" /> Agregar Cuenta
                </button>
            </div>

            {/* Card container */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-lg p-6 md:p-8">
                {/* Tabla elegante */}
                {cuentas.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                        No tienes cuentas bancarias registradas.<br />
                        Agrega una cuenta para poder solicitar retiros.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <CompactTable
                            columns={columns}
                            data={{ nodes: cuentas }}
                            theme={{
                                // Colores modernos y borders suaves
                                BaseRow: `
                  border-bottom: 1px solid #edf0f3;
                  &:last-child { border-bottom: none; }
                  font-size: 1rem;
                  background: rgba(255,255,255,0.65);
                  backdrop-filter: blur(2px);
                  transition: background 0.2s;
                  &:hover { background: rgba(82,124,235,0.07); }
                `,
                                Table: `
                  --tw-shadow: 0 8px 32px 0 rgba(60,60,80,0.07);
                  background: none;
                  box-shadow: none;
                  border-radius: 1.5rem;
                `,
                                HeaderRow: `
                  background: transparent;
                  font-size: 0.92rem;
                  font-weight: 700;
                  color: #21252d;
                `,
                                HeaderCell: `
                  padding: 1rem 0.75rem;
                  text-align: left;
                  border-bottom: 2px solid #f0f2f6;
                  background: transparent;
                `,
                                Cell: `
                  padding: 1rem 0.75rem;
                  background: transparent;
                `,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Modal de cuenta */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative border border-gray-100">
                        <button
                            className="absolute right-5 top-5 text-2xl text-gray-400 hover:text-gray-800"
                            onClick={() => {
                                setShowModal(false)
                                resetForm()
                            }}
                            title="Cerrar"
                        >
                            ×
                        </button>
                        <h2 className="text-xl font-bold mb-4">
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