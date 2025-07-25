'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader, ShieldCheck, ShieldOff, Banknote, Calendar, Landmark, AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// Interfaces para los datos que obtendrá el modal
interface CuentaBancariaResumen {
    id: string;
    tipoCuenta: string;
    nombreTitular: string;
    esPredeterminada: boolean;
    // Solo datos clave para identificar la cuenta
    clabe?: string | null;
    emailPaypal?: string | null;
    numeroCuenta?: string | null;
}

interface RetiroResumen {
    id: string;
    montoSolicitado: number;
    estado: string;
    fechaSolicitud: string;
}

interface ArtistaDetallado {
    id: string;
    nombreCompleto: string;
    email: string;
    estadoCuenta: 'Activa' | 'Inactiva';
    cuentasBancarias: CuentaBancariaResumen[];
    retiros: RetiroResumen[];
}

// Props que el modal recibirá
interface ArtistaQuickViewModalProps {
    artistaId: string | null;
    onClose: () => void;
    onUpdate: () => void; // Para refrescar la lista principal tras un cambio
}

const getInitials = (name: string = ''): string => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + (names[names.length - 1].charAt(0) || '')).toUpperCase();
};

export default function ArtistaQuickViewModal({ artistaId, onClose, onUpdate }: ArtistaQuickViewModalProps) {
    const [artista, setArtista] = useState<ArtistaDetallado | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchArtistaSummary = useCallback(async () => {
        if (!artistaId) return;
        setLoading(true);
        setError('');
        setArtista(null);
        try {
            const res = await fetch(`/api/usuarios/${artistaId}`);
            if (!res.ok) {
                throw new Error('No se pudo cargar la información del artista.');
            }
            const data = await res.json();
            setArtista(data.artista);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [artistaId]);

    useEffect(() => {
        if (artistaId) {
            fetchArtistaSummary();
        }
    }, [artistaId, fetchArtistaSummary]);

    const handleToggleStatus = async () => {
        if (!artista) return;
        const newStatus = artista.estadoCuenta === 'Activa' ? 'Inactiva' : 'Activa';
        if (!confirm(`¿Confirmas cambiar el estado de la cuenta a "${newStatus}"?`)) return;

        try {
            const res = await fetch(`/api/usuarios/${artista.id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus }),
            });
            if (!res.ok) throw new Error('No se pudo actualizar el estado.');
            onUpdate(); // Llama a la función onUpdate para refrescar la lista y cerrar el modal.
        } catch (err) {
            alert((err as Error).message);
        }
    };

    return (
        <AnimatePresence>
            {artistaId && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loading && <div className="flex justify-center items-center h-96"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>}
                        {error && <div className="text-center p-10 text-red-600">{error}</div>}

                        {artista && (
                            <>
                                {/* Header */}
                                <div className="p-6 border-b border-slate-200 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 text-xl">{getInitials(artista.nombreCompleto)}</div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800">{artista.nombreCompleto}</h2>
                                                <p className="text-sm text-slate-500">{artista.email}</p>
                                            </div>
                                        </div>
                                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Columna Izquierda - Acciones y Cuentas */}
                                    <div className="space-y-6">
                                        <section>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h3>
                                            <div className="space-y-2">
                                                <button onClick={handleToggleStatus} className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${artista.estadoCuenta === 'Activa' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                                    {artista.estadoCuenta === 'Activa' ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                    {artista.estadoCuenta === 'Activa' ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                                                </button>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Cuentas Bancarias</h3>
                                            <div className="space-y-3">
                                                {(artista.cuentasBancarias?.length || 0) > 0 ? artista.cuentasBancarias.map(cuenta => (
                                                    <div key={cuenta.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                        <p className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Landmark className="w-4 h-4 text-slate-400" />{cuenta.nombreTitular} {cuenta.esPredeterminada && <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Default</span>}</p>
                                                        <p className="text-xs text-slate-500 font-mono mt-1">{cuenta.tipoCuenta === 'PayPal' ? cuenta.emailPaypal : `CLABE: ****${(cuenta.clabe || '0000').slice(-4)}`}</p>
                                                    </div>
                                                )) : <p className="text-sm text-slate-500 text-center p-4 bg-slate-50 rounded-lg">No hay cuentas asociadas.</p>}
                                            </div>
                                        </section>
                                    </div>

                                    {/* Columna Derecha - Retiros */}
                                    <div className="space-y-6">
                                        <section>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Retiros de este mes</h3>
                                            <div className="space-y-3">
                                                {artista.retiros.length > 0 ? artista.retiros.map(retiro => (
                                                    <div key={retiro.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Banknote className="w-4 h-4 text-green-500" />${parseFloat(retiro.montoSolicitado).toFixed(2)}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{new Date(retiro.fechaSolicitud).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</p>
                                                        </div>
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${retiro.estado === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{retiro.estado}</span>
                                                    </div>
                                                )) : <p className="text-sm text-slate-500 text-center p-4 bg-slate-50 rounded-lg">No hay retiros este mes.</p>}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}