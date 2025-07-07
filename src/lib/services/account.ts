// /lib/services/account.ts

import { PrismaClient } from '@prisma/client'
import { validarDatosCuenta } from '@/lib/validations/account'

const prisma = new PrismaClient()

/**
 * Tipos para el servicio de cuentas
 */
export interface DatosCuentaBancaria {
  tipoCuenta: 'nacional' | 'internacional' | 'paypal';
  nombreBanco?: string;
  clabe?: string;
  numeroRuta?: string;
  numeroCuenta?: string;
  swift?: string;
  emailPaypal?: string;
  nombreTitular: string;
  esPredeterminada?: boolean;
}

export interface ResultadoOperacion {
  exito: boolean;
  mensaje: string;
  data?: any;
  errores?: string[];
}

/**
 * Crear nueva cuenta bancaria
 * @param userId - ID del usuario
 * @param tipoCuenta - Tipo de cuenta
 * @param datos - Datos de la cuenta
 */
export async function crearCuentaBancaria(
  userId: string,
  tipoCuenta: 'nacional' | 'internacional' | 'paypal',
  datos: DatosCuentaBancaria
): Promise<ResultadoOperacion> {
  try {
    // Validar datos
    const validacion = validarDatosCuenta(tipoCuenta, datos);
    if (!validacion.esValido) {
      return {
        exito: false,
        mensaje: 'Datos de cuenta no válidos',
        errores: validacion.errores
      };
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!usuario) {
      return {
        exito: false,
        mensaje: 'Usuario no encontrado'
      };
    }

    // Si es la primera cuenta o se marca como predeterminada, será la predeterminada
    const cuentasExistentes = await prisma.cuentaBancaria.count({
      where: { userId }
    });

    const esPredeterminada = datos.esPredeterminada || cuentasExistentes === 0;

    // Si se marca como predeterminada, desmarcar las demás
    if (esPredeterminada) {
      await prisma.cuentaBancaria.updateMany({
        where: { userId, esPredeterminada: true },
        data: { esPredeterminada: false }
      });
    }

    // Crear la cuenta
    const nuevaCuenta = await prisma.cuentaBancaria.create({
      data: {
        userId,
        tipoCuenta,
        nombreBanco: datos.nombreBanco,
        clabe: datos.clabe,
        numeroRuta: datos.numeroRuta,
        numeroCuenta: datos.numeroCuenta,
        swift: datos.swift,
        emailPaypal: datos.emailPaypal,
        nombreTitular: datos.nombreTitular,
        esPredeterminada
      }
    });

    return {
      exito: true,
      mensaje: 'Cuenta bancaria creada exitosamente',
      data: nuevaCuenta
    };

  } catch (error: any) {
    // Manejar errores de unicidad
    if (error.code === 'P2002') {
      return {
        exito: false,
        mensaje: 'Ya existe una cuenta con estos datos para este usuario'
      };
    }

    console.error('Error al crear cuenta bancaria:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Obtener todas las cuentas de un usuario
 * @param userId - ID del usuario
 */
export async function obtenerCuentasPorUsuario(userId: string): Promise<ResultadoOperacion> {
  try {
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { userId },
      orderBy: [
        { esPredeterminada: 'desc' }, // Predeterminada primero
        { createdAt: 'desc' }        // Más recientes después
      ]
    });

    return {
      exito: true,
      mensaje: 'Cuentas obtenidas exitosamente',
      data: cuentas
    };

  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener las cuentas bancarias'
    };
  }
}

/**
 * Actualizar cuenta bancaria
 * @param cuentaId - ID de la cuenta
 * @param datos - Nuevos datos
 */
