// /app/api/cuentas/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { crearCuentaBancaria, obtenerCuentasPorUsuario } from '@/lib/services/account'
import { DatosCuentaBancaria, ResultadoValidacion, DireccionCompleta } from '@/lib/validations/account'


/**
 * GET /api/cuentas
 * Obtener todas las cuentas bancarias del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    if (session.rol !== 'artista') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const resultado = await obtenerCuentasPorUsuario(session.userId)

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
 * Crear nueva cuenta bancaria (VERSIÓN COMPLETA)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    if (session.rol !== 'artista') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const userId = session.userId;
    const body = await request.json();

    console.log('🔍 [API] Datos recibidos:', {
      tipoCuenta: body.tipoCuenta,
      nombreTitular: body.nombreTitular,
      pais: body.pais,
      tieneDireccionBeneficiario: !!body.direccionBeneficiario,
      tieneDireccionBanco: !!body.direccionBanco
    });

    // === VALIDACIONES BÁSICAS ===
    if (!body.tipoCuenta || !body.nombreTitular) {
      return NextResponse.json({ 
        error: 'Tipo de cuenta y nombre del titular son requeridos' 
      }, { status: 400 });
    }

    // === VALIDACIÓN ESPECÍFICA POR TIPO DE CUENTA ===
    if (body.tipoCuenta === 'internacional' && !body.pais) {
      return NextResponse.json({
        error: 'El país es un campo requerido para cuentas internacionales'
      }, { status: 400 });
    }

    if (body.tipoCuenta === 'nacional' && !body.clabe) {
      return NextResponse.json({
        error: 'La CLABE es requerida para cuentas nacionales'
      }, { status: 400 });
    }

    if (body.tipoCuenta === 'paypal' && !body.emailPaypal) {
      return NextResponse.json({
        error: 'El email de PayPal es requerido'
      }, { status: 400 });
    }

    // === PROCESAR DIRECCIONES ===
    let direccionBeneficiario: DireccionCompleta | undefined;
    let direccionBanco: DireccionCompleta | undefined;

    if (body.direccionBeneficiario) {
      direccionBeneficiario = {
        direccion: body.direccionBeneficiario.direccion || '',
        ciudad: body.direccionBeneficiario.ciudad || '',
        estado: body.direccionBeneficiario.estado || '',
        codigoPostal: body.direccionBeneficiario.codigoPostal || '',
        pais: body.direccionBeneficiario.pais || ''
      };
    }

    if (body.direccionBanco) {
      direccionBanco = {
        direccion: body.direccionBanco.direccion || '',
        ciudad: body.direccionBanco.ciudad || '',
        estado: body.direccionBanco.estado || '',
        codigoPostal: body.direccionBanco.codigoPostal || '',
        pais: body.direccionBanco.pais || ''
      };
    }

    // === CREAR LA CUENTA CON TODOS LOS CAMPOS ===
    const resultado = await crearCuentaBancaria(userId, body.tipoCuenta, {
      tipoCuenta: body.tipoCuenta,
      nombreTitular: body.nombreTitular,
      nombreBanco: body.nombreBanco,
      esPredeterminada: body.esPredeterminada,
      
      // === CUENTAS NACIONALES ===
      clabe: body.clabe,
      tipoCuentaNacional: body.tipoCuentaNacional,
      
      // === CUENTAS INTERNACIONALES ===
      numeroCuenta: body.numeroCuenta,
      swift: body.swift,
      codigoABA: body.codigoABA,
      tipoCuentaInternacional: body.tipoCuentaInternacional,
      pais: body.pais,
      
      // === DIRECCIONES ===
      direccionBeneficiario,
      direccionBanco,
      
      // === PAYPAL ===
      emailPaypal: body.emailPaypal,
    });

    if (!resultado.exito) {
      return NextResponse.json({ 
        error: resultado.mensaje, 
        errores: resultado.errores 
      }, { status: 400 });
    }

    console.log('✅ [API] Cuenta creada exitosamente:', {
      id: resultado.data?.id,
      tipoCuenta: resultado.data?.tipoCuenta
    });

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      cuenta: resultado.data
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [API ERROR] Error en POST /api/cuentas:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}