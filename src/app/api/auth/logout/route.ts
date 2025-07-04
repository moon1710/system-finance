import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ 
      success: true,
      message: 'Sesión cerrada exitosamente' 
    })
    
    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    
    // Log de auditoría antes de destruir
    if (session.isLoggedIn) {
      console.log(`[AUDIT] Logout: Usuario ${session.userId} desde IP ${session.ipAddress}`)
    }
    
    // Destruir la sesión
    session.destroy()
    
    return response
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}