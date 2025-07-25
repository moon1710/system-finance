'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, KeyRound } from 'lucide-react'
import background from './bgLogin.png'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Error al iniciar sesión')
                setLoading(false)
                return
            }

            if (data.user.rol === 'admin') {
                router.push('/admin')
            } else {
                router.push('/artista') }
        } catch {
            setError('No se pudo conectar con el servidor.')
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen grid lg:grid-cols-2 font-sans bg-white text-[#21252d]">
            {/* Sección izquierda - Login */}
            <section className="flex items-center justify-center px-6 py-10 bg-white">
                <div className="w-full max-w-md">
                    <h1 className="text-3xl font-bold text-[#21252d] mb-2">Tu centro de control para finanzas y pagos.</h1>
                    <p className="text-sm text-[#7c777a] mb-6">
                        Ingresa tus credenciales para gestionar tus retiros.
                    </p>

                    {error && <p className="mb-4 text-sm text-red-600 bg-red-100 rounded-xl px-4 py-2">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-[#7c777a]" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full rounded-xl border border-[#e1e1e1] bg-[#f7f7f7] py-3 pl-10 pr-4 text-[#21252d] placeholder:text-[#7c777a] focus:ring-2 focus:ring-[#527ceb] outline-none"
                            />
                        </div>

                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3.5 text-[#7c777a]" size={20} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                className="w-full rounded-xl border border-[#e1e1e1] bg-[#f7f7f7] py-3 pl-10 pr-4 text-[#21252d] placeholder:text-[#7c777a] focus:ring-2 focus:ring-[#527ceb] outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#527ceb] text-white rounded-xl py-3 font-semibold hover:bg-[#48b0f7] transition-all"
                        >
                            {loading ? 'Cargando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <p className="mt-4 text-sm text-center text-[#7c777a]">
                        Olvidaste tu contraseña?{' '}
                        <a href="#" className="underline text-[#527ceb]">
                            {/* Cambiar  # por que esto mande un correo para soporte */}
                            Recuperala
                        </a>
                    </p>
                </div>
            </section>

            {/* Sección derecha - Imagen y mensaje */}
            <section
                className="hidden lg:flex flex-col justify-between p-8 relative text-white bg-cover bg-center"
                style={{
                    backgroundImage: `url(${background.src})`,
                    backgroundColor: '#2b333c',
                }}
            >
                <div className="flex justify-end">
                    <div className="bg-white text-[#21252d] px-4 py-2 rounded-full shadow-md text-sm font-semibold">
                        Pagos Seguros y Verificados
                    </div>
                </div>

                <div className="text-center px-4 mb-8">
                    <h2 className="text-3xl font-bold mb-2 text-white">Claridad en tus Ganancias</h2>
                    {/* Conecta tus cuentas, consulta tus saldos en tiempo real y solicita tus pagos con la confianza de que tu dinero está protegido. */}
                    <p className="text-sm text-white/90 max-w-md mx-auto mb-4">
                        Conecta tus cuentas y solicita tus pagos con la confianza de que tu dinero está protegido.
                    </p>
                    <div className="flex justify-center flex-wrap gap-2 text-sm font-semibold">
                        <span className="bg-[#527ceb] text-white px-4 py-2 rounded-full">Tu talento merece ser bien gestionado</span>
                    </div>
                </div>
            </section>
        </main>
    )
}
