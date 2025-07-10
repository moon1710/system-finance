// app/artista/layout.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Utilidad opcional para clases dinámicas si usas una

const links = [
    { href: '/artista', label: 'Dashboard', icon: 'bx bx-home-alt' },
    { href: '/artista/cuentas', label: 'Cuentas Bancarias', icon: 'bx bx-wallet' },
    { href: '/artista/retiros', label: 'Retiros', icon: 'bx bx-pie-chart-alt' },
];

export default function ArtistaLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <div className={cn('flex min-h-screen bg-[#E4E9F7]', { dark: 'bg-[#18191a]' })}>
            {/* Sidebar */}
            <nav className={`transition-all duration-300 ${collapsed ? 'w-[80px]' : 'w-[250px]'} bg-white dark:bg-[#242526] shadow-lg relative`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4">
                    <div className="text-left overflow-hidden">
                        <h1 className="text-lg font-bold text-gray-700 dark:text-white whitespace-nowrap truncate">{collapsed ? '🎨' : 'Artista'}</h1>
                        {!collapsed && <span className="text-sm text-gray-500 dark:text-gray-400">Bienvenido</span>}
                    </div>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-gray-500 hover:text-blue-600"
                    >
                        <i className={`bx bx-chevron-${collapsed ? 'right' : 'left'} text-xl`} />
                    </button>
                </div>

                {/* Menu */}
                <ul className="mt-4 space-y-1">
                    {links.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href} className={cn(
                                'flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-[#695CFE] hover:text-white rounded-md transition-colors',
                                { 'bg-[#695CFE] text-white': pathname === link.href }
                            )}>
                                <i className={link.icon}></i>
                                {!collapsed && <span>{link.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Footer / logout */}
                <div className="absolute bottom-4 w-full px-4">
                    <button className="flex items-center gap-3 w-full text-sm text-gray-600 hover:text-red-600">
                        <i className="bx bx-log-out" />
                        {!collapsed && <span>Cerrar sesión</span>}
                    </button>
                </div>
            </nav>

            {/* Content */}
            <main className="flex-1 p-6 overflow-auto">
                {children}
            </main>
        </div>
    );
}
