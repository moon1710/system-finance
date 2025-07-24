// /src/lib/email/helpers.ts
import type { CuentaBancaria } from '@prisma/client'

/**
 * Formatea la información de la cuenta según su tipo
 */
export function formatearInfoCuenta(cuenta: CuentaBancaria): {
  nombreBanco: string
  tipoCuenta: string
  tipoCuentaLabel: string
  identificadorCuenta: string
  ultimosDigitos: string
  mostrarUltimosDigitos: boolean
  displayUltimosDigitos: string
  nombreTitular: string
} {
  switch (cuenta.tipoCuenta) {
    case 'paypal':
      return {
        nombreBanco: 'PayPal',
        tipoCuenta: 'paypal',
        tipoCuentaLabel: 'PayPal',
        identificadorCuenta: cuenta.emailPaypal || 'Email no disponible',
        ultimosDigitos: '',
        mostrarUltimosDigitos: false,
        displayUltimosDigitos: 'display: none;',
        nombreTitular: cuenta.nombreTitular
      }
      
    case 'nacional':
      const clabe = cuenta.clabe || ''
      return {
        nombreBanco: cuenta.nombreBanco || 'Banco Nacional',
        tipoCuenta: 'nacional',
        tipoCuentaLabel: 'Nacional (México)',
        identificadorCuenta: `CLABE: ${clabe}`,
        ultimosDigitos: clabe.length >= 4 ? `****${clabe.slice(-4)}` : clabe,
        mostrarUltimosDigitos: true,
        displayUltimosDigitos: 'display: block;',
        nombreTitular: cuenta.nombreTitular
      }
      
    case 'internacional':
      const numeroCuenta = cuenta.numeroCuenta || ''
      return {
        nombreBanco: cuenta.nombreBanco || 'Banco Internacional',
        tipoCuenta: 'internacional',
        tipoCuentaLabel: 'Internacional (USA)',
        identificadorCuenta: `Cuenta: ${numeroCuenta}`,
        ultimosDigitos: numeroCuenta.length >= 4 ? `****${numeroCuenta.slice(-4)}` : numeroCuenta,
        mostrarUltimosDigitos: true,
        displayUltimosDigitos: 'display: block;',
        nombreTitular: cuenta.nombreTitular
      }
      
    default:
      return {
        nombreBanco: 'Cuenta Bancaria',
        tipoCuenta: 'desconocido',
        tipoCuentaLabel: 'Tipo Desconocido',
        identificadorCuenta: 'No disponible',
        ultimosDigitos: '',
        mostrarUltimosDigitos: false,
        displayUltimosDigitos: 'display: none;',
        nombreTitular: cuenta.nombreTitular
      }
  }
}

/**
 * Obtiene el criterio de alerta formateado
 */
export function formatearCriterioAlerta(monto: number, cantidadRetiros: number = 0): string {
  const criterios: string[] = []
  
  if (monto >= 50000) {
    criterios.push(`Monto alto (≥$50,000 USD)`)
  }
  
  if (cantidadRetiros >= 2) {
    criterios.push(`Múltiples retiros del mes (${cantidadRetiros}° retiro)`)
  }
  
  // Si no hay criterios específicos, es revisión de rutina
  if (criterios.length === 0) {
    criterios.push('Revisión de rutina')
  }
  
  return criterios.join(' • ')
}

/**
 * Formatea la fecha para mostrar en emails
 */
export function formatearFechaEmail(fecha: Date): string {
  return fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City'
  })
}

/**
 * Genera la URL del panel de administración para una solicitud específica
 */
export function generarUrlPanelAdmin(solicitudId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/admin/retiros?solicitud=${solicitudId}`
}