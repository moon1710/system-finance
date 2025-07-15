// /src/lib/email/services.ts
import { EMAIL_CONFIG, initializeSendGrid } from './config'
import { 
  getBienvenidaTemplate,
  getConfirmacionRetiroTemplate,
  getAlertaAdminTemplate,
  getActualizacionEstadoTemplate,
  getConfirmacionCambioPasswordTemplate,
  getTokenRecuperacionTemplate
} from './templates'
import { 
  sendEmail, 
  formatearMonto, 
  getSubjectActualizacionEstado,
  buildRecoveryLink,
  validateEmail,
  validateEmails,
  emailLogger
} from './utils'
import type { 
  BienvenidaEmailData,
  ConfirmacionRetiroData,
  AlertaAdminData,
  ActualizacionEstadoData,
  TokenRecuperacionData
} from './types'

// Inicializar SendGrid al cargar el módulo
initializeSendGrid()

/**
 * Servicio para emails de bienvenida
 */
export class BienvenidaEmailService {
  static async enviar({ email, password }: BienvenidaEmailData): Promise<void> {
    if (!validateEmail(email)) {
      throw new Error(`Email inválido: ${email}`)
    }

    const emailData = {
      to: email,
      from: EMAIL_CONFIG.from,
      subject: '¡Bienvenido a nuestra plataforma!',
      html: getBienvenidaTemplate(email, password)
    }

    await sendEmail(emailData)
    emailLogger.success('BIENVENIDA', email, { hasPassword: !!password })
  }
}

/**
 * Servicio para emails de confirmación de retiro
 */
export class ConfirmacionRetiroService {
  static async enviar({ email, monto }: ConfirmacionRetiroData): Promise<void> {
    if (!validateEmail(email)) {
      throw new Error(`Email inválido: ${email}`)
    }

    const emailData = {
      to: email,
      from: EMAIL_CONFIG.from,
      subject: 'Confirmación de solicitud de retiro',
      html: getConfirmacionRetiroTemplate(monto)
    }

    await sendEmail(emailData)
    emailLogger.success('CONFIRMACION_RETIRO', email, { monto })
  }
}

/**
 * Servicio para alertas a administradores
 */
export class AlertaAdminService {
  static async enviar({ adminEmails, artistaNombre, monto }: AlertaAdminData): Promise<void> {
    if (!validateEmails(adminEmails)) {
      throw new Error(`Uno o más emails de admin son inválidos`)
    }

    if (adminEmails.length === 0) {
      throw new Error('Se requiere al menos un email de administrador')
    }

    const emailData = {
      to: adminEmails,
      from: EMAIL_CONFIG.from,
      subject: `ALERTA: Nueva solicitud de retiro de ${artistaNombre}`,
      html: getAlertaAdminTemplate(artistaNombre, monto)
    }

    await sendEmail(emailData)
    emailLogger.success('ALERTA_ADMIN', adminEmails.join(', '), { 
      artista: artistaNombre, 
      monto,
      adminCount: adminEmails.length 
    })
  }
}

/**
 * Servicio para actualizaciones de estado de retiro
 */
export class ActualizacionEstadoService {
  static async enviar({ 
    email, 
    estado, 
    nombreCompleto, 
    monto, 
    motivo 
  }: ActualizacionEstadoData): Promise<void> {
    if (!validateEmail(email)) {
      throw new Error(`Email inválido: ${email}`)
    }

    if (!nombreCompleto?.trim()) {
      throw new Error('Nombre completo es requerido')
    }

    if (typeof monto !== 'number' || monto <= 0) {
      throw new Error('Monto debe ser un número positivo')
    }

    const montoFormateado = formatearMonto(monto)
    const subject = getSubjectActualizacionEstado(estado, montoFormateado)
    
    const emailData = {
      to: email,
      from: EMAIL_CONFIG.from,
      subject,
      html: getActualizacionEstadoTemplate(estado, nombreCompleto, montoFormateado, motivo)
    }

    await sendEmail(emailData)
    emailLogger.success('ACTUALIZACION_ESTADO', email, { 
      estado, 
      monto: montoFormateado,
      motivo: motivo || 'N/A'
    })
  }
}

/**
 * Servicio para confirmación de cambio de contraseña
 */
export class CambioPasswordService {
  static async enviar(email: string): Promise<void> {
    if (!validateEmail(email)) {
      throw new Error(`Email inválido: ${email}`)
    }

    const emailData = {
      to: email,
      from: EMAIL_CONFIG.from,
      subject: 'Confirmación de cambio de contraseña',
      html: getConfirmacionCambioPasswordTemplate()
    }

    await sendEmail(emailData)
    emailLogger.success('CAMBIO_PASSWORD', email)
  }
}

/**
 * Servicio para tokens de recuperación
 */
export class TokenRecuperacionService {
  static async enviar({ email, token }: TokenRecuperacionData): Promise<void> {
    if (!validateEmail(email)) {
      throw new Error(`Email inválido: ${email}`)
    }

    if (!token?.trim()) {
      throw new Error('Token es requerido')
    }

    const recoveryLink = buildRecoveryLink(token)
    
    const emailData = {
      to: email,
      from: EMAIL_CONFIG.from,
      subject: 'Recuperación de contraseña',
      html: getTokenRecuperacionTemplate(recoveryLink)
    }

    await sendEmail(emailData)
    emailLogger.success('TOKEN_RECUPERACION', email, { hasToken: !!token })
  }
}