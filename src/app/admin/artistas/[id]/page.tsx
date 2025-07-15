'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck, ShieldOff, Edit, BarChart2, DollarSign, Clock, CheckCircle2, XCircle, Users, User, Mail, Calendar, Hash, Loader, RefreshCw } from 'lucide-react'

// --- Interfaces ---
interface Retiro {
    id: string;
    montoSolicitado: number;
    estado: 'Pendiente' | 'Procesando' | 'Completado' | 'Rechazado';
    fechaSolicitud: string;
}

interface ArtistaDetallado {
    id: string;
    nombreCompleto: string;
    email: string;
    estadoCuenta: 'Activa' | 'Inactiva';
    createdAt: string;
    _count: {
        retiros: number;
    };
    retiros: Retiro[];
    montoTotalRetirado: number;
    montoPendiente: number;
}

// --- Componentes de UI ---

const getInitials = (name: string = ''): string => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + (names[names.length - 1].charAt(0) || '')).toUpperCase();
};

const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
                <p className="text-sm text-slate-500">{title}</p>
                <p className="text-xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    </div>
);

const RetiroRow = ({ retiro }: { retiro: Retiro }) => {
    const statusConfig = {
        Pendiente: { icon: Clock, color: 'text-blue-600' },
        Procesando: { icon: RefreshCw, color: 'text-amber-600' },
        Completado: { icon: CheckCircle2, color: 'text-green-600' },
        Rechazado: { icon: XCircle, color: 'text-red-600' },
    };
    const config = statusConfig[retiro.estado] || statusConfig.Pendiente;
    const Icon = config.icon;

    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="p-3 text-sm text-slate-700 font-mono text-xs">#{retiro.id.slice(0, 8)}</td>
            <td className="p-3 text-sm text-slate-700 font-semibold">${retiro.montoSolicitado.toFixed(2)}</td>
            <td className="p-3 text-sm text-slate-500">{new Date(retiro.fechaSolicitud).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            <td className="p-3">
                <span className={`inline-flex items-center gap-2 text-sm font-medium ${config.color}`}>
                    <Icon className="w-4 h-4" />
                    {retiro.estado}
                </span>
            </td>
        </tr>
    );
};


// --- Componente Principal de la Página de Detalles ---
export default function ArtistaDetallePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [artista, setArtista] = useState<ArtistaDetallado | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchArtistaDetalles = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/usuarios/${id}`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Error al procesar la respuesta del servidor.' }));
                if (res.status === 404) throw new Error('Artista no encontrado.');
                if (res.status === 401 || res.status === 403) router.push('/login');
                throw new Error(data.error || 'No se pudo cargar la información del artista.');
            }
            const data = await res.json();
            setArtista(data.artista);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchArtistaDetalles();
    }, [fetchArtistaDetalles]);

    // Acción para cambiar estado (ejemplo)
    const handleChangeStatus = async () => {
        if (!artista) return;
        const newStatus = artista.estadoCuenta === 'Activa' ? 'Inactiva' : 'Activa';
        if (!confirm(`¿Seguro que deseas cambiar el estado a "${newStatus}"?`)) return;

        try {
            const res = await fetch(`/api/usuarios/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus })
            });
            if (!res.ok) throw new Error('No se pudo actualizar el estado.');
            // Refrescar datos tras el cambio
            fetchArtistaDetalles();
        } catch (err) {
            alert((err as Error).message);
        }
    };


    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-slate-50"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-center p-4">
                <XCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Error al Cargar</h2>
                <p className="text-slate-500">{error}</p>
                <button onClick={() => router.push('/admin/artistas')} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Volver a la lista</button>
            </div>
        );
    }

    if (!artista) return null;

    const isActiva = artista.estadoCuenta === 'Activa';

    return (
        <div className="bg-slate-50 min-h-screen">
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4">
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => router.push('/admin/artistas')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Volver a la lista de artistas
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold ${isActiva ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                {getInitials(artista.nombreCompleto)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{artista.nombreCompleto}</h1>
                                <p className="text-slate-500">{artista.email}</p>
                                <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActiva ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {isActiva ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                                    Cuenta {artista.estadoCuenta}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* -----------COMENTARIO MON 14/07/2025 Poner sección editar pa futuro
                            <button className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                                <Edit className="w-4 h-4" /> Editar
                            </button>
                            */}
                            <button onClick={handleChangeStatus} className={`px-3 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${isActiva ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                {isActiva ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                {isActiva ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-6 max-w-7xl mx-auto">
                <section className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">Métricas Generales</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={BarChart2} title="Retiros Totales" value={artista._count.retiros} color="text-blue-600" />
                        <StatCard icon={DollarSign} title="Monto Total Retirado" value={`$${(artista.montoTotalRetirado || 0).toFixed(2)}`} color="text-green-600" />
                        <StatCard icon={Clock} title="Monto Pendiente" value={`$${(artista.montoPendiente || 0).toFixed(2)}`} color="text-amber-600" />
                        <StatCard icon={Users} title="Cuentas Bancarias" value="-" color="text-purple-600" />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2">
                        <h2 className="text-lg font-semibold text-slate-800 mb-3">Historial de Retiros</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {artista.retiros && artista.retiros.length > 0 ? (
                                <table className="min-w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {artista.retiros.map(retiro => <RetiroRow key={retiro.id} retiro={retiro} />)}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-6 text-center text-slate-500">
                                    <p>Este artista aún no tiene solicitudes de retiro.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-800 mb-3">Información del Artista</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">{artista.nombreCompleto}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">{artista.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">Miembro desde el {new Date(artista.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Hash className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600 font-mono text-xs">{artista.id}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
