// src/lib/emailService.ts (Actualizado con nuevos templates)

import sgMail from '../sendgrid';
import { renderTemplate } from './templateEngine';

/**
 * Envía un correo electrónico de bienvenida a un nuevo usuario.
 */
export async function enviarEmailBienvenida(email: string, password: string): Promise<void> {
  const html = renderTemplate('bienvenida', { email, password });
  
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: '¡Bienvenido a nuestra plataforma!',
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Bienvenida enviada a: ${email}`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Bienvenida a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar email de bienvenida.`);
  }
}

/**
 * Envía confirmación de solicitud de retiro al artista (versión detallada)
 */
export async function enviarConfirmacionRetiro(
  email: string, 
  data: {
    solicitudId: string;
    nombreArtista: string;
    monto: string | number;
    nombreBanco: string;
    tipoCuenta: string;
    ultimosDigitos: string;
    fecha: string;
    urlPanelArtista: string;
  }
): Promise<void> {
  const html = renderTemplate('confirmacion-retiro', {
    ...data,
    monto: typeof data.monto === 'number' ? data.monto.toLocaleString() : data.monto
  });
  
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: `Confirmación de tu solicitud de retiro #${data.solicitudId}`,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Confirmación de retiro enviada a: ${email} (ID: ${data.solicitudId})`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Confirmación retiro a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar confirmación de retiro.`);
  }
}

/**
 * Envía alerta a administradores sobre nueva solicitud de retiro
 */
export async function enviarAlertaAdmin(
  adminEmails: string[], 
  data: {
    solicitudId: string;
    nombreAdmin: string;
    nombreArtista: string;
    monto: string | number;
    nombreBanco: string;
    tipoCuenta: string;
    ultimosDigitos: string;
    fecha: string;
    criterioAlerta: string;
    urlPanelAdmin: string;
  }
): Promise<void> {
  const html = renderTemplate('alerta-admin', {
    ...data,
    monto: typeof data.monto === 'number' ? data.monto.toLocaleString() : data.monto
  });
  
  const msg = {
    to: adminEmails,
    from: process.env.EMAIL_FROM!,
    subject: `[ALERTA] Nueva solicitud de retiro requiere revisión`,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Alerta admin enviada a: ${adminEmails.join(', ')} (ID: ${data.solicitudId})`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Alerta admin ${adminEmails.join(', ')}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar alerta a administrador.`);
  }
}

/**
 * Envía notificación de retiro completado
 */
export async function enviarRetiroCompletado(
  email: string,
  data: {
    solicitudId: string;
    nombreArtista: string;
    monto: number;
    fechaCompletado: string;
    metodoPago: string;
    urlComprobante: string;
    urlPanelArtista: string;
  }
): Promise<void> {
  const html = renderTemplate('retiro-completado', {
    ...data,
    monto: data.monto.toLocaleString()
  });
  
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: `Tu retiro #${data.solicitudId} ya está completado`,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Retiro completado enviado a: ${email} (ID: ${data.solicitudId})`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Retiro completado a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar notificación de retiro completado.`);
  }
}

/**
 * Función legacy para actualización de estado (mantiene compatibilidad)
 */
export async function enviarActualizacionEstado(
  email: string,
  estado: 'Aprobado' | 'Completado' | 'Rechazado',
  nombreCompleto: string,
  monto: number,
  motivo?: string
): Promise<void> {
  let template = '';
  let subject = '';
  let templateData: any = {};

  const montoFormateado = monto.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  switch (estado) {
    case 'Completado':
      // Usar el nuevo template detallado si es completado
      template = 'retiro-completado';
      subject = `Tu retiro ${montoFormateado} ya está completado`;
      templateData = {
        solicitudId: 'N/A', // Sería mejor pasar el ID real
        nombreArtista: nombreCompleto,
        monto: monto.toLocaleString(),
        fechaCompletado: new Date().toLocaleDateString('es-ES'),
        metodoPago: 'Transferencia bancaria',
        urlComprobante: '#', // URL real del comprobante
        urlPanelArtista: `${process.env.NEXT_PUBLIC_BASE_URL}/artista/retiros`
      };
      break;
    
    default:
      // Para otros estados, usar template genérico
      template = 'cambio-estado';
      subject = `Actualización de tu retiro ${montoFormateado}`;
      templateData = {
        nombreCompleto,
        estado,
        montoFormateado,
        motivo
      };
      break;
  }

  const html = renderTemplate(template, templateData);
  
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: subject,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Actualización de estado '${estado}' enviada a: ${email}`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Actualización estado a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar actualización de estado.`);
  }
}

/**
 * Envía confirmación de cambio de contraseña
 */
export async function enviarConfirmacionCambioPassword(email: string): Promise<void> {
  const html = renderTemplate('cambio-estado', { 
    mensaje: 'Tu contraseña ha sido cambiada exitosamente.' 
  });
  
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Confirmación de cambio de contraseña',
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Confirmación cambio password enviada a: ${email}`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Cambio password a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar confirmación de cambio de contraseña.`);
  }
}

/**
 * Envía token de recuperación de contraseña
 */
export async function enviarTokenRecuperacion(email: string, token: string): Promise<void> {
  const recoveryLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
  
  const html = renderTemplate('recuperacion', { recoveryLink });

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Recuperación de contraseña',
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Token recuperación enviado a: ${email}`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Token recuperación a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar token de recuperación.`);
  }
}