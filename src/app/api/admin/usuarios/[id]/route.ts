import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.isLoggedIn || session.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID de usuario no proporcionado' }, { status: 400 });
  }

  try {
    // Calcular el inicio y fin del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const artista = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        estadoCuenta: true,
        cuentasBancarias: {
          select: {
            id: true,
            tipoCuenta: true,
            nombreTitular: true,
            esPredeterminada: true,
            clabe: true,
            emailPaypal: true,
            numeroCuenta: true,
          },
          orderBy: {
            esPredeterminada: 'desc'
          }
        },
        retiros: {
          where: {
            fechaSolicitud: {
              gte: startOfMonth,
              lt: startOfNextMonth,
            },
          },
          select: {
            id: true,
            montoSolicitado: true,
            estado: true,
            fechaSolicitud: true,
          },
          orderBy: {
            fechaSolicitud: 'desc',
          },
        },
      },
    });

    if (!artista) {
      return NextResponse.json({ error: 'Artista no encontrado' }, { status: 404 });
    }

    // Prisma devuelve Decimal para montos, hay que convertirlo a número
    const retirosFormateados = artista.retiros.map(r => ({
        ...r,
        montoSolicitado: Number(r.montoSolicitado)
    }));

    return NextResponse.json({ artista: { ...artista, retiros: retirosFormateados } });

  } catch (error) {
    console.error('Error en summary API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}