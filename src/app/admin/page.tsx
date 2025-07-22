'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Clock, LogOut, TrendingUp, AlertTriangle, CheckCircle2, DollarSign,
    UserPlus, Eye, BarChart3, Activity, Shield, Wallet, ArrowUpRight, Plus, RefreshCw,
    Sparkles, ChevronRight, CreditCard, Settings
} from 'lucide-react'

interface DashboardStats {
    totalArtistas: number
    totalRetiros: number
    retirosPendientes: number
    retirosCompletados: number
    montoTotalPendiente: number
    montoTotalCompletado: number
    alertasActivas: number
}

interface RecentActivity {
    id: string
    tipo: 'retiro_solicitado' | 'retiro_completado' | 'usuario_creado' | 'alerta_generada'
    mensaje: string
    fecha: string
    usuario?: string
}

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null)
    const [loadingAuth, setLoadingAuth] = useState(true)
    const [loadingStats, setLoadingStats] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        totalArtistas: 0,
        totalRetiros: 0,
        retirosPendientes: 0,
        retirosCompletados: 0,
        montoTotalPendiente: 0,
        montoTotalCompletado: 0,
        alertasActivas: 0
    })
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()
                if (!data.isLoggedIn || data.user?.rol !== 'admin') {
                    router.push('/login')
                } else {
                    if (data.user.requiereCambioPassword) {
                        router.push('/cambiar-password-inicial')
                        return
                    }
                    setUser(data.user)
                }
            } catch {
                router.push('/login')
            } finally {
                setLoadingAuth(false)
            }
        }
        checkAuth()
    }, [router])

    useEffect(() => {
        if (user) fetchDashboardData()
        // eslint-disable-next-line
    }, [user])

    const fetchDashboardData = async () => {
        setLoadingStats(true)
        try {
            const retirosRes = await fetch('/api/admin/retiros')
            if (retirosRes.ok) {
                const retirosData = await retirosRes.json()
                const retiros = retirosData.retiros || []
                const pendientes = retiros.filter(r => r.estado === 'Pendiente').length
                const completados = retiros.filter(r => r.estado === 'Completado').length
                const montoPendiente = retiros.filter(r => r.estado === 'Pendiente').reduce((sum, r) => sum + parseFloat(r.montoSolicitado), 0)
                const montoCompletado = retiros.filter(r => r.estado === 'Completado').reduce((sum, r) => sum + parseFloat(r.montoSolicitado), 0)
                const alertas = retiros.filter(r => r.alertas && r.alertas.length > 0).length

                const usuariosRes = await fetch('/api/usuarios')
                let totalArtistas = 0
                if (usuariosRes.ok) {
                    const usuariosData = await usuariosRes.json()
                    totalArtistas = usuariosData.usuarios?.filter(u => u.rol === 'artista').length 
                }

                setStats({
                    totalArtistas,
                    totalRetiros: retiros.length,
                    retirosPendientes: pendientes,
                    retirosCompletados: completados,
                    montoTotalPendiente: montoPendiente,
                    montoTotalCompletado: montoCompletado,
                    alertasActivas: alertas
                })

                // Actividad reciente: usa tu API real en proyecto real
                const activities: RecentActivity[] = [
                    ...retiros.slice(0, 3).map(retiro => ({
                        id: retiro.id,
                        tipo: 'retiro_solicitado' as const,
                        mensaje: `Nuevo retiro de $${parseFloat(retiro.montoSolicitado).toLocaleString()}`,
                        fecha: retiro.fechaSolicitud,
                        usuario: retiro.usuario?.nombreCompleto
                    }))
                ]
                setRecentActivity(activities)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoadingStats(false)
        }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    const formatCurrency = (amount: number) =>
        `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    if (loadingAuth || !user) {
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
                    className="mb-8 flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-4xl font-bold text-[#082661] tracking-tight mb-1">
                            ¡Hola, {user?.nombreCompleto?.split(' ')[0] || 'Admin'}!
                        </h1>
                        <p className="text-[#7c777a] text-base">Panel de administración del sistema</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchDashboardData}
                            className="flex items-center gap-2 px-4 py-2 text-[#7c777a] hover:text-[#527ceb] rounded-xl hover:bg-white transition-all shadow-sm border border-[#f0f0f0]"
                            aria-label="Actualizar"
                        >
                            <RefreshCw size={18} className={loadingStats ? 'animate-spin' : ''} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-6 py-3 bg-[#527ceb] text-white rounded-xl font-semibold hover:bg-[#415fb3] transition-all shadow-md"
                            aria-label="Salir"
                        >
                            <LogOut size={18} />
                            Salir
                        </motion.button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Panel principal */}
                    <div className="xl:col-span-2">
                        {/* Tarjeta principal con gradiente */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="bg-gradient-to-br from-[#527ceb] via-[#6762b3] to-[#10cfbd] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8"
                        >
                            <div className="relative z-10">
                                {/* Header tarjeta principal */}
                                <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            whileHover={{ rotate: 8, scale: 1.1 }}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                            className="p-4 bg-white/20 rounded-2xl border border-white/20"
                                        >
                                            <Shield size={34} />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-2xl font-bold mb-1">Panel de Control</h2>
                                            <p className="text-blue-100 text-lg opacity-80">Gestión completa del sistema</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                                        <div className="w-3 h-3 bg-[#10cfbd] rounded-full animate-pulse"></div>
                                        <span className="text-sm font-medium">Sistema activo</span>
                                    </div>
                                </div>

                                {/* Stats cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    {/* Artistas */}
                                    <motion.div
                                        whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(82,124,235,.12)' }}
                                        transition={{ duration: 0.25 }}
                                        className="bg-white/20 text-white rounded-xl p-4 border border-white/20"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users size={18} className="text-[#527ceb]" />
                                            <p className="text-blue-100 text-sm">Artistas</p>
                                        </div>
                                        <p className="text-3xl font-bold">{loadingStats ? '...' : stats.totalArtistas}</p>
                                        <p className="text-blue-100 text-sm">Total registrados</p>
                                    </motion.div>

                                    {/* Pendientes */}
                                    <motion.div
                                        whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(255,193,7,.10)' }}
                                        transition={{ duration: 0.25 }}
                                        className="bg-white/20 text-white rounded-xl p-4 border border-white/20"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock size={18} className="text-yellow-300" />
                                            <p className="text-blue-100 text-sm">Pendientes</p>
                                        </div>
                                        <p className="text-3xl font-bold">{loadingStats ? '...' : stats.retirosPendientes}</p>
                                        <p className="text-blue-100 text-sm">Requieren atención</p>
                                    </motion.div>

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
                                        <p className="text-3xl font-bold">{loadingStats ? '...' : stats.retirosCompletados}</p>
                                        <p className="text-blue-100 text-sm">{formatCurrency(stats.montoTotalCompletado)}</p>
                                    </motion.div>
                                </div>

                                {/* Botones de acción */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            href="/admin/retiros"
                                            className="flex items-center justify-center gap-3 bg-[#f7f7f7] text-[#527ceb] px-6 py-3 rounded-xl font-semibold hover:bg-[#e6eefe] transition-all shadow-md"
                                        >
                                            <Eye size={20} />
                                            <span>Gestionar Retiros</span>
                                            <ArrowUpRight size={18} />
                                        </Link>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            href="/admin/usuarios/crear"
                                            className="flex items-center gap-2 bg-[#10cfbd] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0cb3a2] transition-all"
                                        >
                                            <UserPlus size={18} />
                                            <span>Crear Usuario</span>
                                        </Link>
                                    </motion.div>
                                </div>

                                {/* Info adicional */}
                                {stats.alertasActivas > 0 && (
                                    <div className="mt-6 flex items-center gap-2 text-yellow-200 text-sm">
                                        <AlertTriangle size={16} />
                                        <span>Tienes {stats.alertasActivas} alertas activas que requieren revisión</span>
                                    </div>
                                )}
                                {stats.alertasActivas === 0 && (
                                    <div className="mt-6 flex items-center gap-2 text-blue-100 text-sm">
                                        <Sparkles size={16} />
                                        <span>Todos los retiros están bajo control</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Panel de montos */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0] mb-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-[#10cfbd]/10 rounded-xl">
                                    <DollarSign size={24} className="text-[#10cfbd]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#21252d]">Gestión Financiera</h3>
                                    <p className="text-[#7c777a]">Resumen de transacciones</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Wallet size={20} className="text-yellow-600" />
                                        <p className="text-yellow-700 font-semibold">Monto Pendiente</p>
                                    </div>
                                    <p className="text-3xl font-bold text-yellow-800">{formatCurrency(stats.montoTotalPendiente)}</p>
                                    <p className="text-yellow-600 text-sm mt-1">En {stats.retirosPendientes} solicitudes</p>
                                </div>
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <TrendingUp size={20} className="text-green-600" />
                                        <p className="text-green-700 font-semibold">Total Procesado</p>
                                    </div>
                                    <p className="text-3xl font-bold text-green-800">{formatCurrency(stats.montoTotalCompletado)}</p>
                                    <p className="text-green-600 text-sm mt-1">En {stats.retirosCompletados} retiros</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Actividad Reciente */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-[#21252d]">
                                    <Activity size={22} className="text-[#527ceb]" />
                                    Actividad Reciente
                                </h3>
                                <Link
                                    href="/admin/retiros"
                                    className="text-[#527ceb] hover:text-[#415fb3] text-sm font-medium flex items-center gap-1"
                                >
                                    Ver todos <ChevronRight size={16} />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((activity, index) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.07 * index }}
                                            className="flex items-center justify-between p-4 border border-[#f0f0f0] rounded-xl hover:bg-[#f7f7f7] transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[#527ceb]/10 text-[#527ceb] rounded-lg border border-[#527ceb]/20">
                                                    <Wallet size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#2b333c]">{activity.mensaje}</p>
                                                    <p className="text-sm text-[#7c777a]">
                                                        {activity.usuario && `Por ${activity.usuario} • `}
                                                        {new Date(activity.fecha).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <Sparkles size={44} className="text-[#f0f0f0] mx-auto mb-2" />
                                        <p className="text-[#7c777a] font-medium mb-1">Sin actividad reciente</p>
                                        <p className="text-[#b0b0b0] text-sm">La actividad aparecerá aquí</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar derecho */}
                    <div className="space-y-6">
                        {/* Resumen de alertas */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 }}
                            className="bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0]"
                        >
                            <h3 className="text-lg font-bold flex items-center gap-2 text-[#21252d] mb-4">
                                <AlertTriangle size={20} className="text-yellow-500" />
                                Alertas del Sistema
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a]">Alertas Activas</span>
                                    <span className={`font-bold ${stats.alertasActivas > 0 ? 'text-yellow-600' : 'text-[#10cfbd]'}`}>
                                        {stats.alertasActivas}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a]">Retiros Pendientes</span>
                                    <span className="font-bold text-[#527ceb]">{stats.retirosPendientes}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a]">Total en Espera</span>
                                    <span className="font-bold text-[#21252d]">
                                        {formatCurrency(stats.montoTotalPendiente)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Acciones rápidas */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 }}
                            className="bg-gradient-to-br from-[#10cfbd]/10 to-[#527ceb]/10 rounded-2xl p-6 border border-[#10cfbd]/20"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-[#527ceb] rounded-lg flex items-center justify-center">
                                    <Shield size={16} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-[#21252d]">Acciones Rápidas</h3>
                            </div>
                            <div className="space-y-3">
                                <Link
                                    href="/admin/usuarios/crear"
                                    className="flex items-center gap-3 p-3 hover:bg-white/50 rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-[#527ceb]/10 rounded-lg flex items-center justify-center group-hover:bg-[#527ceb]/20">
                                        <UserPlus size={18} className="text-[#527ceb]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Crear Usuario</p>
                                        <p className="text-sm text-[#7c777a]">Agregar nuevo artista</p>
                                    </div>
                                    <ChevronRight size={16} className="text-[#b0b0b0] group-hover:text-[#527ceb] transition-colors" />
                                </Link>
                                <Link
                                    href="/admin/retiros"
                                    className="flex items-center gap-3 p-3 hover:bg-white/50 rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-[#10cfbd]/10 rounded-lg flex items-center justify-center group-hover:bg-[#10cfbd]/20">
                                        <Eye size={18} className="text-[#10cfbd]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Gestionar Retiros</p>
                                        <p className="text-sm text-[#7c777a]">Revisar solicitudes</p>
                                    </div>
                                    <ChevronRight size={16} className="text-[#b0b0b0] group-hover:text-[#10cfbd] transition-colors" />
                                </Link>
                                <Link
                                    href="/admin/artistas"
                                    className="flex items-center gap-3 p-3 hover:bg-white/50 rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-[#6762b3]/10 rounded-lg flex items-center justify-center group-hover:bg-[#6762b3]/20">
                                        <Users size={18} className="text-[#6762b3]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Ver Artistas</p>
                                        <p className="text-sm text-[#7c777a]">Gestionar usuarios</p>
                                    </div>
                                    <ChevronRight size={16} className="text-[#b0b0b0] group-hover:text-[#6762b3] transition-colors" />
                                </Link>
                            </div>
                        </motion.div>

                        {/* Estado del sistema */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.22 }}
                            className="bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-[#21252d]">
                                    <BarChart3 size={20} className="text-green-500" />
                                    Sistema
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-600 text-sm font-medium">Online</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-800">Base de Datos</p>
                                        <p className="text-sm text-green-600">Conectada y operativa</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Shield size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-blue-800">Seguridad</p>
                                        <p className="text-sm text-blue-600">Todos los sistemas seguros</p>
                                    </div>
                                </div>
                                <div className="text-center pt-4 border-t border-[#f0f0f0]">
                                    <p className="text-[#7c777a] text-sm">
                                        Última actualización: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Acceso rápido adicional */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.28 }}
                            className="bg-[#ffffff] rounded-2xl p-6 shadow-lg border border-[#f0f0f0]"
                        >
                            <h3 className="text-lg font-bold text-[#21252d] mb-4">Herramientas</h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 p-3 hover:bg-[#f7f7f7] rounded-xl transition-colors group text-left">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                        <Settings size={18} className="text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Configuración</p>
                                        <p className="text-sm text-[#7c777a]">Ajustes del sistema</p>
                                    </div>
                                </button>
                                <button
                                    onClick={fetchDashboardData}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-[#f7f7f7] rounded-xl transition-colors group text-left"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <RefreshCw size={18} className={`text-blue-600 ${loadingStats ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Actualizar Datos</p>
                                        <p className="text-sm text-[#7c777a]">Refrescar estadísticas</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}