// app/api/retiros/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { 
  generarAlertasAutomaticas, 
  obtenerSolicitudesConAlerta,
  verificarMontoAlto,
  contarRetirosDelMes 
} from '@/lib/services/alertas'
import { debeNotificarAdmin, generarResumenAlertasEmail } from '@/lib/validations/alertas'

const crearRetiroSchema = z.object({
  cuentaBancariaId: z.string().uuid(),
  montoSolicitado: z.number().min(100).max(1000000),
  notas: z.string().optional(),
})

// GET - Listar retiros (diferente para admin y artista)
export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    if (session.rol === 'admin') {
      // Admin: obtener solicitudes con alertas
      const retirosConAlertas = await obtenerSolicitudesConAlerta(session.userId)
      
      return NextResponse.json({
        success: true,
        retiros: retirosConAlertas,
        stats: {
          total: retirosConAlertas.length,
          pendientes: retirosConAlertas.filter(r => r.estado === 'Pendiente').length,
          conAlertas: retirosConAlertas.filter(r => r.alertas.length > 0).length,
          requierenRevision: retirosConAlertas.filter(r => r.requiereRevision).length,
        }
      })
    } else {
      // Artista: sus propios retiros
      const retiros = await prisma.retiro.findMany({
        where: { usuarioId: session.userId },
        include: {
          cuentaBancaria: {
            select: {
              tipoCuenta: true,
              nombreTitular: true,
              nombreBanco: true,
            }
          }
        },
        orderBy: { fechaSolicitud: 'desc' }
      })
      
      return NextResponse.json({
        success: true,
        retiros
      })
    }
  } catch (error) {
    console.error('Error obteniendo retiros:', error)
    return NextResponse.json(
      { error: 'Error al obtener retiros' },
      { status: 500 }
    )
  }
}

// POST - Crear solicitud de retiro (solo artistas)
export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)
    
    if (!session.isLoggedIn || session.rol !== 'artista') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { cuentaBancariaId, montoSolicitado, notas } = crearRetiroSchema.parse(body)
    
    // Verificar que la cuenta bancaria pertenece al usuario
    const cuentaBancaria = await prisma.cuentaBancaria.findFirst({
      where: {
        id: cuentaBancariaId,
        usuarioId: session.userId
      }
    })
    
    if (!cuentaBancaria) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no válida' },
        { status: 400 }
      )
    }
    
    // Verificar si ya tiene una solicitud pendiente
    const solicitudPendiente = await prisma.retiro.findFirst({
      where: {
        usuarioId: session.userId,
        estado: 'Pendiente'
      }
    })
    
    if (solicitudPendiente) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente. Espera a que sea procesada.' },
        { status: 400 }
      )
    }
    
    // Pre-validaciones de alertas
    const montoAlto = verificarMontoAlto(montoSolicitado)
    const retirosDelMes = await contarRetirosDelMes(session.userId)
    
    // Crear el retiro
    const nuevoRetiro = await prisma.retiro.create({
      data: {
        usuarioId: session.userId,
        cuentaBancariaId,
        montoSolicitado,
        estado: 'Pendiente',
        notasAdmin: notas ? `Notas del artista: ${notas}` : undefined,
      },
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            email: true
          }
        },
        cuentaBancaria: true
      }
    })
    
    // Generar alertas automáticas
    const alertas = await generarAlertasAutomaticas(nuevoRetiro.id)
    
    // Log de auditoría
    console.log(`[RETIRO] Usuario ${session.userId} solicitó retiro de $${montoSolicitado}`)
    if (alertas.length > 0) {
      console.log(`[ALERTAS] Se generaron ${alertas.length} alertas para el retiro ${nuevoRetiro.id}`)
    }
    
    // Si hay alertas críticas, notificar a admins
    if (debeNotificarAdmin(alertas)) {
      // Obtener admins del artista
      const adminsDelArtista = await prisma.adminArtistaRelacion.findMany({
        where: { artistaId: session.userId },
        include: {
          admin: {
            select: {
              email: true,
              nombreCompleto: true
            }
          }
        }
      })
      
      // Preparar datos para notificación
      const resumenEmail = generarResumenAlertasEmail(nuevoRetiro, alertas)
      
      // TODO: Enviar email cuando esté configurado
      console.log('[EMAIL] Se debería notificar a los admins:', {
        admins: adminsDelArtista.map(rel => rel.admin.email),
        asunto: resumenEmail.asunto,
        prioridad: resumenEmail.prioridad
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud de retiro creada exitosamente',
      retiro: {
        id: nuevoRetiro.id,
        monto: nuevoRetiro.montoSolicitado,
        estado: nuevoRetiro.estado,
        requiereRevision: nuevoRetiro.requiereRevision,
        alertas: alertas.map(a => ({
          tipo: a.tipo,
          mensaje: a.mensaje,
          nivel: a.nivel
        }))
      }
    })
    
  } catch (error) {
    console.error('Error creando retiro:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al crear solicitud de retiro' },
      { status: 500 }
    )
  }
}