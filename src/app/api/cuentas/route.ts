// /app/api/cuentas/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { crearCuentaBancaria, obtenerCuentasPorUsuario } from '@/lib/services/account'

// Asumiendo que tienes configuración de NextAuth (ajusta según tu implementación)
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * GET /api/cuentas
 * Obtener todas las cuentas bancarias del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener sesión (ajusta según tu implementación de auth)
    // const session = await getServerSession(authOptions)

    // Por ahora simulamos obtener el userId de headers o session
    // Obtener sesión
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

    const resultado = await obtenerCuentasPorUsuario(userId)

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      cuentas: resultado.data
    })

  } catch (error) {
    console.error('Error en GET /api/cuentas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cuentas
 * Crear nueva cuenta bancaria
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener sesión
    const userId = request.headers.get('x-user-id') // Temporal - cambiar por tu auth

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    console.log('Datos recibidos:', body) // Ver qué llega

    // Validar campos requeridos
    if (!body.tipoCuenta || !body.nombreTitular) {
      return NextResponse.json(
        { error: 'Tipo de cuenta y nombre del titular son requeridos' },
        { status: 400 }
      )
    }

    // Validar tipo de cuenta
    if (!['nacional', 'internacional', 'paypal'].includes(body.tipoCuenta)) {
      return NextResponse.json(
        { error: 'Tipo de cuenta no válido' },
        { status: 400 }
      )
    }

    // Crear la cuenta
    const resultado = await crearCuentaBancaria(userId, body.tipoCuenta, {
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
      console.log('Error en creación:', resultado.mensaje, resultado.errores) // Debug
      return NextResponse.json({ error: resultado.mensaje, errores: resultado.errores }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      cuenta: resultado.data
    }, { status: 201 })

  } catch (error) {
    console.error('Error en POST /api/cuentas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}