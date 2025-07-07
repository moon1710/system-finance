// app/api/usuario/cambiar-password-inicial/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { hashPassword } from '@/lib/auth'; // Asegúrate de tener una función para hashear la contraseña

// Esquema de validación para la nueva contraseña
const passwordSchema = z.object({
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'), // Ajusta según tus requisitos de seguridad
});

export async function POST(request: NextRequest) {
  const response = new NextResponse();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { newPassword } = passwordSchema.parse(body);

    // Buscar al usuario en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        requiereCambioPassword: true,
        rol: true,
        email: true, // Para actualizar la sesión
        nombreCompleto: true // Para actualizar la sesión
      }
    });

    if (!usuario) {
      session.destroy(); // Si el usuario no existe o está inactivo, invalida la sesión
      return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 404 });
    }

    // Verificar si realmente requiere cambio de contraseña (doble chequeo)
    if (!usuario.requiereCambioPassword) {
      // Si el usuario no requiere un cambio, puede ser un intento de bypass.
      // Puedes elegir redirigirlo al dashboard o denegar la acción.
      return NextResponse.json({ error: 'Este usuario no requiere un cambio de contraseña inicial.' }, { status: 403 });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar la contraseña y establecer requiereCambioPassword a false
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        passwordHash: hashedPassword,
        requiereCambioPassword: false, // ¡IMPORTANTE! Marcar como ya cambiada
      },
    });

    // Actualizar la sesión para reflejar que ya no requiere cambio de contraseña
    session.requiereCambioPassword = false; // Asumiendo que `SessionData` tiene esta propiedad
    // Asegurarte de que la sesión tenga los datos actualizados si se usan en el frontend
    session.email = usuario.email;
    session.rol = usuario.rol as 'admin' | 'artista';
    session.nombreCompleto = usuario.nombreCompleto;
    session.isLoggedIn = true; // Asegurarse de que siga loggeado
    session.lastActivity = Date.now();
    await session.save();

    console.log(`[AUDIT] Contraseña inicial cambiada para el usuario ${usuario.id}`);

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente.',
      user: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombreCompleto: usuario.nombreCompleto,
        requiereCambioPassword: false // Confirmar que ya no lo requiere
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error al cambiar la contraseña inicial:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor al procesar la solicitud.' }, { status: 500 });
  }
}