'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import background from '../login/bg.png' // cambia la ruta si es diferente

export default function CambiarPasswordInicial() {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.')
            return
        }

        if (newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/usuarios/cambiar-password-inicial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            })

            const data = await res.json()

            if (res.ok) {
                setSuccess('Contraseña actualizada exitosamente. Redirigiendo...')
                setShowConfetti(true)

                // Redirige después de un pequeño delay
                setTimeout(async () => {
                    const meRes = await fetch('/api/auth/me')
                    const meData = await meRes.json()
                    if (meData.isLoggedIn) {
                        router.push(meData.user.rol === 'admin' ? '/admin' : '/artista')
                    } else {
                        router.push('/login')
                    }
                }, 3500)
            } else {
                setError(data.error || 'Error al cambiar la contraseña.')
            }
        } catch (err) {
            console.error('Error al enviar la solicitud:', err)
            setError('Error de conexión. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!showConfetti) return
        const duration = 2000
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
            })
        }, 250)

        return () => clearInterval(interval)
    }, [showConfetti])

    return (
        <main className="min-h-screen grid lg:grid-cols-2 font-sans text-[#21252d]">
            {/* Panel visual derecho */}
            <section
                className="hidden lg:flex flex-col justify-center px-12 bg-cover bg-center text-white"
                style={{
                    backgroundImage: `url(${background.src})`,
                    backgroundColor: '#2b333c',
                }}
            >
                <div className="max-w-md text-[#2b333c]">
                    <h2 className="text-4xl font-bold mb-4">Seguridad ante todo</h2>
                    <p className="text-lg">
                        Establece una contraseña segura para mantener protegida tu cuenta y continuar con tus proyectos creativos.
                    </p>
                </div>
            </section>

            {/* Formulario izquierdo */}
            <section className="flex items-center justify-center p-6 bg-[#f7f7f7] relative">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl border border-[#e1e1e1]"
                >
                    <h2 className="text-2xl font-bold mb-2 text-center">Establece tu nueva contraseña</h2>
                    <p className="text-sm text-center text-[#7c777a] mb-6">
                        Es necesario cambiarla antes de continuar.
                    </p>

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-100 text-red-700 text-sm px-4 py-2 border border-red-400">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 rounded-lg bg-green-100 text-green-700 text-sm px-4 py-2 border border-green-400">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                min={8}
                                className="w-full rounded-xl border border-[#ccc] bg-[#f7f7f7] py-3 px-4 text-[#21252d] placeholder:text-[#999] focus:ring-2 focus:ring-[#527ceb] outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Confirmar contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                min={8}
                                className="w-full rounded-xl border border-[#ccc] bg-[#f7f7f7] py-3 px-4 text-[#21252d] placeholder:text-[#999] focus:ring-2 focus:ring-[#527ceb] outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#527ceb] text-white py-3 rounded-xl font-semibold hover:bg-[#48b0f7] transition-all disabled:opacity-60"
                        >
                            {loading ? 'Guardando...' : 'Guardar y continuar'}
                        </button>
                    </form>
                </motion.div>

                {/* Confetti + Mensaje */}
                <AnimatePresence>
                    {showConfetti && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className="bg-white rounded-2xl px-8 py-6 text-center shadow-2xl border border-[#d0d0d0]"
                            >
                                <CheckCircle2 size={48} className="mx-auto mb-2 text-[#10cfbd]" />
                                <h2 className="text-xl font-bold text-[#21252d]">¡Contraseña actualizada!</h2>
                                <p className="text-sm text-[#7c777a] mt-1">Serás redirigido automáticamente.</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </main>
    )
}