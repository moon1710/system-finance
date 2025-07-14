// src/app/layout.tsx
'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from './components/AdminSidebar'
import { Toaster } from 'sonner'

interface User {
    nombreCompleto: string
    email?: string
}

interface RootLayoutProps {
    children: ReactNode
}

export default function AdminLayout({ children }: RootLayoutProps) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [collapsed, setCollapsed] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { isLoggedIn, user } = await fetch('/api/auth/me').then(r => r.json())
                if (!isLoggedIn || user.rol !== 'admin') {
                    router.push('/login')
                    return
                }
                setUser({
                    nombreCompleto: user.nombreCompleto,
                    email: user.email,
                })
            } catch {
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }
        loadUser()
    }, [router])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
            </div>
        )
    }
    if (!user) return null

    return (
        <div className="flex min-h-screen bg-[#f7f7f7]">
            {/* Sidebar recibe el estado y la función onToggle */}
            <AdminSidebar
                user={user}
                onLogout={handleLogout}
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(prev => !prev)}
            />

            {/* Main desplazado según collapsed */}
            <main
                className={`
          flex-1
          transition-[margin] duration-500 ease-in-out
          ${collapsed ? 'ml-15' : 'ml-1'}
        `}
            >
                {children}
            </main>

            <Toaster richColors position="top-right" closeButton />
        </div>
    )
}
