// /src/app/api/retiros/[id]/aprobar/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { aprobarRetiro } from '@/lib/services/retiros'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PUT /api/retiros/[id]/aprobar
 * Aprobar una solicitud de retiro (solo admins)
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

    // Solo admins pueden aprobar retiros
    if (session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden aprobar retiros' },
        { status: 403 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de retiro requerido' },
        { status: 400 }
      )
    }

    // Aprobar el retiro
    const resultado = await aprobarRetiro(id, session.userId)

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      retiro: resultado.data
    })

  } catch (error) {
    console.error('Error en PUT /api/retiros/[id]/aprobar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}