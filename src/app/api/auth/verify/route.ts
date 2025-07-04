import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

const verifySchema = z.object({
  token: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
    }
    
    // Buscar token válido
    const tokenAuth = await prisma.tokenAutenticacion.findUnique({
      where: { token },
      include: { usuario: true }
    })
    
    if (!tokenAuth || tokenAuth.usado || tokenAuth.fechaExpiracion < new Date()) {
      return NextResponse.redirect(new URL('/login?error=expired-token', request.url))
    }
    
    // Marcar token como usado
    await prisma.tokenAutenticacion.update({
      where: { id: tokenAuth.id },
      data: { usado: true }
    })
    
    // Crear sesión
    const response = NextResponse.redirect(new URL('/artista', request.url))
    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    session.userId = tokenAuth.usuario.id
    session.email = tokenAuth.usuario.email
    session.rol = tokenAuth.usuario.rol as 'artista'
    session.isLoggedIn = true
    await session.save()
    
    return response
  } catch (error) {
    console.error('Error en verificación:', error)
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url))
  }
}