import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { aprobarRetiro } from '@/lib/services/retiros';
import { enviarActualizacionEstado } from '@/lib/email/emailService';
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

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
    const { id } = params;

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

    // 1. Llamar al servicio para aprobar el retiro
    const resultado = await aprobarRetiro(id, session.userId);

    if (!resultado.exito || !resultado.data) {
      return NextResponse.json(
        { error: resultado.mensaje || 'No se pudo aprobar el retiro.' },
        { status: 400 }
      );
    }
    
    // 2. Intentar enviar notificación por email
    try {
      const retiroAprobado = resultado.data;
      
      const artista = await prisma.usuario.findUnique({
        where: { id: retiroAprobado.usuarioId },
        select: { email: true, nombreCompleto: true }
      });

      if (artista?.email && artista.nombreCompleto) {
        
        // --- INICIO DE LA CORRECCIÓN ---

        // ✅ Paso 1: Usar el nombre de propiedad correcto: `montoSolicitado`.
        // ✅ Paso 2: Convertir el valor de Decimal a Number antes de pasarlo.
        const montoComoNumero = Number(retiroAprobado.montoSolicitado);

        await enviarActualizacionEstado(
          artista.email,
          'Aprobado', // El estado al aprobar es 'Procesando', pero el email es de "Aprobación"
          artista.nombreCompleto,
          montoComoNumero, // Se pasa el número ya convertido
          // Puedes agregar un motivo si es necesario
        );

        // --- FIN DE LA CORRECCIÓN ---

        console.log(`[EMAIL] Notificación de aprobación enviada a artista: ${artista.email}`);
      } else {
        console.warn(`[EMAIL WARN] Datos de artista incompletos para retiro ${id}. No se pudo enviar email.`);
      }
    } catch (emailError) {
      // El error de email no debe detener la respuesta exitosa de la API.
      // La aprobación ya se realizó en la base de datos.
      console.error(`[EMAIL ERROR] Fallo al enviar email de aprobación para retiro ${id}:`, emailError);
    }

    // 3. Devolver respuesta exitosa
    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      retiro: resultado.data
    }, { headers: response.headers }); // Asegura que las cookies de sesión se establezcan

  } catch (error) {
    console.error('Error en PUT /api/retiros/[id]/aprobar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
