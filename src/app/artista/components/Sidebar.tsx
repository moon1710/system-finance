// src/app/artista/components/Sidebar.tsx
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Bell
} from 'lucide-react'

interface SidebarProps {
  user: {
    nombreCompleto: string
    email?: string
  }
  onLogout: () => void
}

interface MenuItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()

  const menuItems = [
    { href: '/artista', icon: Home, label: 'Dashboard' },
    { href: '/artista/cuentas', icon: CreditCard, label: 'Mis Cuentas' },
    { href: '/artista/retiros', icon: Download, label: 'Retiros' },
    { href: '/artista/configuracion', icon: Settings, label: 'Configuración' }
  ]

  const MenuItem: React.FC<MenuItemProps> = ({ href, icon: Icon, label }) => {
    const isActive = pathname === href

    return (
      <Link
        href={href}
        className={`
          flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
          ${isActive
            ? 'bg-[#6762b3] text-[#f7f7f7] border-r-4 border-[#48b0f7]'
            : 'text-[#7c777a] hover:bg-[#2b333c] hover:text-[#f7f7f7]'
          }
          ${isCollapsed ? 'justify-center px-2' : ''}
        `}
      >
        <Icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
        {!isCollapsed && <span>{label}</span>}
      </Link>
    )
  }

  return (
    <>
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden
          ${isCollapsed ? 'hidden' : 'block'}
        `}
        onClick={() => setIsCollapsed(true)}
      />

      <div
        className={`
          sticky top-0 h-screen bg-[#21252d] border-r border-[#2b333c]
          transition-all duration-300 flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          lg:translate-x-0
          ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2b333c]">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-[#f7f7f7]">Panel Artista</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-[#7c777a] hover:bg-[#2b333c] hover:text-[#f7f7f7] transition-colors"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        <div className="p-4 border-b border-[#2b333c]">
          <div
            className={`
              flex items-center cursor-pointer rounded-lg p-2 hover:bg-[#2b333c] transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-[#6762b3] rounded-full">
              <User className="h-4 w-4 text-[#f7f7f7]" />
            </div>
            {!isCollapsed && (
              <>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-[#f7f7f7]">{user.nombreCompleto}</p>
                  {user.email && (
                    <p className="text-xs text-[#7c777a]">{user.email}</p>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#7c777a] transition-transform ${showUserMenu ? 'rotate-180' : ''
                    }`}
                />
              </>
            )}
          </div>

          {showUserMenu && !isCollapsed && (
            <div className="mt-2 space-y-1">
              <Link
                href="/artista/perfil"
                className="flex items-center px-3 py-2 text-sm text-[#7c777a] hover:text-[#f7f7f7] hover:bg-[#2b333c] rounded-md"
              >
                <User className="h-4 w-4 mr-2" />
                Mi Perfil
              </Link>
              <Link
                href="/artista/notificaciones"
                className="flex items-center px-3 py-2 text-sm text-[#7c777a] hover:text-[#f7f7f7] hover:bg-[#2b333c] rounded-md"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Link>
              <button
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/[0.1] rounded-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <MenuItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-[#2b333c] mt-auto">
          {!isCollapsed ? (
            <div className="text-xs text-[#7c777a] text-center">
              <p>Sistema de Gestión</p>
              <p>© 2025 Finanzas</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-[#10cfbd] rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-4 left-4 z-40 p-2 bg-[#21252d] text-[#f7f7f7] rounded-lg shadow-lg border border-[#2b333c] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
    </>
  )
}

export default Sidebar