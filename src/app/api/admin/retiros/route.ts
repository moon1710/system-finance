// app/api/retiros/route.ts
// 🔧 FIX COMPLETO: Incluir todos los campos de cuenta bancaria

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

// 🔧 FUNCIÓN HELPER: Select completo de cuenta bancaria
const cuentaBancariaCompleta = {
  select: {
    id: true,
    tipoCuenta: true,
    nombreBanco: true,
    clabe: true,
    numeroRuta: true,
    numeroCuenta: true,
    swift: true,
    emailPaypal: true,
    nombreTitular: true,
    esPredeterminada: true,
    pais: true,
  }
}

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
      // 🔧 FIX ADMIN: Query directa con todos los campos
      console.log('🔍 [API ADMIN] Obteniendo retiros para admin...')
      
      const retiros = await prisma.retiro.findMany({
        include: {
          usuario: {
            select: {
              id: true,
              nombreCompleto: true,
              email: true,
            },
          },
          cuentaBancaria: cuentaBancariaCompleta, // ✅ TODOS LOS CAMPOS
        },
        orderBy: {
          fechaSolicitud: "desc",
        },
      })

      // 🔧 OBTENER ALERTAS REALES DE LA BD
      const alertasReales = await prisma.alerta.findMany({
        where: {
          retiroId: {
            in: retiros.map(r => r.id)
          }
        }
      }).catch(() => {
        console.log('⚠️ [API WARN] Tabla alertas no existe, usando alertas simuladas')
        return []
      })

      // 🔧 MAPEAR CON ALERTAS
      const retirosConAlertas = retiros.map((retiro) => {
        const alertasDelRetiro = alertasReales.filter(a => a.retiroId === retiro.id)
        
        // Si no hay alertas reales, generar simuladas
        let alertas = alertasDelRetiro
        if (alertas.length === 0) {
          const alertasSimuladas = []
          
          if (retiro.montoSolicitado >= 50000) {
            alertasSimuladas.push({
              id: `sim-monto-${retiro.id}`,
              tipo: 'MONTO_ALTO',
              mensaje: 'Monto alto (≥$50,000 USD)',
              resuelta: false,
              nivel: 'alta'
            })
          }

          if (retiro.requiereRevision) {
            alertasSimuladas.push({
              id: `sim-revision-${retiro.id}`,
              tipo: 'REVISION_ESPECIAL', 
              mensaje: 'Requiere revisión especial',
              resuelta: false,
              nivel: 'media'
            })
          }

          alertas = alertasSimuladas
        }

        return {
          ...retiro,
          alertas,
        }
      })

      // Log de verificación
      if (retiros.length > 0) {
        console.log('✅ [API ADMIN] Primer retiro con cuenta completa:', {
          id: retiros[0].id.substring(0, 8) + '...',
          tipoCuenta: retiros[0].cuentaBancaria.tipoCuenta,
          nombreBanco: retiros[0].cuentaBancaria.nombreBanco,
          clabe: retiros[0].cuentaBancaria.clabe,
          numeroRuta: retiros[0].cuentaBancaria.numeroRuta,
          numeroCuenta: retiros[0].cuentaBancaria.numeroCuenta,
          swift: retiros[0].cuentaBancaria.swift,
          emailPaypal: retiros[0].cuentaBancaria.emailPaypal,
          nombreTitular: retiros[0].cuentaBancaria.nombreTitular,
          pais: retiros[0].cuentaBancaria.pais,
        })
      }
      
      return NextResponse.json({
        success: true,
        retiros: retirosConAlertas,
        stats: {
          total: retirosConAlertas.length,
          pendientes: retirosConAlertas.filter(r => r.estado === 'Pendiente').length,
          procesando: retirosConAlertas.filter(r => r.estado === 'Procesando').length,
          completados: retirosConAlertas.filter(r => r.estado === 'Completado').length,
          rechazados: retirosConAlertas.filter(r => r.estado === 'Rechazado').length,
          conAlertas: retirosConAlertas.filter(r => r.alertas.length > 0).length,
          requierenRevision: retirosConAlertas.filter(r => r.requiereRevision).length,
        }
      })
    } else {
      // 🔧 FIX ARTISTA: Incluir todos los campos de cuenta
      console.log('🔍 [API ARTISTA] Obteniendo retiros para artista...')
      
      const retiros = await prisma.retiro.findMany({
        where: { usuarioId: session.userId },
        include: {
          cuentaBancaria: cuentaBancariaCompleta // ✅ TODOS LOS CAMPOS
        },
        orderBy: { fechaSolicitud: 'desc' }
      })

      // Log de verificación
      if (retiros.length > 0) {
        console.log('✅ [API ARTISTA] Primer retiro con cuenta completa:', {
          id: retiros[0].id.substring(0, 8) + '...',
          tipoCuenta: retiros[0].cuentaBancaria.tipoCuenta,
          nombreBanco: retiros[0].cuentaBancaria.nombreBanco,
          clabe: retiros[0].cuentaBancaria.clabe,
          numeroRuta: retiros[0].cuentaBancaria.numeroRuta,
          numeroCuenta: retiros[0].cuentaBancaria.numeroCuenta,
          swift: retiros[0].cuentaBancaria.swift,
          emailPaypal: retiros[0].cuentaBancaria.emailPaypal,
          nombreTitular: retiros[0].cuentaBancaria.nombreTitular,
          pais: retiros[0].cuentaBancaria.pais,

        })
      }
      
      return NextResponse.json({
        success: true,
        retiros
      })
    }
  } catch (error) {
    console.error('❌ [API ERROR] Error obteniendo retiros:', error)
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
        cuentaBancaria: cuentaBancariaCompleta // ✅ TODOS LOS CAMPOS
      }
    })
    
    // Generar alertas automáticas
    const alertas = await generarAlertasAutomaticas(nuevoRetiro.id)
    
    // Log de auditoría
    console.log(`✅ [RETIRO] Usuario ${session.userId} solicitó retiro de $${montoSolicitado}`)
    if (alertas.length > 0) {
      console.log(`🚨 [ALERTAS] Se generaron ${alertas.length} alertas para el retiro ${nuevoRetiro.id}`)
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
      console.log('📧 [EMAIL] Se debería notificar a los admins:', {
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
    console.error('❌ [POST ERROR] Error creando retiro:', error)
    
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