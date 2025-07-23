// /lib/validations/account.ts
// 🔧 VERSIÓN COMPLETA: Con todos los campos pero validaciones flexibles

export interface DireccionCompleta {
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  pais: string;
}

export interface DatosCuentaBancaria {
  // === CAMPOS BÁSICOS ===
  tipoCuenta: 'nacional' | 'internacional' | 'paypal';
  nombreTitular: string;
  nombreBanco?: string;
  
  // === CUENTAS NACIONALES (México) ===
  clabe?: string;
  tipoCuentaNacional?: 'cheques' | 'ahorros';
  
  // === CUENTAS INTERNACIONALES ===
  numeroCuenta?: string; // IBAN o número de cuenta
  swift?: string;
  codigoABA?: string; // Solo para USA
  tipoCuentaInternacional?: 'checking' | 'savings';
  pais?: string;
  
  // === DIRECCIONES ===
  direccionBeneficiario?: DireccionCompleta;
  direccionBanco?: DireccionCompleta;
  
  // === PAYPAL ===
  emailPaypal?: string;
  
  // === CONFIGURACIÓN ===
  esPredeterminada?: boolean;
}

export interface ResultadoValidacion {
  exito: boolean;
  mensaje?: string;
  errores?: string[];
}

/**
 * Validar cuenta bancaria nacional (México)
 * VALIDACIONES FLEXIBLES: Solo campos esenciales
 */
export function validarCuentaNacional(datos: DatosCuentaBancaria): ResultadoValidacion {
  const errores: string[] = [];

  // Validar nombre del banco (flexible)
  if (!datos.nombreBanco || datos.nombreBanco.trim().length < 2) {
    errores.push('El nombre del banco es requerido (mínimo 2 caracteres)');
  }

  // Validar CLABE (flexible - solo longitud)
  if (!datos.clabe) {
    errores.push('La CLABE es requerida para cuentas nacionales');
  } else {
    const clabeNumeros = datos.clabe.replace(/\s/g, '');
    if (clabeNumeros.length !== 18 || !/^\d+$/.test(clabeNumeros)) {
      errores.push('La CLABE debe tener exactamente 18 dígitos');
    }
  }

  // Validar nombre del titular
  if (!datos.nombreTitular || datos.nombreTitular.trim().length < 3) {
    errores.push('El nombre del titular es requerido (mínimo 3 caracteres)');
  }

  // Validar tipo de cuenta (opcional pero si existe debe ser válido)
  if (datos.tipoCuentaNacional && !['cheques', 'ahorros'].includes(datos.tipoCuentaNacional)) {
    errores.push('El tipo de cuenta debe ser "cheques" o "ahorros"');
  }

  return {
    exito: errores.length === 0,
    mensaje: errores.length > 0 ? 'Error en la validación de cuenta nacional' : 'Validación exitosa',
    errores: errores.length > 0 ? errores : undefined
  };
}

/**
 * Validar cuenta bancaria internacional
 * VALIDACIONES FLEXIBLES: Solo campos críticos, direcciones opcionales pero validadas si existen
 */
