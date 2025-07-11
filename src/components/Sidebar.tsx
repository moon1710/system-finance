// src/components/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
    FiHome,
    FiCreditCard,
    FiDollarSign,
    FiLogOut,
    FiMenu,
} from "react-icons/fi";

export default function Sidebar() {
    const [open, setOpen] = useState(true);

    const links = [
        { label: "Dashboard", href: "/artista", icon: <FiHome /> },
        { label: "Cuentas Bancarias", href: "/artista/cuentas", icon: <FiCreditCard /> },
        { label: "Retiros", href: "/artista/retiros", icon: <FiDollarSign /> },
    ];

    return (
        <div
            className={`flex flex-col bg-gray-800 text-gray-100 transition-[width] duration-300
        ${open ? "w-64" : "w-16"} min-h-screen`}
        >
            {/* botón hamburguesa */}
            <div className="h-16 flex items-center justify-between px-4">
                {open && <span className="font-bold text-lg">Menú</span>}
                <button
                    onClick={() => setOpen(!open)}
                    className="p-2 hover:bg-gray-700 rounded focus:outline-none"
                >
                    <FiMenu size={20} />
                </button>
            </div>

            {/* links principales */}
            <nav className="flex-1 flex flex-col mt-2 space-y-1">
                {links.map(({ label, href, icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex items-center px-4 py-2 hover:bg-gray-700 rounded"
                    >
                        <span className="text-xl">{icon}</span>
                        {open && <span className="ml-3">{label}</span>}
                    </Link>
                ))}
            </nav>

            {/* Logout abajo */}
            <div className="mb-4">
                <button
                    onClick={() => {/* opcional: llama a tu handleLogout aquí */ }}
                    className="w-full flex items-center px-4 py-2 hover:bg-gray-700 rounded"
                >
                    <FiLogOut size={20} />
                    {open && <span className="ml-3">Cerrar Sesión</span>}
                </button>
            </div>
        </div>
    );
}
