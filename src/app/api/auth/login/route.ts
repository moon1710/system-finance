// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { recordFailedAttempt, clearAttempts } from '@/lib/rate-limit'
import { nanoid } from 'nanoid'

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(100),
})

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || real || 'unknown'
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  try {
    // Parsear y validar entrada
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)
    
    // Log de intento de login
    console.log(`[AUTH] Intento de login para ${email} desde IP ${clientIp}`)
    
    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    })
    
    if (!usuario || usuario.estadoCuenta !== 'Activa') {
      recordFailedAttempt(clientIp)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Delay contra fuerza bruta
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }
    
    // Verificar contraseña
    const passwordValid = await verifyPassword(password, usuario.passwordHash)
    
    if (!passwordValid) {
      recordFailedAttempt(clientIp)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Delay contra fuerza bruta
      
      // Log de seguridad
      console.warn(`[SECURITY] Login fallido para ${email} desde IP ${clientIp}`)
      
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }
    
    // Login exitoso - limpiar intentos
    clearAttempts(clientIp)
    
    // Crear sesión
    const response = NextResponse.json({ 
      success: true,
      requiereCambioPassword: usuario.requiereCambioPassword,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
        requiereCambioPassword: usuario.requiereCambioPassword
      }
    })
    
    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    
    // Datos de sesión seguros
    session.userId = usuario.id
    session.email = usuario.email
    session.rol = usuario.rol as 'admin' | 'artista'
    session.isLoggedIn = true
    session.lastActivity = Date.now()
    session.id = nanoid() // ID único de sesión para tracking
    session.ipAddress = clientIp
    session.userAgent = userAgent
    
    await session.save()
    
    // Log de auditoría
    console.log(`[AUDIT] Login exitoso: Usuario ${usuario.id} (${usuario.rol}) desde IP ${clientIp}`)
    
    return response
    
  } catch (error) {
    console.error('Error en login:', error)
    
    // No revelar información sobre el error
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}