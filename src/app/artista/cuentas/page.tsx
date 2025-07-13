'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompactTable } from '@table-library/react-table-library/compact'
import { useTheme } from '@table-library/react-table-library/theme'
import { getTheme } from '@table-library/react-table-library/baseline'
import {
    CreditCard,
    Globe,
    MapPin,
    Plus,
    TrendingUp,
    Users,
    DollarSign,
    Building,
    Edit,
    Trash2,
    Star,
    StarOff,
    Search,
    Filter,
    Download,
    RefreshCw,
    X
} from 'lucide-react'

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

export default function CuentasDashboard() {
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')
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

    // Cargar cuentas (tu función original)
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

    // Métricas calculadas
    const metrics = [
        {
            title: "Total Cuentas",
            value: cuentas.length.toString(),
            icon: CreditCard,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            borderColor: "border-blue-200"
        },
        {
            title: "Cuentas Nacionales",
            value: cuentas.filter(c => c.tipoCuenta === 'nacional').length.toString(),
            icon: MapPin,
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            borderColor: "border-green-200"
        },
        {
            title: "Internacionales",
            value: cuentas.filter(c => c.tipoCuenta === 'internacional').length.toString(),
            icon: Globe,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            borderColor: "border-purple-200"
        },
        {
            title: "PayPal",
            value: cuentas.filter(c => c.tipoCuenta === 'paypal').length.toString(),
            icon: DollarSign,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
            borderColor: "border-orange-200"
        }
    ]

    // Tus funciones originales (sin cambios)
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
            let cleanData: any = {
                tipoCuenta: formData.tipoCuenta,
                nombreTitular: formData.nombreTitular,
                esPredeterminada: formData.esPredeterminada
            }

            switch (formData.tipoCuenta) {
                case 'nacional':
                    cleanData.nombreBanco = formData.nombreBanco
                    cleanData.clabe = formData.clabe
                    break
                case 'internacional':
                    cleanData.nombreBanco = formData.nombreBanco
                    cleanData.swift = formData.swift
                    cleanData.numeroCuenta = formData.numeroCuenta
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

    const formatCuentaInfo = (cuenta: CuentaBancaria) => {
        switch (cuenta.tipoCuenta) {
            case 'nacional':
                return `${cuenta.nombreBanco} - ****${cuenta.clabe?.slice(-4)}`
            case 'internacional':
                return `${cuenta.nombreBanco} - ****${cuenta.numeroCuenta?.slice(-4)} (${cuenta.swift})`
            case 'paypal':
                return `PayPal - ${cuenta.emailPaypal}`
            default:
                return 'Información no disponible'
        }
    }

    // Filtrar cuentas
    const cuentasFiltradas = cuentas.filter(cuenta => {
        const matchesSearch = cuenta.nombreTitular.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cuenta.nombreBanco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cuenta.emailPaypal?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterType === 'all' || cuenta.tipoCuenta === filterType
        return matchesSearch && matchesFilter
    })

    const data = { nodes: cuentasFiltradas }

    // Configuración React Table Library
    const theme = useTheme([
        getTheme(),
        {
            Table: `
                --data-table-library_grid-template-columns: 60px 300px 1fr 120px 120px 150px;
                font-size: 14px;
                border-radius: 12px;
                overflow: auto;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            `,
            Header: `
                background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%);
                color: #475569;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 0.05em;
                border-bottom: 2px solid #e2e8f0;
            `,
            Body: `
                background-color: #ffffff;
            `,
            BaseRow: `
                border-bottom: 1px solid #f1f5f9;
                transition: all 0.3s ease;
                &:hover {
                    background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
                    transform: translateX(4px);
                    box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.1);
                }
                &:last-child {
                    border-bottom: none;
                }
            `,
            BaseCell: `
                padding: 16px;
                vertical-align: middle;
            `,
        },
    ])

    const COLUMNS = [
        {
            label: '',
            renderCell: (item: CuentaBancaria) => (
                <div className="flex justify-center">
                    {item.esPredeterminada && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    )}
                </div>
            )
        },
        {
            label: 'Información de Cuenta',
            renderCell: (item: CuentaBancaria) => (
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${item.tipoCuenta === 'nacional' ? 'bg-green-100' :
                            item.tipoCuenta === 'internacional' ? 'bg-purple-100' : 'bg-orange-100'
                        }`}>
                        {item.tipoCuenta === 'nacional' ? <MapPin className="w-5 h-5 text-green-600" /> :
                            item.tipoCuenta === 'internacional' ? <Globe className="w-5 h-5 text-purple-600" /> :
                                <DollarSign className="w-5 h-5 text-orange-600" />}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{formatCuentaInfo(item)}</div>
                        <div className="text-sm text-gray-500 capitalize">{item.tipoCuenta}</div>
                    </div>
                </div>
            )
        },
        {
            label: 'Titular',
            renderCell: (item: CuentaBancaria) => (
                <div>
                    <div className="font-medium text-gray-900">{item.nombreTitular}</div>
                    <div className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('es-MX')}
                    </div>
                </div>
            )
        },
        {
            label: 'Tipo',
            renderCell: (item: CuentaBancaria) => (
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${item.tipoCuenta === 'nacional' ? 'bg-green-100 text-green-800' :
                        item.tipoCuenta === 'internacional' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                    }`}>
                    {item.tipoCuenta === 'nacional' ? 'Nacional' :
                        item.tipoCuenta === 'internacional' ? 'Internacional' : 'PayPal'}
                </span>
            )
        },
        {
            label: 'Estado',
            renderCell: (item: CuentaBancaria) => (
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${item.esPredeterminada ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {item.esPredeterminada ? 'Predeterminada' : 'Secundaria'}
                </span>
            )
        },
        {
            label: 'Acciones',
            renderCell: (item: CuentaBancaria) => (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    {!item.esPredeterminada && (
                        <button
                            onClick={() => handleSetDefault(item.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Establecer como predeterminada"
                        >
                            <StarOff className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ]

    const renderFormFields = () => {
        switch (formData.tipoCuenta) {
            case 'nacional':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Banco *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.nombreBanco}
                                onChange={(e) => setFormData({ ...formData, nombreBanco: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Ej: BBVA México, Banorte, Santander"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CLABE (18 dígitos) *
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={18}
                                value={formData.clabe}
                                onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="123456789012345678"
                            />
                        </div>
                    </>
                )

            case 'internacional':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                País *
                            </label>
                            <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option value="USA">Estados Unidos</option>
                                <option value="other">Otro país</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Código SWIFT *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.swift}
                                onChange={(e) => setFormData({ ...formData, swift: e.target.value.toUpperCase() })}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="BCMRMXMM"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número de Cuenta *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.numeroCuenta}
                                onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="123456789012345678"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CLABE (solo México, 18 dígitos)
                            </label>
                            <input
                                type="text"
                                maxLength={18}
                                value={formData.clabe}
                                onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="123456789012345678"
                            />
                        </div>
                    </>
                )
            case 'paypal':
                return (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email de PayPal *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.emailPaypal}
                            onChange={(e) => setFormData({ ...formData, emailPaypal: e.target.value })}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="tu@email.com"
                        />
                    </div>
                )
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Cuentas Bancarias</h1>
                    <p className="text-gray-600 mt-1">Administra las cuentas de destino para retiros</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchCuentas}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualizar
                    </button>
                    <button
                        onClick={() => {
                            resetForm()
                            setShowModal(true)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Cuenta
                    </button>
                </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <div key={index} className={`bg-white rounded-xl p-6 shadow-sm border-2 ${metric.borderColor} hover:shadow-md transition-all duration-300`}>
                        <div className="flex items-center justify-between">
                            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                                <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
                            </div>
                            <div className="text-right">
                                <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-600 text-sm">{metric.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por titular, banco o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="nacional">Nacional</option>
                            <option value="internacional">Internacional</option>
                            <option value="paypal">PayPal</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla de Cuentas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {cuentasFiltradas.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cuentas registradas</h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm || filterType !== 'all'
                                ? 'No se encontraron cuentas con los filtros aplicados.'
                                : 'Agrega una cuenta bancaria para poder solicitar retiros.'}
                        </p>
                        {(!searchTerm && filterType === 'all') && (
                            <button
                                onClick={() => {
                                    resetForm()
                                    setShowModal(true)
                                }}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Primera Cuenta
                            </button>
                        )}
                    </div>
                ) : (
                    <CompactTable columns={COLUMNS} data={data} theme={theme} />
                )}
            </div>

            {/* Modal para crear/editar cuenta */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCuenta ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    resetForm()
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Cuenta *
                                </label>
                                <select
                                    value={formData.tipoCuenta}
                                    onChange={(e) => {
                                        const nuevoTipo = e.target.value as 'nacional' | 'internacional' | 'paypal'
                                        setFormData({
                                            tipoCuenta: nuevoTipo,
                                            nombreBanco: '',
                                            clabe: '',
                                            numeroRuta: '',
                                            numeroCuenta: '',
                                            swift: '',
                                            emailPaypal: '',
                                            nombreTitular: formData.nombreTitular,
                                            esPredeterminada: formData.esPredeterminada
                                        })
                                    }}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="nacional">Nacional (México)</option>
                                    <option value="internacional">Internacional (USA y otros)</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>

                            {renderFormFields()}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre del Titular *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombreTitular}
                                    onChange={(e) => setFormData({ ...formData, nombreTitular: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Nombre completo del titular"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="predeterminada"
                                    checked={formData.esPredeterminada}
                                    onChange={(e) => setFormData({ ...formData, esPredeterminada: e.target.checked })}
                                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="predeterminada" className="text-sm text-gray-700">
                                    Establecer como cuenta predeterminada
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
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