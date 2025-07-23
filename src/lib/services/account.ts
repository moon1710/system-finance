// /lib/services/account.ts - VERSIÓN CORREGIDA FINAL
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

// Interfaz para direcciones
interface DireccionCompleta {
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  pais: string;
}

// Interfaz COMPLETA para datos de cuenta
export interface DatosCuenta {
  tipoCuenta?: 'nacional' | 'internacional' | 'paypal';
  nombreTitular: string;
  esPredeterminada?: boolean;
  
  // Campos opcionales según el tipo
  nombreBanco?: string | null;
  clabe?: string | null;
  tipoCuentaNacional?: string | null;
  numeroCuenta?: string | null;
  swift?: string | null;
  codigoABA?: string | null;
  tipoCuentaInternacional?: string | null;
  pais?: string | null;
  emailPaypal?: string | null;
  
  // Direcciones
  direccionBeneficiario?: DireccionCompleta | null;
  direccionBanco?: DireccionCompleta | null;
}

/**
 * Crear nueva cuenta bancaria - VERSIÓN CORREGIDA
 */
export async function crearCuentaBancaria(
  userId: string,
  tipoCuenta: string,
  datos: DatosCuenta
): Promise<ResultadoOperacion> {
  try {
    console.log('🔍 [SERVICE] Creando cuenta con datos:', {
      tipoCuenta,
      nombreTitular: datos.nombreTitular,
      pais: datos.pais,
      tieneDirBeneficiario: !!datos.direccionBeneficiario,
      tieneDirBanco: !!datos.direccionBanco
    });

    // 🔧 VALIDAR SEGÚN TIPO DE CUENTA
    let validacionResultado;
    
    switch (tipoCuenta) {
      case 'nacional':
        if (!datos.nombreBanco || !datos.clabe) {
          return {
            exito: false,
            mensaje: 'Faltan datos requeridos para cuenta nacional',
            errores: ['Se requiere nombre del banco y CLABE']
          };
        }
        
        validacionResultado = validarCuentaNacional({
          nombreBanco: datos.nombreBanco,
          clabe: datos.clabe,
          nombreTitular: datos.nombreTitular
        });
        break;
        
      case 'internacional':
        if (!datos.pais || !datos.nombreBanco || !datos.numeroCuenta || !datos.swift) {
          return {
            exito: false,
            mensaje: 'Faltan datos requeridos para cuenta internacional',
            errores: ['Se requiere país, banco, número de cuenta y SWIFT']
          };
        }
        
validacionResultado = validarCuentaInternacional({
  nombreBanco: datos.nombreBanco,
  numeroCuenta: datos.numeroCuenta,
  swift: datos.swift,
  nombreTitular: datos.nombreTitular,
  pais: datos.pais
});
        break;
        
      case 'paypal':
        if (!datos.emailPaypal) {
          return {
            exito: false,
            mensaje: 'Falta email de PayPal',
            errores: ['Se requiere email de PayPal']
          };
        }
        
        validacionResultado = validarCuentaPayPal({
          emailPaypal: datos.emailPaypal,
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

    // 🔧 VERIFICAR SI ES LA PRIMERA CUENTA
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

    // 🔧 PREPARAR DATOS PARA PRISMA
    const datosParaPrisma: any = {
      userId,
      tipoCuenta,
      nombreTitular: datos.nombreTitular,
      esPredeterminada: datos.esPredeterminada || esPrimeraCuenta,
      
      // Campos básicos (siempre incluir, aunque sean null)
      nombreBanco: datos.nombreBanco,
      clabe: datos.clabe,
      tipoCuentaNacional: datos.tipoCuentaNacional,
      numeroCuenta: datos.numeroCuenta,
      swift: datos.swift,
      codigoABA: datos.codigoABA,
      tipoCuentaInternacional: datos.tipoCuentaInternacional,
      pais: datos.pais,
      emailPaypal: datos.emailPaypal,
    };

    // Agregar direcciones solo si existen
    if (datos.direccionBeneficiario) {
      datosParaPrisma.direccionBeneficiario = datos.direccionBeneficiario.direccion;
      datosParaPrisma.ciudadBeneficiario = datos.direccionBeneficiario.ciudad;
      datosParaPrisma.estadoBeneficiario = datos.direccionBeneficiario.estado;
      datosParaPrisma.codigoPostalBeneficiario = datos.direccionBeneficiario.codigoPostal;
      datosParaPrisma.paisBeneficiario = datos.direccionBeneficiario.pais;
    }

    if (datos.direccionBanco) {
      datosParaPrisma.direccionBanco = datos.direccionBanco.direccion;
      datosParaPrisma.ciudadBanco = datos.direccionBanco.ciudad;
      datosParaPrisma.estadoBanco = datos.direccionBanco.estado;
      datosParaPrisma.codigoPostalBanco = datos.direccionBanco.codigoPostal;
      datosParaPrisma.paisBanco = datos.direccionBanco.pais;
    }

    console.log('🔍 [SERVICE] Datos para Prisma:', datosParaPrisma);

    // 🔧 CREAR LA CUENTA
    const nuevaCuenta = await prisma.cuentaBancaria.create({
      data: datosParaPrisma
    });

    console.log('✅ [SERVICE] Cuenta creada exitosamente:', {
      id: nuevaCuenta.id,
      tipoCuenta: nuevaCuenta.tipoCuenta
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
      const constraint = error.meta?.target || ['campo desconocido'];
      let mensaje = 'Ya existe una cuenta con estos datos';
      
      if (constraint.includes('clabe')) {
        mensaje = 'Ya existe una cuenta con esta CLABE';
      } else if (constraint.includes('email_paypal')) {
        mensaje = 'Ya existe una cuenta con este email de PayPal';
      } else if (constraint.includes('numero_cuenta')) {
        mensaje = 'Ya existe una cuenta con este número de cuenta';
      }
      
      return {
        exito: false,
        mensaje,
        errores: [mensaje]
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
 * Obtener cuentas bancarias de un usuario (sin cambios)
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