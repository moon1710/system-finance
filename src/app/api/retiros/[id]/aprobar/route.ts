// /src/app/api/retiros/[id]/aprobar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { aprobarRetiro } from '@/lib/services/retiros';
import { enviarActualizacionEstado } from '@/lib/email/emailService';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/retiros/[id]/aprobar
 * Aprobar una solicitud de retiro (solo admins)
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

    // Solo admins pueden aprobar retiros
    if (session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden aprobar retiros' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de retiro requerido' },
        { status: 400 }
      );
    }

    const resultado = await aprobarRetiro(id, session.userId);

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      );
    }

    try {
      const retiroAprobado = resultado.data;
      
      // Obtener todos los datos necesarios en una sola consulta
      const artista = await prisma.usuario.findUnique({
        where: { id: retiroAprobado.usuarioId },
        select: { email: true, nombreCompleto: true }
      });

      if (artista?.email && artista.nombreCompleto) {
        // Llamar a la nueva función con todos los parámetros
        await enviarActualizacionEstado(
          artista.email,
          retiroAprobado.estado as 'Aprobado' | 'Completado' | 'Rechazado', // Cast para seguridad de tipos
          artista.nombreCompleto,
          retiroAprobado.monto
        );
        console.log(`[EMAIL] Notificación de estado (${retiroAprobado.estado}) enviada a artista: ${artista.email}`);
      } else {
        console.warn(`[EMAIL WARN] Datos de artista incompletos para retiro ${id}.`);
      }
    } catch (emailError) {
      console.error(`[EMAIL ERROR] Fallo al enviar email de aprobación para retiro ${id}:`, emailError);
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      retiro: resultado.data
    });

  } catch (error) {
    console.error('Error en PUT /api/retiros/[id]/aprobar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}