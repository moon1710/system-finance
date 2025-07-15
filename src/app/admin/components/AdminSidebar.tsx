// src/app/admin/components/AdminSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    CreditCard,
    Download,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    ChevronDown,
    Bell,
} from "lucide-react";

interface SidebarProps {
    user: {
        nombreCompleto: string;
        email?: string;
    };
    onLogout: () => void;
}

interface MenuItemProps {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { href: "/admin", icon: Home, label: "Dashboard" },
        { href: "/admin/artistas", icon: CreditCard, label: "Mis Cuentas" },
        { href: "/admin/retiros", icon: Download, label: "Retiros" },
        { href: "/admin/configuracion", icon: Settings, label: "Configuracion" },
    ];

    const MenuItem: React.FC<MenuItemProps> = ({ href, icon: Icon, label }) => {
        const isActive = pathname === href;

        return (
            <Link
                href={href}
                className={`
          group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl
          transition-all duration-300 ease-out
          ${isActive
                        ? "bg-[#2b333c] text-[#f7f7f7] shadow-lg"
                        : "text-[#7c777a] hover:bg-[#2b333c]/50 hover:text-[#f0f0f0]"
                    }
          ${isCollapsed ? "justify-center px-2" : ""}
        `}
            >
                {/*isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#10cfbd] rounded-r-full" />
        )*/}

                <Icon
                    className={`
          ${isCollapsed ? "h-6 w-6" : "h-5 w-5 mr-3"} 
          transition-transform duration-200
          ${isActive ? "" : "group-hover:scale-110"}
        `}
                />
                {!isCollapsed && <span className="relative">{label}</span>}
            </Link>
        );
    };

    return (
        <>
            <div
                className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden
          transition-opacity duration-300
          ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
                onClick={() => setIsCollapsed(true)}
            />

            <div
                className={`
          sticky top-0 h-screen bg-[#21252d]
          border-r border-[#2b333c]/50
          transition-all duration-500 ease-in-out flex flex-col
          ${isCollapsed ? "w-20" : "w-64"}
          lg:translate-x-0
          ${isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}
          shadow-2xl
        `}
            >
                <div className="flex items-center justify-between p-4 border-b border-[#2b333c]/30">
                    {!isCollapsed && (
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-[#f7f7f7]">
                                Sistema Pagos
                            </h1>
                        </div>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg text-[#7c777a] hover:bg-[#2b333c]/50 hover:text-[#f7f7f7] 
                     transition-all duration-300"
                    >
                        {isCollapsed ? (
                            <Menu className="h-5 w-5" />
                        ) : (
                            <X className="h-5 w-5" />
                        )}
                    </button>
                </div>

                <div className="p-4 border-b border-[#2b333c]/30">
                    <div
                        className={`
              group flex items-center cursor-pointer rounded-xl p-3
              bg-[#2b333c]/20
              hover:bg-[#2b333c]/40
              transition-all duration-300
              ${isCollapsed ? "justify-center" : ""}
            `}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="relative">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300
                bg-gradient-to-br from-[#10cfbd] to-[#6762b3])]">
                                <User className="h-5 w-5 text-[#f7f7f7]" />
                            </div>
                            {/* Esto es para ponerle el circulito */}
                            {/*<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#10cfbd] rounded-full" />*/}
                        </div>

                        {!isCollapsed && (
                            <>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-[#f7f7f7]">
                                        {user.nombreCompleto}
                                    </p>
                                    {user.email && (
                                        <p className="text-xs text-[#7c777a] group-hover:text-[#f0f0f0] transition-colors">
                                            {user.email}
                                        </p>
                                    )}
                                </div>
                                <ChevronDown
                                    className={`h-4 w-4 text-[#7c777a] transition-all duration-300
                            ${showUserMenu ? "rotate-180 text-[#10cfbd]" : ""}`}
                                />
                            </>
                        )}
                    </div>

                    {showUserMenu && !isCollapsed && (
                        <div className="mt-2 space-y-1">
                            <Link
                                href="/admin/perfil"
                                className="flex items-center px-3 py-2 text-sm text-[#7c777a] hover:text-[#f7f7f7] 
                         hover:bg-[#2b333c]/50 rounded-lg transition-all duration-200"
                            >
                                <User className="h-4 w-4 mr-2" />
                                Mi Perfil
                            </Link>
                            <Link
                                href="/admin/notificaciones"
                                className="flex items-center px-3 py-2 text-sm text-[#7c777a] hover:text-[#f7f7f7] 
                         hover:bg-[#2b333c]/50 rounded-lg transition-all duration-200"
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                Notificaciones
                            </Link>
                            <button
                                onClick={onLogout}
                                className="flex items-center w-full px-3 py-2 text-sm text-[#ef4444] 
                         hover:text-[#f87171] hover:bg-[#ef4444]/10 
                         rounded-lg transition-all duration-200"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <MenuItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-outer-space/30 mt-auto">
                    {!isCollapsed ? (
                        <div className="text-xs text-gallery text-center space-y-2">
                            <p className="font-medium text-[#fff]">
                                ¿Necesitas ayuda o soporte?
                            </p>
                            <Link
                                href="/soporte"
                                className="text-cornflower-blue hover:underline transition-colors text-[#fff] hover:text-[#10cfbd]"
                            >
                                Contáctanos
                            </Link>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            {/* indicador cuando está collapsed */}
                            <div className="w-2 h-2 bg-bright-turquoise rounded-full animate-pulse" />
                        </div>
                    )}
                </div>
            </div>

            {isCollapsed && (
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="fixed top-4 left-4 z-40 p-3 bg-[#21252d] text-[#f7f7f7] 
                   rounded-xl shadow-2xl border border-[#2b333c]/50 lg:hidden
                   transition-all duration-300 hover:scale-110"
                >
                    <Menu className="h-5 w-5" />
                </button>
            )}
        </>
    );
};

export default Sidebar;