export function validarCuentaInternacional(datos: DatosCuentaBancaria): ResultadoValidacion {
  const errores: string[] = [];

  // Validar país (solo que exista)
  if (!datos.pais || datos.pais.trim().length === 0) {
    errores.push('El país es requerido para cuentas internacionales');
  }

  // Validar nombre del banco
  if (!datos.nombreBanco || datos.nombreBanco.trim().length < 2) {
    errores.push('El nombre del banco es requerido (mínimo 2 caracteres)');
  }

  // Validar número de cuenta/IBAN (flexible)
  if (!datos.numeroCuenta || datos.numeroCuenta.trim().length < 4) {
    errores.push('El número de cuenta o IBAN es requerido (mínimo 4 caracteres)');
  }

  // Validar código SWIFT (flexible)
  if (!datos.swift) {
    errores.push('El código SWIFT/BIC es requerido');
  } else {
    const swiftLimpio = datos.swift.replace(/\s/g, '').toUpperCase();
    if (swiftLimpio.length < 8 || swiftLimpio.length > 11) {
      errores.push('El código SWIFT debe tener entre 8 y 11 caracteres');
    }
  }

  // Validar código ABA si el país del banco es USA (flexible)
  if (datos.direccionBanco?.pais === 'USA' || datos.pais === 'USA') {
    if (datos.codigoABA && datos.codigoABA.length !== 9) {
      errores.push('El código ABA debe tener exactamente 9 dígitos para bancos de USA');
    }
  }

  // Validar nombre del titular
  if (!datos.nombreTitular || datos.nombreTitular.trim().length < 3) {
    errores.push('El nombre del titular es requerido (mínimo 3 caracteres)');
  }

  // Validar tipo de cuenta internacional (opcional)
  if (datos.tipoCuentaInternacional && !['checking', 'savings'].includes(datos.tipoCuentaInternacional)) {
    errores.push('El tipo de cuenta debe ser "checking" o "savings"');
  }

  // Validar direcciones si se proporcionan (flexible)
  if (datos.direccionBeneficiario) {
    const errorDir = validarDireccionFlexible(datos.direccionBeneficiario, 'beneficiario');
    if (errorDir) errores.push(errorDir);
  }

  if (datos.direccionBanco) {
    const errorDir = validarDireccionFlexible(datos.direccionBanco, 'banco');
    if (errorDir) errores.push(errorDir);
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

  // Validar email de PayPal (flexible)
  if (!datos.emailPaypal || datos.emailPaypal.trim().length === 0) {
    errores.push('El email de PayPal es requerido');
  } else {
    // Validación básica de email (muy flexible)
    if (!datos.emailPaypal.includes('@') || !datos.emailPaypal.includes('.')) {
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
 * Validar dirección de forma flexible
 */
function validarDireccionFlexible(direccion: DireccionCompleta, tipo: string): string | null {
  if (!direccion.direccion || direccion.direccion.trim().length < 5) {
    return `La dirección del ${tipo} debe tener al menos 5 caracteres`;
  }
  
  if (!direccion.ciudad || direccion.ciudad.trim().length < 2) {
    return `La ciudad del ${tipo} es requerida (mínimo 2 caracteres)`;
  }
  
  if (!direccion.pais || direccion.pais.trim().length < 2) {
    return `El país del ${tipo} es requerido`;
  }

  // Estado y código postal opcionales (muy flexible)
  return null;
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

// ✅ FUNCIONES DE UTILIDAD PARA FRONTEND (flexibles)

export function validarCLABE(clabe: string): { valido: boolean; mensaje?: string } {
  if (!clabe) return { valido: false, mensaje: 'CLABE requerida' };
  
  const clabeNumeros = clabe.replace(/\s/g, '');
  if (clabeNumeros.length !== 18 || !/^\d+$/.test(clabeNumeros)) {
    return { valido: false, mensaje: 'CLABE debe tener exactamente 18 dígitos' };
  }
  
  return { valido: true };
}

export function validarSWIFT(swift: string): { valido: boolean; mensaje?: string } {
  if (!swift) return { valido: false, mensaje: 'Código SWIFT requerido' };
  
  const swiftLimpio = swift.replace(/\s/g, '').toUpperCase();
  if (swiftLimpio.length < 8 || swiftLimpio.length > 11) {
    return { valido: false, mensaje: 'Código SWIFT debe tener entre 8-11 caracteres' };
  }
  
  return { valido: true };
}

export function validarEmail(email: string): { valido: boolean; mensaje?: string } {
  if (!email) return { valido: false, mensaje: 'Email requerido' };
  
  if (!email.includes('@') || !email.includes('.')) {
    return { valido: false, mensaje: 'Email inválido' };
  }
  
  return { valido: true };
}

export function validarCodigoABA(codigo: string): { valido: boolean; mensaje?: string } {
  if (!codigo) return { valido: false, mensaje: 'Código ABA requerido para bancos de USA' };
  
  const codigoNumeros = codigo.replace(/\s/g, '');
  if (!/^\d{9}$/.test(codigoNumeros)) {
    return { valido: false, mensaje: 'Código ABA debe tener exactamente 9 dígitos' };
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

export function formatearCodigoABA(codigo: string): string {
  const numeros = codigo.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
}

// ✅ EXPORT DE TIPOS
export type { DatosCuentaBancaria, ResultadoValidacion, DireccionCompleta };