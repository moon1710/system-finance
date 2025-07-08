// lib/services/alertas.ts

import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// Configuración de umbrales
export const ALERT_THRESHOLDS = {
  MONTO_ALTO: 50000, // $50,000 USD
  MAX_RETIROS_MES: 1, // Más de 1 retiro al mes genera alerta
  DIAS_REVISION_RAPIDA: 7, // Retiros frecuentes en X días
}

// Tipos de alertas
export enum TipoAlerta {
  MONTO_ALTO = 'MONTO_ALTO',
  RETIROS_MULTIPLES = 'RETIROS_MULTIPLES',
  PATRON_SOSPECHOSO = 'PATRON_SOSPECHOSO',
  CUENTA_NUEVA = 'CUENTA_NUEVA',
}

export interface AlertaDetectada {
  tipo: TipoAlerta
  mensaje: string
  nivel: 'warning' | 'danger'
  detalles?: any
}

/**
 * Verificar si el monto supera el umbral configurado
 */
export function verificarMontoAlto(monto: number | Decimal): boolean {
  const montoNumerico = typeof monto === 'number' ? monto : monto.toNumber()
  return montoNumerico >= ALERT_THRESHOLDS.MONTO_ALTO
}

/**
 * Contar retiros del mes actual para un usuario
 */
export async function contarRetirosDelMes(userId: string): Promise<number> {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  
  const finMes = new Date(inicioMes)
  finMes.setMonth(finMes.getMonth() + 1)
  
  const count = await prisma.retiro.count({
    where: {
      usuarioId: userId,
      fechaSolicitud: {
        gte: inicioMes,
        lt: finMes
      },
      estado: {
        notIn: ['Rechazado'] // No contar rechazados
      }
    }
  })
  
  return count
}

/**
 * Crear alerta para un retiro
 */
export async function crearAlerta(
  retiroId: string, 
  tipo: string,
  mensaje: string
): Promise<void> {
  await prisma.alerta.create({
    data: {
      retiroId,
      tipo,
      mensaje
    }
  })
  
  console.log(`[ALERTA] Creada alerta tipo ${tipo} para retiro ${retiroId}: ${mensaje}`)
}

/**
 * Obtener todas las solicitudes con alertas para un admin
 */
