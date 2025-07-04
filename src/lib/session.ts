// lib/session.ts
import { SessionOptions } from 'iron-session'

export interface SessionData {
  userId: string
  email: string
  rol: 'artista' | 'admin'
  isLoggedIn: boolean
  lastActivity?: number
  id?: string // Para tracking de sesión
  ipAddress?: string // IP del usuario
  userAgent?: string // Navegador/dispositivo
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: 'sistema-pagos-session',
  ttl: 60 * 60, // 1 hora
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: undefined, // Sesión expira al cerrar navegador
    path: '/',
  }
}