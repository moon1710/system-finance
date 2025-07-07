// app/api/admin/usuarios/route.ts
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';
import { hashPassword } from '@/lib/auth'; // Asegúrate de tener esta función

export async function POST(request: Request) {
  const response = new NextResponse();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  // 1. Verificar autenticación y rol de admin
  if (!session.isLoggedIn || session.rol !== 'admin') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { nombreCompleto, email, rol } = await request.json();

    // Validaciones básicas
    if (!nombreCompleto || !email || !rol) {
      return NextResponse.json({ message: 'Nombre, email y rol son requeridos.' }, { status: 400 });
    }
    if (rol !== 'artista' && rol !== 'admin') {
      return NextResponse.json({ message: 'Rol inválido. Debe ser "artista" o "admin".' }, { status: 400 });
    }

    // Generar una contraseña temporal (puedes hacerla más compleja)
    const temporaryPassword = Math.random().toString(36).slice(-8); // Ejemplo: 8 caracteres alfanuméricos
    const passwordHash = await hashPassword(temporaryPassword);

    // 2. Crear el nuevo usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto,
        email,
        passwordHash,
        rol,
        estadoCuenta: 'Activa', // Por defecto, activo
        requiereCambioPassword: true, // ¡Importante! Forzar cambio de contraseña
      },
    });

    // En un sistema real, aquí enviarías un email al nuevo usuario
    // con su correo y la contraseña temporal, y la URL de login.
    console.log(`Usuario creado: ${nuevoUsuario.email}, Contraseña temporal: ${temporaryPassword}`);

    return NextResponse.json({
      message: 'Usuario creado exitosamente. Se ha establecido una contraseña temporal y se requiere un cambio.',
      user: {
        id: nuevoUsuario.id,
        nombreCompleto: nuevoUsuario.nombreCompleto,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        requiereCambioPassword: nuevoUsuario.requiereCambioPassword,
      }
    }, { status: 201 });

  } catch (error: any) {
    // Manejo de errores, por ejemplo, si el email ya existe (@unique)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'El email ya está registrado.' }, { status: 409 });
    }
    console.error('Error al crear usuario:', error);
    return NextResponse.json({ message: 'Error interno del servidor al crear usuario.' }, { status: 500 });
  }
}