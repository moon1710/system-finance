// app/artista/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './components/Sidebar' // ✅ También funciona

export default function ArtistaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<any>(null)
    const [loadingAuth, setLoadingAuth] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()

                if (!data.isLoggedIn || data.user?.rol !== 'artista') {
                    router.push('/login')
                } else {
                    if (data.user.requiereCambioPassword) {
                        router.push('/cambiar-password-inicial')
                        return
                    }
                    setUser(data.user)
                }
            } catch (err) {
                console.error("Error al verificar sesión:", err)
                router.push('/login')
            } finally {
                setLoadingAuth(false)
            }
        }

        checkAuth()
    }, [router])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
    }

    if (loadingAuth || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p>Cargando...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar user={user} onLogout={handleLogout} />

            <div className="flex-1 transition-all duration-300">
                {/* Header móvil */}
                <header className="md:hidden bg-white shadow-sm p-4 pl-16">
                    <h1 className="text-xl font-bold">Panel de Artista</h1>
                </header>

                {/* Contenido de cada página */}
                <main className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}