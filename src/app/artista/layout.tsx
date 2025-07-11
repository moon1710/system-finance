// src/app/artista/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './components/Sidebar'

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
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <Sidebar user={user} onLogout={handleLogout} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                <div className="flex-1 flex flex-col md:pl-3 lg:pl-3 transition-all duration-300">
                    <div className="md:hidden bg-white border-b border-gray-200 p-4 shadow-sm">
                        <h1 className="text-lg font-semibold text-gray-900">Panel Artista</h1>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4 md:p-6 lg:p-8">
                            {children}
                        </div>
                    </div>
                    <footer className="bg-white border-t border-gray-200 p-4 text-center text-sm text-gray-500">
                        © 2025 Sistema de Gestión Financiera
                    </footer>
                </div>
                <div className="md:hidden absolute inset-0 bg-black/20 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300" />
            </main>
        </div>
    )
}
