import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

const updateUserSchema = z.object({
  nombreCompleto: z.string().min(3).max(100).optional(),
  estadoCuenta: z.enum(['Activa', 'Bloqueada']).optional(),
})

// GET - Obtener detalles de un artista
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    
    // Verificar que el admin tenga acceso a este artista
    const relacion = await prisma.adminArtistaRelacion.findUnique({
      where: {
        adminId_artistaId: {
          adminId: session.userId,
          artistaId: params.id
        }
      }
    })
    
    if (!relacion) {
      return NextResponse.json(
        { error: 'No tienes acceso a este artista' },
        { status: 403 }
      )
    }
    
    // Obtener datos del artista
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      include: {
        cuentasBancarias: true,
        retiros: {
          orderBy: { fechaSolicitud: 'desc' },
          take: 10
        },
        notasRecibidas: {
          include: {
            admin: {
              select: {
                nombreCompleto: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      usuario
    })
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    
    // Verificar acceso
    const relacion = await prisma.adminArtistaRelacion.findUnique({
      where: {
        adminId_artistaId: {
          adminId: session.userId,
          artistaId: params.id
        }
      }
    })
    
    if (!relacion) {
      return NextResponse.json(
        { error: 'No tienes acceso a este artista' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const data = updateUserSchema.parse(body)
    
    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data
    })
    
    // Log de auditoría
    console.log(`[AUDIT] Admin ${session.userId} actualizó usuario ${params.id}`)
    
    return NextResponse.json({
      success: true,
      usuario
    })
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}