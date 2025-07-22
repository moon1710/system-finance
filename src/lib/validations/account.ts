// /lib/validations/account.ts
// 🔧 VERSIÓN SIMPLE: Sin restricciones de países específicos

export interface DatosCuentaBancaria {
  nombreBanco?: string;
  clabe?: string;
  numeroRuta?: string;
  numeroCuenta?: string;
  swift?: string;
  emailPaypal?: string;
  nombreTitular: string;
  pais?: string; // ✅ CAMPO AGREGADO
}

export interface ResultadoValidacion {
  exito: boolean;
  mensaje?: string;
  errores?: string[];
}

/**
 * Validar cuenta bancaria nacional (México)
 */
export function validarCuentaNacional(datos: DatosCuentaBancaria): ResultadoValidacion {
  const errores: string[] = [];

  if (!datos.nombreBanco || datos.nombreBanco.trim().length < 2) {
    errores.push('El nombre del banco es requerido');
  }

  if (!datos.clabe || datos.clabe.replace(/\s/g, '').length < 10) { // Solo mínimo 10 dígitos, sin exigir 18 exactos
    errores.push('La CLABE debe tener al menos 10 dígitos');
  }

  if (!datos.nombreTitular || datos.nombreTitular.trim().length < 2) {
    errores.push('El nombre del titular es requerido');
  }

  return {
    exito: errores.length === 0,
    mensaje: errores.length > 0 ? 'Error en la validación de cuenta nacional' : 'Validación exitosa',
    errores: errores.length > 0 ? errores : undefined
  };
}
/**
 * Validar cuenta bancaria internacional
 */
export function validarCuentaInternacional(datos: DatosCuentaBancaria): ResultadoValidacion {
  const errores: string[] = [];

  if (!datos.pais) {
    errores.push('El país es requerido');
  }
  if (!datos.nombreBanco || datos.nombreBanco.trim().length < 2) {
    errores.push('El nombre del banco es requerido');
  }
  if (!datos.numeroCuenta) {
    errores.push('El número de cuenta o IBAN es requerido');
  } else if (datos.numeroCuenta.replace(/\s/g, '').length < 4) {
    errores.push('El número de cuenta debe tener al menos 4 caracteres');
  }
  if (!datos.swift || datos.swift.length < 6) { // No exige formato exacto, solo presencia y mínimo 6
    errores.push('El código SWIFT/BIC es requerido');
  }
  if (!datos.nombreTitular || datos.nombreTitular.trim().length < 2) {
    errores.push('El nombre del titular es requerido');
  }
  return {
    exito: errores.length === 0,
    mensaje: errores.length > 0 ? 'Error en la validación de cuenta internacional' : 'Validación exitosa',
    errores: errores.length > 0 ? errores : undefined
  };
}
/**
 * Validar cuenta bancaria paypal
 */
export function validarCuentaPayPal(datos: DatosCuentaBancaria): ResultadoValidacion {
  const errores: string[] = [];

  if (!datos.emailPaypal) {
    errores.push('El email de PayPal es requerido');
  }
  if (!datos.nombreTitular || datos.nombreTitular.trim().length < 2) {
    errores.push('El nombre del titular es requerido');
  }
  return {
    exito: errores.length === 0,
    mensaje: errores.length > 0 ? 'Error en la validación de cuenta PayPal' : 'Validación exitosa',
    errores: errores.length > 0 ? errores : undefined
  };
}

/**
 * Validar datos generales de cuenta bancaria
 */
export function validarCuentaBancaria(
  tipoCuenta: 'nacional' | 'internacional' | 'paypal',
  datos: DatosCuentaBancaria
): ResultadoValidacion {
  
  switch (tipoCuenta) {
    case 'nacional':
      return validarCuentaNacional(datos);
    
    case 'internacional':
      return validarCuentaInternacional(datos);
    
    case 'paypal':
      return validarCuentaPayPal(datos);
    
    default:
      return {
        exito: false,
        mensaje: 'Tipo de cuenta no válido',
        errores: ['tipoCuenta: Debe ser nacional, internacional o paypal']
      };
  }
}

// ✅ VALIDACIONES ESPECÍFICAS PARA FRONTEND
export function validarCLABE(clabe: string): { valido: boolean; mensaje?: string } {
  if (!clabe) return { valido: false, mensaje: 'CLABE requerida' };
  
  const clabeNumeros = clabe.replace(/\s/g, '');
  if (!/^\d{18}$/.test(clabeNumeros)) {
    return { valido: false, mensaje: 'CLABE debe tener exactamente 18 dígitos' };
  }
  
  return { valido: true };
}

export function validarSWIFT(swift: string): { valido: boolean; mensaje?: string } {
  if (!swift) return { valido: false, mensaje: 'Código SWIFT requerido' };
  
  const swiftLimpio = swift.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftLimpio)) {
    return { valido: false, mensaje: 'Formato SWIFT inválido (ej: BOFAUS3NXXX)' };
  }
  
  return { valido: true };
}

export function validarEmail(email: string): { valido: boolean; mensaje?: string } {
  if (!email) return { valido: false, mensaje: 'Email requerido' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valido: false, mensaje: 'Email inválido' };
  }
  
  return { valido: true };
}

// ✅ FORMATTERS PARA EL FRONTEND
export function formatearCLABE(clabe: string): string {
  const numeros = clabe.replace(/\D/g, '');
  return numeros.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatearSWIFT(swift: string): string {
  return swift.toUpperCase().replace(/\s/g, '');
}

// ✅ EXPORT DE TIPOS
export type { DatosCuentaBancaria, ResultadoValidacion };