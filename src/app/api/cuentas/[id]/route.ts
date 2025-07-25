// /app/api/cuentas/[id]/route.ts
// 🔧 FIX: Agregar soporte completo para el campo 'pais'

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { actualizarCuentaBancaria, eliminarCuentaBancaria, establecerCuentaPredeterminada} from '@/lib/services/account'
import { DatosCuentaBancaria, ResultadoValidacion, DireccionCompleta } from '@/lib/validations/account'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PUT /api/cuentas/[id]
 * Actualizar cuenta bancaria (VERSIÓN COMPLETA)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    if (session.rol !== 'artista') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // === VERIFICAR QUE LA CUENTA PERTENECE AL USUARIO ===
    const cuentaExistente = await prisma.cuentaBancaria.findFirst({
      where: {
        id: id,
        userId: session.userId
      }
    });

    if (!cuentaExistente) {
      return NextResponse.json({
        error: 'Cuenta bancaria no encontrada'
      }, { status: 404 });
    }

    const body = await request.json();

    console.log('🔍 [API] Actualizando cuenta con datos:', {
      id: id,
      tipoCuenta: body.tipoCuenta,
      nombreTitular: body.nombreTitular,
      pais: body.pais
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

    // === ACTUALIZAR LA CUENTA CON TODOS LOS CAMPOS ===
    const resultado = await actualizarCuentaBancaria(id, {
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

    console.log('✅ [API] Cuenta actualizada exitosamente:', {
      id: id,
      tipoCuenta: resultado.data?.tipoCuenta
    });

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      cuenta: resultado.data
    });

  } catch (error) {
    console.error('❌ [API ERROR] Error en PUT /api/cuentas/[id]:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
/**
 * DELETE /api/cuentas/[id]
 * Eliminar cuenta bancaria específica
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id:string } }
) {
  try {
    const { id } = params;
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // 1. Verificar que la cuenta existe y pertenece al usuario.
    const cuentaExistente = await prisma.cuentaBancaria.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!cuentaExistente) {
      return NextResponse.json({ error: 'Cuenta bancaria no encontrada' }, { status: 404 });
    }

    // 2. **NUEVA VALIDACIÓN**: Contar si existen retiros asociados a esta cuenta.
    const historialRetiros = await prisma.retiro.count({
      where: {
        cuentaBancariaId: id,
      },
    });

    // 3. Si hay historial (count > 0), bloquear el borrado.
    if (historialRetiros > 0) {
      return NextResponse.json({
        error: 'Esta cuenta no puede ser eliminada porque tiene un historial de retiros asociado. Para mantener la integridad de los registros, las cuentas usadas no se pueden borrar.',
      }, { status: 400 }); // 400 Bad Request es apropiado aquí.
    }
    
    // 4. Si no hay historial, proceder con el borrado físico.
    await prisma.cuentaBancaria.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      mensaje: 'Cuenta eliminada exitosamente.',
    });

  } catch (error) {
    console.error('❌ [API ERROR] Error en DELETE /api/cuentas/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * GET /api/cuentas/[id]
 * Obtener una cuenta bancaria específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    if (session.rol !== 'artista') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const cuenta = await prisma.cuentaBancaria.findFirst({
      where: {
        id: id,
        userId: session.userId
      }
    })

    if (!cuenta) {
      return NextResponse.json({ error: 'Cuenta bancaria no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      cuenta
    })

  } catch (error) {
    console.error('Error en GET /api/cuentas/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}