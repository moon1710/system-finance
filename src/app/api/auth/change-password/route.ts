import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/auth'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)
    
    // Validar fortaleza
    const validation = validatePasswordStrength(newPassword)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Contraseña débil', errors: validation.errors },
        { status: 400 }
      )
    }
    
    // Obtener usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId }
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    // Si requiere cambio obligatorio, no validar contraseña actual
    if (!usuario.requiereCambioPassword) {
      const isValid = await verifyPassword(currentPassword, usuario.passwordHash)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 401 }
        )
      }
    }
    
    // Cambiar contraseña
    const newPasswordHash = await hashPassword(newPassword)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { 
        passwordHash: newPasswordHash,
        requiereCambioPassword: false 
      }
    })
    
    // Log de auditoría
    console.log(`[AUDIT] Usuario ${usuario.id} cambió su contraseña`)
    
    // TODO: Enviar email de confirmación cuando esté configurado
    
    return NextResponse.json({ 
      success: true,
      message: 'Contraseña actualizada exitosamente' 
    })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    return NextResponse.json(
      { error: 'Error al cambiar contraseña' },
      { status: 500 }
    )
  }
}