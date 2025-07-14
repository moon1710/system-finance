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
  // --- CAMBIO CLAVE: Se incluye el campo 'pais' ---
  pais?: string;
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
    // 1. Validar datos con la lógica corregida
    const validacion = validarDatosCuenta(tipoCuenta, datos);
    if (!validacion.esValido) {
      return { exito: false, mensaje: 'Datos de cuenta no válidos', errores: validacion.errores };
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) {
      return { exito: false, mensaje: 'Usuario no encontrado' };
    }

    // --- LÓGICA MODIFICADA PARA CONSTRUIR DATOS DINÁMICAMENTE ---

    // 2. Construir el objeto de datos base
    const dataToCreate: any = {
      userId,
      tipoCuenta,
      nombreTitular: datos.nombreTitular,
    };

    // 3. Añadir campos específicos según el tipo
    switch (tipoCuenta) {
      case 'nacional':
        dataToCreate.nombreBanco = datos.nombreBanco;
        dataToCreate.clabe = datos.clabe;
        break;
      case 'internacional':
        dataToCreate.nombreBanco = datos.nombreBanco;
        dataToCreate.numeroCuenta = datos.numeroCuenta;
        dataToCreate.swift = datos.swift;
        dataToCreate.numeroRuta = datos.numeroRuta;
        dataToCreate.pais = datos.pais;
        break;
      case 'paypal':
        dataToCreate.emailPaypal = datos.emailPaypal;
        break;
    }

    // 4. Manejar la lógica de 'esPredeterminada'
    const cuentasExistentes = await prisma.cuentaBancaria.count({ where: { userId } });
    const esPredeterminada = datos.esPredeterminada || cuentasExistentes === 0;

    if (esPredeterminada) {
      await prisma.cuentaBancaria.updateMany({
        where: { userId, esPredeterminada: true },
        data: { esPredeterminada: false },
      });
      dataToCreate.esPredeterminada = true;
    } else {
      dataToCreate.esPredeterminada = false;
    }

    // 5. Crear la cuenta con los datos limpios y filtrados
    const nuevaCuenta = await prisma.cuentaBancaria.create({
      data: dataToCreate,
    });

    return {
      exito: true,
      mensaje: 'Cuenta bancaria creada exitosamente',
      data: nuevaCuenta,
    };

  } catch (error: any) {
    if (error.code === 'P2002') { // Error de restricción única de Prisma
      const target = error.meta?.target || ['un campo'];
      return { exito: false, mensaje: `Ya existe una cuenta con el mismo valor en: ${target.join(', ')}` };
    }
    console.error('Error al crear cuenta bancaria:', error);
    return { exito: false, mensaje: 'Error interno del servidor' };
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
            orderBy: [{ esPredeterminada: 'desc' }, { createdAt: 'desc' }]
        });
        return { exito: true, mensaje: 'Cuentas obtenidas exitosamente', data: cuentas };
    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        return { exito: false, mensaje: 'Error al obtener las cuentas bancarias' };
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
    const cuentaExistente = await prisma.cuentaBancaria.findUnique({ where: { id: cuentaId } });
    if (!cuentaExistente) {
      return { exito: false, mensaje: 'Cuenta bancaria no encontrada' };
    }

    // --- LÓGICA MODIFICADA PARA ACTUALIZACIÓN DINÁMICA ---
    const dataToUpdate: any = {};
    const tipoCuenta = cuentaExistente.tipoCuenta as 'nacional' | 'internacional' | 'paypal';

    // Campos que siempre se pueden actualizar
    if (datos.nombreTitular) dataToUpdate.nombreTitular = datos.nombreTitular;
    if (datos.esPredeterminada !== undefined) dataToUpdate.esPredeterminada = datos.esPredeterminada;

    // Campos específicos del tipo de cuenta
    switch (tipoCuenta) {
        case 'nacional':
            if (datos.nombreBanco) dataToUpdate.nombreBanco = datos.nombreBanco;
            if (datos.clabe) dataToUpdate.clabe = datos.clabe;
            break;
        case 'internacional':
            if (datos.nombreBanco) dataToUpdate.nombreBanco = datos.nombreBanco;
            if (datos.numeroCuenta) dataToUpdate.numeroCuenta = datos.numeroCuenta;
            if (datos.swift !== undefined) dataToUpdate.swift = datos.swift;
            if (datos.numeroRuta !== undefined) dataToUpdate.numeroRuta = datos.numeroRuta;
            if (datos.pais) dataToUpdate.pais = datos.pais;
            break;
        case 'paypal':
            if (datos.emailPaypal) dataToUpdate.emailPaypal = datos.emailPaypal;
            break;
    }
    
    const validacion = validarDatosCuenta(tipoCuenta, { ...cuentaExistente, ...dataToUpdate });
    if (!validacion.esValido) {
        return { exito: false, mensaje: 'Datos de cuenta no válidos', errores: validacion.errores };
    }

    if (datos.esPredeterminada) {
      await prisma.cuentaBancaria.updateMany({
        where: { userId: cuentaExistente.userId, esPredeterminada: true, id: { not: cuentaId } },
        data: { esPredeterminada: false },
      });
    }

    const cuentaActualizada = await prisma.cuentaBancaria.update({
      where: { id: cuentaId },
      data: dataToUpdate,
    });

    return { exito: true, mensaje: 'Cuenta bancaria actualizada exitosamente', data: cuentaActualizada };

  } catch (error: any) {
    if (error.code === 'P2002') {
        const target = error.meta?.target || ['un campo'];
        return { exito: false, mensaje: `Ya existe una cuenta con el mismo valor en: ${target.join(', ')}`};
    }
    console.error('Error al actualizar cuenta bancaria:', error);
    return { exito: false, mensaje: 'Error interno del servidor' };
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