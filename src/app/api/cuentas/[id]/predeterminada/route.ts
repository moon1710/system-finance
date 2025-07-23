// /app/api/cuentas/[id]/predeterminada/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { establecerCuentaPredeterminada } from '@/lib/services/account'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PUT /api/cuentas/[id]/predeterminada
 * Establecer cuenta como predeterminada
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }
    
    const userId = session.userId
    if (session.rol !== 'artista') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cuenta requerido' },
        { status: 400 }
      )
    }

    // Establecer como predeterminada
    const resultado = await establecerCuentaPredeterminada(userId, id)

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      cuenta: resultado.data
    })

  } catch (error) {
    console.error('Error en PUT /api/cuentas/[id]/predeterminada:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}