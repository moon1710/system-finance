import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

const createNotaSchema = z.object({
  nota: z.string().min(1).max(1000),
})

// POST - Crear nota
export async function POST(
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
    const { nota } = createNotaSchema.parse(body)
    
    const nuevaNota = await prisma.notaUsuario.create({
      data: {
        usuarioId: params.id,
        adminId: session.userId,
        nota
      },
      include: {
        admin: {
          select: {
            nombreCompleto: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      nota: nuevaNota
    })
  } catch (error) {
    console.error('Error creando nota:', error)
    return NextResponse.json(
      { error: 'Error al crear nota' },
      { status: 500 }
    )
  }
}