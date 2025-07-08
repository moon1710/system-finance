// lib/validations/alertas.ts

import { z } from 'zod'
import { ALERT_THRESHOLDS } from '@/lib/services/alertas'

/**
 * Schema para configuración de umbrales
 */
export const configuracionAlertasSchema = z.object({
  montoAlto: z.number().min(1000).max(1000000),
  maxRetirosMes: z.number().min(1).max(10),
  diasRevisionRapida: z.number().min(1).max(30),
})

/**
 * Schema para crear alerta manual
 */
export const crearAlertaManualSchema = z.object({
  retiroId: z.string().uuid(),
  mensaje: z.string().min(10).max(500),
  nivel: z.enum(['warning', 'danger']),
})

/**
 * Validar si un monto requiere alerta
 */
export function requiereAlertaPorMonto(monto: number): {
  requiere: boolean
  nivel: 'warning' | 'danger'
  mensaje?: string
} {
  if (monto >= ALERT_THRESHOLDS.MONTO_ALTO * 2) {
    return {
      requiere: true,
      nivel: 'danger',
      mensaje: `Monto extremadamente alto (≥$${(ALERT_THRESHOLDS.MONTO_ALTO * 2).toLocaleString()})`
    }
  }
  
  if (monto >= ALERT_THRESHOLDS.MONTO_ALTO) {
    return {
      requiere: true,
      nivel: 'warning',
      mensaje: `Monto alto (≥$${ALERT_THRESHOLDS.MONTO_ALTO.toLocaleString()})`
    }
  }
  
  return { requiere: false, nivel: 'warning' }
}

/**
 * Determinar prioridad de revisión
 */
export function calcularPrioridadRevision(alertas: any[]): 'baja' | 'media' | 'alta' | 'critica' {
  const cantidadDanger = alertas.filter(a => a.nivel === 'danger').length
  const cantidadWarning = alertas.filter(a => a.nivel === 'warning').length
  
  if (cantidadDanger >= 2) return 'critica'
  if (cantidadDanger === 1) return 'alta'
  if (cantidadWarning >= 2) return 'media'
  if (cantidadWarning === 1) return 'baja'
  
  return 'baja'
}

/**
 * Formatear mensaje de alerta para notificación
 */
export function formatearMensajeAlerta(
  tipoAlerta: string,
  detalles: any,
  usuario?: { nombreCompleto: string; email: string }
): string {
  const nombreUsuario = usuario ? usuario.nombreCompleto : 'Usuario'
  
  switch (tipoAlerta) {
    case 'MONTO_ALTO':
      return `${nombreUsuario} ha solicitado un retiro de $${detalles.monto?.toLocaleString() || 'N/A'} USD`
      
    case 'RETIROS_MULTIPLES':
      return `${nombreUsuario} está realizando su ${detalles.cantidadRetiros || 'N/A'}° retiro del mes`
      
    case 'PATRON_SOSPECHOSO':
      return `${nombreUsuario} ha realizado múltiples retiros en ${detalles.diasEntreSolicitudes || 'pocos'} días`
      
    case 'CUENTA_NUEVA':
      return `${nombreUsuario} está usando una cuenta bancaria agregada recientemente`
      
    default:
      return `Alerta detectada para ${nombreUsuario}`
  }
}

/**
 * Validar si se debe notificar al admin
 */
export function debeNotificarAdmin(alertas: any[]): boolean {
  // Notificar si hay al menos una alerta de nivel 'danger'
  // o más de 2 alertas de cualquier tipo
  return alertas.some(a => a.nivel === 'danger') || alertas.length > 2
}

/**
 * Generar resumen de alertas para email
 */
export function generarResumenAlertasEmail(
  retiro: any,
  alertas: any[]
): {
  asunto: string
  prioridad: string
  contenido: string
} {
  const prioridad = calcularPrioridadRevision(alertas)
  const montoFormateado = `$${retiro.montoSolicitado.toLocaleString()}`
  
  let asunto = `[${prioridad.toUpperCase()}] Solicitud de retiro `
  
  if (alertas.some(a => a.tipo === 'MONTO_ALTO')) {
    asunto += `por ${montoFormateado} `
  }
  
  asunto += `- ${retiro.usuario.nombreCompleto}`
  
  const contenido = `
    <h3>Solicitud de Retiro que Requiere Atención</h3>
    
    <p><strong>Artista:</strong> ${retiro.usuario.nombreCompleto} (${retiro.usuario.email})</p>
    <p><strong>Monto:</strong> ${montoFormateado}</p>
    <p><strong>Fecha:</strong> ${new Date(retiro.fechaSolicitud).toLocaleDateString()}</p>
    
    <h4>Alertas Detectadas:</h4>
    <ul>
      ${alertas.map(alerta => `
        <li style="color: ${alerta.nivel === 'danger' ? '#dc2626' : '#f59e0b'}">
          <strong>${alerta.mensaje}</strong>
        </li>
      `).join('')}
    </ul>
    
    <p><strong>Prioridad de Revisión:</strong> ${prioridad.toUpperCase()}</p>
    
    <p>Por favor, revise esta solicitud con especial atención.</p>
  `
  
  return { asunto, prioridad, contenido }
}