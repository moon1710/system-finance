'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    Wallet, Plus, TrendingUp, Clock, CheckCircle2, XCircle, CreditCard, ArrowUpRight,
    DollarSign, AlertCircle, Sparkles, ChevronRight, RefreshCw
} from 'lucide-react'

export default function ArtistDashboard() {
    const [user, setUser] = useState(null)
    const [retiros, setRetiros] = useState([])
    const [cuentas, setCuentas] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRetiros: 0, pendientes: 0, completados: 0, montoTotal: 0
    })
    const router = useRouter()

    // --- Fetch de datos y validación de sesión
    useEffect(() => {
        const fetchData = async () => {
            try {
                const authRes = await fetch('/api/auth/me')
                const authData = await authRes.json()
                if (!authData.isLoggedIn || authData.user?.rol !== 'artista') {
                    router.push('/login'); return
                }
                setUser(authData.user)
                const retirosRes = await fetch('/api/retiros')
                if (retirosRes.ok) {
                    const retirosData = await retirosRes.json()
                    setRetiros(retirosData.retiros || [])
                    const total = retirosData.retiros?.length || 0
                    const pendientes = retirosData.retiros?.filter(r => r.estado === 'Pendiente').length || 0
                    const completados = retirosData.retiros?.filter(r => r.estado === 'Completado').length || 0
                    const montoTotal = retirosData.retiros?.filter(r => r.estado === 'Completado')
                        .reduce((sum, r) => sum + parseFloat(r.montoSolicitado), 0) || 0
                    setStats({ totalRetiros: total, pendientes, completados, montoTotal })
                }
                const cuentasRes = await fetch('/api/cuentas')
                if (cuentasRes.ok) {
                    const cuentasData = await cuentasRes.json()
                    setCuentas(cuentasData.cuentas || [])
                }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        }
        fetchData()
    }, [router])

    // --- Formateo de moneda
    const formatCurrency = (amount: number) =>
        `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    // --- Colores de estados
    const getStatusConfig = (estado: string) => {
        const configs: Record<string, any> = {
            'Pendiente': { color: 'text-[#527ceb] bg-[#f0f0f0] border-[#527ceb]', icon: Clock },
            'Procesando': { color: 'text-[#019fd2] bg-[#f0f0f0] border-[#019fd2]', icon: RefreshCw },
            'Completado': { color: 'text-[#10cfbd] bg-[#f0f0f0] border-[#10cfbd]', icon: CheckCircle2 },
            'Rechazado': { color: 'text-red-500 bg-[#f0f0f0] border-red-300', icon: XCircle }
        }
        return configs[estado] || configs['Pendiente']
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-[#527ceb] border-t-transparent rounded-full"
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f7f7f7] p-10 font-sans text-[15px] text-[#2b333c]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-[#082661] tracking-tight mb-1">
                        ¡Hola, {user?.nombreCompleto?.split(' ')[0] || 'Artista'}!
                    </h1>
                    <p className="text-[#7c777a] text-base">Gestiona tus retiros y cuentas bancarias</p>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Panel principal */}
                    <div className="xl:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="bg-gradient-to-br from-[#527ceb] via-[#6762b3] to-[#10cfbd] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
                        >
                            {/* Fondo decorativo */}
                            <div className="relative z-10">
                                {/* Header tarjeta principal */}
                                <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            whileHover={{ rotate: 8, scale: 1.1 }}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                            className="p-4 bg-white/20 rounded-2xl border border-white/20"
                                        >
                                            <Wallet size={34} />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-2xl font-bold mb-1">Solicitar Retiro</h2>
                                            <p className="text-blue-100 text-lg opacity-80">Retira tus ganancias rápido y seguro</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                                        <div className="w-3 h-3 bg-[#10cfbd] rounded-full animate-pulse"></div>
                                        <span className="text-sm font-medium">Sistema activo</span>
                                    </div>
                                </div>
                                {/* Stats cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    {/* Completados */}
                                    <motion.div
                                        whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(16,207,189,.09)' }}
                                        transition={{ duration: 0.25 }}
                                        className="bg-white/20 text-white rounded-xl p-4 border border-white/20"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2 size={18} className="text-[#10cfbd]" />
                                            <p className="text-blue-100 text-sm">Completados</p>
                                        </div>
                                        <p className="text-3xl font-bold">{stats.completados}</p>
                                        <p className="text-blue-100 text-sm">{formatCurrency(stats.montoTotal)} total</p>
                                    </motion.div>
                                    {/* Pendientes */}
                                    <motion.div
                                        whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(82,124,235,.12)' }}
                                        transition={{ duration: 0.25 }}
                                        className="bg-white/20 text-white rounded-xl p-4 border border-white/20"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock size={18} className="text-[#527ceb]" />
                                            <p className="text-blue-100 text-sm">Pendientes</p>
                                        </div>
                                        <p className="text-3xl font-bold">{stats.pendientes}</p>
                                        <p className="text-blue-100 text-sm">En proceso</p>
                                    </motion.div>
                                    {/* Cuentas */}
                                    <motion.div
                                        whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(103,98,179,.10)' }}
                                        transition={{ duration: 0.25 }}
                                        className="bg-white/20 text-white rounded-xl p-4 border border-white/20"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <CreditCard size={18} className="text-[#6762b3]" />
                                            <p className="text-blue-100 text-sm">Cuentas</p>
                                        </div>
                                        <p className="text-3xl font-bold">{cuentas.length}</p>
                                        <p className="text-blue-100 text-sm">
                                            {cuentas.length > 0 ? 'Configuradas' : 'Por configurar'}
                                        </p>
                                    </motion.div>
                                </div>
                                {/* Botones de acción */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            href="/artista/retiros"
                                            className="flex items-center justify-center gap-3 bg-[#f7f7f7] text-[#527ceb] px-6 py-3 rounded-xl font-semibold hover:bg-[#e6eefe] transition-all shadow-md"
                                        >
                                            <Plus size={20} />
                                            <span>Nuevo Retiro</span>
                                            <ArrowUpRight size={18} />
                                        </Link>
                                    </motion.div>
                                    {cuentas.length === 0 && (
                                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                            <Link
                                                href="/artista/cuentas"
                                                className="flex items-center gap-2 bg-[#10cfbd] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0cb3a2] transition-all"
                                            >
                                                <CreditCard size={18} />
                                                <span>Configurar Cuenta</span>
                                            </Link>
                                        </motion.div>
                                    )}
                                </div>
                                {/* Info adicional */}
                                <div className="mt-6 flex items-center gap-2 text-blue-100 text-sm">
                                    <Sparkles size={16} />
                                    <span>Los retiros se procesan en 1-3 días hábiles</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Actividad Reciente */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="mt-8 bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-[#21252d]">
                                    <TrendingUp size={22} className="text-[#527ceb]" />
                                    Actividad Reciente
                                </h3>
                                <Link
                                    href="/artista/retiros"
                                    className="text-[#527ceb] hover:text-[#415fb3] text-sm font-medium flex items-center gap-1"
                                >
                                    Ver todos <ChevronRight size={16} />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {retiros.slice(0, 3).map((retiro, index) => {
                                    const statusConfig = getStatusConfig(retiro.estado)
                                    const StatusIcon = statusConfig.icon
                                    return (
                                        <motion.div
                                            key={retiro.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.07 * index }}
                                            className="flex items-center justify-between p-4 border border-[#f0f0f0] rounded-xl hover:bg-[#f7f7f7] transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg border ${statusConfig.color}`}>
                                                    <StatusIcon size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#2b333c]">
                                                        {formatCurrency(parseFloat(retiro.montoSolicitado))}
                                                    </p>
                                                    <p className="text-sm text-[#7c777a]">
                                                        {new Date(retiro.fechaSolicitud).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                                {retiro.estado}
                                            </span>
                                        </motion.div>
                                    )
                                })}
                                {retiros.length === 0 && (
                                    <div className="text-center py-8">
                                        <Sparkles size={44} className="text-[#f0f0f0] mx-auto mb-2" />
                                        <p className="text-[#7c777a] font-medium mb-1">¡Aún no tienes retiros!</p>
                                        <p className="text-[#b0b0b0] text-sm">Tu primer retiro aparecerá aquí</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                    {/* Sidebar derecho */}
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 }}
                            className="bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0]"
                        >
                            <h3 className="text-lg font-bold flex items-center gap-2 text-[#21252d] mb-4">
                                <DollarSign size={20} className="text-[#10cfbd]" />
                                Resumen
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a]">Total Retiros</span>
                                    <span className="font-bold text-[#21252d]">{stats.totalRetiros}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a]">Pendientes</span>
                                    <span className="font-bold text-[#527ceb]">{stats.pendientes}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a]">Completados</span>
                                    <span className="font-bold text-[#10cfbd]">{stats.completados}</span>
                                </div>
                                <hr className="border-[#f0f0f0]" />
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-[#7c777a]">Total Retirado</span>
                                    <span className="font-bold text-lg text-[#21252d]">
                                        {formatCurrency(stats.montoTotal)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                        {/* Cómo funciona */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 }}
                            className="bg-gradient-to-br from-[#10cfbd]/10 to-[#527ceb]/10 rounded-2xl p-6 border border-[#10cfbd]/20"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-[#10cfbd] rounded-lg flex items-center justify-center">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-[#21252d]">¿Cómo funciona?</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-[#527ceb] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                                    <div>
                                        <p className="font-medium text-[#21252d]">Registra tu cuenta bancaria</p>
                                        <p className="text-[#7c777a]">Agrega tu información bancaria de forma segura</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-[#6762b3] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                                    <div>
                                        <p className="font-medium text-[#21252d]">Solicita tu retiro</p>
                                        <p className="text-[#7c777a]">Indica el monto que deseas retirar</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-[#10cfbd] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                                    <div>
                                        <p className="font-medium text-[#21252d]">Recibe tu dinero</p>
                                        <p className="text-[#7c777a]">Te transferimos en 1-3 días hábiles</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        {/* Cuentas bancarias */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.22 }}
                            className="bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-[#21252d]">
                                    <CreditCard size={20} className="text-[#6762b3]" />
                                    Cuentas
                                </h3>
                                <Link
                                    href="/artista/cuentas"
                                    className="text-[#6762b3] hover:text-[#527ceb] text-sm font-medium"
                                >
                                    Gestionar
                                </Link>
                            </div>
                            {cuentas.length > 0 ? (
                                <div className="space-y-3">
                                    {cuentas.slice(0, 2).map((cuenta, index) => (
                                        <motion.div
                                            key={cuenta.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="flex items-center gap-3 p-3 border border-[#f0f0f0] rounded-xl hover:bg-[#f7f7f7] transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-[#e7e6f5] rounded-lg flex items-center justify-center">
                                                <CreditCard size={18} className="text-[#6762b3]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-[#2b333c] capitalize">{cuenta.tipoCuenta}</p>
                                                <p className="text-sm text-[#7c777a]">{cuenta.nombreTitular}</p>
                                            </div>
                                            {cuenta.esPredeterminada && (
                                                <span className="px-2 py-1 bg-[#10cfbd]/10 text-[#10cfbd] text-xs rounded-full font-medium">
                                                    Principal
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 bg-[#fdf6e3] rounded-full flex items-center justify-center mx-auto mb-3">
                                        <AlertCircle size={24} className="text-[#e5b700]" />
                                    </div>
                                    <p className="text-[#21252d] font-medium mb-1">Sin cuentas registradas</p>
                                    <p className="text-[#7c777a] text-sm mb-4">Configura una cuenta para poder retirar</p>
                                    <Link
                                        href="/artista/cuentas"
                                        className="inline-flex items-center gap-2 bg-[#6762b3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#527ceb] transition-colors shadow-sm"
                                    >
                                        <Plus size={16} />
                                        Agregar Cuenta
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                        {/* Acceso rápido */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.28 }}
                            className="bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0]"
                        >
                            <h3 className="text-lg font-bold text-[#21252d] mb-4">Acceso Rápido</h3>
                            <div className="space-y-3">
                                <Link
                                    href="/artista/retiros"
                                    className="flex items-center gap-3 p-3 hover:bg-[#f7f7f7] rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-[#e6eefe] rounded-lg flex items-center justify-center group-hover:bg-[#527ceb]/10">
                                        <Wallet size={18} className="text-[#527ceb]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Mis Retiros</p>
                                        <p className="text-sm text-[#7c777a]">Ver historial completo</p>
                                    </div>
                                    <ChevronRight size={16} className="text-[#b0b0b0] group-hover:text-[#527ceb] transition-colors" />
                                </Link>
                                <Link
                                    href="/artista/cuentas"
                                    className="flex items-center gap-3 p-3 hover:bg-[#f7f7f7] rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-[#e7e6f5] rounded-lg flex items-center justify-center group-hover:bg-[#6762b3]/10">
                                        <CreditCard size={18} className="text-[#6762b3]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Cuentas Bancarias</p>
                                        <p className="text-sm text-[#7c777a]">Gestionar métodos de pago</p>
                                    </div>
                                    <ChevronRight size={16} className="text-[#b0b0b0] group-hover:text-[#6762b3] transition-colors" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
