// /src/lib/email/index.ts

// Exportar servicios modulares
export {
  BienvenidaEmailService,
  ConfirmacionRetiroService,
  AlertaAdminService,
  ActualizacionEstadoService,
  CambioPasswordService,
  TokenRecuperacionService
} from './services'

// Exportar tipos
export type {
  EstadoRetiro,
  BaseEmailData,
  BienvenidaEmailData,
  ConfirmacionRetiroData,
  AlertaAdminData,
  ActualizacionEstadoData,
  TokenRecuperacionData,
  SendGridResponse
} from './types'

// Exportar utilidades
export {
  formatearMonto,
  validateEmail,
  validateEmails,
  emailLogger
} from './utils'

// Exportar configuración
export { EMAIL_CONFIG } from './config'

// Re-exportar funciones originales para compatibilidad hacia atrás
import {
  BienvenidaEmailService,
  ConfirmacionRetiroService,
  AlertaAdminService,
  ActualizacionEstadoService,
  CambioPasswordService,
  TokenRecuperacionService
} from './services'

/**
 * @deprecated Usar BienvenidaEmailService.enviar() en su lugar
 */
export async function enviarEmailBienvenida(email: string, password: string): Promise<void> {
  return BienvenidaEmailService.enviar({ email, password })
}

/**
 * @deprecated Usar ConfirmacionRetiroService.enviar() en su lugar
 */
export async function enviarConfirmacionRetiro(email: string, monto: string | number): Promise<void> {
  return ConfirmacionRetiroService.enviar({ email, monto })
}

/**
 * @deprecated Usar AlertaAdminService.enviar() en su lugar
 */
export async function enviarAlertaAdmin(
  adminEmails: string[], 
  artistaNombre: string, 
  monto: string | number
): Promise<void> {
  return AlertaAdminService.enviar({ adminEmails, artistaNombre, monto })
}

/**
 * @deprecated Usar ActualizacionEstadoService.enviar() en su lugar
 */
export async function enviarActualizacionEstado(
  email: string,
  estado: 'Aprobado' | 'Completado' | 'Rechazado',
  nombreCompleto: string,
  monto: number,
  motivo?: string
): Promise<void> {
  return ActualizacionEstadoService.enviar({
    email,
    estado,
    nombreCompleto,
    monto,
    motivo
  })
}

/**
 * @deprecated Usar CambioPasswordService.enviar() en su lugar
 */
export async function enviarConfirmacionCambioPassword(email: string): Promise<void> {
  return CambioPasswordService.enviar(email)
}

/**
 * @deprecated Usar TokenRecuperacionService.enviar() en su lugar
 */
export async function enviarTokenRecuperacion(email: string, token: string): Promise<void> {
  return TokenRecuperacionService.enviar({ email, token })
}