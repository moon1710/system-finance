// src/app/artista/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './components/Sidebar'
import { Toaster } from 'sonner' // 1. Importar el componente Toaster

interface User {
    nombreCompleto: string
    email?: string
}

export default function ArtistaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // ... tu lógica de useEffect y handleLogout no cambia ...
    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await fetch('/api/auth/me')
                const data = await response.json()

                if (!data.isLoggedIn || data.user?.rol !== 'artista') {
                    router.push('/login')
                    return
                }
                if (data.user.requiereCambioPassword) {
                    router.push('/cambiar-password-inicial')
                    return
                }

                setUser({
                    nombreCompleto: data.user.nombreCompleto,
                    email: data.user.email,
                })
            } catch (error) {
                console.error('Error cargando usuario:', error)
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        loadUser()
    }, [router])

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/login')
        } catch (error) {
            console.error('Error al cerrar sesión:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null // Redirigiendo...
    }

    return (
        <div className="flex min-h-screen bg-[#f7f7f7]">
            <Sidebar user={user} onLogout={handleLogout} />

            <main className="flex-1 flex flex-col w-full">
                <div className="flex-1">
                    {children}
                </div>
            </main>

            {/* 2. Añadir el componente Toaster aquí. Se posicionará de forma fija. */}
            <Toaster richColors position="top-right" closeButton />
        </div>
    )
}