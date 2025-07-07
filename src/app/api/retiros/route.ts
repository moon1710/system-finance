// /src/app/api/retiros/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { crearSolicitudRetiro, obtenerRetirosUsuario } from '@/lib/services/retiros'

/**
 * GET /api/retiros
 * Obtener historial de retiros del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener sesión
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Solo artistas pueden ver sus retiros
    if (session.rol !== 'artista') {
      return NextResponse.json(
        { error: 'Solo los artistas pueden ver retiros' },
        { status: 403 }
      )
    }

    const resultado = await obtenerRetirosUsuario(session.userId)

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      retiros: resultado.data
    })

  } catch (error) {
    console.error('Error en GET /api/retiros:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/retiros
 * Crear nueva solicitud de retiro
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener sesión
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Solo artistas pueden crear retiros
    if (session.rol !== 'artista') {
      return NextResponse.json(
        { error: 'Solo los artistas pueden solicitar retiros' },
        { status: 403 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    
    // Validar campos requeridos
    if (!body.monto || !body.cuentaId) {
      return NextResponse.json(
        { error: 'Monto y cuenta bancaria son requeridos' },
        { status: 400 }
      )
    }

    // Validar que monto sea número
    const monto = parseFloat(body.monto)
    if (isNaN(monto)) {
      return NextResponse.json(
        { error: 'El monto debe ser un número válido' },
        { status: 400 }
      )
    }

    // Crear la solicitud
    const resultado = await crearSolicitudRetiro(
      session.userId,
      monto,
      body.cuentaId,
      body.notas
    )

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
      retiro: resultado.data,
      alertas: resultado.alertas
    }, { status: 201 })

  } catch (error) {
    console.error('Error en POST /api/retiros:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}