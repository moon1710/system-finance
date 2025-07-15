// /src/lib/email/types.ts

/**
 * Estados posibles para las actualizaciones de retiro
 */
export type EstadoRetiro = 'Aprobado' | 'Completado' | 'Rechazado'

/**
 * Interfaz base para todos los emails
 */
export interface BaseEmailData {
  to: string
  from: string
  subject: string
  html: string
}

/**
 * Datos para email de bienvenida
 */
export interface BienvenidaEmailData {
  email: string
  password: string
}

/**
 * Datos para email de confirmación de retiro
 */
export interface ConfirmacionRetiroData {
  email: string
  monto: string | number
}

/**
 * Datos para alerta de admin
 */
export interface AlertaAdminData {
  adminEmails: string[]
  artistaNombre: string
  monto: string | number
}

/**
 * Datos para actualización de estado
 */
export interface ActualizacionEstadoData {
  email: string
  estado: EstadoRetiro
  nombreCompleto: string
  monto: number
  motivo?: string
}

/**
 * Datos para token de recuperación
 */
export interface TokenRecuperacionData {
  email: string
  token: string
}

/**
 * Respuesta de SendGrid
 */
export interface SendGridResponse {
  statusCode: number
  body: any
  headers: Record<string, string>
}