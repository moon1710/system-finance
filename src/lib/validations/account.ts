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

  // Validar nombre del banco
  if (!datos.nombreBanco || datos.nombreBanco.trim().length < 2) {
    errores.push('El nombre del banco es requerido (mínimo 2 caracteres)');
  }

  // Validar CLABE
  if (!datos.clabe) {
    errores.push('La CLABE es requerida para cuentas nacionales');
  } else {
    // CLABE debe tener exactamente 18 dígitos
    const clabeNumeros = datos.clabe.replace(/\s/g, '');
    if (!/^\d{18}$/.test(clabeNumeros)) {
      errores.push('La CLABE debe tener exactamente 18 dígitos');
    }
  }

  // Validar nombre del titular
  if (!datos.nombreTitular || datos.nombreTitular.trim().length < 3) {
    errores.push('El nombre del titular es requerido (mínimo 3 caracteres)');
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

  // ✅ VALIDAR PAÍS (SOLO QUE EXISTA, SIN RESTRICCIONES)
  if (!datos.pais || datos.pais.trim().length === 0) {
    errores.push('El país es requerido para cuentas internacionales');
  }

  // Validar nombre del banco
  if (!datos.nombreBanco || datos.nombreBanco.trim().length < 2) {
    errores.push('El nombre del banco es requerido (mínimo 2 caracteres)');
  }

  // Validar número de cuenta/IBAN
  if (!datos.numeroCuenta) {
    errores.push('El número de cuenta o IBAN es requerido');
  } else {
    // Validación básica de número de cuenta (4-34 caracteres alfanuméricos)
    const cuentaLimpia = datos.numeroCuenta.replace(/\s/g, '');
    if (!/^[A-Z0-9]{4,34}$/i.test(cuentaLimpia)) {
      errores.push('El número de cuenta debe tener entre 4 y 34 caracteres alfanuméricos');
    }
  }

  // Validar código SWIFT
  if (!datos.swift) {
    errores.push('El código SWIFT/BIC es requerido');
  } else {
    // SWIFT debe tener 8 o 11 caracteres
    const swiftLimpio = datos.swift.replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftLimpio)) {
      errores.push('El código SWIFT debe tener 8 o 11 caracteres (formato: AAAABBCCXXX)');
    }
  }

  // Validar nombre del titular
  if (!datos.nombreTitular || datos.nombreTitular.trim().length < 3) {
    errores.push('El nombre del titular es requerido (mínimo 3 caracteres)');
  }

  return {
    exito: errores.length === 0,
    mensaje: errores.length > 0 ? 'Error en la validación de cuenta internacional' : 'Validación exitosa',
    errores: errores.length > 0 ? errores : undefined
  };
}

/**
 * Validar cuenta PayPal
 */
export function validarCuentaPayPal(datos: DatosCuentaBancaria): ResultadoValidacion {
  const errores: string[] = [];

  // Validar email de PayPal
  if (!datos.emailPaypal) {
    errores.push('El email de PayPal es requerido');
  } else {
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.emailPaypal)) {
      errores.push('Ingresa un email válido para PayPal');
    }
  }

  // Validar nombre del titular
  if (!datos.nombreTitular || datos.nombreTitular.trim().length < 3) {
    errores.push('El nombre del titular es requerido (mínimo 3 caracteres)');
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