// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ // Necesario para getIronSession
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    // Log de auditoría antes de destruir
    if (session.isLoggedIn) {
      console.log(`[AUDIT] Logout: Usuario ${session.userId} (${session.email}) desde IP ${session.ipAddress || 'unknown'}`);
    }

    // Destruir la sesión
    session.destroy(); // Esto borra los datos de la sesión y la cookie
    await session.save(); // Asegúrate de guardar los cambios después de destruir

    return response; // La respuesta no necesita redirigir, la redirección es en el frontend
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}