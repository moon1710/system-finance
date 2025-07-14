// src/lib/emailService.ts (Refactorizado)

import sgMail from '../sendgrid';
// Importamos nuestro nuevo motor de plantillas
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
    console.log(`Email de bienvenida enviado a: ${email}`);
  } catch (error: any) {
    console.error(`Error al enviar email de bienvenida a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar email de bienvenida.`);
  }
}

/**
 * Envía un correo electrónico de confirmación de retiro a un artista.
 */
export async function enviarConfirmacionRetiro(email: string, monto: string | number): Promise<void> {
  const html = renderTemplate('confirmacion-retiro', { 
    monto: monto.toLocaleString() 
  });
  
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Confirmación de solicitud de retiro',
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email de confirmación de retiro enviado a: ${email}`);
  } catch (error: any) {
    console.error(`Error al enviar confirmación de retiro a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar confirmación de retiro.`);
  }
}

/**
 * Envía una alerta por correo electrónico a los administradores sobre un retiro.
 */
export async function enviarAlertaAdmin(adminEmail: string, artistaNombre: string, monto: string | number): Promise<void> {
  const html = renderTemplate('alerta-admin', { 
    artistaNombre, 
    monto: monto.toLocaleString() 
  });
  
  const msg = {
    to: adminEmail,
    from: process.env.EMAIL_FROM!,
    subject: `ALERTA: Nueva solicitud de retiro de ${artistaNombre}`,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Alerta a admin enviada a: ${adminEmail}`);
  } catch (error: any) {
    console.error(`Error al enviar alerta a admin ${adminEmail}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar alerta a administrador.`);
  }
}

// ... y así sucesivamente con el resto de tus funciones ...

/**
 * Envía un correo electrónico con un token de recuperación de contraseña.
 */
export async function enviarTokenRecuperacion(email: string, token: string): Promise<void> {
  const recoveryLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
  
  // Asume que tienes una plantilla llamada 'recuperacion-password.html'
  const html = renderTemplate('recuperacion-password', { recoveryLink });

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Recuperación de contraseña',
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email de token de recuperación enviado a: ${email}`);
  } catch (error: any) {
    console.error(`Error al enviar token de recuperación a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar token de recuperación.`);
  }
}