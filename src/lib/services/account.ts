// /lib/services/account.ts
// 🔧 VERSIÓN SIMPLE: Con campo país pero sin restricciones específicas

import { prisma } from "@/lib/db";
import { 
  validarCuentaNacional, 
  validarCuentaInternacional, 
  validarCuentaPayPal,
  type DatosCuentaBancaria 
} from "@/lib/validations/account";

export interface ResultadoOperacion<T = any> {
  exito: boolean;
  mensaje: string;
  data?: T;
  errores?: string[];
}

// 🔧 INTERFAZ ACTUALIZADA con campo país
export interface DatosCuenta {
  tipoCuenta: 'nacional' | 'internacional' | 'paypal';
  nombreBanco?: string;
  clabe?: string;
  numeroRuta?: string;        // ABA/Routing para USA
  numeroCuenta?: string;      // O IBAN internacional
  iban?: string;              // IBAN internacional
  swift?: string;
  emailPaypal?: string;
  nombreTitular: string;
  direccionTitular?: string;  // dirección completa del titular (internacional)
  direccionBanco?: string;    // dirección del banco (internacional)
  paisBanco?: string;         // país del banco (internacional)
  pais?: string;
  abaRouting?: string;        // ABA/routing (solo USA)
  esPredeterminada?: boolean;
}

/**
 * Crear nueva cuenta bancaria
 */