export async function actualizarCuentaBancaria(
  cuentaId: string,
  datos: Partial<DatosCuentaBancaria>
): Promise<ResultadoOperacion> {
  try {
    // Verificar que la cuenta existe
    const cuentaExistente = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId }
    });

    if (!cuentaExistente) {
      return {
        exito: false,
        mensaje: 'Cuenta bancaria no encontrada'
      };
    }

    // Si se cambian datos críticos, validar
    const datosCombinados = {
      tipoCuenta: datos.tipoCuenta || cuentaExistente.tipoCuenta,
      nombreBanco: datos.nombreBanco || cuentaExistente.nombreBanco,
      clabe: datos.clabe || cuentaExistente.clabe,
      numeroRuta: datos.numeroRuta || cuentaExistente.numeroRuta,
      numeroCuenta: datos.numeroCuenta || cuentaExistente.numeroCuenta,
      swift: datos.swift || cuentaExistente.swift,
      emailPaypal: datos.emailPaypal || cuentaExistente.emailPaypal,
      nombreTitular: datos.nombreTitular || cuentaExistente.nombreTitular,
    };

    const validacion = validarDatosCuenta(
      datosCombinados.tipoCuenta as any,
      datosCombinados
    );

    if (!validacion.esValido) {
      return {
        exito: false,
        mensaje: 'Datos de cuenta no válidos',
        errores: validacion.errores
      };
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (datos.esPredeterminada) {
      await prisma.cuentaBancaria.updateMany({
        where: { 
          userId: cuentaExistente.userId, 
          esPredeterminada: true,
          id: { not: cuentaId }
        },
        data: { esPredeterminada: false }
      });
    }

    // Actualizar la cuenta
    const cuentaActualizada = await prisma.cuentaBancaria.update({
      where: { id: cuentaId },
      data: {
        tipoCuenta: datos.tipoCuenta,
        nombreBanco: datos.nombreBanco,
        clabe: datos.clabe,
        numeroRuta: datos.numeroRuta,
        numeroCuenta: datos.numeroCuenta,
        swift: datos.swift,
        emailPaypal: datos.emailPaypal,
        nombreTitular: datos.nombreTitular,
        esPredeterminada: datos.esPredeterminada
      }
    });

    return {
      exito: true,
      mensaje: 'Cuenta bancaria actualizada exitosamente',
      data: cuentaActualizada
    };

  } catch (error: any) {
    if (error.code === 'P2002') {
      return {
        exito: false,
        mensaje: 'Ya existe una cuenta con estos datos para este usuario'
      };
    }

    console.error('Error al actualizar cuenta bancaria:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Eliminar cuenta bancaria
 * @param cuentaId - ID de la cuenta
 */
export async function eliminarCuentaBancaria(cuentaId: string): Promise<ResultadoOperacion> {
  try {
    // Verificar que la cuenta existe
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId },
      include: {
        retiros: {
          where: {
            estado: { in: ['Pendiente', 'Procesando'] }
          }
        }
      }
    });

    if (!cuenta) {
      return {
        exito: false,
        mensaje: 'Cuenta bancaria no encontrada'
      };
    }

    // Verificar que no tenga retiros pendientes o en proceso
    if (cuenta.retiros.length > 0) {
      return {
        exito: false,
        mensaje: 'No se puede eliminar una cuenta con retiros pendientes o en proceso'
      };
    }

    // Si era la cuenta predeterminada, marcar otra como predeterminada
    if (cuenta.esPredeterminada) {
      const otraCuenta = await prisma.cuentaBancaria.findFirst({
        where: { 
          userId: cuenta.userId,
          id: { not: cuentaId }
        }
      });

      if (otraCuenta) {
        await prisma.cuentaBancaria.update({
          where: { id: otraCuenta.id },
          data: { esPredeterminada: true }
        });
      }
    }

    // Eliminar la cuenta
    await prisma.cuentaBancaria.delete({
      where: { id: cuentaId }
    });

    return {
      exito: true,
      mensaje: 'Cuenta bancaria eliminada exitosamente'
    };

  } catch (error) {
    console.error('Error al eliminar cuenta bancaria:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Establecer cuenta como predeterminada
 * @param cuentaId - ID de la cuenta
 * @param userId - ID del usuario (para verificación)
 */
export async function establecerCuentaPredeterminada(
  cuentaId: string,
  userId: string
): Promise<ResultadoOperacion> {
  try {
    // Verificar que la cuenta existe y pertenece al usuario
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId }
    });

    if (!cuenta || cuenta.userId !== userId) {
      return {
        exito: false,
        mensaje: 'Cuenta bancaria no encontrada o no autorizada'
      };
    }

    // Si ya es predeterminada, no hacer nada
    if (cuenta.esPredeterminada) {
      return {
        exito: true,
        mensaje: 'La cuenta ya es predeterminada',
        data: cuenta
      };
    }

    // Usar transacción para garantizar consistencia
    const resultado = await prisma.$transaction(async (tx) => {
      // Desmarcar todas las cuentas predeterminadas del usuario
      await tx.cuentaBancaria.updateMany({
        where: { userId, esPredeterminada: true },
        data: { esPredeterminada: false }
      });

      // Marcar la cuenta seleccionada como predeterminada
      const cuentaActualizada = await tx.cuentaBancaria.update({
        where: { id: cuentaId },
        data: { esPredeterminada: true }
      });

      return cuentaActualizada;
    });

    return {
      exito: true,
      mensaje: 'Cuenta establecida como predeterminada exitosamente',
      data: resultado
    };

  } catch (error) {
    console.error('Error al establecer cuenta predeterminada:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}