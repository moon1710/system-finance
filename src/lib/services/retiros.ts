// /lib/services/retiros.ts
import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { 
  validarDatosRetiro, 
  validarTransicionEstado,
  validarMotivoRechazo,
  validarComprobante
} from '@/lib/validations/retiros'
import { generarAlertasAutomaticas } from '@/lib/services/alertas'

const prisma = new PrismaClient()

/**
 * Tipos para el servicio de retiros
 */
export interface DatosRetiro {
  monto: number;
  cuentaId: string;
  notas?: string;
}

export interface ResultadoOperacion {
  exito: boolean;
  mensaje: string;
  data?: any;
  errores?: string[];
  alertas?: string[];
}

/**
 * FUNCIONES DE ARTISTA
 */

/**
 * Crear nueva solicitud de retiro
 * @param userId - ID del usuario (artista)
 * @param monto - Monto a retirar en USD
 * @param cuentaId - ID de la cuenta bancaria
 * @param notas - Notas opcionales
 */
export async function crearSolicitudRetiro(
  userId: string,
  monto: number,
  cuentaId: string,
  notas?: string
): Promise<ResultadoOperacion> {
  try {
    // Validar datos
    const validacion = validarDatosRetiro({ monto, cuentaId, notas });
    if (!validacion.esValido) {
      return {
        exito: false,
        mensaje: 'Datos de retiro no válidos',
        errores: validacion.errores
      };
    }

    // Verificar que el usuario existe y es artista
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!usuario) {
      return {
        exito: false,
        mensaje: 'Usuario no encontrado'
      };
    }

    if (usuario.rol !== 'artista') {
      return {
        exito: false,
        mensaje: 'Solo los artistas pueden solicitar retiros'
      };
    }

    if (usuario.estadoCuenta !== 'Activa') {
      return {
        exito: false,
        mensaje: 'Tu cuenta debe estar activa para solicitar retiros'
      };
    }

    // Verificar límite de solicitudes pendientes (máximo 3)
    const verificacionPendientes = await verificarSolicitudPendiente(userId);
    if (!verificacionPendientes.exito) {
      return verificacionPendientes;
    }

    // Verificar que la cuenta bancaria existe y pertenece al usuario
    const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
      where: { id: cuentaId }
    });

    if (!cuentaBancaria || cuentaBancaria.userId !== userId) {
      return {
        exito: false,
        mensaje: 'Cuenta bancaria no encontrada o no autorizada'
      };
    }

    // Crear la solicitud SIN requiereRevision
    const nuevaSolicitud = await prisma.retiro.create({
      data: {
        usuarioId: userId,
        cuentaBancariaId: cuentaId,
        montoSolicitado: monto,
        estado: 'Pendiente',
        notasAdmin: notas || null
      },
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            email: true
          }
        },
        cuentaBancaria: {
          select: {
            tipoCuenta: true,
            nombreBanco: true
          }
        }
      }
    });

    // Generar alertas automáticas usando el nuevo sistema
    let alertasGeneradas: any[] = [];
    try {
      alertasGeneradas = await generarAlertasAutomaticas(nuevaSolicitud.id);
    } catch (error) {
      console.error('Error generando alertas:', error);
      // No fallar la creación del retiro si fallan las alertas
    }

    return {
      exito: true,
      mensaje: 'Solicitud de retiro creada exitosamente',
      data: {
        ...nuevaSolicitud,
        alertas: alertasGeneradas
      },
      alertas: alertasGeneradas.length > 0 ? alertasGeneradas.map(a => a.mensaje) : undefined
    };

  } catch (error) {
    console.error('Error al crear solicitud de retiro:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Obtener historial de retiros de un usuario
 * @param userId - ID del usuario (artista)
 */
export async function obtenerRetirosUsuario(userId: string): Promise<ResultadoOperacion> {
  try {
    const retiros = await prisma.retiro.findMany({
      where: { usuarioId: userId },
      include: {
        cuentaBancaria: {
          select: {
            tipoCuenta: true,
            nombreBanco: true,
            clabe: true,
            numeroCuenta: true,
            emailPaypal: true
          }
        },
        alertas: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { fechaSolicitud: 'desc' }
    });

    return {
      exito: true,
      mensaje: 'Retiros obtenidos exitosamente',
      data: retiros
    };

  } catch (error) {
    console.error('Error al obtener retiros:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener el historial de retiros'
    };
  }
}

/**
 * Verificar límite de solicitudes pendientes (máximo 3)
 * @param userId - ID del usuario
 */
export async function verificarSolicitudPendiente(userId: string): Promise<ResultadoOperacion> {
  try {
    const solicitudesPendientes = await prisma.retiro.count({
      where: {
        usuarioId: userId,
        estado: { in: ['Pendiente', 'Procesando'] }
      }
    });

    const LIMITE_PENDIENTES = 3;

    if (solicitudesPendientes >= LIMITE_PENDIENTES) {
      return {
        exito: false,
        mensaje: `Ya tienes ${LIMITE_PENDIENTES} solicitudes pendientes. Espera a que se procesen antes de crear una nueva.`
      };
    }

    return {
      exito: true,
      mensaje: 'Límite de pendientes válido',
      data: { pendientes: solicitudesPendientes, limite: LIMITE_PENDIENTES }
    };

  } catch (error) {
    console.error('Error al verificar solicitudes pendientes:', error);
    return {
      exito: false,
      mensaje: 'Error al verificar solicitudes pendientes'
    };
  }
}

/**
 * FUNCIONES DE ADMIN
 */

/**
 * Obtener solicitudes de retiro por administrador
 * @param adminId - ID del administrador
 */
export async function obtenerSolicitudesPorAdmin(adminId: string): Promise<ResultadoOperacion> {
  try {
    // Verificar que el usuario es admin
    const admin = await prisma.usuario.findUnique({
      where: { id: adminId }
    });

    if (!admin || admin.rol !== 'admin') {
      return {
        exito: false,
        mensaje: 'Usuario no autorizado'
      };
    }

    // TEMPORAL: Mostrar todos los retiros (sin filtrar por relación)
    const solicitudes = await prisma.retiro.findMany({
      where: {},  // Sin filtros = todos los retiros
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            email: true
          }
        },
        cuentaBancaria: {
          select: {
            tipoCuenta: true,
            nombreBanco: true
          }
        },
        alertas: {
          where: { resuelta: false },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { fechaSolicitud: 'desc' }
      ]
    });

    // Agregar información de si tiene alertas
    const solicitudesConInfo = solicitudes.map(solicitud => ({
      ...solicitud,
      tieneAlertas: solicitud.alertas.length > 0,
      cantidadAlertas: solicitud.alertas.length
    }));

    return {
      exito: true,
      mensaje: 'Solicitudes obtenidas exitosamente',
      data: solicitudesConInfo
    };

  } catch (error) {
    console.error('Error al obtener solicitudes por admin:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener las solicitudes'
    };
  }
}

/**
 * Cambiar estado de retiro
 * @param retiroId - ID del retiro
 * @param nuevoEstado - Nuevo estado
 * @param adminId - ID del administrador
 */
export async function cambiarEstadoRetiro(
  retiroId: string,
  nuevoEstado: string,
  adminId: string
): Promise<ResultadoOperacion> {
  try {
    // Obtener retiro actual
    const retiro = await prisma.retiro.findUnique({
      where: { id: retiroId },
      include: {
        usuario: true
      }
    });

    if (!retiro) {
      return {
        exito: false,
        mensaje: 'Retiro no encontrado'
      };
    }

    // TEMPORAL: Comentado verificación de permisos
    /*
    const relacion = await prisma.adminArtistaRelacion.findUnique({
      where: {
        adminId_artistaId: {
          adminId: adminId,
          artistaId: retiro.usuarioId
        }
      }
    });

    if (!relacion) {
      return {
        exito: false,
        mensaje: 'No tienes permisos para modificar este retiro'
      };
    }
    */

    // Validar transición de estado
    const validacionTransicion = validarTransicionEstado(retiro.estado, nuevoEstado);
    if (!validacionTransicion.esValido) {
      return {
        exito: false,
        mensaje: 'Transición de estado no válida',
        errores: validacionTransicion.errores
      };
    }

    // Actualizar estado
    const retiroActualizado = await prisma.retiro.update({
      where: { id: retiroId },
      data: {
        estado: nuevoEstado,
        fechaActualizacion: new Date()
      },
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            email: true
          }
        }
      }
    });

    return {
      exito: true,
      mensaje: `Estado cambiado a "${nuevoEstado}" exitosamente`,
      data: retiroActualizado
    };

  } catch (error) {
    console.error('Error al cambiar estado de retiro:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Aprobar retiro
 * @param retiroId - ID del retiro
 * @param adminId - ID del administrador
 */
export async function aprobarRetiro(retiroId: string, adminId: string): Promise<ResultadoOperacion> {
  return await cambiarEstadoRetiro(retiroId, 'Procesando', adminId);
}

/**
 * Rechazar retiro con motivo
 * @param retiroId - ID del retiro
 * @param adminId - ID del administrador
 * @param motivo - Motivo del rechazo
 */
export async function rechazarRetiro(
  retiroId: string,
  adminId: string,
  motivo: string
): Promise<ResultadoOperacion> {
  try {
    // Validar motivo
    const validacionMotivo = validarMotivoRechazo(motivo);
    if (!validacionMotivo.esValido) {
      return {
        exito: false,
        mensaje: 'Motivo de rechazo no válido',
        errores: validacionMotivo.errores
      };
    }

    // Obtener retiro actual
    const retiro = await prisma.retiro.findUnique({
      where: { id: retiroId },
      include: { usuario: true }
    });

    if (!retiro) {
      return {
        exito: false,
        mensaje: 'Retiro no encontrado'
      };
    }

    // TEMPORAL: Comentado verificación de permisos
    /*
    const relacion = await prisma.adminArtistaRelacion.findUnique({
      where: {
        adminId_artistaId: {
          adminId: adminId,
          artistaId: retiro.usuarioId
        }
      }
    });

    if (!relacion) {
      return {
        exito: false,
        mensaje: 'No tienes permisos para modificar este retiro'
      };
    }
    */

    // Validar transición
    const validacionTransicion = validarTransicionEstado(retiro.estado, 'Rechazado');
    if (!validacionTransicion.esValido) {
      return {
        exito: false,
        mensaje: 'No se puede rechazar este retiro en su estado actual',
        errores: validacionTransicion.errores
      };
    }

    // Actualizar retiro con motivo de rechazo
    const retiroActualizado = await prisma.retiro.update({
      where: { id: retiroId },
      data: {
        estado: 'Rechazado',
        notasAdmin: motivo,
        fechaActualizacion: new Date()
      },
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            email: true
          }
        }
      }
    });

    // Marcar alertas como resueltas
    await prisma.alerta.updateMany({
      where: { 
        retiroId: retiroId,
        resuelta: false
      },
      data: { resuelta: true }
    });

    return {
      exito: true,
      mensaje: 'Retiro rechazado exitosamente',
      data: retiroActualizado
    };

  } catch (error) {
    console.error('Error al rechazar retiro:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Completar retiro con comprobante
 * @param retiroId - ID del retiro
 * @param adminId - ID del administrador
 * @param urlComprobante - URL del comprobante subido
 */
export async function completarRetiro(
  retiroId: string,
  adminId: string,
  urlComprobante: string
): Promise<ResultadoOperacion> {
  try {
    if (!urlComprobante || urlComprobante.trim() === '') {
      return {
        exito: false,
        mensaje: 'URL del comprobante es requerida'
      };
    }

    // Obtener retiro actual
    const retiro = await prisma.retiro.findUnique({
      where: { id: retiroId },
      include: { usuario: true }
    });

    if (!retiro) {
      return {
        exito: false,
        mensaje: 'Retiro no encontrado'
      };
    }

    // TEMPORAL: Comentado verificación de permisos
    /*
    const relacion = await prisma.adminArtistaRelacion.findUnique({
      where: {
        adminId_artistaId: {
          adminId: adminId,
          artistaId: retiro.usuarioId
        }
      }
    });

    if (!relacion) {
      return {
        exito: false,
        mensaje: 'No tienes permisos para modificar este retiro'
      };
    }
    */

    // Validar que está en estado "Procesando"
    if (retiro.estado !== 'Procesando') {
      return {
        exito: false,
        mensaje: 'Solo se pueden completar retiros en estado "Procesando"'
      };
    }

    // Completar retiro
    const retiroActualizado = await prisma.retiro.update({
      where: { id: retiroId },
      data: {
        estado: 'Completado',
        urlComprobante: urlComprobante,
        fechaActualizacion: new Date()
      },
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            email: true
          }
        }
      }
    });

    // Marcar alertas como resueltas
    await prisma.alerta.updateMany({
      where: { 
        retiroId: retiroId,
        resuelta: false
      },
      data: { resuelta: true }
    });

    return {
      exito: true,
      mensaje: 'Retiro completado exitosamente',
      data: retiroActualizado
    };

  } catch (error) {
    console.error('Error al completar retiro:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Subir comprobante de pago (solo admins)
 * @param retiroId - ID del retiro
 * @param adminId - ID del administrador
 * @param archivo - Archivo del comprobante
 */
export async function subirComprobante(
  retiroId: string,
  adminId: string,
  archivo: File
): Promise<ResultadoOperacion> {
  try {
    
    // Validar archivo
    const validacionArchivo = validarComprobante({
      name: archivo.name,
      size: archivo.size,
      type: archivo.type
    });

    if (!validacionArchivo.esValido) {
      return {
        exito: false,
        mensaje: 'Archivo no válido',
        errores: validacionArchivo.errores
      };
    }

    // Obtener retiro y verificar permisos
    const retiro = await prisma.retiro.findUnique({
      where: { id: retiroId },
      include: { usuario: true }
    });

    if (!retiro) {
      return {
        exito: false,
        mensaje: 'Retiro no encontrado'
      };
    }

    // TEMPORAL: Comentado verificación de permisos
    /*
    const relacion = await prisma.adminArtistaRelacion.findUnique({
      where: {
        adminId_artistaId: {
          adminId: adminId,
          artistaId: retiro.usuarioId
        }
      }
    });

    if (!relacion) {
      return {
        exito: false,
        mensaje: 'No tienes permisos para subir comprobantes a este retiro'
      };
    }
    */

    // Verificar que está en estado "Procesando"
    if (retiro.estado !== 'Procesando') {
      return {
        exito: false,
        mensaje: 'Solo se pueden subir comprobantes a retiros en estado "Procesando"'
      };
    }

    // Crear directorio si no existe
    const uploadsDir = path.join(process.cwd(), 'uploads', 'comprobantes');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = path.extname(archivo.name);
    const nombreArchivo = `comprobante_${retiroId}_${timestamp}${extension}`;
    const rutaArchivo = path.join(uploadsDir, nombreArchivo);

    // Convertir File a Buffer y guardar
    const arrayBuffer = await archivo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(rutaArchivo, buffer);

    // URL pública del archivo
    const urlComprobante = `/uploads/comprobantes/${nombreArchivo}`;

    // Completar el retiro automáticamente
    const resultadoCompletar = await completarRetiro(retiroId, adminId, urlComprobante);

    if (!resultadoCompletar.exito) {
      // Si falla completar, eliminar el archivo subido
      try {
        await fs.unlink(rutaArchivo);
      } catch (error) {
        console.error('Error al eliminar archivo tras fallo:', error);
      }
      return resultadoCompletar;
    }

    return {
      exito: true,
      mensaje: 'Comprobante subido y retiro completado exitosamente',
      data: {
        urlComprobante,
        retiro: resultadoCompletar.data
      }
    };

  } catch (error) {
    console.error('Error al subir comprobante:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor al subir el comprobante'
    };
  }
}

/**
 * Obtener retiro específico (para validaciones)
 * @param retiroId - ID del retiro
 * @param userId - ID del usuario (para verificar permisos)
 */
export async function obtenerRetiroPorId(
  retiroId: string,
  userId: string
): Promise<ResultadoOperacion> {
  try {
    const retiro = await prisma.retiro.findUnique({
      where: { id: retiroId },
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            email: true,
            rol: true
          }
        },
        cuentaBancaria: {
          select: {
            tipoCuenta: true,
            nombreBanco: true
          }
        },
        alertas: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!retiro) {
      return {
        exito: false,
        mensaje: 'Retiro no encontrado'
      };
    }

    // Verificar permisos según el rol
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!usuario) {
      return {
        exito: false,
        mensaje: 'Usuario no encontrado'
      };
    }

    if (usuario.rol === 'artista') {
      // Los artistas solo pueden ver sus propios retiros
      if (retiro.usuarioId !== userId) {
        return {
          exito: false,
          mensaje: 'No tienes permisos para ver este retiro'
        };
      }
    } else if (usuario.rol === 'admin') {
      // TEMPORAL: Los admins pueden ver todos los retiros
      // Cuando se habilite la relación admin-artista, descomentar:
      /*
      const relacion = await prisma.adminArtistaRelacion.findUnique({
        where: {
          adminId_artistaId: {
            adminId: userId,
            artistaId: retiro.usuarioId
          }
        }
      });

      if (!relacion) {
        return {
          exito: false,
          mensaje: 'No tienes permisos para ver este retiro'
        };
      }
      */
    }

    return {
      exito: true,
      mensaje: 'Retiro obtenido exitosamente',
      data: retiro
    };

  } catch (error) {
    console.error('Error al obtener retiro por ID:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}