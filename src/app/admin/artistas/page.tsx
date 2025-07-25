'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, CheckCircle, Clipboard, Loader, Users, ShieldCheck, ShieldOff, ChevronsRight, Filter, UserPlus } from 'lucide-react'
import ArtistaQuickViewModal from '../components/ArtistaQuickViewModal' 

// --- Interfaces ---
interface Artista {
    id: string;
    nombreCompleto: string;
    email: string;
    estadoCuenta: 'Activa' | 'Inactiva';
    _count: {
        retiros: number;
    };
}

interface NewArtistInfo {
    nombreCompleto: string;
    email: string;
    tempPassword?: string;
}

// --- Componentes de UI ---

const getInitials = (name: string = ''): string => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + (names[names.length - 1].charAt(0) || '')).toUpperCase();
};

const ArtistaCard = ({ artista, onCardClick }: { artista: Artista, onCardClick: () => void }) => {
    const isActiva = artista.estadoCuenta === 'Activa';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer flex flex-col"
            onClick={onCardClick} // Usa el callback
        >
            <div className="p-5 flex-grow">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${isActiva ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        {artista.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 truncate">{artista.nombreCompleto}</h3>
                        <p className="text-sm text-slate-500 truncate">{artista.email}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500">Retiros</p>
                        <p className="font-semibold text-slate-700">{artista._count.retiros}</p>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActiva ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {isActiva ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                        {artista.estadoCuenta}
                    </div>
                </div>
            </div>
            <div className="bg-slate-50/70 group-hover:bg-slate-100 transition-colors px-5 py-2 text-xs font-medium text-slate-500 flex justify-between items-center">
                <span>Acciones rápidas</span>
                <ChevronsRight className="w-4 h-4 transition-transform transform group-hover:translate-x-1" />
            </div>
        </motion.div>
    );
};

// --- Componente Principal ---
export default function ArtistasPage() {
    const [artistas, setArtistas] = useState<Artista[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArtistaId, setSelectedArtistaId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'Activa', 'Inactiva'
    const router = useRouter();

    const fetchArtistas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/usuarios');
            if (!res.ok) {
                if (res.status === 403 || res.status === 401) router.push('/login');
                return;
            }
            const data = await res.json();
            setArtistas(data.artistas || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchArtistas();
    }, [fetchArtistas]);

    const filteredArtistas = useMemo(() => {
        return artistas
            .filter(artista => {
                if (filterStatus === 'todos') return true;
                return artista.estadoCuenta === filterStatus;
            })
            .filter(artista =>
                artista.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                artista.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [artistas, searchTerm, filterStatus]);

    // Función para manejar la actualización desde el modal
    const handleModalUpdate = () => {
        setSelectedArtistaId(null); // Cierra el modal
        fetchArtistas(); // Vuelve a cargar los datos
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gestión de Artistas</h1>
                        <p className="text-sm text-slate-500 mt-1">Crea, busca y administra los perfiles de los artistas.</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link href="/admin/usuarios/crear" passHref>
                            <span className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-2 text-sm font-semibold">
                                <UserPlus className="w-4 h-4" />
                                Crear Usuario
                            </span>
                        </Link>
                    </motion.div>
                </div>
            </header>

            <main className="p-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative w-full md:flex-1">
                            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-100 border-transparent text-slate-700 py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full md:w-auto bg-slate-100 border-transparent text-slate-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="Activa">Activa</option>
                                <option value="Inactiva">Inactiva</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                    </div>
                ) : filteredArtistas.length > 0 ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredArtistas.map((artista) => (
                            <ArtistaCard
                                key={artista.id}
                                artista={artista}
                                onCardClick={() => setSelectedArtistaId(artista.id)}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center bg-white rounded-xl p-10 border border-slate-200">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-700">No se encontraron artistas</h3>
                        <p className="text-sm text-slate-500 mt-1">Prueba a cambiar los filtros o crea un nuevo artista.</p>
                    </div>
                )}
            </main>
            <ArtistaQuickViewModal
                artistaId={selectedArtistaId}
                onClose={() => setSelectedArtistaId(null)}
                onUpdate={handleModalUpdate}
            />
        </div>
    );
}
