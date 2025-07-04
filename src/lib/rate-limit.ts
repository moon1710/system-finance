// lib/rate-limit.ts

// Cache para intentos de login
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()

// Configuración
const SECURITY_CONFIG = {
  maxLoginAttempts: 3,
  lockoutDuration: 15 * 60 * 1000, // 15 minutos
}

// Verificar si la IP está bloqueada
export function isIpBlocked(ip: string): boolean {
  const attempt = loginAttempts.get(ip)
  if (!attempt) return false
  
  if (Date.now() > attempt.lockedUntil) {
    loginAttempts.delete(ip)
    return false
  }
  
  return attempt.count >= SECURITY_CONFIG.maxLoginAttempts
}

// Registrar intento fallido
export function recordFailedAttempt(ip: string) {
  const attempt = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 }
  attempt.count++
  
  if (attempt.count >= SECURITY_CONFIG.maxLoginAttempts) {
    attempt.lockedUntil = Date.now() + SECURITY_CONFIG.lockoutDuration
  }
  
  loginAttempts.set(ip, attempt)
}

// Limpiar intentos exitosos
export function clearAttempts(ip: string) {
  loginAttempts.delete(ip)
}

// Limpiar cache periódicamente
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, attempt] of loginAttempts.entries()) {
      if (now > attempt.lockedUntil) {
        loginAttempts.delete(ip)
      }
    }
  }, 60 * 60 * 1000) // cada hora
}