import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn) {
      return NextResponse.json({ 
        isLoggedIn: false,
        user: null 
      })
    }
    
    // Obtener datos actualizados del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { 
        id: session.userId,
        estadoCuenta: 'Activa'
      },
      select: {
        id: true,
        email: true,
        nombreCompleto: true,
        rol: true,
        requiereCambioPassword: true,
        estadoCuenta: true
      }
    })
    
    if (!usuario) {
      session.destroy()
      return NextResponse.json({ 
        isLoggedIn: false,
        user: null 
      })
    }
    
    return NextResponse.json({
      isLoggedIn: true,
      user: usuario,
      session: {
        lastActivity: session.lastActivity,
        ipAddress: session.ipAddress
      }
    })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json({ 
      isLoggedIn: false,
      user: null 
    })
  }
}