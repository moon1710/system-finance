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
  onLogout: () => void // <--- NUEVO: función recibida desde el layout
}

interface MenuItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive?: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()

  const menuItems: MenuItemProps[] = [
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
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
      {/* Overlay para móvil */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'}
        lg:relative lg:translate-x-0
        ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800">Panel Artista</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div
            className={`
              flex items-center cursor-pointer rounded-lg p-2 hover:bg-gray-50 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            {!isCollapsed && (
              <>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.nombreCompleto}</p>
                  {user.email && (
                    <p className="text-xs text-gray-500">{user.email}</p>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </>
            )}
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && !isCollapsed && (
            <div className="mt-2 py-2 bg-gray-50 rounded-lg shadow">
              <Link
                href="/artista/perfil"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <User className="h-4 w-4 mr-2" />
                Mi Perfil
              </Link>
              <Link
                href="/artista/notificaciones"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Link>
              <button
                onClick={onLogout} // <-- Aquí el logout es seguro y limpio
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
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

        {/* Footer compacto */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed ? (
            <div className="text-xs text-gray-500 text-center">
              <p>Sistema de Gestión</p>
              <p>© 2025 Finanzas</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button para móvil cuando está colapsado */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
    </>
  )
}

export default Sidebar
