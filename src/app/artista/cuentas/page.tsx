'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompactTable } from '@table-library/react-table-library/compact'
import { useTheme } from '@table-library/react-table-library/theme'
import { getTheme } from '@table-library/react-table-library/baseline'
import { motion } from 'framer-motion'
import {
    CreditCard,
    Globe,
    MapPin,
    Plus,
    DollarSign,
    Edit,
    Trash2,
    Star,
    StarOff,
    Search,
    RefreshCw,
    X
} from 'lucide-react'

interface CuentaBancaria {
    id: string
    tipoCuenta: 'nacional' | 'internacional' | 'paypal'
    nombreBanco?: string
    clabe?: string
    numeroCuenta?: string
    swift?: string
    emailPaypal?: string
    nombreTitular: string
    esPredeterminada: boolean
    createdAt: string
}

export default function CuentasDashboardCompact() {
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
        numeroCuenta: '',
        swift: '',
        emailPaypal: '',
        nombreTitular: '',
        esPredeterminada: false
    })
    const router = useRouter()

    useEffect(() => { fetchCuentas() }, [])
    const fetchCuentas = async () => {
        try {
            const res = await fetch('/api/cuentas')
            if (!res.ok) {
                if (res.status === 401) router.push('/login')
                return
            }
            const data = await res.json()
            setCuentas(data.cuentas || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const metrics = [
        { title: 'Total', value: cuentas.length.toString(), icon: CreditCard },
        { title: 'Nacionales', value: cuentas.filter(c => c.tipoCuenta === 'nacional').length.toString(), icon: MapPin },
        { title: 'Internacionales', value: cuentas.filter(c => c.tipoCuenta === 'internacional').length.toString(), icon: Globe },
        { title: 'PayPal', value: cuentas.filter(c => c.tipoCuenta === 'paypal').length.toString(), icon: DollarSign }
    ]

    const resetForm = () => {
        setFormData({ tipoCuenta: 'nacional', nombreBanco: '', clabe: '', numeroCuenta: '', swift: '', emailPaypal: '', nombreTitular: '', esPredeterminada: false })
        setEditingCuenta(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        let clean: any = { tipoCuenta: formData.tipoCuenta, nombreTitular: formData.nombreTitular, esPredeterminada: formData.esPredeterminada }
        if (formData.tipoCuenta === 'nacional') { clean.nombreBanco = formData.nombreBanco; clean.clabe = formData.clabe }
        if (formData.tipoCuenta === 'internacional') { clean.nombreBanco = formData.nombreBanco; clean.numeroCuenta = formData.numeroCuenta; clean.swift = formData.swift }
        if (formData.tipoCuenta === 'paypal') { clean.emailPaypal = formData.emailPaypal }
        const url = editingCuenta ? `/api/cuentas/${editingCuenta.id}` : '/api/cuentas'
        const method = editingCuenta ? 'PUT' : 'POST'
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clean) })
        const data = await res.json()
        if (res.ok) { setShowModal(false); resetForm(); fetchCuentas() }
        else alert(data.error)
    }

    const handleEdit = (c: CuentaBancaria) => { setEditingCuenta(c); setFormData({ ...c, tipoCuenta: c.tipoCuenta, nombreTitular: c.nombreTitular, esPredeterminada: c.esPredeterminada }); setShowModal(true) }
    const handleDelete = async (id: string) => { if (!confirm('¿Eliminar?')) return; await fetch(`/api/cuentas/${id}`, { method: 'DELETE' }); fetchCuentas() }
    const handleSetDefault = async (id: string) => { await fetch(`/api/cuentas/${id}/predeterminada`, { method: 'PUT' }); fetchCuentas() }
    const formatInfo = (c: CuentaBancaria) => c.tipoCuenta === 'paypal' ? `PayPal - ${c.emailPaypal}` : `${c.nombreBanco} ****${(c.clabe || c.numeroCuenta)?.slice(-4)}`

    const cuentasFiltradas = cuentas.filter(c => {
        const s = searchTerm.toLowerCase()
        return (c.nombreTitular.toLowerCase().includes(s) || c.nombreBanco?.toLowerCase().includes(s) || c.emailPaypal?.toLowerCase().includes(s))
            && (filterType === 'all' || c.tipoCuenta === filterType)
    })
    const data = { nodes: cuentasFiltradas }

    const theme = useTheme([
        getTheme(),
        {
            Table: `
        --data-table-library_grid-template-columns: 40px 250px 1fr 100px 100px 120px;
        font-size: 13px;
        border-radius: 8px;
        overflow-x: auto;
      `,
            Header: `
        position: sticky;
        top: 0;
        background-color: #2b333c;
        color: #f7f7f7;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        z-index: 10;
      `,
            BaseRow: `&:hover { transform: translateX(2px); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }`,
            BaseCell: `padding: 12px; vertical-align: middle;`,
            Body: `background-color: #f0f0f0;`
        }
    ])

    const COLUMNS = [
        { label: '', renderCell: (i: CuentaBancaria) => i.esPredeterminada ? <Star className="w-4 h-4 text-[#10cfbd]" /> : null },
        { label: 'Cuenta', renderCell: (i: CuentaBancaria) => <div className="flex items-center space-x-2"><div className="p-1 rounded bg-[#527ceb] text-[#f7f7f7]">{i.tipoCuenta === 'nacional' ? <MapPin className="w-4 h-4" /> : i.tipoCuenta === 'internacional' ? <Globe className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}</div><div><div className="font-medium text-[#21252d] text-sm">{formatInfo(i)}</div><div className="text-xs text-[#7c777a] capitalize">{i.tipoCuenta}</div></div></div> },
        { label: 'Titular', renderCell: (i: CuentaBancaria) => <div><div className="font-medium text-[#21252d] text-sm">{i.nombreTitular}</div><div className="text-xs text-[#7c777a]">{new Date(i.createdAt).toLocaleDateString('es-MX')}</div></div> },
        { label: 'Tipo', renderCell: (i: CuentaBancaria) => <span className="px-2 py-0.5 text-xs rounded-full bg-[#f7f7f7] text-[#21252d]">{i.tipoCuenta}</span> },
        { label: 'Estado', renderCell: (i: CuentaBancaria) => <span className="px-2 py-0.5 text-xs rounded-full bg-[#f7f7f7] text-[#21252d]">{i.esPredeterminada ? 'Predeterminada' : 'Secundaria'}</span> },
        { label: 'Acciones', renderCell: (i: CuentaBancaria) => <div className="flex space-x-1"><motion.button whileHover={{ scale: 1.1 }} onClick={() => handleEdit(i)}><Edit className="w-4 h-4 text-[#6762b3] hover:text-[#48b0f7]" /></motion.button>{!i.esPredeterminada && <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleSetDefault(i.id)}><Star className="w-4 h-4 text-[#019fd2] hover:text-[#10cfbd]" /></motion.button>}<motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(i.id)}><Trash2 className="w-4 h-4 text-[#d64545] hover:text-[#ff6b6b]" /></motion.button></div> }
    ]

    if (loading) return <div className="p-6 animate-pulse"><div className="h-6 bg-[#f0f0f0] rounded w-48 mb-4"></div><div className="h-64 bg-[#f0f0f0] rounded"></div></div>

    return (
        <div className="p-6 space-y-6 max-w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[#21252d]">Gestión de Cuentas</h1>
                    <p className="text-sm text-[#7c777a]">Administra las cuentas de destino</p>
                </div>
                <div className="flex items-center space-x-2">
                    <motion.button whileHover={{ scale: 1.05 }} onClick={fetchCuentas} className="flex items-center px-3 py-1 border border-[#21252d] rounded text-sm text-[#21252d] hover:bg-[#f0f0f0] transition"><RefreshCw className="w-4 h-4 mr-1" />Actualizar</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center px-3 py-1 bg-[#527ceb] text-[#f7f7f7] rounded text-sm hover:bg-[#48b0f7] transition"><Plus className="w-4 h-4 mr-1" />Agregar</motion.button>
                </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, index) => (
                    <motion.div key={index} whileHover={{ scale: 1.02 }} className="bg-[#f7f7f7] p-4 rounded-lg shadow border border-[#e0e0e0] transition">
                        <div className="flex items-center justify-between">
                            <div className="p-2 rounded" style={{ backgroundColor: '#dfe1e5' }}><m.icon className="w-5 h-5 text-[#6762b3]" /></div>
                            <div><h3 className="text-xl font-bold text-[#21252d]">{m.value}</h3></div>
                        </div>
                        <p className="text-xs text-[#7c777a] mt-2">{m.title}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filtros */}
            <div className="bg-[#f7f7f7] p-4 rounded-lg shadow border border-[#e0e0e0]">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7c777a] w-4 h-4" />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-2 py-2 text-sm border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2] focus:border-transparent" />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-sm border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2] focus:border-transparent">
                        <option value="all">Todos</option>
                        <option value="nacional">Nacional</option>
                        <option value="internacional">Internacional</option>
                        <option value="paypal">PayPal</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-[#gallery] rounded-lg shadow border border-[#e0e0e0] overflow-x-auto">
                <CompactTable columns={COLUMNS} data={data} theme={theme} />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="bg-[#wild-sand] p-4 rounded-lg w-full max-w-md max-h-[85vh] overflow-auto shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-[#21252d]">{editingCuenta ? 'Editar' : 'Agregar'} Cuenta</h2>
                            <button onClick={() => { setShowModal(false); resetForm() }}><X className="w-5 h-5 text-[#7c777a]" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                            <div>
                                <label className="block mb-1 text-[#21252d]">Tipo *</label>
                                <select value={formData.tipoCuenta} onChange={e => { const t = e.target.value as any; setFormData({ ...formData, tipoCuenta: t }) }} className="w-full py-1 px-2 border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2]">
                                    <option value="nacional">Nacional</option>
                                    <option value="internacional">Internacional</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>
                            {formData.tipoCuenta === 'nacional' && (
                                <>
                                    <div><label className="block mb-1 text-[#21252d]">Banco *</label><input required value={formData.nombreBanco} onChange={e => setFormData({ ...formData, nombreBanco: e.target.value })} className="w-full py-1 px-2 border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2]" /></div>
                                    <div><label className="block mb-1 text-[#21252d]">CLABE *</label><input required maxLength={18} value={formData.clabe} onChange={e => setFormData({ ...formData, clabe: e.target.value })} className="w-full py-1 px-2 border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2]" /></div>
                                </>
                            )}
                            {formData.tipoCuenta === 'internacional' && (
                                <>
                                    <div><label className="block mb-1 text-[#21252d]">SWIFT *</label><input required value={formData.swift} onChange={e => setFormData({ ...formData, swift: e.target.value.toUpperCase() })} className="w-full py-1 px-2 border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2]" /></div>
                                    <div><label className="block mb-1 text-[#21252d]">Cuenta *</label><input required value={formData.numeroCuenta} onChange={e => setFormData({ ...formData, numeroCuenta: e.target.value })} className="w-full py-1 px-2 border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2]" /></div>
                                </>
                            )}
                            {formData.tipoCuenta === 'paypal' && (
                                <div><label className="block mb-1 text-[#21252d]">Email PayPal *</label><input required type="email" value={formData.emailPaypal} onChange={e => setFormData({ ...formData, emailPaypal: e.target.value })} className="w-full py-1 px-2 border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2]" /></div>
                            )}
                            <div><label className="block mb-1 text-[#21252d]">Titular *</label><input required value={formData.nombreTitular} onChange={e => setFormData({ ...formData, nombreTitular: e.target.value })} className="w-full py-1 px-2 border border-[#d0d0d0] rounded focus:ring-1 focus:ring-[#019fd2]" /></div>
                            <div className="flex items-center"><input type="checkbox" checked={formData.esPredeterminada} onChange={e => setFormData({ ...formData, esPredeterminada: e.target.checked })} className="mr-2" /><label className="text-[#21252d] text-sm">Predeterminada</label></div>
                            <div className="flex justify-end gap-2 pt-3">
                                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="px-4 py-1 text-sm border border-[#21252d] rounded hover:bg-[#f0f0f0]">Cancelar</button>
                                <button type="submit" className="px-4 py-1 bg-[#527ceb] text-[#f7f7f7] rounded text-sm hover:bg-[#48b0f7]">{editingCuenta ? 'Actualizar' : 'Crear'}</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
