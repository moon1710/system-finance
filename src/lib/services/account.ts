// /lib/services/account.ts
// 🔧 VERSIÓN COMPLETA: Con todos los campos nuevos

import { prisma } from "@/lib/db";
import {
  validarCuentaNacional,
  validarCuentaInternacional,
  validarCuentaPayPal,
  type DatosCuentaBancaria,
  type DireccionCompleta
} from "@/lib/validations/account";

export interface ResultadoOperacion<T = any> {
  exito: boolean;
  mensaje: string;
  data?: T;
  errores?: string[];
}

// 🔧 INTERFAZ COMPLETA ACTUALIZADA
export interface DatosCuenta {
  tipoCuenta: 'nacional' | 'internacional' | 'paypal';
  nombreTitular: string;
  nombreBanco?: string;
  esPredeterminada?: boolean;
  
  // === CUENTAS NACIONALES ===
  clabe?: string;
  tipoCuentaNacional?: 'cheques' | 'ahorros';
  
  // === CUENTAS INTERNACIONALES ===
  numeroCuenta?: string;
  swift?: string;
  codigoABA?: string;
  tipoCuentaInternacional?: 'checking' | 'savings';
  pais?: string;
  
  // === DIRECCIONES ===
  direccionBeneficiario?: DireccionCompleta;
  direccionBanco?: DireccionCompleta;
  
  // === PAYPAL ===
  emailPaypal?: string;
}

/**
 * Crear nueva cuenta bancaria (VERSIÓN COMPLETA)
 */
