// app/artista/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ArtistDashboard() {
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        // Verificar sesión y rol del usuario
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                // Si no está logueado o no es artista, redirigir al login
                if (!data.isLoggedIn || data.user?.rol !== 'artista') {
                    router.push('/login')
                } else {
                    setUser(data.user)
                }
            })
            .catch(err => {
                console.error("Error al verificar sesión:", err);
                // En caso de error de red o API, también redirige al login
                router.push('/login');
            });
    }, [router])

    const handleLogout = async () => {
        // Redirige a la landing page ('/') después de cerrar sesión
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    }

    if (!user) {
        // Puedes mostrar un spinner o un mensaje de carga más elaborado
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p>Cargando dashboard del artista...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold">Panel de Artista</h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link href="/artista" className="border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                    Dashboard
                                </Link>
                                <Link href="/artista/cuentas-bancarias" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Cuentas Bancarias
                                </Link>
                                <Link href="/artista/retiros" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Retiros
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-4 text-sm text-gray-700">{user.nombreCompleto}</span>
                            <button
                                onClick={handleLogout}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Contenido */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h2 className="text-2xl font-bold mb-4">Bienvenido, {user.nombreCompleto}</h2>

                    {/* Cards de resumen para Artistas (ejemplo) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7m0 2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2m2 4H9m7 0H9m7 0a2 2 0 00-2-2H9a2 2 0 00-2 2m7 0v2" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Saldo Actual
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                $0.00
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3">
                                <Link href="/artista/retiros" className="text-sm text-blue-600 hover:text-blue-900">
                                    Solicitar Retiro →
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Cuentas Bancarias Registradas
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                si
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3">
                                <Link href="/artista/cuentas-bancarias" className="text-sm text-blue-600 hover:text-blue-900">
                                    Administrar Cuentas →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}