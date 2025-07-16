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
 * Obtener historial de retiros del usuario autenticado
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

    if (session.rol !== "artista") {
      return NextResponse.json(
        { error: "Solo los artistas pueden ver retiros" },
        { status: 403 }
      );
    }

    const resultado = await obtenerRetirosUsuario(session.userId);

    if (!resultado.exito) {
      return NextResponse.json({ error: resultado.mensaje }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      retiros: resultado.data,
    });
  } catch (error) {
    console.error("Error en GET /api/retiros:", error);
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
      return cuenta.email_paypal ? `...${cuenta.email_paypal.slice(-8)}` : '****';  // ← Cambiar aquí
    
    case 'nacional':
      return cuenta.clabe ? cuenta.clabe.slice(-4) : '****';
    
    case 'internacional':
      return cuenta.numeroCuenta ? String(cuenta.numeroCuenta).slice(-4) : '****';
    
    default:
      if (cuenta.numeroCuenta) return String(cuenta.numeroCuenta).slice(-4);
      if (cuenta.clabe) return cuenta.clabe.slice(-4);
      if (cuenta.email_paypal) return `...${cuenta.email_paypal.slice(-8)}`;  // ← Cambiar aquí
      return '****';
  }
};

    // 4. Función para obtener el identificador de cuenta
const obtenerIdentificadorCuenta = (cuenta: any): string => {
  switch (cuenta.tipoCuenta?.toLowerCase()) {
    case 'paypal':
      return cuenta.email_paypal || 'Email no disponible';  // ← Cambiar aquí
    
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
