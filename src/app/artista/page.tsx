// app/artista/page.tsx
'use client'

import Link from 'next/link'

export default function ArtistDashboard() {
    return (
        <>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

            {/* Cards de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
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

                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
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
                        <Link href="/artista/cuentas" className="text-sm text-blue-600 hover:text-blue-900">
                            Administrar Cuentas →
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}