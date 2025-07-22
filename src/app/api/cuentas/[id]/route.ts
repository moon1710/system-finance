// /app/api/cuentas/[id]/route.ts
// 🔧 FIX: Agregar soporte completo para el campo 'pais'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { actualizarCuentaBancaria, eliminarCuentaBancaria } from '@/lib/services/account'
import { prisma } from '@/lib/db'

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

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cuenta requerido' },
        { status: 400 }
      )
    }

    // Obtener datos del body
    const body = await request.json()

    console.log('🔍 [API UPDATE] Datos recibidos:', {
      id,
      tipoCuenta: body.tipoCuenta,
      pais: body.pais,
      nombreTitular: body.nombreTitular
    });

    // ✅ VALIDACIÓN ADICIONAL PARA CUENTAS INTERNACIONALES
    if (body.tipoCuenta === 'internacional' && !body.pais) {
      return NextResponse.json(
        { error: 'El país es un campo requerido para cuentas internacionales' },
        { status: 400 }
      )
    }

    // 🔧 VERIFICAR QUE LA CUENTA PERTENECE AL USUARIO
    const cuentaExistente = await prisma.cuentaBancaria.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!cuentaExistente) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada o no tienes permisos para modificarla' },
        { status: 404 }
      )
    }

    // ✅ ACTUALIZAR LA CUENTA CON TODOS LOS CAMPOS
    const resultado = await actualizarCuentaBancaria(id, {
      tipoCuenta: body.tipoCuenta,
      nombreBanco: body.nombreBanco,
      clabe: body.clabe,
      numeroRuta: body.numeroRuta,              // <--- Nuevo
      numeroCuenta: body.numeroCuenta,
      iban: body.iban,                          // <--- Nuevo
      swift: body.swift,
      emailPaypal: body.emailPaypal,
      nombreTitular: body.nombreTitular,
      direccionTitular: body.direccionTitular,  // <--- Nuevo
      direccionBanco: body.direccionBanco,      // <--- Nuevo
      paisBanco: body.paisBanco,                // <--- Nuevo
      pais: body.pais,
      abaRouting: body.abaRouting,              // <--- Nuevo
      esPredeterminada: body.esPredeterminada
    });

    if (!resultado.exito) {
      return NextResponse.json(
        { 
          error: resultado.mensaje,
          errores: resultado.errores 
        },
        { status: 400 }
      )
    }

    console.log('✅ [API UPDATE] Cuenta actualizada exitosamente:', {
      id: resultado.data?.id,
      tipoCuenta: resultado.data?.tipoCuenta,
      pais: resultado.data?.pais
    });

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      cuenta: resultado.data
    })

  } catch (error) {
    console.error('❌ [API UPDATE ERROR] Error en PUT /api/cuentas/[id]:', error)
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

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cuenta requerido' },
        { status: 400 }
      )
    }

    // 🔧 VERIFICAR QUE LA CUENTA PERTENECE AL USUARIO
    const cuentaExistente = await prisma.cuentaBancaria.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!cuentaExistente) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada o no tienes permisos para eliminarla' },
        { status: 404 }
      )
    }

    // Eliminar la cuenta
    const resultado = await eliminarCuentaBancaria(id)

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      )
    }

    console.log('✅ [API DELETE] Cuenta eliminada exitosamente:', id);

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje
    })

  } catch (error) {
    console.error('❌ [API DELETE ERROR] Error en DELETE /api/cuentas/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cuentas/[id]
 * Obtener cuenta bancaria específica
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cuenta requerido' },
        { status: 400 }
      )
    }

    // 🔧 OBTENER CUENTA ESPECÍFICA CON TODOS LOS CAMPOS
    const cuenta = await prisma.cuentaBancaria.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!cuenta) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      cuenta
    })

  } catch (error) {
    console.error('❌ [API GET ERROR] Error en GET /api/cuentas/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}