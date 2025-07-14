// /lib/validations/account.ts

/**
 * Interfaz para el resultado de una validación.
 */
export interface ValidacionResult {
  esValido: boolean;
  errores: string[];
}

/**
 * Interfaz para los datos de la cuenta que se validarán.
 */
interface DatosParaValidar {
  nombreTitular?: string;
  nombreBanco?: string;
  clabe?: string;
  numeroCuenta?: string;
  swift?: string;
  emailPaypal?: string;
  pais?: string;
}

// --- VALIDACIONES ESPECÍFICAS ---

/**
 * Valida una CLABE de 18 dígitos (México).
 */
function validarCLABE(clabe?: string): ValidacionResult {
  const errores: string[] = [];
  if (!clabe || clabe.trim() === '') {
    errores.push('La CLABE es requerida.');
    return { esValido: false, errores };
  }

  const clabeLimpia = clabe.trim();
  if (!/^\d{18}$/.test(clabeLimpia)) {
    errores.push('La CLABE debe contener exactamente 18 dígitos.');
    return { esValido: false, errores };
  }

  // Algoritmo de validación del dígito verificador
  const pesos = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let suma = 0;
  for (let i = 0; i < 17; i++) {
    suma += parseInt(clabeLimpia.charAt(i), 10) * pesos[i];
  }
  const digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
  const digitoVerificadorReal = parseInt(clabeLimpia.charAt(17), 10);

  if (digitoVerificadorCalculado !== digitoVerificadorReal) {
    errores.push('La CLABE no es válida.');
  }

  return { esValido: errores.length === 0, errores };
}

/**
 * Valida los campos de una cuenta internacional genérica.
 */
function validarCuentaInternacional(datos: DatosParaValidar): ValidacionResult {
  const errores: string[] = [];

  // CORREGIDO: Se añade la validación para el país.
  if (!datos.pais || datos.pais.trim() === '') {
    errores.push('El país es requerido para cuentas internacionales.');
  }

  if (!datos.numeroCuenta || datos.numeroCuenta.trim() === '') {
    errores.push('El número de cuenta es requerido.');
  } else if (datos.numeroCuenta.trim().length < 5) {
    errores.push('El número de cuenta parece demasiado corto.');
  }

  // SWIFT es opcional en muchos casos, pero si se provee, debe ser válido.
  if (datos.swift && datos.swift.trim() !== '') {
    const swiftLimpio = datos.swift.trim().toUpperCase();
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftLimpio)) {
      errores.push('El formato del código SWIFT no es válido.');
    }
  }

  return { esValido: errores.length === 0, errores };
}

/**
 * Valida una cuenta de PayPal.
 */
function validarCuentaPaypal(email?: string): ValidacionResult {
  const errores: string[] = [];
  if (!email || email.trim() === '') {
    errores.push('El email de PayPal es requerido.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errores.push('El formato del email no es válido.');
  }
  return { esValido: errores.length === 0, errores };
}


// --- FUNCIÓN PRINCIPAL DE VALIDACIÓN ---

/**
 * Valida un conjunto de datos de cuenta bancaria según su tipo.
 * Esta es la función principal que debe ser llamada desde el servicio.
 * @param tipoCuenta - El tipo de cuenta a validar.
 * @param datos - El objeto con todos los datos del formulario.
 */
export function validarDatosCuenta(
  tipoCuenta: string,
  datos: DatosParaValidar
): ValidacionResult {
  const errores: string[] = [];

  // 1. Validaciones comunes a todos los tipos que las requieren
  if (!datos.nombreTitular || datos.nombreTitular.trim() === '') {
    errores.push('El nombre del titular es requerido.');
  }

  if (['nacional', 'internacional'].includes(tipoCuenta)) {
      if (!datos.nombreBanco || datos.nombreBanco.trim() === '') {
          errores.push('El nombre del banco es requerido.');
      }
  }

  // 2. Validaciones específicas por tipo de cuenta
  let validacionEspecifica: ValidacionResult;

  switch (tipoCuenta) {
    case 'nacional':
      validacionEspecifica = validarCLABE(datos.clabe);
      errores.push(...validacionEspecifica.errores);
      break;

    case 'internacional':
      // CORREGIDO: Llama a la función que valida el conjunto completo de datos internacionales
      validacionEspecifica = validarCuentaInternacional(datos);
      errores.push(...validacionEspecifica.errores);
      // CORREGIDO: Se eliminó la validación innecesaria de CLABE aquí.
      break;

    case 'paypal':
      validacionEspecifica = validarCuentaPaypal(datos.emailPaypal);
      errores.push(...validacionEspecifica.errores);
      break;

    default:
      errores.push('Tipo de cuenta no válido.');
  }

  return {
    esValido: errores.length === 0,
    errores,
  };
}