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
  enviarAlertaAdmin, // Esta función SÍ existe aquí
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

    // --- Lógica de envío de emails ---
    try {
      // 1. Obtener los datos del artista para el email
      const artista = await prisma.usuario.findUnique({
        where: { id: session.userId },
        select: { email: true, nombreCompleto: true },
      });

      if (artista) {
        // Enviar confirmación al artista
        await enviarConfirmacionRetiro(artista.email, monto);
        console.log(
          `[EMAIL] Confirmación de retiro enviada a artista: ${artista.email}`
        );

        // 2. Obtener los emails de TODOS los administradores de la base de datos
        const admins = await prisma.usuario.findMany({
          where: { rol: "admin" },
          select: { email: true },
        });

        const adminEmails = admins.map((admin) => admin.email); // Esto ya es un array: ['a@a.com', 'b@b.com']

        if (adminEmails && adminEmails.length > 0) {
          console.log('Enviando alerta con los siguientes datos:');
          console.log('Emails Admin:', adminEmails);
          console.log('Nombre Artista:', artista.nombreCompleto);
          console.log('Monto:', monto);
          // Enviar alerta a administradores pasando el array
          await enviarAlertaAdmin(adminEmails, artista.nombreCompleto!, monto); // Usar '!' si estás seguro que nombreCompleto existe
          console.log(
            `[EMAIL] Alerta de retiro enviada a administradores: ${adminEmails.join(", ")}`
          );
        } else {
          console.warn(
            `[EMAIL WARN] No se encontraron administradores para enviar alertas.`
          );
        }
      } else {
        console.warn(
          `[EMAIL WARN] No se encontró el artista con ID ${session.userId} para enviar notificaciones de retiro.`
        );
      }
    } catch (emailError) {
      console.error(
        `[EMAIL ERROR] Fallo al enviar notificaciones de retiro:`,
        emailError
      );
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
