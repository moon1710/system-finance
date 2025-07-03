"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Shield, Mail, KeyRound } from "lucide-react"

// ============================================================================
// Componente 1: Fondo Animado (Separado para limpieza)
// ============================================================================
const PastelAuroraBackground = () => (
    <div className="relative hidden h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100 to-teal-100 lg:flex">
        {[
            { class: "bg-purple-300/50", size: "w-96 h-96", pos: { top: "-20%", left: "-10%" }, dur: 25 },
            { class: "bg-sky-300/50", size: "w-80 h-80", pos: { bottom: "-15%", right: "-10%" }, dur: 28 },
            { class: "bg-rose-300/40", size: "w-72 h-72", pos: { top: "25%", right: "15%" }, dur: 32 },
        ].map((orb, i) => (
            <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.5, rotate: Math.random() * 90 }}
                animate={{
                    scale: [0.9, 1, 0.9],
                    x: `calc(${orb.pos.left || orb.pos.right} + ${Math.random() * 40 - 20}px)`,
                    y: `calc(${orb.pos.top || orb.pos.bottom} + ${Math.random() * 40 - 20}px)`,
                    rotate: 360,
                }}
                transition={{ duration: orb.dur, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                className={`absolute rounded-full mix-blend-multiply filter blur-3xl ${orb.size} ${orb.class}`}
            />
        ))}
        <div className="z-10 text-center select-none space-y-4 rounded-xl bg-white/30 p-8 shadow-lg backdrop-blur-md">
            <h1 className="text-4xl font-bold tracking-tight text-slate-800">
                Plataforma Creativa
            </h1>
            <p className="max-w-sm text-lg text-slate-600">
                Donde la inspiración y la gestión se encuentran.
            </p>
        </div>
    </div>
)

// ============================================================================
// Componente 2: Formulario de Login (Separado para lógica)
// ============================================================================
const LoginForm = () => {
    const [role, setRole] = useState<'artist' | 'admin'>('artist')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 2000)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={role}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg from-rose-300 to-sky-300"
                >
                    {role === 'artist' ? <User size={32} /> : <Shield size={32} />}
                </motion.div>
            </AnimatePresence>

            <motion.h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-800">
                {role === 'artist' ? 'Portal del Artista' : 'Acceso de Admin'}
            </motion.h2>

            <div className="mt-8 flex rounded-full bg-slate-200/70 p-1">
                {['artist', 'admin'].map((r) => (
                    <button
                        key={r}
                        onClick={() => setRole(r as 'artist' | 'admin')}
                        className="relative w-1/2 rounded-full py-2 text-sm font-semibold capitalize text-slate-700 transition-colors focus:outline-none"
                    >
                        {role === r && (
                            <motion.div
                                layoutId="active-pill"
                                transition={{ type: "spring", stiffness: 380, damping: 35 }}
                                className="absolute inset-0 z-0 rounded-full bg-white shadow-md"
                            />
                        )}
                        <span className="relative z-10">{r}</span>
                    </button>
                ))}
            </div>

            <motion.form
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                onSubmit={handleSubmit}
                className="mt-8 space-y-6"
            >
                <motion.div variants={itemVariants} className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="email"
                        required
                        placeholder="correo@ejemplo.com"
                        className="w-full rounded-full border border-slate-300 bg-white/80 py-3 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 transition-shadow focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300/50"
                    />
                </motion.div>

                <AnimatePresence>
                    {role === 'admin' && (
                        <motion.div
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, height: 0, y: -10, transition: { duration: 0.3 } }}
                            className="relative"
                        >
                            <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="password"
                                required
                                placeholder="Contraseña"
                                className="w-full rounded-full border border-slate-300 bg-white/80 py-3 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 transition-shadow focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300/50"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div variants={itemVariants}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 py-3 font-semibold text-white shadow-lg transition-transform hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:opacity-60"
                    >
                        {isLoading ? 'Verificando...' : (role === 'artist' ? 'Enviar Enlace Mágico' : 'Iniciar Sesión')}
                    </motion.button>
                </motion.div>
            </motion.form>
        </motion.div>
    )
}

// ============================================================================
// Componente Principal de la Página (Ensamblador)
// ============================================================================
export default function PolishedLoginPage() {
    return (
        <main className="min-h-screen font-sans antialiased">
            <div className="lg:grid lg:grid-cols-2">
                <PastelAuroraBackground />
                <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4 lg:bg-transparent">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-teal-100 lg:hidden" />
                    <LoginForm />
                </div>
            </div>
        </main>
    )
}