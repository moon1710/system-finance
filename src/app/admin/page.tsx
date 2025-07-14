'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null)
    const [loadingAuth, setLoadingAuth] = useState(true); // Nuevo estado para controlar la carga de autenticación
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();

                if (!data.isLoggedIn || data.user?.rol !== 'admin') {
                    router.push('/login');
                } else {
                    if (data.user.requiereCambioPassword) {
                        router.push('/cambiar-password-inicial');
                        // Es crucial retornar aquí para detener la ejecución y la renderización del dashboard.
                        return;
                    }
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Error al verificar sesión:", err);
                router.push('/login');
            } finally {
                setLoadingAuth(false); // La verificación de autenticación ha terminado
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    // Muestra un estado de carga mientras se verifica la autenticación/redirección
    if (loadingAuth || !user) { // Añadimos loadingAuth aquí
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p>Cargando panel de administración...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Contenido */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h2 className="text-2xl font-bold mb-4">Bienvenido, {user.nombreCompleto}</h2>

                    {/* Cards de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Artistas
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                -
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3">
                                <Link href="/admin/artistas" className="text-sm text-blue-600 hover:text-blue-900">
                                    Ver todos →
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Retiros Pendientes
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                -
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3">
                                <Link href="/admin/retiros" className="text-sm text-blue-600 hover:text-blue-900">
                                    Ver todos →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}