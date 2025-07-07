// /lib/validations/retiros.ts

/**
 * Tipos para validación de retiros
 */
export interface ValidacionResult {
    esValido: boolean;
    errores: string[];
  }
  
  export interface DatosRetiro {
    monto: number;
    cuentaId: string;
    notas?: string;
  }
  
  /**
   * Validar monto mínimo ($100 USD)
   * @param monto - Monto del retiro en USD
   */
  export function validarMontoMinimo(monto: number): ValidacionResult {
    const errores: string[] = [];
    const MONTO_MINIMO = 100;
  
    if (!monto && monto !== 0) {
      errores.push('El monto es requerido');
    } else if (typeof monto !== 'number' || isNaN(monto)) {
      errores.push('El monto debe ser un número válido');
    } else if (monto <= 0) {
      errores.push('El monto debe ser mayor a cero');
    } else if (monto < MONTO_MINIMO) {
      errores.push(`El monto mínimo es $${MONTO_MINIMO} USD`);
    } else if (monto > 999999.99) {
      errores.push('El monto máximo es $999,999.99 USD');
    }
  
    // Validar que tenga máximo 2 decimales
    const montoStr = monto.toString();
    if (montoStr.includes('.')) {
      const decimales = montoStr.split('.')[1];
      if (decimales.length > 2) {
        errores.push('El monto no puede tener más de 2 decimales');
      }
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar datos generales del retiro
   * @param datos - Datos del retiro a validar
   */
  export function validarDatosRetiro(datos: DatosRetiro): ValidacionResult {
    const errores: string[] = [];
  
    // Validar monto
    const validacionMonto = validarMontoMinimo(datos.monto);
    errores.push(...validacionMonto.errores);
  
    // Validar cuenta bancaria ID
    if (!datos.cuentaId || datos.cuentaId.trim() === '') {
      errores.push('Debe seleccionar una cuenta bancaria');
    } else if (datos.cuentaId.trim().length < 10) {
      errores.push('ID de cuenta bancaria no válido');
    }
  
    // Validar notas (opcional)
    if (datos.notas && datos.notas.length > 500) {
      errores.push('Las notas no pueden exceder 500 caracteres');
    }
  
    // Sanitizar notas para evitar caracteres peligrosos
    if (datos.notas) {
      const caracteresProhibidos = /<script|javascript:|on\w+=/i;
      if (caracteresProhibidos.test(datos.notas)) {
        errores.push('Las notas contienen caracteres no permitidos');
      }
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Determinar si un monto requiere revisión especial
   * @param monto - Monto del retiro
   */
  export function requiereRevisionEspecial(monto: number): {
    requiere: boolean;
    motivos: string[];
  } {
    const motivos: string[] = [];
    const MONTO_ALTO = 50000; // $50,000 USD
  
    if (monto >= MONTO_ALTO) {
      motivos.push('Monto alto (≥$50,000 USD)');
    }
  
    return {
      requiere: motivos.length > 0,
      motivos
    };
  }
  
  /**
   * Validar estado de retiro
   * @param estado - Estado del retiro
   */
  export function validarEstadoRetiro(estado: string): ValidacionResult {
    const errores: string[] = [];
    const estadosValidos = ['Pendiente', 'Procesando', 'Completado', 'Rechazado'];
  
    if (!estado || estado.trim() === '') {
      errores.push('El estado es requerido');
    } else if (!estadosValidos.includes(estado)) {
      errores.push(`Estado no válido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar transición de estados
   * @param estadoActual - Estado actual del retiro
   * @param nuevoEstado - Nuevo estado deseado
   */
  export function validarTransicionEstado(
    estadoActual: string,
    nuevoEstado: string
  ): ValidacionResult {
    const errores: string[] = [];
  
    // Definir transiciones válidas
    const transicionesValidas: Record<string, string[]> = {
      'Pendiente': ['Procesando', 'Rechazado'],
      'Procesando': ['Completado', 'Rechazado'],
      'Completado': [], // No se puede cambiar desde completado
      'Rechazado': [] // No se puede cambiar desde rechazado
    };
  
    if (!transicionesValidas[estadoActual]) {
      errores.push('Estado actual no válido');
    } else if (!transicionesValidas[estadoActual].includes(nuevoEstado)) {
      errores.push(`No se puede cambiar de "${estadoActual}" a "${nuevoEstado}"`);
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar motivo de rechazo
   * @param motivo - Motivo del rechazo
   */
  export function validarMotivoRechazo(motivo: string): ValidacionResult {
    const errores: string[] = [];
  
    if (!motivo || motivo.trim() === '') {
      errores.push('El motivo de rechazo es requerido');
    } else if (motivo.trim().length < 10) {
      errores.push('El motivo debe tener al menos 10 caracteres');
    } else if (motivo.length > 1000) {
      errores.push('El motivo no puede exceder 1000 caracteres');
    }
  
    // Sanitizar motivo
    const caracteresProhibidos = /<script|javascript:|on\w+=/i;
    if (caracteresProhibidos.test(motivo)) {
      errores.push('El motivo contiene caracteres no permitidos');
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar archivo de comprobante
   * @param archivo - Información del archivo
   */
  export function validarComprobante(archivo: {
    name: string;
    size: number;
    type: string;
  }): ValidacionResult {
    const errores: string[] = [];
    
    // Tipos de archivo permitidos
    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png'
    ];
  
    // Extensiones permitidas
    const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];
  
    if (!archivo.name || archivo.name.trim() === '') {
      errores.push('El archivo es requerido');
    } else {
      // Validar extensión
      const extension = archivo.name.toLowerCase().substring(archivo.name.lastIndexOf('.'));
      if (!extensionesPermitidas.includes(extension)) {
        errores.push('Formato de archivo no válido. Use: PDF, JPG, JPEG, PNG');
      }
  
      // Validar tipo MIME
      if (!tiposPermitidos.includes(archivo.type)) {
        errores.push('Tipo de archivo no válido');
      }
  
      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (archivo.size > maxSize) {
        errores.push('El archivo no puede exceder 5MB');
      }
  
      // Validar que el archivo no esté vacío
      if (archivo.size === 0) {
        errores.push('El archivo está vacío');
      }
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Validar límite de retiros por mes
   * @param cantidadRetiros - Cantidad actual de retiros en el mes
   * @param limite - Límite máximo (por defecto 10)
   */
  export function validarLimiteRetirosMes(
    cantidadRetiros: number,
    limite: number = 10
  ): ValidacionResult {
    const errores: string[] = [];
  
    if (cantidadRetiros >= limite) {
      errores.push(`Has alcanzado el límite de ${limite} retiros por mes`);
    }
  
    return {
      esValido: errores.length === 0,
      errores
    };
  }
  
  /**
   * Obtener alertas para un retiro
   * @param monto - Monto del retiro
   * @param cantidadRetirosDelMes - Cantidad de retiros en el mes actual
   */
  export function obtenerAlertasRetiro(
    monto: number,
    cantidadRetirosDelMes: number
  ): string[] {
    const alertas: string[] = [];
  
    // Alerta por monto alto
    if (monto >= 50000) {
      alertas.push('Monto alto (≥$50,000 USD)');
    }
  
    // Alerta por múltiples retiros
    if (cantidadRetirosDelMes >= 2) {
      alertas.push(`Retiro múltiple (${cantidadRetirosDelMes + 1}° del mes)`);
    }
  
    return alertas;
  }