export async function crearCuentaBancaria(
  userId: string,
  tipoCuenta: string,
  datos: DatosCuenta
): Promise<ResultadoOperacion> {
  try {
    console.log('🔍 [SERVICE] Creando cuenta completa con datos:', {
      tipoCuenta,
      nombreTitular: datos.nombreTitular,
      pais: datos.pais,
      tieneDireccionBeneficiario: !!datos.direccionBeneficiario,
      tieneDireccionBanco: !!datos.direccionBanco
    });

    // 🔧 VALIDAR SEGÚN TIPO DE CUENTA
    let validacionResultado;
    
    switch (tipoCuenta) {
      case 'nacional':
        validacionResultado = validarCuentaNacional({
          tipoCuenta: 'nacional',
          nombreBanco: datos.nombreBanco || '',
          clabe: datos.clabe || '',
          nombreTitular: datos.nombreTitular,
          tipoCuentaNacional: datos.tipoCuentaNacional
        });
        break;
        
      case 'internacional':
        if (!datos.pais || datos.pais.trim().length === 0) {
          return {
            exito: false,
            mensaje: 'El país es requerido para cuentas internacionales',
            errores: ['pais: Campo requerido']
          };
        }
        
        validacionResultado = validarCuentaInternacional({
          tipoCuenta: 'internacional',
          nombreBanco: datos.nombreBanco || '',
          numeroCuenta: datos.numeroCuenta || '',
          swift: datos.swift || '',
          nombreTitular: datos.nombreTitular,
          pais: datos.pais,
          codigoABA: datos.codigoABA,
          tipoCuentaInternacional: datos.tipoCuentaInternacional,
          direccionBeneficiario: datos.direccionBeneficiario,
          direccionBanco: datos.direccionBanco
        });
        break;
        
      case 'paypal':
        validacionResultado = validarCuentaPayPal({
          tipoCuenta: 'paypal',
          emailPaypal: datos.emailPaypal || '',
          nombreTitular: datos.nombreTitular
        });
        break;
        
      default:
        return {
          exito: false,
          mensaje: 'Tipo de cuenta no válido',
          errores: ['tipoCuenta: Debe ser nacional, internacional o paypal']
        };
    }

    if (!validacionResultado.exito) {
      return validacionResultado;
    }

    // 🔧 VERIFICAR SI ES LA PRIMERA CUENTA (será predeterminada)
    const cuentasExistentes = await prisma.cuentaBancaria.count({
      where: { userId }
    });

    const esPrimeraCuenta = cuentasExistentes === 0;

    // 🔧 SI QUIERE SER PREDETERMINADA, DESACTIVAR LAS DEMÁS
    if (datos.esPredeterminada || esPrimeraCuenta) {
      await prisma.cuentaBancaria.updateMany({
        where: { userId },
        data: { esPredeterminada: false }
      });
    }

    // 🔧 CREAR LA CUENTA CON TODOS LOS CAMPOS NUEVOS
    const nuevaCuenta = await prisma.cuentaBancaria.create({
      data: {
        userId,
        tipoCuenta,
        nombreTitular: datos.nombreTitular,
        nombreBanco: datos.nombreBanco,
        esPredeterminada: datos.esPredeterminada || esPrimeraCuenta,
        
        // === CUENTAS NACIONALES ===
        clabe: datos.clabe,
        tipoCuentaNacional: datos.tipoCuentaNacional,
        
        // === CUENTAS INTERNACIONALES ===
        numeroCuenta: datos.numeroCuenta,
        swift: datos.swift,
        codigoABA: datos.codigoABA,
        tipoCuentaInternacional: datos.tipoCuentaInternacional,
        pais: datos.pais,
        
        // === DIRECCIONES DEL BENEFICIARIO ===
        direccionBeneficiario: datos.direccionBeneficiario?.direccion,
        ciudadBeneficiario: datos.direccionBeneficiario?.ciudad,
        estadoBeneficiario: datos.direccionBeneficiario?.estado,
        codigoPostalBeneficiario: datos.direccionBeneficiario?.codigoPostal,
        paisBeneficiario: datos.direccionBeneficiario?.pais,
        
        // === DIRECCIONES DEL BANCO ===
        direccionBanco: datos.direccionBanco?.direccion,
        ciudadBanco: datos.direccionBanco?.ciudad,
        estadoBanco: datos.direccionBanco?.estado,
        codigoPostalBanco: datos.direccionBanco?.codigoPostal,
        paisBanco: datos.direccionBanco?.pais,
        
        // === PAYPAL ===
        emailPaypal: datos.emailPaypal,
      }
    });

    console.log('✅ [SERVICE] Cuenta completa creada exitosamente:', {
      id: nuevaCuenta.id,
      tipoCuenta: nuevaCuenta.tipoCuenta,
      pais: nuevaCuenta.pais,
      tieneDirecciones: !!(nuevaCuenta.direccionBeneficiario || nuevaCuenta.direccionBanco)
    });

    return {
      exito: true,
      mensaje: 'Cuenta bancaria creada exitosamente',
      data: nuevaCuenta
    };

  } catch (error: any) {
    console.error('❌ [SERVICE ERROR] Error creando cuenta completa:', error);

    // 🔧 MANEJAR ERRORES DE UNICIDAD
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[1] || 'cuenta';
      return {
        exito: false,
        mensaje: `Ya existe una cuenta con este ${field}`,
        errores: [`${field}: Ya está registrado`]
      };
    }

    return {
      exito: false,
      mensaje: 'Error al crear la cuenta bancaria',
      errores: [error.message || 'Error desconocido']
    };
  }
}

/**
 * Actualizar cuenta bancaria existente (VERSIÓN COMPLETA)
 */
