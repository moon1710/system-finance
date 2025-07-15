// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { generateTemporaryPassword, hashPassword } from '@/lib/auth'

const createUserSchema = z.object({
  nombreCompleto: z.string().min(3).max(100),
  email: z.string().email().max(255),
})

// GET - Listar artistas del admin
export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    
    // Obtener artistas asignados al admin
    const artistas = await prisma.usuario.findMany({
      where: {
        rol: 'artista',
        /*
        adminAsignado: {
          some: {
            adminId: session.userId
          }
        }
          */
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
    })
    
    return NextResponse.json({
      success: true,
      artistas
    })
  } catch (error) {
    console.error('Error listando usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo artista
export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { nombreCompleto, email } = createUserSchema.parse(body)
    
    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo ya está registrado' },
        { status: 400 }
      )
    }
    
    // Generar contraseña temporal
    const tempPassword = generateTemporaryPassword()
    const passwordHash = await hashPassword(tempPassword)
    
    // Crear usuario y relación en una transacción
    const usuario = await prisma.$transaction(async (tx) => {
      // Crear artista
      const newUser = await tx.usuario.create({
        data: {
          nombreCompleto,
          email,
          passwordHash,
          rol: 'artista',
          requiereCambioPassword: true,
          estadoCuenta: 'Activa'
        }
      })
      
      // Crear relación admin-artista
      await tx.adminArtistaRelacion.create({
        data: {
          adminId: session.userId,
          artistaId: newUser.id
        }
      })
      
      return newUser
    })
    
    // Log de auditoría
    console.log(`[AUDIT] Admin ${session.userId} creó artista ${usuario.id}`)
    
    // TODO: Enviar email con credenciales cuando esté configurado
    console.log(`[EMAIL] Credenciales temporales - Email: ${email}, Password: ${tempPassword}`)
    
    return NextResponse.json({
      success: true,
      message: 'Artista creado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto
      },
      // En desarrollo, devolver la contraseña temporal
      ...(process.env.NODE_ENV === 'development' && { tempPassword })
    })
  } catch (error) {
    console.error('Error creando usuario:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}