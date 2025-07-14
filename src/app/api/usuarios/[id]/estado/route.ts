// /api/admin/usuarios/[id]/estado/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    const { estado } = await request.json();
    const usuarioId = params.id;

    if (estado !== 'Activa' && estado !== 'Inactiva') {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { estadoCuenta: estado },
    });

    return NextResponse.json({ success: true, usuario: usuarioActualizado });

  } catch (error) {
    console.error("Error al actualizar estado de cuenta:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}