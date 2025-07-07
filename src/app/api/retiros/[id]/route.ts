// /src/app/api/retiros/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { obtenerRetiroPorId } from '@/lib/services/retiros'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/retiros/[id]
 * Obtener detalles de un retiro específico
 * - Artistas: solo pueden ver sus propios retiros
 * - Admins: solo pueden ver retiros de sus artistas asignados
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Verificar autenticación
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de retiro requerido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario puede ver este retiro
    const resultado = await obtenerRetiroPorId(id, session.userId)

    if (!resultado.exito) {
      // Si no tiene permisos, devolver 404 en lugar de 403 por seguridad
      const statusCode = resultado.mensaje.includes('No tienes permisos') ? 404 : 400
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      retiro: resultado.data
    })

  } catch (error) {
    console.error('Error en GET /api/retiros/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}