export async function crearCuentaBancaria(
  userId: string,
  tipoCuenta: string,
  datos: DatosCuenta
): Promise<ResultadoOperacion> {
  try {
    console.log('🔍 [SERVICE] Creando cuenta con datos:', {
      tipoCuenta,
      pais: datos.pais,
      nombreTitular: datos.nombreTitular
    });

    // 🔧 VALIDAR SEGÚN TIPO DE CUENTA
    let validacionResultado;
    
    switch (tipoCuenta) {
      case 'nacional':
        validacionResultado = validarCuentaNacional({
          nombreBanco: datos.nombreBanco || '',
          clabe: datos.clabe || '',
          nombreTitular: datos.nombreTitular
        });
        break;
        
      case 'internacional':
        // ✅ VALIDAR QUE INCLUYA EL PAÍS (SIN RESTRICCIONES ESPECÍFICAS)
        if (!datos.pais || datos.pais.trim().length === 0) {
          return {
            exito: false,
            mensaje: 'El país es requerido para cuentas internacionales',
            errores: ['pais: Campo requerido']
          };
        }
        
        validacionResultado = validarCuentaInternacional({
          nombreBanco: datos.nombreBanco || '',
          numeroCuenta: datos.numeroCuenta || '',
          swift: datos.swift || '',
          nombreTitular: datos.nombreTitular,
          pais: datos.pais // ✅ PASAR EL PAÍS
        });
        break;
        
      case 'paypal':
        validacionResultado = validarCuentaPayPal({
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

    // 🔧 CREAR LA CUENTA CON TODOS LOS CAMPOS
    const nuevaCuenta = await prisma.cuentaBancaria.create({
      data: {
        userId,
        tipoCuenta,
        nombreBanco: datos.nombreBanco,
        clabe: datos.clabe,
        numeroRuta: datos.numeroRuta,
        numeroCuenta: datos.numeroCuenta,
        iban: datos.iban,            
        swift: datos.swift,
        emailPaypal: datos.emailPaypal,
        nombreTitular: datos.nombreTitular,
        direccionTitular: datos.direccionTitular, 
        direccionBanco: datos.direccionBanco,  
        paisBanco: datos.paisBanco,  
        pais: datos.pais,
        abaRouting: datos.abaRouting,
        esPredeterminada: datos.esPredeterminada || esPrimeraCuenta
      }
    });

    console.log('✅ [SERVICE] Cuenta creada exitosamente:', {
      id: nuevaCuenta.id,
      tipoCuenta: nuevaCuenta.tipoCuenta,
      pais: nuevaCuenta.pais
    });

    return {
      exito: true,
      mensaje: 'Cuenta bancaria creada exitosamente',
      data: nuevaCuenta
    };

  } catch (error: any) {
    console.error('❌ [SERVICE ERROR] Error creando cuenta:', error);

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
 * Actualizar cuenta bancaria existente
 */
export async function actualizarCuentaBancaria(
  cuentaId: string,
  datos: DatosCuenta
): Promise<ResultadoOperacion> {
  try {
    console.log('🔍 [SERVICE] Actualizando cuenta:', {
      cuentaId,
      tipoCuenta: datos.tipoCuenta,
      pais: datos.pais
    });

    // 🔧 VALIDAR SEGÚN TIPO DE CUENTA
    let validacionResultado;
    
    switch (datos.tipoCuenta) {
      case 'nacional':
        validacionResultado = validarCuentaNacional({
          nombreBanco: datos.nombreBanco || '',
          clabe: datos.clabe || '',
          nombreTitular: datos.nombreTitular
        });
        break;
        
      case 'internacional':
        // ✅ VALIDAR QUE INCLUYA EL PAÍS (SIN RESTRICCIONES ESPECÍFICAS)
        if (!datos.pais || datos.pais.trim().length === 0) {
          return {
            exito: false,
            mensaje: 'El país es requerido para cuentas internacionales',
            errores: ['pais: Campo requerido']
          };
        }
        
        validacionResultado = validarCuentaInternacional({
          nombreBanco: datos.nombreBanco || '',
          numeroCuenta: datos.numeroCuenta || '',
          swift: datos.swift || '',
          nombreTitular: datos.nombreTitular,
          pais: datos.pais // ✅ INCLUIR EL PAÍS
        });
        break;
        
      case 'paypal':
        validacionResultado = validarCuentaPayPal({
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

    // 🔧 ACTUALIZAR LA CUENTA CON TODOS LOS CAMPOS
  const cuentaActualizada = await prisma.cuentaBancaria.update({
    where: { id: cuentaId },
    data: {
      tipoCuenta: datos.tipoCuenta,
      nombreBanco: datos.nombreBanco,
      clabe: datos.clabe,
      numeroRuta: datos.numeroRuta,
      numeroCuenta: datos.numeroCuenta,
      iban: datos.iban,                  // Añade esto
      swift: datos.swift,
      emailPaypal: datos.emailPaypal,
      nombreTitular: datos.nombreTitular,
      direccionTitular: datos.direccionTitular, // Añade esto
      direccionBanco: datos.direccionBanco,     // Añade esto
      paisBanco: datos.paisBanco,               // Añade esto
      pais: datos.pais,
      abaRouting: datos.abaRouting,             // Añade esto
      esPredeterminada: datos.esPredeterminada
    }
  });

    console.log('✅ [SERVICE] Cuenta actualizada exitosamente:', {
      id: cuentaActualizada.id,
      tipoCuenta: cuentaActualizada.tipoCuenta,
      pais: cuentaActualizada.pais
    });

    return {
      exito: true,
      mensaje: 'Cuenta bancaria actualizada exitosamente',
      data: cuentaActualizada
    };

  } catch (error: any) {
    console.error('❌ [SERVICE ERROR] Error actualizando cuenta:', error);

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
 * Obtener cuentas bancarias de un usuario
 */
export async function obtenerCuentasPorUsuario(userId: string): Promise<ResultadoOperacion> {
  try {
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { userId },
      orderBy: [
        { esPredeterminada: 'desc' }, // Predeterminada primero
        { createdAt: 'desc' }         // Más recientes primero
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
 * Eliminar cuenta bancaria
 */
export async function eliminarCuentaBancaria(cuentaId: string): Promise<ResultadoOperacion> {
  try {
    // 🔧 VERIFICAR QUE LA CUENTA EXISTE
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId }
    });

    if (!cuenta) {
      return {
        exito: false,
        mensaje: 'Cuenta bancaria no encontrada'
      };
    }

    // 🔧 NO PERMITIR ELIMINAR SI TIENE RETIROS ASOCIADOS
    const retirosAsociados = await prisma.retiro.count({
      where: { cuentaBancariaId: cuentaId }
    });

    if (retirosAsociados > 0) {
      return {
        exito: false,
        mensaje: 'No se puede eliminar una cuenta con retiros asociados'
      };
    }

    // 🔧 ELIMINAR LA CUENTA
    await prisma.cuentaBancaria.delete({
      where: { id: cuentaId }
    });

    // 🔧 SI ERA PREDETERMINADA, ASIGNAR A OTRA CUENTA
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
 * Establecer cuenta como predeterminada
 */
export async function establecerCuentaPredeterminada(
  userId: string, 
  cuentaId: string
): Promise<ResultadoOperacion> {
  try {
    // 🔧 DESACTIVAR TODAS LAS CUENTAS DEL USUARIO
    await prisma.cuentaBancaria.updateMany({
      where: { userId },
      data: { esPredeterminada: false }
    });

    // 🔧 ACTIVAR LA CUENTA SELECCIONADA
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