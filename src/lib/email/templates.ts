// /src/lib/email/templates.ts
import { EstadoRetiro } from './types'
import { formatearInfoCuenta, formatearCriterioAlerta } from './helpers'
import { renderTemplate } from './templateEngine'
/**
 * Template base con footer común
 */
const baseFooter = `
  <p>Gracias por usar nuestra plataforma.</p>
  <p>Saludos,</p>
  <p>El equipo de Tu Plataforma</p>
`

/**
 * Template para email de bienvenida
 */
export function getBienvenidaTemplate(email: string, password: string): string {
  return `
    <p>Hola,</p>
    <p>Te damos la bienvenida a nuestra plataforma.</p>
    <p>Tus credenciales de acceso son:</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Contraseña:</strong> ${password}</p>
    <p>Te recomendamos cambiar tu contraseña una vez que inicies sesión.</p>
    <p>Saludos cordiales,</p>
    <p>El equipo de Tu Plataforma</p>
  `
}

/**
 * Template para confirmación de retiro
 */
export function getConfirmacionRetiroTemplate(monto: string | number): string {
  return `
    <p>Hola,</p>
    <p>Hemos recibido tu solicitud de retiro por un monto de <strong>$${typeof monto === 'number' ? monto.toLocaleString() : monto} USD</strong>.</p>
    <p>Tu solicitud está siendo procesada y te notificaremos cuando el pago haya sido completado.</p>
    ${baseFooter}
  `
}

/**
 * Template para alerta de admin
 */
export function getAlertaAdminTemplate(data: any): string {
  // Si data.cuenta existe, formatear la info
  if (data.cuenta) {
    const infoCuenta = formatearInfoCuenta(data.cuenta)
    const criterio = formatearCriterioAlerta(data.monto, data.cantidadRetiros || 0)
    
    const templateData = {
      ...data,
      ...infoCuenta,
      criterioAlerta: criterio
    }
    
    return renderTemplate('alerta-admin', templateData)
  }
  
  // Fallback si no hay información de cuenta
  return renderTemplate('alerta-admin', data)
}

/**
 * Template para actualización de estado de retiro
 */
export function getActualizacionEstadoTemplate(
  estado: EstadoRetiro,
  nombreCompleto: string,
  montoFormateado: string,
  motivo?: string
): string {
  let body = ''

  switch (estado) {
    case 'Aprobado':
      body = `
        <p>Hola, ${nombreCompleto},</p>
        <p>Buenas noticias. Tu solicitud de retiro por <strong>${montoFormateado}</strong> ha sido aprobada y está siendo procesada.</p>
        <p>Recibirás otra notificación una vez que el pago haya sido completado. Generalmente, esto toma de 3 a 5 días hábiles.</p>
      `
      break
    case 'Completado':
      body = `
        <p>Hola, ${nombreCompleto},</p>
        <p>¡Excelente! Hemos enviado el pago de tu retiro por <strong>${montoFormateado}</strong> a tu cuenta registrada.</p>
        <p>Por favor, verifica tu cuenta bancaria. El tiempo que tarda en reflejarse depende de tu banco.</p>
      `
      break
    case 'Rechazado':
      body = `
        <p>Hola, ${nombreCompleto},</p>
        <p>Lamentamos informarte que tu solicitud de retiro por <strong>${montoFormateado}</strong> no pudo ser procesada.</p>
        <p><strong>Motivo del rechazo:</strong> ${motivo || 'No se proporcionó un motivo específico.'}</p>
        <p>Si tienes alguna pregunta, por favor, contacta a soporte.</p>
      `
      break
  }

  return body + baseFooter
}

/**
 * Template para confirmación de cambio de contraseña
 */
export function getConfirmacionCambioPasswordTemplate(): string {
  return `
    <p>Hola,</p>
    <p>Te confirmamos que tu contraseña ha sido cambiada exitosamente.</p>
    <p>Si no realizaste este cambio, por favor, contacta a soporte inmediatamente.</p>
    ${baseFooter}
  `
}

/**
 * Template para token de recuperación
 */
export function getTokenRecuperacionTemplate(recoveryLink: string): string {
  return `
    <p>Hola,</p>
    <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
    <p><a href="${recoveryLink}">Restablecer mi contraseña</a></p>
    <p>Este enlace es válido por un tiempo limitado.</p>
    <p>Si no solicitaste este cambio, por favor, ignora este correo.</p>
    ${baseFooter}
  `
}