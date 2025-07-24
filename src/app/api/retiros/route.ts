// /src/app/api/retiros/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import {
  crearSolicitudRetiro,
  obtenerRetirosUsuario,
} from "@/lib/services/retiros";
import { 
  enviarConfirmacionRetiro,
  enviarAlertaAdminCompleta, // Nueva función
  enviarActualizacionEstado 
} from "@/lib/email/emailService";
import { prisma } from "@/lib/db"; // Necesario para obtener datos del artista y de los administradores

/**
 * GET /api/retiros
 * ✅ CORREGIDO: Obtener retiros DEL ARTISTA autenticado (no de todos)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      request,
      new NextResponse(),
      sessionOptions
    );

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // ✅ CAMBIO PRINCIPAL: Validar que sea ARTISTA, no admin
    if (session.rol !== "artista") {
      return NextResponse.json(
        { error: "Solo los artistas pueden ver sus retiros" },
        { status: 403 }
      );
    }

    // ✅ USAR LA FUNCIÓN CORRECTA: obtenerRetirosUsuario (solo del usuario)
    const resultado = await obtenerRetirosUsuario(session.userId);

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      );
    }

    // ✅ Los datos ya vienen formateados desde el service
    return NextResponse.json({
      success: true,
      retiros: resultado.data,
      mensaje: resultado.mensaje
    });

  } catch (error) {
    console.error("❌ Error en GET /api/retiros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}


// 🔧 VERSIÓN ALTERNATIVA CON QUERY RAW SI PRISMA DA PROBLEMAS
export async function GET_RAW_VERSION(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      request,
      new NextResponse(),
      sessionOptions
    );

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    if (session.rol !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden ver todas las solicitudes" },
        { status: 403 }
      );
    }

    // Query RAW para asegurar que todos los campos lleguen
    const retirosRaw = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.monto_solicitado as montoSolicitado,
        r.estado,
        r.fecha_solicitud as fechaSolicitud,
        r.fecha_actualizacion as fechaActualizacion,
        r.notas_admin as notasAdmin,
        r.url_comprobante as urlComprobante,
        r.requiere_revision as requiereRevision,
        
        -- Usuario
        u.nombre_completo as usuarioNombre,
        u.email as usuarioEmail,
        
        -- Cuenta Bancaria - TODOS LOS CAMPOS
        cb.tipo_cuenta as tipoCuenta,
        cb.nombre_banco as nombreBanco,
        cb.nombre_titular as nombreTitular,
        cb.clabe,
        cb.numero_ruta as numeroRuta,
        cb.numero_cuenta as numeroCuenta,
        cb.swift,
        cb.email_paypal as emailPaypal
        
      FROM retiros r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      INNER JOIN cuentas_bancarias cb ON r.cuenta_bancaria_id = cb.id
      ORDER BY r.fecha_solicitud DESC
    `;

    // Mapear resultado raw a formato esperado
    const retirosFormateados = retirosRaw.map((r: any) => ({
      id: r.id,
      montoSolicitado: parseFloat(r.montoSolicitado),
      estado: r.estado,
      fechaSolicitud: r.fechaSolicitud,
      fechaActualizacion: r.fechaActualizacion,
      notasAdmin: r.notasAdmin,
      urlComprobante: r.urlComprobante,
      requiereRevision: Boolean(r.requiereRevision),
      usuario: {
        nombreCompleto: r.usuarioNombre,
        email: r.usuarioEmail,
      },
      cuentaBancaria: {
        tipoCuenta: r.tipoCuenta,
        nombreBanco: r.nombreBanco,
        nombreTitular: r.nombreTitular,
        clabe: r.clabe,
        numeroRuta: r.numeroRuta,
        numeroCuenta: r.numeroCuenta,
        swift: r.swift,
        emailPaypal: r.emailPaypal,
      },
      alertas: []
    }));

    console.log('🔍 [RAW DEBUG] Primer retiro con todos los campos:', 
      JSON.stringify(retirosFormateados[0], null, 2)
    );

    return NextResponse.json({
      success: true,
      retiros: retirosFormateados,
      stats: {
        total: retirosFormateados.length,
        pendientes: retirosFormateados.filter((r) => r.estado === "Pendiente").length,
        procesando: retirosFormateados.filter((r) => r.estado === "Procesando").length,
        completados: retirosFormateados.filter((r) => r.estado === "Completado").length,
        rechazados: retirosFormateados.filter((r) => r.estado === "Rechazado").length,
        conAlertas: 0
      },
    });
  } catch (error) {
    console.error("❌ Error en GET RAW /api/admin/retiros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
/**
 * POST /api/retiros
 * Crear nueva solicitud de retiro
 */
