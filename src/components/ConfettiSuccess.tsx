'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2 } from 'lucide-react'

export default function ConfettiSuccess({
    message = '¡Listo!',
    description = 'La acción fue completada exitosamente.',
}: {
    message?: string
    description?: string
}) {
    const [show, setShow] = useState(true)

    useEffect(() => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
        })

        const timer = setTimeout(() => setShow(false), 3500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="bg-white rounded-2xl px-8 py-6 text-center shadow-2xl border border-[#d0d0d0]"
                    >
                        <CheckCircle2 size={48} className="mx-auto mb-2 text-[#10cfbd]" />
                        <h2 className="text-xl font-bold text-[#21252d]">{message}</h2>
                        <p className="text-sm text-[#7c777a] mt-1">{description}</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
