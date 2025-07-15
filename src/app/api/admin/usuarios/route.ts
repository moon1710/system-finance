// src/app/api/admin/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { generateTemporaryPassword, hashPassword } from '@/lib/auth';
import { enviarEmailBienvenida } from '@/lib/email/emailService';

// Esquema de validación actualizado para incluir el rol.
const createUserSchema = z.object({
  nombreCompleto: z.string().min(3).max(100),
  email: z.string().email().max(255),
  rol: z.enum(['artista', 'admin']), // Se añade la validación para el rol.
});

// GET - Listar artistas del admin (Sin cambios)
export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions);
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }
    
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

// POST - Crear nuevo usuario (artista o admin) - CORREGIDO
export async function POST(request: NextRequest) {
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
    // Se extrae el 'rol' del body validado.
    const { nombreCompleto, email, rol } = createUserSchema.parse(body);
    
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo ya está registrado' },
        { status: 400 }
      );
    }
    
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);
    
    let usuario;

    // Lógica condicional basada en el rol.
    if (rol === 'artista') {
      // Si es artista, se crea el usuario y la relación en una transacción.
      usuario = await prisma.$transaction(async (tx) => {
        const newUser = await tx.usuario.create({
          data: {
            nombreCompleto,
            email,
            passwordHash,
            rol: 'artista', // Usar el rol correcto.
            requiereCambioPassword: true,
            estadoCuenta: 'Activa'
          }
        });
        
        await tx.adminArtistaRelacion.create({
          data: {
            adminId: session.userId, // El admin que crea
            artistaId: newUser.id      // El nuevo artista
          }
        });
        
        return newUser;
      });
      console.log(`[AUDIT] Admin ${session.userId} creó al artista ${usuario.id}`);

    } else { // Si el rol es 'admin'
      // Si es admin, solo se crea el usuario. No se necesita transacción.
      usuario = await prisma.usuario.create({
        data: {
          nombreCompleto,
          email,
          passwordHash,
          rol: 'admin', // Usar el rol correcto.
          requiereCambioPassword: true,
          estadoCuenta: 'Activa'
        }
      });
      console.log(`[AUDIT] Admin ${session.userId} creó al admin ${usuario.id}`);
    }
    
    // Enviar email con credenciales.
    try {
      await enviarEmailBienvenida(email, tempPassword);
      console.log(`[EMAIL] Email de bienvenida con credenciales temporales enviado a: ${email}`);
    } catch (emailError) {
      console.error(`[EMAIL ERROR] Fallo al enviar email de bienvenida a ${email}:`, emailError);
      // La creación del usuario fue exitosa, pero el email falló.
      // Se puede añadir un mensaje específico para esto si se desea.
    }
    
    return NextResponse.json({
      success: true,
      message: `Usuario con rol '${rol}' creado exitosamente. Se ha enviado un email con las credenciales temporales.`,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto
      },
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