export async function POST(request: NextRequest) {
  const response = new NextResponse();
  try {
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions
    );

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    if (session.rol !== "artista") {
      return NextResponse.json(
        { error: "Solo los artistas pueden solicitar retiros" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.monto || !body.cuentaId) {
      return NextResponse.json(
        { error: "Monto y cuenta bancaria son requeridos" },
        { status: 400 }
      );
    }

    const monto = parseFloat(body.monto);
    if (isNaN(monto)) {
      return NextResponse.json(
        { error: "El monto debe ser un número válido" },
        { status: 400 }
      );
    }

    const resultado = await crearSolicitudRetiro(
      session.userId,
      monto,
      body.cuentaId,
      body.notas
    );

    if (!resultado.exito) {
      return NextResponse.json(
        {
          error: resultado.mensaje,
          errores: resultado.errores,
        },
        { status: 400 }
      );
    }

try {
  console.log('🔍 [EMAIL DEBUG] Iniciando envío de emails...');

  // 1. Obtener los datos completos del artista
  const artista = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { email: true, nombreCompleto: true },
  });

  // 2. Obtener TODOS los datos de la cuenta bancaria
  const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
    where: { id: body.cuentaId },
    select: {
      tipoCuenta: true,
      nombreBanco: true,
      numeroCuenta: true,
      clabe: true,
      emailPaypal: true,
      nombreTitular: true,
      numeroRuta: true,
      swift: true
    }
  });

  console.log('🔍 [EMAIL DEBUG] Cuenta bancaria completa:', cuentaBancaria);

  if (artista && cuentaBancaria) {
    // 3. Función para obtener los últimos dígitos según el tipo de cuenta
const obtenerUltimosDigitos = (cuenta: any): string => {
  switch (cuenta.tipoCuenta?.toLowerCase()) {
    case 'paypal':
      return cuenta.email_paypal ? `...${cuenta.emailPaypal.slice(-8)}` : '****';  // ← Cambiar aquí
    
    case 'nacional':
      return cuenta.clabe ? cuenta.clabe.slice(-4) : '****';
    
    case 'internacional':
      return cuenta.numeroCuenta ? String(cuenta.numeroCuenta).slice(-4) : '****';
    
    default:
      if (cuenta.numeroCuenta) return String(cuenta.numeroCuenta).slice(-4);
      if (cuenta.clabe) return cuenta.clabe.slice(-4);
      if (cuenta.emailPaypal) return `...${cuenta.emailPaypal.slice(-8)}`;  // ← Cambiar aquí
      return '****';
  }
};

    // 4. Función para obtener el identificador de cuenta
const obtenerIdentificadorCuenta = (cuenta: any): string => {
  switch (cuenta.tipoCuenta?.toLowerCase()) {
    case 'paypal':
      return cuenta.emailPaypal || 'Email no disponible';  // ← Cambiar aquí
    
    case 'nacional':
      return cuenta.clabe || 'CLABE no disponible';
    
    case 'internacional':
      return cuenta.numeroCuenta || 'Número no disponible';
    
    default:
      return 'Cuenta no disponible';
  }
};  

    // 5. Preparar datos completos para el email
    const datosEmail = {
      solicitudId: resultado.data.id,
      nombreArtista: artista.nombreCompleto || 'Artista',
      monto: monto,
      nombreBanco: cuentaBancaria.nombreBanco || 'Banco no especificado',
      tipoCuenta: cuentaBancaria.tipoCuenta || 'Cuenta no especificada',
      ultimosDigitos: obtenerUltimosDigitos(cuentaBancaria),
      identificadorCuenta: obtenerIdentificadorCuenta(cuentaBancaria),
      fecha: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      urlPanelArtista: `${process.env.NEXT_PUBLIC_BASE_URL}/artista/retiros`
    };

    console.log('🔍 [EMAIL DEBUG] Datos finales para email:', datosEmail);

    // 6. Enviar confirmación
    await enviarConfirmacionRetiro(artista.email, datosEmail);
    console.log(`✅ [EMAIL] Confirmación enviada a: ${artista.email}`);

    // 7. Preparar datos para alerta de admin
    const datosAlertaAdmin = {
      ...datosEmail,
      nombreAdmin: 'Administrador',
      criterioAlerta: resultado.alertas?.length > 0 ? 
        resultado.alertas.map(a => a.mensaje).join(', ') : 
        'Solicitud de retiro estándar',
      urlPanelAdmin: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/retiros`
    };

    // 8. Obtener emails de administradores
    const admins = await prisma.usuario.findMany({
      where: { rol: "admin" },
      select: { email: true },
    });

    const adminEmails = admins.map((admin) => admin.email);

    if (adminEmails && adminEmails.length > 0) {
      await enviarAlertaAdminCompleta(adminEmails, datosAlertaAdmin);
      console.log(`✅ [EMAIL] Alerta enviada a: ${adminEmails.join(", ")}`);
    } else {
      console.warn(`⚠️ [EMAIL WARN] No se encontraron administradores`);
    }

  } else {
    console.warn(`⚠️ [EMAIL WARN] Datos faltantes:`, {
      artista: !!artista,
      cuentaBancaria: !!cuentaBancaria
    });
  }
} catch (emailError) {
  console.error(`❌ [EMAIL ERROR] Error completo:`, emailError);
  console.error(`❌ [EMAIL ERROR] Stack:`, emailError.stack);
}
// --- Fin lógica de envío de emails ---

    return NextResponse.json(
      {
        success: true,
        mensaje: resultado.mensaje,
        retiro: resultado.data,
        alertas: resultado.alertas,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/retiros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
