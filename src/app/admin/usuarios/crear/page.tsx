// app/admin/usuarios/crear/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateUserPage() {
    const [user, setUser] = useState<any>(null)
    const [nombreCompleto, setNombreCompleto] = useState('')
    const [email, setEmail] = useState('')
    const [rol, setRol] = useState('artista') // Default a 'artista'
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Verificar sesión y rol de admin
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.isLoggedIn || data.user?.rol !== 'admin') {
                    router.push('/login')
                } else {
                    setUser(data.user)
                }
            })
            .catch(err => {
                console.error("Error al verificar sesión:", err);
                router.push('/login');
            });
    }, [router])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setIsError(false)

        try {
            const res = await fetch('/api/admin/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombreCompleto, email, rol }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Error al crear usuario.')
            }

            setMessage(data.message || 'Usuario creado con éxito.')
            setIsError(false)
            setNombreCompleto('')
            setEmail('')
            setRol('artista') // Resetear a default
        } catch (err: any) {
            setMessage(err.message || 'Error desconocido.')
            setIsError(true)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return <div>Cargando...</div>

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header del Admin */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold">Panel de Admin</h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link href="/admin" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Dashboard
                                </Link>
                                <Link href="/admin/artistas" className="border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                    Artistas
                                </Link>
                                <Link href="/admin/retiros" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Retiros
                                </Link>
                                <Link href="/admin/usuarios/crear" className="border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                    Crear Usuario
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

            {/* Contenido principal */}
            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0 bg-white shadow rounded-lg">
                    <h2 className="text-2xl font-bold text-center mb-6">Crear Nuevo Usuario</h2>

                    {message && (
                        <div className={`p-3 mb-4 rounded text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 p-6">
                        <div>
                            <label htmlFor="nombreCompleto" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input
                                type="text"
                                id="nombreCompleto"
                                name="nombreCompleto"
                                value={nombreCompleto}
                                onChange={(e) => setNombreCompleto(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
                            <select
                                id="rol"
                                name="rol"
                                value={rol}
                                onChange={(e) => setRol(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option value="artista">Artista</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {loading ? 'Creando...' : 'Crear Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}