export async function actualizarCuentaBancaria(
  cuentaId: string,
  datos: DatosCuenta
): Promise<ResultadoOperacion> {
  try {
    console.log('🔍 [SERVICE] Actualizando cuenta completa:', {
      cuentaId,
      tipoCuenta: datos.tipoCuenta,
      pais: datos.pais
    });

    // 🔧 VALIDAR SEGÚN TIPO DE CUENTA (igual que en crear)
    let validacionResultado;
    
    switch (datos.tipoCuenta) {
      case 'nacional':
        validacionResultado = validarCuentaNacional({
          tipoCuenta: 'nacional',
          nombreBanco: datos.nombreBanco || '',
          clabe: datos.clabe || '',
          nombreTitular: datos.nombreTitular,
          tipoCuentaNacional: datos.tipoCuentaNacional
        });
        break;
        
      case 'internacional':
        if (!datos.pais || datos.pais.trim().length === 0) {
          return {
            exito: false,
            mensaje: 'El país es requerido para cuentas internacionales',
            errores: ['pais: Campo requerido']
          };
        }
        
        validacionResultado = validarCuentaInternacional({
          tipoCuenta: 'internacional',
          nombreBanco: datos.nombreBanco || '',
          numeroCuenta: datos.numeroCuenta || '',
          swift: datos.swift || '',
          nombreTitular: datos.nombreTitular,
          pais: datos.pais,
          codigoABA: datos.codigoABA,
          tipoCuentaInternacional: datos.tipoCuentaInternacional,
          direccionBeneficiario: datos.direccionBeneficiario,
          direccionBanco: datos.direccionBanco
        });
        break;
        
      case 'paypal':
        validacionResultado = validarCuentaPayPal({
          tipoCuenta: 'paypal',
          emailPaypal: datos.emailPaypal || '',
          nombreTitular: datos.nombreTitular
        });
        break;
        
      default:
        return {
          exito: false,
          mensaje: 'Tipo de cuenta no válido'
        };
    }

    if (!validacionResultado.exito) {
      return validacionResultado;
    }

    // 🔧 VERIFICAR QUE LA CUENTA EXISTE
    const cuentaExistente = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId }
    });

    if (!cuentaExistente) {
      return {
        exito: false,
        mensaje: 'Cuenta bancaria no encontrada'
      };
    }

    // 🔧 SI QUIERE SER PREDETERMINADA, DESACTIVAR LAS DEMÁS
    if (datos.esPredeterminada) {
      await prisma.cuentaBancaria.updateMany({
        where: {
          userId: cuentaExistente.userId,
          id: { not: cuentaId }
        },
        data: { esPredeterminada: false }
      });
    }

    // 🔧 ACTUALIZAR LA CUENTA CON TODOS LOS CAMPOS NUEVOS
    const cuentaActualizada = await prisma.cuentaBancaria.update({
      where: { id: cuentaId },
      data: {
        tipoCuenta: datos.tipoCuenta,
        nombreTitular: datos.nombreTitular,
        nombreBanco: datos.nombreBanco,
        esPredeterminada: datos.esPredeterminada,
        
        // === CUENTAS NACIONALES ===
        clabe: datos.clabe,
        tipoCuentaNacional: datos.tipoCuentaNacional,
        
        // === CUENTAS INTERNACIONALES ===
        numeroCuenta: datos.numeroCuenta,
        swift: datos.swift,
        codigoABA: datos.codigoABA,
        tipoCuentaInternacional: datos.tipoCuentaInternacional,
        pais: datos.pais,
        
        // === DIRECCIONES DEL BENEFICIARIO ===
        direccionBeneficiario: datos.direccionBeneficiario?.direccion || null,
        ciudadBeneficiario: datos.direccionBeneficiario?.ciudad || null,
        estadoBeneficiario: datos.direccionBeneficiario?.estado || null,
        codigoPostalBeneficiario: datos.direccionBeneficiario?.codigoPostal || null,
        paisBeneficiario: datos.direccionBeneficiario?.pais || null,
        
        // === DIRECCIONES DEL BANCO ===
        direccionBanco: datos.direccionBanco?.direccion || null,
        ciudadBanco: datos.direccionBanco?.ciudad || null,
        estadoBanco: datos.direccionBanco?.estado || null,
        codigoPostalBanco: datos.direccionBanco?.codigoPostal || null,
        paisBanco: datos.direccionBanco?.pais || null,
        
        // === PAYPAL ===
        emailPaypal: datos.emailPaypal,
      }
    });

    console.log('✅ [SERVICE] Cuenta completa actualizada exitosamente:', {
      id: cuentaActualizada.id,
      tipoCuenta: cuentaActualizada.tipoCuenta
    });

    return {
      exito: true,
      mensaje: 'Cuenta bancaria actualizada exitosamente',
      data: cuentaActualizada
    };

  } catch (error: any) {
    console.error('❌ [SERVICE ERROR] Error actualizando cuenta completa:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[1] || 'cuenta';
      return {
        exito: false,
        mensaje: `Ya existe una cuenta con este ${field}`,
        errores: [`${field}: Ya está registrado`]
      };
    }

    return {
      exito: false,
      mensaje: 'Error al actualizar la cuenta bancaria',
      errores: [error.message || 'Error desconocido']
    };
  }
}