export async function obtenerSolicitudesConAlerta(adminId: string) {
  // Primero obtener los artistas asignados al admin
  const artistasDelAdmin = await prisma.adminArtistaRelacion.findMany({
    where: { adminId },
    select: { artistaId: true }
  })
  
  const artistaIds = artistasDelAdmin.map(rel => rel.artistaId)
  
  // Obtener retiros con alertas no resueltas
  const retirosConAlerta = await prisma.retiro.findMany({
    where: {
      usuarioId: { in: artistaIds },
      OR: [
        { 
          alertas: {
            some: { resuelta: false }
          }
        },
        { estado: 'Pendiente' }
      ]
    },
    include: {
      usuario: {
        select: {
          id: true,
          nombreCompleto: true,
          email: true
        }
      },
      cuentaBancaria: {
        select: {
          tipoCuenta: true,
          nombreTitular: true
        }
      },
      alertas: {
        where: { resuelta: false },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: [
      { fechaSolicitud: 'desc' }
    ]
  })
  
  return retirosConAlerta
}

/**
 * Generar alertas automáticas para un retiro
 */
export async function generarAlertasAutomaticas(retiroId: string): Promise<AlertaDetectada[]> {
  const retiro = await prisma.retiro.findUnique({
    where: { id: retiroId },
    include: {
      usuario: true,
      cuentaBancaria: true
    }
  })
  
  if (!retiro) {
    throw new Error('Retiro no encontrado')
  }
  
  const alertas = await detectarAlertas(
    retiro.usuarioId,
    retiro.montoSolicitado,
    retiro.cuentaBancariaId
  )
  
  // Crear alertas en la base de datos
  for (const alerta of alertas) {
    await prisma.alerta.create({
      data: {
        retiroId,
        tipo: alerta.tipo,
        mensaje: alerta.mensaje
      }
    })
  }
  
  // Log de auditoría
  if (alertas.length > 0) {
    console.log(`[ALERTAS] Retiro ${retiroId} generó ${alertas.length} alertas:`)
    alertas.forEach(alerta => {
      console.log(`  - ${alerta.tipo}: ${alerta.mensaje} (${alerta.nivel})`)
    })
  }
  
  return alertas
}

/**
 * Detectar todas las alertas posibles para un retiro
 */
async function detectarAlertas(
  userId: string,
  monto: Decimal,
  cuentaBancariaId?: string
): Promise<AlertaDetectada[]> {
  const alertas: AlertaDetectada[] = []
  const montoNumerico = monto.toNumber()
  
  // 1. Verificar monto alto
  if (verificarMontoAlto(monto)) {
    alertas.push({
      tipo: TipoAlerta.MONTO_ALTO,
      mensaje: `Monto alto: $${montoNumerico.toLocaleString()} USD`,
      nivel: 'danger',
      detalles: { monto: montoNumerico }
    })
  }
  
  // 2. Verificar múltiples retiros en el mes
  const retirosDelMes = await contarRetirosDelMes(userId)
  if (retirosDelMes > ALERT_THRESHOLDS.MAX_RETIROS_MES) {
    alertas.push({
      tipo: TipoAlerta.RETIROS_MULTIPLES,
      mensaje: `${retirosDelMes + 1}° retiro del mes`,
      nivel: 'warning',
      detalles: { cantidadRetiros: retirosDelMes + 1 }
    })
  }
  
  // 3. Verificar patrones sospechosos (retiros frecuentes)
  const retirosFrecuentes = await verificarRetirosFrecuentes(userId)
  if (retirosFrecuentes) {
    alertas.push({
      tipo: TipoAlerta.PATRON_SOSPECHOSO,
      mensaje: 'Múltiples retiros en período corto',
      nivel: 'warning',
      detalles: { diasEntreSolicitudes: retirosFrecuentes }
    })
  }
  
  // 4. Verificar si es cuenta bancaria nueva
  if (cuentaBancariaId) {
    const esCuentaNueva = await verificarCuentaNueva(cuentaBancariaId)
    if (esCuentaNueva) {
      alertas.push({
        tipo: TipoAlerta.CUENTA_NUEVA,
        mensaje: 'Cuenta bancaria agregada recientemente',
        nivel: 'warning',
        detalles: { cuentaBancariaId }
      })
    }
  }
  
  return alertas
}

/**
 * Verificar si hay retiros muy frecuentes
 */
async function verificarRetirosFrecuentes(userId: string): Promise<number | null> {
  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() - ALERT_THRESHOLDS.DIAS_REVISION_RAPIDA)
  
  const retirosRecientes = await prisma.retiro.findMany({
    where: {
      usuarioId: userId,
      fechaSolicitud: { gte: fechaLimite },
      estado: { notIn: ['Rechazado'] }
    },
    orderBy: { fechaSolicitud: 'desc' },
    take: 2
  })
  
  if (retirosRecientes.length >= 2) {
    const diff = retirosRecientes[0].fechaSolicitud.getTime() - 
                 retirosRecientes[1].fechaSolicitud.getTime()
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
    return dias
  }
  
  return null
}

/**
 * Verificar si la cuenta bancaria es nueva (menos de 7 días)
 */
async function verificarCuentaNueva(cuentaBancariaId: string): Promise<boolean> {
  const cuenta = await prisma.cuentaBancaria.findUnique({
    where: { id: cuentaBancariaId },
    select: { createdAt: true }
  })
  
  if (!cuenta) return false
  
  const diasDesdeCreacion = Math.floor(
    (Date.now() - cuenta.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  return diasDesdeCreacion < 7
}

/**
 * Obtener resumen de alertas para el dashboard
 */
export async function obtenerResumenAlertas(adminId: string) {
  const solicitudesConAlerta = await obtenerSolicitudesConAlerta(adminId)
  
  const resumen = {
    total: 0,
    porTipo: {
      montoAlto: 0,
      retirosMultiples: 0,
      patronSospechoso: 0,
      cuentaNueva: 0
    },
    montoTotal: new Decimal(0),
    alertasNoResueltas: 0
  }
  
  // Contar todas las alertas no resueltas
  const alertasNoResueltas = await prisma.alerta.count({
    where: {
      resuelta: false,
      retiro: {
        usuarioId: { 
          in: (await prisma.adminArtistaRelacion.findMany({
            where: { adminId },
            select: { artistaId: true }
          })).map(rel => rel.artistaId)
        }
      }
    }
  })
  
  resumen.alertasNoResueltas = alertasNoResueltas
  
  solicitudesConAlerta.forEach(solicitud => {
    resumen.total++
    resumen.montoTotal = resumen.montoTotal.add(solicitud.montoSolicitado)
    
    solicitud.alertas.forEach(alerta => {
      switch (alerta.tipo) {
        case 'MONTO_ALTO':
          resumen.porTipo.montoAlto++
          break
        case 'RETIROS_MULTIPLES':
          resumen.porTipo.retirosMultiples++
          break
        case 'PATRON_SOSPECHOSO':
          resumen.porTipo.patronSospechoso++
          break
        case 'CUENTA_NUEVA':
          resumen.porTipo.cuentaNueva++
          break
      }
    })
  })
  
  return resumen
}

/**
 * Marcar alerta como resuelta
 */
export async function resolverAlerta(alertaId: string): Promise<void> {
  await prisma.alerta.update({
    where: { id: alertaId },
    data: { resuelta: true }
  })
}