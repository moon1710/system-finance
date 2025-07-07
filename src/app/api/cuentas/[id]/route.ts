// /app/api/cuentas/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { actualizarCuentaBancaria, eliminarCuentaBancaria } from '@/lib/services/account'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PUT /api/cuentas/[id]
 * Actualizar cuenta bancaria específica
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

    // Obtener datos del body
    const body = await request.json()

    // TODO: Verificar que la cuenta pertenece al usuario autenticado
    // Esto se puede hacer en el servicio o aquí con una consulta previa

    // Actualizar la cuenta
    const resultado = await actualizarCuentaBancaria(id, {
      tipoCuenta: body.tipoCuenta,
      nombreBanco: body.nombreBanco,
      clabe: body.clabe,
      numeroRuta: body.numeroRuta,
      numeroCuenta: body.numeroCuenta,
      swift: body.swift,
      emailPaypal: body.emailPaypal,
      nombreTitular: body.nombreTitular,
      esPredeterminada: body.esPredeterminada
    })

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
      cuenta: resultado.data
    })

  } catch (error) {
    console.error('Error en PUT /api/cuentas/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cuentas/[id]
 * Eliminar cuenta bancaria específica
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Verificar autenticación
    const userId = request.headers.get('x-user-id') // Temporal - cambiar por tu auth
    
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

    // TODO: Verificar que la cuenta pertenece al usuario autenticado
    // Esto se puede hacer en el servicio o aquí con una consulta previa

    // Eliminar la cuenta
    const resultado = await eliminarCuentaBancaria(id)

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje
    })

  } catch (error) {
    console.error('Error en DELETE /api/cuentas/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cuentas/[id]
 * Obtener cuenta bancaria específica (opcional)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Verificar autenticación
    const userId = request.headers.get('x-user-id') // Temporal - cambiar por tu auth
    
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

    // Obtener cuenta específica (necesitarías agregar esta función al servicio)
    // Por ahora retornamos un mensaje temporal
    return NextResponse.json(
      { error: 'Función no implementada aún' },
      { status: 501 }
    )

  } catch (error) {
    console.error('Error en GET /api/cuentas/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}