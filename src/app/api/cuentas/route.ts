// /app/api/cuentas/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { crearCuentaBancaria, obtenerCuentasPorUsuario } from '@/lib/services/account'
import { DatosCuentaBancaria, ResultadoValidacion, DireccionCompleta } from '@/lib/validations/account'


/**
 * GET /api/cuentas
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
 * POST /api/cuentas - VERSIÓN CORREGIDA
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

    console.log('🔍 [API] Datos recibidos completos:', body);

    // === VALIDACIONES BÁSICAS ===
    if (!body.tipoCuenta || !body.nombreTitular) {
      return NextResponse.json({ 
        error: 'Tipo de cuenta y nombre del titular son requeridos' 
      }, { status: 400 });
    }

    // === VALIDACIONES ESPECÍFICAS POR TIPO ===
    if (body.tipoCuenta === 'nacional') {
      if (!body.nombreBanco || !body.clabe) {
        return NextResponse.json({
          error: 'Para cuentas nacionales se requiere nombre del banco y CLABE'
        }, { status: 400 });
      }
    }

    if (body.tipoCuenta === 'internacional') {
      if (!body.nombreBanco || !body.numeroCuenta || !body.swift || !body.pais) {
        return NextResponse.json({
          error: 'Para cuentas internacionales se requiere banco, número de cuenta, SWIFT y país'
        }, { status: 400 });
      }
    }

    if (body.tipoCuenta === 'paypal') {
      if (!body.emailPaypal) {
        return NextResponse.json({
          error: 'Para cuentas PayPal se requiere el email'
        }, { status: 400 });
      }
    }

    // === PROCESAR DIRECCIONES ===
    let direccionBeneficiarioData = null;
    let direccionBancoData = null;

    if (body.direccionBeneficiario && Object.values(body.direccionBeneficiario).some(v => v && v.trim())) {
      direccionBeneficiarioData = {
        direccion: body.direccionBeneficiario.direccion || '',
        ciudad: body.direccionBeneficiario.ciudad || '',
        estado: body.direccionBeneficiario.estado || '',
        codigoPostal: body.direccionBeneficiario.codigoPostal || '',
        pais: body.direccionBeneficiario.pais || ''
      };
    }

    if (body.direccionBanco && Object.values(body.direccionBanco).some(v => v && v.trim())) {
      direccionBancoData = {
        direccion: body.direccionBanco.direccion || '',
        ciudad: body.direccionBanco.ciudad || '',
        estado: body.direccionBanco.estado || '',
        codigoPostal: body.direccionBanco.codigoPostal || '',
        pais: body.direccionBanco.pais || ''
      };
    }

    // === PREPARAR DATOS PARA EL SERVICIO ===
    const datosCuenta = {
      tipoCuenta: body.tipoCuenta,
      nombreTitular: body.nombreTitular,
      esPredeterminada: body.esPredeterminada || false,
      
      // Campos específicos por tipo
      nombreBanco: body.nombreBanco || null,
      clabe: body.clabe || null,
      tipoCuentaNacional: body.tipoCuentaNacional || null,
      numeroCuenta: body.numeroCuenta || null,
      swift: body.swift || null,
      codigoABA: body.codigoABA || null,
      tipoCuentaInternacional: body.tipoCuentaInternacional || null,
      pais: body.pais || null,
      emailPaypal: body.emailPaypal || null,
      
      // Direcciones
      direccionBeneficiario: direccionBeneficiarioData,
      direccionBanco: direccionBancoData
    };

    console.log('🔍 [API] Datos preparados para servicio:', datosCuenta);

    // === CREAR LA CUENTA ===
    const resultado = await crearCuentaBancaria(userId, body.tipoCuenta, datosCuenta);

    if (!resultado.exito) {
      console.error('❌ [API] Error del servicio:', resultado.mensaje, resultado.errores);
      return NextResponse.json({ 
        error: resultado.mensaje, 
        errores: resultado.errores 
      }, { status: 400 });
    }

    console.log('✅ [API] Cuenta creada exitosamente:', resultado.data?.id);

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      cuenta: resultado.data
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ [API ERROR] Error en POST /api/cuentas:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}