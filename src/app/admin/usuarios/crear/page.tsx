'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, User, Mail, Shield, ArrowLeft, Users } from 'lucide-react'
import confetti from 'canvas-confetti'
import Link from 'next/link'

export default function CreateUserPage() {
    const [user, setUser] = useState(null)
    const [nombreCompleto, setNombreCompleto] = useState('')
    const [email, setEmail] = useState('')
    const [rol, setRol] = useState('artista')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Verificar sesión y rol de admin
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.isLoggedIn || data.user?.rol !== 'admin') {
                    router.push('/login')
                } else {
                    setUser(data.user)
                }
            })
            .catch(err => {
                console.error("Error al verificar sesión:", err);
                router.push('/login');
            });
    }, [router])

    const triggerConfetti = () => {
        const duration = 3000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now()
            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            confetti({
                ...defaults,
                particleCount,
                origin: { x: Math.random(), y: Math.random() - 0.2 },
                colors: ['#527ceb', '#48b0f7', '#10cfbd', '#019fd2', '#6762b3']
            })
        }, 250)

        return () => clearInterval(interval)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setIsError(false)

        try {
            const res = await fetch('/api/admin/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombreCompleto, email, rol }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Error al crear usuario.')
            }

            setMessage(data.message || 'Usuario creado con éxito.')
            setIsError(false)
            setShowSuccess(true)
            triggerConfetti()

            // Resetear formulario
            setNombreCompleto('')
            setEmail('')
            setRol('artista')

            // Redirigir después del confetti
            setTimeout(() => {
                router.push('/admin/artistas')
            }, 3500)

        } catch (err) {
            setMessage(err.message || 'Error desconocido.')
            setIsError(true)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        )
    }

    return (
        <main className="min-h-screen grid lg:grid-cols-2 font-sans text-gray-800">
            {/* Panel visual derecho */}
            <section className="hidden lg:flex flex-col justify-center px-12 bg-gray-700 text-white relative overflow-hidden">
                {/* Fondo decorativo */}
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none">
                        <circle cx="100" cy="100" r="50" fill="#527ceb" />
                        <circle cx="300" cy="200" r="30" fill="#48b0f7" />
                        <circle cx="200" cy="300" r="40" fill="#10cfbd" />
                        <circle cx="350" cy="80" r="25" fill="#019fd2" />
                        <circle cx="50" cy="250" r="35" fill="#6762b3" />
                    </svg>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-md relative z-10"
                >
                    <div className="flex items-center mb-6">
                        <div className="p-3 bg-blue-500 rounded-full mr-4">
                            <Users size={32} />
                        </div>
                        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                    </div>

                    <h2 className="text-4xl font-bold mb-4">Crea nuevos usuarios</h2>
                    <p className="text-lg mb-8 opacity-90">
                        Agrega artistas o administradores al sistema de manera rápida y segura.
                    </p>

                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center space-x-3"
                        >
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>Contraseñas seguras generadas automáticamente</span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center space-x-3"
                        >
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>Notificación automática por email</span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center space-x-3"
                        >
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                            <span>Roles y permisos configurables</span>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Formulario izquierdo */}
            <section className="flex items-center justify-center p-6 bg-gray-50 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl border border-gray-200"
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                            <User size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">Crear Nuevo Usuario</h2>
                        <p className="text-sm text-gray-600">
                            Completa la información para agregar un nuevo usuario al sistema
                        </p>
                    </div>

                    {/* Botón volver */}
                    <Link
                        href="/admin/artistas"
                        className="inline-flex items-center text-sm mb-4 text-blue-500 hover:underline transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Volver a Artistas
                    </Link>

                    {/* Mensajes */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`mb-4 rounded-lg text-sm px-4 py-3 border ${isError
                                        ? 'bg-red-100 text-red-700 border-red-400'
                                        : 'bg-green-100 text-green-700 border-green-400'
                                    }`}
                            >
                                {message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Formulario */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Nombre Completo</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={nombreCompleto}
                                    onChange={(e) => setNombreCompleto(e.target.value)}
                                    required
                                    placeholder="Ingresa el nombre completo"
                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 pr-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="usuario@ejemplo.com"
                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 pr-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Rol</label>
                            <div className="relative">
                                <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                <select
                                    value={rol}
                                    onChange={(e) => setRol(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 pr-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                                >
                                    <option value="artista">Artista</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <p className="text-xs mt-1 text-gray-600">
                                {rol === 'artista' ? 'Podrá gestionar sus retiros y cuentas bancarias' : 'Tendrá acceso completo al sistema de administración'}
                            </p>
                        </div>

                        <motion.button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Creando usuario...</span>
                                </div>
                            ) : (
                                'Crear Usuario'
                            )}
                        </motion.button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Se enviará un email con las credenciales de acceso
                        </p>
                    </div>
                </motion.div>

                {/* Modal de éxito con confetti */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className="bg-white rounded-2xl px-8 py-8 text-center shadow-2xl border border-gray-200 max-w-sm mx-4"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                                    className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center"
                                >
                                    <CheckCircle2 size={32} className="text-white" />
                                </motion.div>

                                <h2 className="text-xl font-bold mb-2 text-gray-800">
                                    ¡Usuario creado exitosamente!
                                </h2>
                                <p className="text-sm mb-4 text-gray-600">
                                    {nombreCompleto} ha sido agregado como {rol}.
                                    Se ha enviado un email con las credenciales.
                                </p>
                                <p className="text-xs text-gray-500">
                                    Redirigiendo a la lista de artistas...
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </main>
    )
}