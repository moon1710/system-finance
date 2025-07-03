"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Shield, Mail, KeyRound, Sparkles } from "lucide-react"

const PastelAuroraBackground = () => (
    <div className="relative hidden h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-200 via-sky-200 to-indigo-300 lg:flex">
        {[
            { class: "bg-indigo-300/50", size: "w-96 h-96", pos: { top: "-20%", left: "-10%" }, dur: 25 },
            { class: "bg-sky-300/40", size: "w-80 h-80", pos: { bottom: "-15%", right: "-10%" }, dur: 28 },
            { class: "bg-blue-200/40", size: "w-72 h-72", pos: { top: "25%", right: "15%" }, dur: 32 },
        ].map((orb, i) => (
            <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.5, rotate: Math.random() * 90 }}
                animate={{
                    scale: [0.9, 1, 0.9],
                    x: [0, 20, -20, 0],
                    y: [0, -20, 20, 0],
                    rotate: 360,
                }}
                transition={{ duration: orb.dur, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                className={`absolute rounded-full mix-blend-multiply filter blur-3xl ${orb.size} ${orb.class}`}
            />
        ))}

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="z-10 text-center select-none space-y-4 rounded-3xl bg-white/30 p-10 shadow-xl backdrop-blur-2xl border border-white/30 max-w-sm"
        >
            <Sparkles className="mx-auto text-indigo-500" size={32} />
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 drop-shadow-md">
                Plataforma de Pagos
            </h1>
            <p className="text-lg text-slate-700 drop-shadow-sm">
                Gestiona tu creatividad de forma segura y eficiente.
            </p>
            <p className="text-sm text-slate-600">
                ¿Tienes problemas para ingresar? <a href="#" className="underline text-indigo-600">Contáctanos</a>
            </p>
        </motion.div>
    </div>
)

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md rounded-3xl bg-white/60 p-10 shadow-2xl backdrop-blur-2xl border border-white/20"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={role}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg from-indigo-400 to-sky-400"
                >
                    {role === 'artist' ? <User size={32} /> : <Shield size={32} />}
                </motion.div>
            </AnimatePresence>

            <motion.h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-800">
                Acceso a la Plataforma de Pagos
            </motion.h2>

            <p className="mt-2 text-center text-sm text-slate-600">
                {role === 'artist'
                    ? 'Ingresa tu correo electrónico registrado. Te enviaremos un enlace de acceso seguro y de un solo uso.'
                    : 'Inicia sesión con tus credenciales de administrador.'}
            </p>

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
                        <span className="relative z-10">{r === 'artist' ? 'Artista' : 'Administrador'}</span>
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
                    <label className="block mb-1 text-sm font-medium text-slate-700">Correo Electrónico</label>
                    <Mail className="pointer-events-none absolute left-4 top-[2.5rem] text-slate-400" size={20} />
                    <input
                        type="email"
                        required
                        placeholder="tu.nombre@email.com"
                        className="w-full rounded-full border border-slate-300 bg-white/70 py-3 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 transition-shadow focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
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
                            <label className="block mb-1 text-sm font-medium text-slate-700">Contraseña</label>
                            <KeyRound className="pointer-events-none absolute left-4 top-[2.5rem] text-slate-400" size={20} />
                            <input
                                type="password"
                                required
                                placeholder="Ingresa tu contraseña"
                                className="w-full rounded-full border border-slate-300 bg-white/70 py-3 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 transition-shadow focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div variants={itemVariants}>
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 py-3 font-semibold text-white shadow-xl transition-all hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-60"
                    >
                        {isLoading ? 'Verificando...' : (role === 'artist' ? 'ENVIAR ENLACE DE ACCESO' : 'INICIAR SESIÓN')}
                    </motion.button>
                </motion.div>

                <p className="text-center text-sm text-slate-500">
                    ¿No puedes ingresar? <a href="#" className="underline text-indigo-600">Solicita ayuda</a>
                </p>
            </motion.form>
        </motion.div>
    )
}

export default function PolishedLoginPage() {
    return (
        <main className="min-h-screen font-sans antialiased">
            <div className="lg:grid lg:grid-cols-2">
                <PastelAuroraBackground />
                <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-200 p-4 lg:bg-transparent">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 lg:hidden" />
                    <LoginForm />
                </div>
            </div>
            <footer className="w-full py-4 text-center text-sm text-slate-500 bg-white/30 backdrop-blur-md border-t border-white/10">
                © 2025 Mon | <a href="#" className="underline text-indigo-600">Necesitas Ayuda?</a> | <a href="#" className="underline text-indigo-600">Política de Privacidad</a> | <a href="#" className="underline text-indigo-600">Términos de Servicio</a>
            </footer>
        </main>
    )
}
