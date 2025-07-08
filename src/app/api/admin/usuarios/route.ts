// src/app/api/admin/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { generateTemporaryPassword, hashPassword } from '@/lib/auth';
import { enviarEmailBienvenida } from '@/lib/emailService'; // <-- Importa la función de email

const createUserSchema = z.object({
  nombreCompleto: z.string().min(3).max(100),
  email: z.string().email().max(255),
});

// GET - Listar artistas del admin
export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions);
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }
    
    // Obtener artistas asignados al admin
    const artistas = await prisma.usuario.findMany({
      where: {
        rol: 'artista',
        adminAsignado: {
          some: {
            adminId: session.userId
          }
        }
      },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        estadoCuenta: true,
        createdAt: true,
        requiereCambioPassword: true,
        _count: {
          select: {
            retiros: true,
            cuentasBancarias: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      artistas
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo artista
export async function POST(request: NextRequest) {
  // En App Router, `NextResponse.next()` se pasa como segundo argumento a `getIronSession`
  const response = new NextResponse(); 
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  try {
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { nombreCompleto, email } = createUserSchema.parse(body);
    
    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo ya está registrado' },
        { status: 400 }
      );
    }
    
    // Generar contraseña temporal
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);
    
    // Crear usuario y relación en una transacción
    const usuario = await prisma.$transaction(async (tx) => {
      // Crear artista
      const newUser = await tx.usuario.create({
        data: {
          nombreCompleto,
          email,
          passwordHash,
          rol: 'admin',
          requiereCambioPassword: true,
          estadoCuenta: 'Activa'
        }
      });
      
      // Crear relación admin-artista
      await tx.adminArtistaRelacion.create({
        data: {
          adminId: session.userId,
          artistaId: newUser.id
        }
      });
      
      return newUser;
    });
    
    // Log de auditoría
    console.log(`[AUDIT] Admin ${session.userId} creó artista ${usuario.id}`);
    
    // TODO: Enviar email con credenciales cuando esté configurado
    // ¡Aquí se envía el email de bienvenida!
    try {
      await enviarEmailBienvenida(email, tempPassword);
      console.log(`[EMAIL] Email de bienvenida con credenciales temporales enviado a: ${email}`);
    } catch (emailError) {
      console.error(`[EMAIL ERROR] Fallo al enviar email de bienvenida a ${email}:`, emailError);
      // Decide cómo manejar este error:
      // 1. Podrías devolver un status 500 para indicar un fallo completo.
      // 2. O, como está ahora, loguearlo y continuar, asumiendo que la creación del usuario es más crítica que la notificación.
      // La implementación actual no detiene la respuesta exitosa al frontend si el email falla.
    }
    
    return NextResponse.json({
      success: true,
      message: 'Artista creado exitosamente. Se ha enviado un email con las credenciales temporales.',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto
      },
      // En desarrollo, devolver la contraseña temporal (asegúrate de QUITAR ESTO EN PRODUCCIÓN)
      ...(process.env.NODE_ENV === 'development' && { tempPassword })
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'El correo ya está registrado.' }, { status: 409 });
    }
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al crear usuario.' },
      { status: 500 }
    );
  }
}