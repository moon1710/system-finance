// /src/app/api/retiros/[id]/rechazar/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { rechazarRetiro } from '@/lib/services/retiros'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PUT /api/retiros/[id]/rechazar
 * Rechazar una solicitud de retiro con motivo (solo admins)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Solo admins pueden rechazar retiros
    if (session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden rechazar retiros' },
        { status: 403 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de retiro requerido' },
        { status: 400 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    
    // Validar que venga el motivo
    if (!body.motivo || body.motivo.trim() === '') {
      return NextResponse.json(
        { error: 'El motivo de rechazo es requerido' },
        { status: 400 }
      )
    }

    // Rechazar el retiro
    const resultado = await rechazarRetiro(id, session.userId, body.motivo)

    if (!resultado.exito) {
      return NextResponse.json(
        { 
          error: resultado.mensaje,
          errores: resultado.errores 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      retiro: resultado.data
    })

  } catch (error) {
    console.error('Error en PUT /api/retiros/[id]/rechazar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}