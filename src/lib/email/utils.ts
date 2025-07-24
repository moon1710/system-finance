// /src/lib/email/utils.ts
import { sgMail, EMAIL_CONFIG } from './config'
import type { BaseEmailData, EstadoRetiro } from './types'

/**
 * Formatea un monto como moneda USD
 */
export function formatearMonto(monto: number): string {
  return monto.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/**
 * Genera el asunto para emails de actualización de estado
 */
export function getSubjectActualizacionEstado(estado: EstadoRetiro): string {
  switch (estado) {
    case 'Aprobado':
      return `Backstage Pagos::: Tu retiro ha sido aprobado`
    case 'Completado':
      return `Backstage Pagos::: ¡Tu transferencia ha sido completada!`
    case 'Rechazado':
      return `Backstage Pagos::: Tu solicitud de retiro fue rechazada`
    default:
      return `Backstage Pagos::: Actualización de tu retiro`
  }
}

/**
 * Construye un enlace de recuperación de contraseña
 */
export function buildRecoveryLink(token: string): string {
  return `${EMAIL_CONFIG.baseUrl}/reset-password?token=${token}`
}

/**
 * Función base para enviar emails
 */
export async function sendEmail(emailData: BaseEmailData): Promise<void> {
  try {
    await sgMail.send(emailData)
    console.log(`✅ Email enviado exitosamente a: ${emailData.to}`)
  } catch (error: any) {
    const errorMessage = error.response?.body || error.message || error
    console.error(`❌ Error al enviar email a ${emailData.to}:`, errorMessage)
    throw new Error(`Fallo al enviar email: ${errorMessage}`)
  }
}

/**
 * Valida que un email tenga el formato correcto
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida que los emails en un array sean válidos
 */
export function validateEmails(emails: string[]): boolean {
  return emails.every(email => validateEmail(email))
}

/**
 * Logger para operaciones de email
 */
export const emailLogger = {
  success: (operation: string, email: string, details?: any) => {
    console.log(`✅ [EMAIL SUCCESS] ${operation} - ${email}`, details ? JSON.stringify(details) : '')
  },
  
  error: (operation: string, email: string, error: any) => {
    console.error(`❌ [EMAIL ERROR] ${operation} - ${email}:`, error)
  },
  
  warn: (operation: string, message: string) => {
    console.warn(`⚠️ [EMAIL WARN] ${operation}: ${message}`)
  },
  
  info: (operation: string, message: string) => {
    console.info(`ℹ️ [EMAIL INFO] ${operation}: ${message}`)
  }
}