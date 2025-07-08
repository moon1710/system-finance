// src/lib/emailService.ts (Actualizado para SendGrid)

import sgMail from './sendgrid'; // Importa el cliente SendGrid configurado

/**
 * Envía un correo electrónico de bienvenida a un nuevo usuario con sus credenciales de acceso.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña generada para el usuario.
 */
export async function enviarEmailBienvenida(email: string, password: string): Promise<void> {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!, // La dirección 'From' configurada en SendGrid
    subject: '¡Bienvenido a nuestra plataforma!',
    html: `
      <p>Hola,</p>
      <p>Te damos la bienvenida a nuestra plataforma.</p>
      <p>Tus credenciales de acceso son:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Contraseña:</strong> ${password}</p>
      <p>Te recomendamos cambiar tu contraseña una vez que inicies sesión.</p>
      <p>Saludos cordiales,</p>
      <p>El equipo de Tu Plataforma</p>
    `,
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
 * @param {string} email - Correo electrónico del artista.
 * @param {string | number} monto - Monto del retiro solicitado.
 */
export async function enviarConfirmacionRetiro(email: string, monto: string | number): Promise<void> {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Confirmación de solicitud de retiro',
    html: `
      <p>Hola,</p>
      <p>Hemos recibido tu solicitud de retiro por un monto de <strong>$${monto.toLocaleString()} USD</strong>.</p>
      <p>Tu solicitud está siendo procesada y te notificaremos cuando el pago haya sido completado.</p>
      <p>Gracias por usar nuestra plataforma.</p>
      <p>Saludos,</p>
      <p>El equipo de Tu Plataforma</p>
    `,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email de confirmación de retiro enviado a: ${email} por $${monto}`);
  } catch (error: any) {
    console.error(`Error al enviar confirmación de retiro a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar confirmación de retiro.`);
  }
}

/**
 * Envía una alerta por correo electrónico a los administradores sobre una solicitud de retiro.
 * @param {string} adminEmail - Correo electrónico del administrador o lista de administradores (separados por coma).
 * @param {string} artistaNombre - Nombre completo del artista que realizó el retiro.
 * @param {string | number} monto - Monto del retiro solicitado.
 */
export async function enviarAlertaAdmin(adminEmail: string, artistaNombre: string, monto: string | number): Promise<void> {
  const msg = {
    to: adminEmail,
    from: process.env.EMAIL_FROM!, // Puedes usar un email diferente si lo configuras en SendGrid y .env
    subject: `ALERTA: Nueva solicitud de retiro de ${artistaNombre}`,
    html: `
      <p>Estimado administrador,</p>
      <p>Se ha registrado una nueva solicitud de retiro que requiere su atención:</p>
      <ul>
        <li><strong>Artista:</strong> ${artistaNombre}</li>
        <li><strong>Monto solicitado:</strong> $${monto.toLocaleString()} USD</li>
      </ul>
      <p>Por favor, ingrese al panel de administración para revisar los detalles.</p>
      <p>Saludos,</p>
      <p>El sistema de alertas de Tu Plataforma</p>
    `,
  };
  try {
    await sgMail.send(msg);
    console.log(`Alerta a admin enviada a: ${adminEmail} sobre retiro de ${artistaNombre} por $${monto}`);
  } catch (error: any) {
    console.error(`Error al enviar alerta a admin ${adminEmail}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar alerta a administrador.`);
  }
}

/**
 * Envía un correo electrónico al usuario para notificarle un cambio en el estado de su retiro.
 * @param {string} email - Correo electrónico del usuario.
 * @param {'Pendiente' | 'Procesando' | 'Completado' | 'Rechazado'} estado - Nuevo estado del retiro.
 * @param {string} [motivo] - Motivo adicional, útil para retiros rechazados.
 */
export async function enviarActualizacionEstado(email: string, estado: 'Pendiente' | 'Procesando' | 'Completado' | 'Rechazado', motivo?: string): Promise<void> {
  let subject = `Actualización de estado de tu retiro: ${estado}`;
  let body = `
    <p>Hola,</p>
    <p>Te informamos que el estado de tu solicitud de retiro ha sido actualizado a: <strong>${estado}</strong>.</p>
  `;

  if (estado === 'Rechazado' && motivo) {
    subject = 'Tu solicitud de retiro ha sido rechazada';
    body += `<p><strong>Motivo del rechazo:</strong> ${motivo}</p>`;
  } else if (estado === 'Completado') {
    body += `<p>¡Tu retiro ha sido procesado con éxito! Por favor, verifica tu cuenta bancaria.</p>`;
  }

  body += `
    <p>Para más detalles, por favor, inicia sesión en tu cuenta.</p>
    <p>Saludos,</p>
    <p>El equipo de Tu Plataforma</p>
  `;

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: subject,
    html: body,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email de actualización de estado enviado a: ${email} - Estado: ${estado}`);
  } catch (error: any) {
    console.error(`Error al enviar actualización de estado a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar actualización de estado.`);
  }
}

/**
 * Envía un correo electrónico de confirmación de cambio de contraseña al usuario.
 * @param {string} email - Correo electrónico del usuario.
 */
export async function enviarConfirmacionCambioPassword(email: string): Promise<void> {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Confirmación de cambio de contraseña',
    html: `
      <p>Hola,</p>
      <p>Te confirmamos que tu contraseña ha sido cambiada exitosamente.</p>
      <p>Si no realizaste este cambio, por favor, contacta a soporte inmediatamente.</p>
      <p>Saludos,</p>
      <p>El equipo de Tu Plataforma</p>
    `,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email de confirmación de cambio de contraseña enviado a: ${email}`);
  } catch (error: any) {
    console.error(`Error al enviar confirmación de cambio de contraseña a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar confirmación de cambio de contraseña.`);
  }
}

/**
 * Envía un correo electrónico con un token de recuperación de contraseña.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} token - Token único para la recuperación de contraseña.
 */
export async function enviarTokenRecuperacion(email: string, token: string): Promise<void> {
  const recoveryLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`; // Asume una URL base pública
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Recuperación de contraseña',
    html: `
      <p>Hola,</p>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
      <p><a href="${recoveryLink}">Restablecer mi contraseña</a></p>
      <p>Este enlace es válido por un tiempo limitado.</p>
      <p>Si no solicitaste este cambio, por favor, ignora este correo.</p>
      <p>Saludos,</p>
      <p>El equipo de Tu Plataforma</p>
    `,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email de token de recuperación enviado a: ${email}`);
  } catch (error: any) {
    console.error(`Error al enviar token de recuperación a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar token de recuperación.`);
  }
}