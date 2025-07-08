// /src/app/api/retiros/[id]/rechazar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { rechazarRetiro } from '@/lib/services/retiros';
import { enviarActualizacionEstado } from '@/lib/emailService';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/retiros/[id]/rechazar
 * Rechazar una solicitud de retiro con motivo (solo admins)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const response = new NextResponse();
  try {
    // CORRECCIÓN: Await params antes de desestructurar
    const { id } = await params; // <--- CAMBIO AQUÍ: await params

    // ... (el resto de tu código es correcto) ...

    // Verificar autenticación
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Solo admins pueden rechazar retiros
    if (session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden rechazar retiros' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de retiro requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    if (!body.motivo || body.motivo.trim() === '') {
      return NextResponse.json(
        { error: 'El motivo de rechazo es requerido' },
        { status: 400 }
      );
    }

    const resultado = await rechazarRetiro(id, session.userId, body.motivo);

    if (!resultado.exito) {
      return NextResponse.json(
        { 
          error: resultado.mensaje,
          errores: resultado.errores 
        },
        { status: 400 }
      );
    }

    try {
      const retiroRechazado = resultado.data;
      if (retiroRechazado && retiroRechazado.usuarioId) {
        const artista = await prisma.usuario.findUnique({
          where: { id: retiroRechazado.usuarioId },
          select: { email: true }
        });

        if (artista && artista.email) {
          await enviarActualizacionEstado(artista.email, 'Rechazado', body.motivo);
          console.log(`[EMAIL] Notificación de estado (Rechazado) enviada a artista: ${artista.email} para retiro ${id}`);
        } else {
          console.warn(`[EMAIL WARN] No se encontró email para el usuario del retiro ${id} al rechazar.`);
        }
      } else {
        console.warn(`[EMAIL WARN] Datos de retiro incompletos para enviar notificación de rechazo para retiro ${id}.`);
      }
    } catch (emailError) {
      console.error(`[EMAIL ERROR] Fallo al enviar email de actualización de estado para rechazo de retiro ${id}:`, emailError);
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      retiro: resultado.data
    });

  } catch (error) {
    console.error('Error en PUT /api/retiros/[id]/rechazar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}