/**
 * Obtener cuentas bancarias de un usuario (sin cambios - compatible)
 */
export async function obtenerCuentasPorUsuario(userId: string): Promise<ResultadoOperacion> {
  try {
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { userId },
      orderBy: [
        { esPredeterminada: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return {
      exito: true,
      mensaje: 'Cuentas obtenidas exitosamente',
      data: cuentas
    };

  } catch (error: any) {
    console.error('❌ [SERVICE ERROR] Error obteniendo cuentas:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener las cuentas bancarias',
      errores: [error.message || 'Error desconocido']
    };
  }
}

/**
 * Eliminar cuenta bancaria (sin cambios)
 */
export async function eliminarCuentaBancaria(cuentaId: string): Promise<ResultadoOperacion> {
  try {
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId }
    });

    if (!cuenta) {
      return {
        exito: false,
        mensaje: 'Cuenta bancaria no encontrada'
      };
    }

    const retirosAsociados = await prisma.retiro.count({
      where: { cuentaBancariaId: cuentaId }
    });

    if (retirosAsociados > 0) {
      return {
        exito: false,
        mensaje: 'No se puede eliminar una cuenta con retiros asociados'
      };
    }

    await prisma.cuentaBancaria.delete({
      where: { id: cuentaId }
    });

    if (cuenta.esPredeterminada) {
      const otraCuenta = await prisma.cuentaBancaria.findFirst({
        where: { userId: cuenta.userId }
      });

      if (otraCuenta) {
        await prisma.cuentaBancaria.update({
          where: { id: otraCuenta.id },
          data: { esPredeterminada: true }
        });
      }
    }

    console.log('✅ [SERVICE] Cuenta eliminada:', cuentaId);

    return {
      exito: true,
      mensaje: 'Cuenta bancaria eliminada exitosamente'
    };

  } catch (error: any) {
    console.error('❌ [SERVICE ERROR] Error eliminando cuenta:', error);
    return {
      exito: false,
      mensaje: 'Error al eliminar la cuenta bancaria',
      errores: [error.message || 'Error desconocido']
    };
  }
}

/**
 * Establecer cuenta como predeterminada (sin cambios)
 */
export async function establecerCuentaPredeterminada(
  userId: string,
  cuentaId: string
): Promise<ResultadoOperacion> {
  try {
    await prisma.cuentaBancaria.updateMany({
      where: { userId },
      data: { esPredeterminada: false }
    });

    const cuentaActualizada = await prisma.cuentaBancaria.update({
      where: { id: cuentaId },
      data: { esPredeterminada: true }
    });

    console.log('✅ [SERVICE] Cuenta predeterminada establecida:', cuentaId);

    return {
      exito: true,
      mensaje: 'Cuenta establecida como predeterminada',
      data: cuentaActualizada
    };

  } catch (error: any) {
    console.error('❌ [SERVICE ERROR] Error estableciendo cuenta predeterminada:', error);
    return {
      exito: false,
      mensaje: 'Error al establecer cuenta predeterminada',
      errores: [error.message || 'Error desconocido']
    };
  }
}