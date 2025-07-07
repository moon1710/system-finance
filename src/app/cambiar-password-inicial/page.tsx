// app/cambiar-password-inicial/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CambiarPasswordInicial() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (newPassword.length < 8) { // Puedes ajustar esta validación según tus requisitos
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/usuarios/cambiar-password-inicial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Contraseña actualizada exitosamente. Redirigiendo...');
                // Redirige al usuario a su dashboard correspondiente después del cambio
                // Asume que /api/auth/me devuelve el rol actualizado
                const meRes = await fetch('/api/auth/me');
                const meData = await meRes.json();
                if (meData.isLoggedIn) {
                    if (meData.user.rol === 'admin') {
                        router.push('/admin');
                    } else if (meData.user.rol === 'artista') {
                        router.push('/artista');
                    } else {
                        router.push('/'); // Rol desconocido, redirige a la página principal
                    }
                } else {
                    router.push('/login'); // No logueado, redirige al login
                }
            } else {
                setError(data.error || 'Error al cambiar la contraseña.');
            }
        } catch (err) {
            console.error('Error al enviar la solicitud:', err);
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Establece tu Contraseña Inicial</h2>
                <p className="text-gray-600 text-center mb-6">
                    Parece que es la primera vez que inicias sesión o tu contraseña ha sido restablecida.
                    Por favor, establece una nueva contraseña para continuar.
                </p>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">
                            Nueva Contraseña:
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            min={8}
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                            Confirmar Contraseña:
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            min={8}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            disabled={loading}
                        >
                            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}