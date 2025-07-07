// /lib/validations/account.ts

/**
 * Tipos para validación de cuentas bancarias
 */
export interface ValidacionResult {
    esValido: boolean;
    errores: string[];
  }
  
  /**
   * Validar cuenta nacional (USA)
   * @param numeroRuta - Routing number de 9 dígitos
   * @param numeroCuenta - Número de cuenta
   */
  export function validarCuentaNacional(
    numeroRuta: string,
    numeroCuenta: string
  ): ValidacionResult {
    const errores: string[] = [];
  
    // Validar routing number
    if (!numeroRuta || numeroRuta.trim() === '') {
      errores.push('El número de ruta es requerido');
    } else if (!/^\d{9}$/.test(numeroRuta.trim())) {
      errores.push('El número de ruta debe tener exactamente 9 dígitos');
    }
  
    // Validar número de cuenta
    if (!numeroCuenta || numeroCuenta.trim() === '') {
      errores.push('El número de cuenta es requerido');
    } else if (numeroCuenta.trim().length < 4 || numeroCuenta.trim().length > 20) {
      errores.push('El número de cuenta debe tener entre 4 y 20 caracteres');
    } else if (!/^\d+$/.test(numeroCuenta.trim())) {
      errores.push('El número de cuenta solo debe contener dígitos');
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar cuenta internacional
   * @param swift - Código SWIFT (8 o 11 caracteres)
   * @param numeroCuenta - Número de cuenta
   */
  export function validarCuentaInternacional(
    swift: string,
    numeroCuenta: string
  ): ValidacionResult {
    const errores: string[] = [];
  
    // Validar SWIFT
    if (!swift || swift.trim() === '') {
      errores.push('El código SWIFT es requerido');
    } else {
      const swiftLimpio = swift.trim().toUpperCase();
      if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftLimpio)) {
        errores.push('El código SWIFT debe tener 8 o 11 caracteres en formato válido');
      }
    }
  
    // Validar número de cuenta
    if (!numeroCuenta || numeroCuenta.trim() === '') {
      errores.push('El número de cuenta es requerido');
    } else if (numeroCuenta.trim().length < 8 || numeroCuenta.trim().length > 30) {
      errores.push('El número de cuenta debe tener entre 8 y 30 caracteres');
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar cuenta PayPal
   * @param email - Email de PayPal
   */
  export function validarCuentaPaypal(email: string): ValidacionResult {
    const errores: string[] = [];
  
    if (!email || email.trim() === '') {
      errores.push('El email de PayPal es requerido');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errores.push('El formato del email no es válido');
      }
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar CLABE (México) - 18 dígitos con dígito verificador
   * @param clabe - Número CLABE de 18 dígitos
   */
  export function validarCLABE(clabe: string): ValidacionResult {
    const errores: string[] = [];
  
    if (!clabe || clabe.trim() === '') {
      errores.push('La CLABE es requerida');
      return { esValido: false, errores };
    }
  
    const clabeLimpia = clabe.trim();
  
    // Verificar que sean exactamente 18 dígitos
    if (!/^\d{18}$/.test(clabeLimpia)) {
      errores.push('La CLABE debe tener exactamente 18 dígitos');
      return { esValido: false, errores };
    }
  
    // Validar dígito verificador usando algoritmo bancario mexicano
    const digitosVerificacion = clabeLimpia.substring(0, 17);
    const digitoVerificador = parseInt(clabeLimpia.charAt(17));
  
    let suma = 0;
    const pesos = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  
    for (let i = 0; i < 17; i++) {
      suma += parseInt(digitosVerificacion.charAt(i)) * pesos[i];
    }
  
    const residuo = suma % 10;
    const digitoCalculado = residuo === 0 ? 0 : 10 - residuo;
  
    if (digitoCalculado !== digitoVerificador) {
      errores.push('La CLABE no es válida (dígito verificador incorrecto)');
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar datos según el tipo de cuenta
   * @param tipoCuenta - Tipo de cuenta ('nacional', 'internacional', 'paypal')
   * @param datos - Datos específicos del tipo de cuenta
   */
  export function validarDatosCuenta(
    tipoCuenta: string,
    datos: {
      numeroRuta?: string;
      numeroCuenta?: string;
      swift?: string;
      emailPaypal?: string;
      clabe?: string;
      nombreBanco?: string;
      nombreTitular: string;
    }
  ): ValidacionResult {
    const errores: string[] = [];
  
    // Validar nombre del titular (común para todos)
    if (!datos.nombreTitular || datos.nombreTitular.trim() === '') {
      errores.push('El nombre del titular es requerido');
    } else if (datos.nombreTitular.trim().length < 2) {
      errores.push('El nombre del titular debe tener al menos 2 caracteres');
    }
  
    // Validaciones específicas por tipo
    let validacionEspecifica: ValidacionResult;
  
    switch (tipoCuenta) {
      case 'nacional':
        if (!datos.clabe) {
          errores.push('CLABE es requerida para cuentas nacionales (México)');
          break;
        }
        validacionEspecifica = validarCLABE(datos.clabe);
        errores.push(...validacionEspecifica.errores);
        break;
  
      case 'internacional':
        if (!datos.swift || !datos.numeroCuenta) {
          errores.push('SWIFT y número de cuenta son requeridos para cuentas internacionales');
          break;
        }
        validacionEspecifica = validarCuentaInternacional(datos.swift, datos.numeroCuenta);
        errores.push(...validacionEspecifica.errores);
        
        // Validar CLABE si es México
        if (datos.clabe) {
          const validacionCLABE = validarCLABE(datos.clabe);
          errores.push(...validacionCLABE.errores);
        }
        break;
  
      case 'paypal':
        if (!datos.emailPaypal) {
          errores.push('El email de PayPal es requerido');
          break;
        }
        validacionEspecifica = validarCuentaPaypal(datos.emailPaypal);
        errores.push(...validacionEspecifica.errores);
        break;
  
      default:
        errores.push('Tipo de cuenta no válido');
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }