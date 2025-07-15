import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { cookies } from 'next/headers' // Importar cookies de next/headers

const prisma = new PrismaClient()

// GET - Obtener detalles de un artista
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // --- SOLUCIÓN DEFINITIVA ---
    // Se obtiene la sesión usando el store de cookies de Next.js.
    // Esto no interfiere con el objeto `request` ni con `params`.
    const session = await getIronSession<SessionData>(cookies(), sessionOptions)
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    
    const { id } = params;

    // Obtener datos del artista y sus métricas
    const artista = await prisma.usuario.findUnique({
      where: { id },
      select: {
          id: true,
          nombreCompleto: true,
          email: true,
          estadoCuenta: true,
          createdAt: true,
          _count: {
              select: { retiros: true }
          },
          retiros: {
              orderBy: {
                  fechaSolicitud: 'desc'
              },
              take: 10,
              select: {
                  id: true,
                  montoSolicitado: true,
                  estado: true,
                  fechaSolicitud: true,
              }
          }
      }
    });
    
    if (!artista) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Calcular métricas adicionales
    const retirosCompletados = await prisma.retiro.aggregate({
        _sum: { montoSolicitado: true },
        where: { usuarioId: id, estado: 'Completado' },
    });

    const retirosPendientes = await prisma.retiro.aggregate({
        _sum: { montoSolicitado: true },
        where: { usuarioId: id, estado: 'Pendiente' },
    });

    const artistaDetallado = {
        ...artista,
        montoTotalRetirado: retirosCompletados._sum.montoSolicitado || 0,
        montoPendiente: retirosPendientes._sum.montoSolicitado || 0,
    };
    
    return NextResponse.json({
      success: true,
      artista: artistaDetallado
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
    // Aplicar la misma corrección aquí
    const session = await getIronSession<SessionData>(cookies(), sessionOptions)
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    
    const { id } = params;
    const body = await request.json()
    
    const updateUserStatusSchema = z.object({
        estado: z.enum(['Activa', 'Inactiva']),
    });
    const data = updateUserStatusSchema.parse(body)
    
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        estadoCuenta: data.estado
      }
    })
    
    console.log(`[AUDIT] Admin ${session.userId} actualizó estado del usuario ${id} a ${data.estado}`)
    
    return NextResponse.json({
      success: true,
      usuario
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Datos inválidos', issues: error.errors }, { status: 400 });
    }
    console.error('Error actualizando usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}
