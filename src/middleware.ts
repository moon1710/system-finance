import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from './lib/session'
import { isIpBlocked } from './lib/rate-limit' // Importar desde lib

// Configuración de seguridad
const SECURITY_CONFIG = {
  sessionTimeout: 60 * 60 * 1000, // 1 hora
  ipWhitelist: process.env.IP_WHITELIST?.split(',') || [],
  allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
}

// Headers de seguridad estrictos
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
}

// Rutas públicas (mínimas necesarias)
const PUBLIC_ROUTES = [
  '/',//temporal para desarrollo front
  '/cambiar-password-inicial',//temporal para desarrollo front
  '/login',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/setup', // temporal para desarrollo
]

// 🔧 RUTAS ESPECIALES QUE NO NECESITAN VALIDACIÓN DE ORIGEN
// (Pero sí necesitan autenticación de sesión)
const SPECIAL_API_ROUTES = [
  '/api/retiros/', // Para comprobantes
]

// Función para obtener IP del cliente
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || real || 'unknown'
}

// Validar origen de la petición
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const checkOrigin = origin || referer || ''

  return SECURITY_CONFIG.allowedOrigins.some(allowed =>
    checkOrigin.startsWith(allowed)
  ) || (process.env.NODE_ENV !== 'production' && checkOrigin.includes('.devtunnels.ms'))
}

// 🔧 NUEVA FUNCIÓN: Verificar si es una ruta especial
function isSpecialApiRoute(pathname: string): boolean {
  return SPECIAL_API_ROUTES.some(route => pathname.includes(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIp = getClientIp(request)
  
  console.log('=== MIDDLEWARE DEBUG ===')
  console.log('URL:', pathname)
  console.log('Origin:', request.headers.get('origin'))
  console.log('Referer:', request.headers.get('referer'))
  
  // Crear response con headers de seguridad
  const response = NextResponse.next()
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // 🛡️ VERIFICAR ORIGEN PARA APIS (CON EXCEPCIONES)
  if (pathname.startsWith('/api/')) {
    // ✅ PERMITIR rutas especiales sin validación de origen
    if (isSpecialApiRoute(pathname)) {
      console.log('✅ Ruta especial detectada, saltando validación de origen:', pathname)
    } 
    // ❌ VALIDAR origen para otras APIs
    else if (!isValidOrigin(request)) {
      console.warn(`❌ Origen inválido detectado: ${request.headers.get('origin')} para ${pathname}`)
      return new NextResponse(
        JSON.stringify({ error: 'Origen no autorizado' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Verificar si la IP está bloqueada por intentos fallidos
  if (pathname === '/api/auth/login' && isIpBlocked(clientIp)) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Demasiados intentos fallidos. Intenta más tarde.'
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Verificar rutas públicas
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route)
  if (isPublicRoute) {
    // Si está en login pero ya tiene sesión válida, redirigir
    if (pathname === '/login') {
      try {
        const session = await getIronSession<SessionData>(request, response, sessionOptions)
        if (session.isLoggedIn) {
          const redirectUrl = session.rol === 'admin' ? '/admin' : '/artista'
          return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
      } catch (error) {
        console.error('Error verificando sesión en login:', error)
      }
    }
    return response
  }

  // Para rutas protegidas, verificar sesión
  try {
    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    
    // Verificar si hay sesión
    if (!session.isLoggedIn) {
      console.log('❌ No hay sesión válida para:', pathname)
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'No autorizado', code: 'NO_SESSION' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('✅ Sesión válida:', { userId: session.userId, rol: session.rol })

    // Verificar permisos por rol
    if (pathname.startsWith('/admin')) {
      if (session.rol !== 'admin') {
        console.warn(`❌ Acceso denegado: Usuario ${session.userId} intentó acceder a /admin`)
        return NextResponse.redirect(new URL('/artista', request.url))
      }
    }
    
    if (pathname.startsWith('/artista')) {
      if (session.rol !== 'artista') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }

    // Agregar información de seguridad a los headers
    response.headers.set('X-User-Id', session.userId)
    response.headers.set('X-User-Role', session.rol)
    
    return response

  } catch (error) {
    console.error('💥 Error crítico en middleware:', error)
    
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Error de seguridad', code: 'SECURITY_ERROR' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return NextResponse.redirect(new URL('/login?error=security', request.url))
  }
}

// Configuración del matcher
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}