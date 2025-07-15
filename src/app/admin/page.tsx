'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Users, Clock, LogOut, TrendingUp, AlertTriangle, CheckCircle2, DollarSign,
    UserPlus, Eye, BarChart3, Activity, Shield, Wallet, ArrowRight, Plus, RefreshCw
} from 'lucide-react'

const colors = {
    background: '#f7f7f7',
    card: '#fff',
    border: '#f0f0f0',
    primary: '#527ceb',
    accent: '#10cfbd',
    muted: '#7c777a',
    dark: '#21252d',
}

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
                    totalArtistas = usuariosData.usuarios?.filter(u => u.rol === 'artista').length || 0
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
            <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7] font-sans">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-[#527ceb] border-t-transparent rounded-full"
                />
                <span className="ml-4 text-[#7c777a] text-lg">Cargando panel de administración...</span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f7f7f7] font-sans text-[15px]">
            {/* Header */}
            <header className="bg-white border-b border-[#f0f0f0] px-6 py-4 sticky top-0 z-40">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-[#527ceb] font-bold text-2xl tracking-tight">Panel Admin</h1>
                        <p className="text-[#7c777a] text-xs">Sistema de gestión financiera</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.07 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={fetchDashboardData}
                            className="flex items-center gap-2 px-3 py-2 text-[#7c777a] hover:text-[#527ceb] rounded-lg hover:bg-[#f7f7f7] transition-all"
                            aria-label="Actualizar"
                        >
                            <RefreshCw size={18} className={loadingStats ? 'animate-spin' : ''} />
                        </motion.button>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[#21252d] font-semibold text-sm">{user.nombreCompleto}</p>
                                <p className="text-[#7c777a] text-xs">Administrador</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-[#527ceb] text-white rounded-xl font-medium hover:bg-[#415fb3] transition-all shadow-md"
                                aria-label="Salir"
                            >
                                <LogOut size={18} />
                                Salir
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-6">
                {/* Bienvenida */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl font-bold text-[#21252d] mb-1">
                        ¡Bienvenido, {user.nombreCompleto.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-[#7c777a] text-lg">Resumen de actividad y métricas clave.</p>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Panel principal - Estadísticas */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Artistas */}
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.10 }}
                                whileHover={{ y: -2, boxShadow: '0 6px 20px 0 #527ceb1a' }}
                                className="bg-white rounded-2xl p-6 border border-[#f0f0f0] shadow-sm hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#527ceb]/10 rounded-xl">
                                        <Users size={24} className="text-[#527ceb]" />
                                    </div>
                                    <div>
                                        <p className="text-[#7c777a] text-sm font-medium">Artistas</p>
                                        <p className="text-2xl font-bold text-[#21252d]">
                                            {loadingStats ? '...' : stats.totalArtistas}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                            {/* Pendientes */}
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                whileHover={{ y: -2, boxShadow: '0 6px 20px 0 #527ceb1a' }}
                                className="bg-white rounded-2xl p-6 border border-[#f0f0f0] shadow-sm hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Clock size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[#7c777a] text-sm font-medium">Pendientes</p>
                                        <p className="text-2xl font-bold text-[#21252d]">
                                            {loadingStats ? '...' : stats.retirosPendientes}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                            {/* Completados */}
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.20 }}
                                whileHover={{ y: -2, boxShadow: '0 6px 20px 0 #10cfbd1a' }}
                                className="bg-white rounded-2xl p-6 border border-[#f0f0f0] shadow-sm hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <CheckCircle2 size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[#7c777a] text-sm font-medium">Completados</p>
                                        <p className="text-2xl font-bold text-[#21252d]">
                                            {loadingStats ? '...' : stats.retirosCompletados}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                            {/* Alertas */}
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                whileHover={{ y: -2, boxShadow: '0 6px 20px 0 #fae29b33' }}
                                className="bg-white rounded-2xl p-6 border border-[#f0f0f0] shadow-sm hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-yellow-100 rounded-xl">
                                        <AlertTriangle size={24} className="text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-[#7c777a] text-sm font-medium">Alertas</p>
                                        <p className="text-2xl font-bold text-[#21252d]">
                                            {loadingStats ? '...' : stats.alertasActivas}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        {/* Panel de montos */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.30 }}
                            className="bg-gradient-to-br from-[#527ceb] to-[#10cfbd] rounded-3xl p-8 text-white relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                        <DollarSign size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Gestión Financiera</h3>
                                        <p className="text-blue-100">Resumen de transacciones</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white bg-opacity-15 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Wallet size={20} className="text-yellow-300" />
                                            <p className="text-blue-100 font-medium">Monto Pendiente</p>
                                        </div>
                                        <p className="text-3xl font-bold">{formatCurrency(stats.montoTotalPendiente)}</p>
                                        <p className="text-blue-200 text-sm mt-1">En {stats.retirosPendientes} solicitudes</p>
                                    </div>
                                    <div className="bg-white bg-opacity-15 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TrendingUp size={20} className="text-green-300" />
                                            <p className="text-blue-100 font-medium">Total Procesado</p>
                                        </div>
                                        <p className="text-3xl font-bold">{formatCurrency(stats.montoTotalCompletado)}</p>
                                        <p className="text-blue-200 text-sm mt-1">En {stats.retirosCompletados} retiros</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        {/* Actividad reciente */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white rounded-2xl border border-[#f0f0f0] p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-[#21252d] flex items-center gap-2">
                                    <Activity size={24} className="text-[#10cfbd]" />
                                    Actividad Reciente
                                </h3>
                                <Link href="/admin/retiros" className="text-[#527ceb] hover:text-[#415fb3] text-sm font-medium flex items-center gap-1">
                                    Ver todo <ArrowRight size={16} />
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((activity, index) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -18 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.10 * index }}
                                            className="flex items-center gap-4 p-4 bg-[#f7f7f7] rounded-xl hover:bg-[#f0f0f0] transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-[#527ceb] bg-opacity-10 rounded-lg flex items-center justify-center">
                                                <Wallet size={18} className="text-[#527ceb]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-[#21252d]">{activity.mensaje}</p>
                                                <p className="text-sm text-[#7c777a]">
                                                    {activity.usuario && `Por ${activity.usuario} • `}
                                                    {new Date(activity.fecha).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <Activity size={48} className="text-[#7c777a] mx-auto mb-3 opacity-50" />
                                        <p className="text-[#7c777a]">No hay actividad reciente</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                    {/* Sidebar - Acciones rápidas */}
                    <div className="space-y-6">
                        {/* Acciones rápidas */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.38 }}
                            className="bg-white rounded-2xl border border-[#f0f0f0] p-6"
                        >
                            <h3 className="text-lg font-bold text-[#21252d] mb-4 flex items-center gap-2">
                                <Shield size={20} className="text-[#527ceb]" />
                                Acciones Rápidas
                            </h3>
                            <div className="space-y-3">
                                <Link
                                    href="/admin/usuarios/crear"
                                    className="flex items-center gap-3 p-3 bg-[#527ceb] bg-opacity-5 rounded-xl hover:bg-[#527ceb] hover:bg-opacity-10 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-[#527ceb] bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-[#527ceb] group-hover:bg-opacity-20">
                                        <UserPlus size={18} className="text-[#527ceb]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Crear Usuario</p>
                                        <p className="text-xs text-[#7c777a]">Agregar nuevo artista</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/admin/retiros"
                                    className="flex items-center gap-3 p-3 bg-[#10cfbd] bg-opacity-5 rounded-xl hover:bg-[#10cfbd] hover:bg-opacity-10 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-[#10cfbd] bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-[#10cfbd] group-hover:bg-opacity-20">
                                        <Eye size={18} className="text-[#10cfbd]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Ver Retiros</p>
                                        <p className="text-xs text-[#7c777a]">Gestionar solicitudes</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/admin/artistas"
                                    className="flex items-center gap-3 p-3 bg-purple-500 bg-opacity-5 rounded-xl hover:bg-purple-500 hover:bg-opacity-10 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-purple-500 group-hover:bg-opacity-20">
                                        <Users size={18} className="text-purple-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#21252d]">Gestionar Artistas</p>
                                        <p className="text-xs text-[#7c777a]">Ver todos los usuarios</p>
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                        {/* Estado del sistema */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.42 }}
                            className="bg-white rounded-2xl border border-[#f0f0f0] p-6"
                        >
                            <h3 className="text-lg font-bold text-[#21252d] mb-4 flex items-center gap-2">
                                <BarChart3 size={20} className="text-green-500" />
                                Estado del Sistema
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a] text-sm">Sistema</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-green-600 text-sm font-medium">Activo</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a] text-sm">Base de Datos</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-green-600 text-sm font-medium">Conectada</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#7c777a] text-sm">Última actualización</span>
                                    <span className="text-[#21252d] text-sm font-medium">
                                        {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    )
}
