// src/lib/email/emailService.ts (Completo con todas las funciones)

import sgMail from '../sendgrid';
import { renderTemplate, debugTemplate } from './templateEngine';
import { formatearInfoCuenta, formatearCriterioAlerta } from './helpers' // ← AGREGAR ESTA IMPORTACIÓN

/**
 * Helper para obtener el label del tipo de cuenta
 */
function getTipoCuentaLabel(tipoCuenta: string): string {
  switch (tipoCuenta?.toLowerCase()) {
    case 'paypal': return 'PayPal';
    case 'nacional': return 'Nacional (México)';
    case 'internacional': return 'Internacional (USA)';
    default: return 'Tipo no especificado';
  }
}

/**
 * Envía un correo electrónico de confirmación de retiro a un artista. (NUEVA VERSIÓN)
 */
export async function enviarConfirmacionRetiro(
  email: string, 
  data: any  // Acepta el objeto completo que le pasas desde la API
): Promise<void> {
  
  console.log('🔍 [CONFIRMACION DEBUG] Función llamada con:', {
    email,
    tipoData: typeof data,
    keys: Object.keys(data || {})
  });
  
  // Si data es solo un número (versión legacy), convertir
  if (typeof data === 'number' || typeof data === 'string') {
    console.log('🔄 [CONFIRMACION] Convirtiendo formato legacy');
    data = {
      monto: data,
      solicitudId: `RET-${Date.now()}`,
      nombreArtista: 'Artista',
      fecha: new Date().toLocaleDateString('es-ES'),
      nombreBanco: 'Banco pendiente',
      tipoCuenta: 'Por configurar',
      ultimosDigitos: '****',
      identificadorCuenta: 'No disponible',
      urlPanelArtista: `${process.env.NEXT_PUBLIC_BASE_URL}/artista/retiros`
    };
  }
  
  // Preparar datos completos para el template
  const templateData = {
    solicitudId: data.solicitudId || `RET-${Date.now()}`,
    nombreArtista: data.nombreArtista || 'Artista',
    monto: typeof data.monto === 'number' ? data.monto.toLocaleString('en-US') : data.monto,
    fecha: data.fecha || new Date().toLocaleDateString('es-ES'),
    nombreBanco: data.nombreBanco || 'Banco no especificado',
    tipoCuenta: data.tipoCuenta || 'No especificado',
    tipoCuentaLabel: getTipoCuentaLabel(data.tipoCuenta),
    identificadorCuenta: data.identificadorCuenta || 'No disponible',
    ultimosDigitos: data.ultimosDigitos || '****',
    urlPanelArtista: data.urlPanelArtista || `${process.env.NEXT_PUBLIC_BASE_URL}/artista/retiros`
  };
  
  console.log('🔍 [CONFIRMACION DEBUG] Template data preparado:', templateData);
  
  const html = renderTemplate('confirmacion-retiro', templateData);
  
  // Verificar que las variables se reemplazaron
  if (html.includes('{{')) {
    console.warn('⚠️ [TEMPLATE WARNING] Variables sin reemplazar en confirmacion-retiro:');
    const unreplacedVars = html.match(/\{\{[^}]+\}\}/g);
    console.log('Variables sin reemplazar:', unreplacedVars);
  }
  
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Backstage Pagos::: Confirmación de solicitud de retiro',
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Confirmación de retiro enviada a: ${email}`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Confirmación retiro a ${email}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar confirmación de retiro.`);
  }
}

/**
 * Función helper para preparar datos de email de forma segura CON HELPERS
 */
function prepararDatosEmail(data: any): any {
  console.log('🔧 [PREPARAR DATOS] Data recibida:', data)
  
  // Si hay información de cuenta, formatearla
  let infoCuenta = {}
  if (data.cuenta) {
    console.log('🏦 [CUENTA] Formateando información de cuenta:', data.cuenta)
    infoCuenta = formatearInfoCuenta(data.cuenta)
    console.log('🏦 [CUENTA] Información formateada:', infoCuenta)
  }
  
  // Formatear criterio de alerta
  const criterio = formatearCriterioAlerta(data.monto || 0, data.cantidadRetiros || 0)
  console.log('🚨 [CRITERIO] Criterio generado:', criterio)
  
  const resultado = {
    solicitudId: data.solicitudId || `RET-${Date.now()}`,
    nombreArtista: data.nombreArtista || 'Artista',
    monto: (typeof data.monto === 'number' ? data.monto.toLocaleString() : data.monto) || '0',
    fecha: data.fecha || new Date().toLocaleDateString('es-ES'),
    urlPanelArtista: data.urlPanelArtista || `${process.env.NEXT_PUBLIC_BASE_URL}/artista/retiros`,
    // Para alertas de admin
    nombreAdmin: data.nombreAdmin || 'Administrador',
    criterioAlerta: criterio, // ← USAR EL CRITERIO FORMATEADO
    urlPanelAdmin: data.urlPanelAdmin || `${process.env.NEXT_PUBLIC_BASE_URL}/admin/retiros`,
    // Información de cuenta formateada
    ...infoCuenta,
    // Datos adicionales
    cantidadRetiros: data.cantidadRetiros || 0
  }
  
  console.log('✅ [PREPARAR DATOS] Resultado final:', resultado)
  return resultado
}

/**
 * Envía una alerta por correo electrónico a los administradores sobre un retiro. (CORREGIDA)
 */
export async function enviarAlertaAdminCompleta(adminEmails: string[], data: any): Promise<void> {
  console.log('🔍 [ALERTA ADMIN] Datos originales recibidos:', data);
  
  // Preparar datos de forma segura con helpers
  const templateData = prepararDatosEmail(data);
  
  console.log('🔍 [ALERTA ADMIN] Datos preparados para template:', templateData);
  console.log('🔍 [TEMPLATE DEBUG] Datos para template alerta-admin:');
  debugTemplate('alerta-admin', templateData);
  
  const html = renderTemplate('alerta-admin', templateData);
  
  // Verificar que las variables se reemplazaron
  if (html.includes('{{')) {
    console.warn('⚠️ [TEMPLATE WARNING] Variables sin reemplazar en alerta-admin:');
    const unreplacedVars = html.match(/\{\{[^}]+\}\}/g);
    console.log('Variables sin reemplazar:', unreplacedVars);
  }
  
  const msg = {
    to: adminEmails,
    from: process.env.EMAIL_FROM!,
    // ✅ CORRECCIÓN: Usar templateData.nombreArtista en lugar de artistaNombre
    subject: `Backstage Pagos::: Nueva solicitud de retiro de ${templateData.nombreArtista}`,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Alerta admin completa enviada a: ${adminEmails.join(', ')}`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Alerta admin completa ${adminEmails.join(', ')}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar alerta a administrador.`);
  }
}

/**
 * Función legacy de alerta admin (solo para compatibilidad)
 */
export async function enviarAlertaAdmin(adminEmails: string[], artistaNombre: string, monto: string | number): Promise<void> {
  const templateData = {
    solicitudId: `RET-${Date.now()}`,
    nombreAdmin: 'Administrador',
    nombreArtista: artistaNombre,
    monto: typeof monto === 'number' ? monto.toLocaleString() : monto,
    nombreBanco: 'Pendiente',
    tipoCuenta: 'Pendiente',
    ultimosDigitos: '****',
    fecha: new Date().toLocaleDateString('es-ES'),
    criterioAlerta: 'Solicitud de retiro estándar',
    urlPanelAdmin: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/retiros`
  };
  
  const html = renderTemplate('alerta-admin', templateData);
  
  const msg = {
    to: adminEmails,
    from: process.env.EMAIL_FROM!,
    subject: `ALERTA: Nueva solicitud de retiro de ${artistaNombre}`,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Alerta admin (legacy) enviada a: ${adminEmails.join(', ')}`);
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Alerta admin legacy ${adminEmails.join(', ')}:`, error.response?.body || error);
    throw new Error(`Fallo al enviar alerta a administrador.`);
  }
}

/**
 * Función mejorada para actualización de estado con debugging
 */
export async function enviarActualizacionEstado(
  email: string,
  estado: 'Aprobado' | 'Completado' | 'Rechazado',
  nombreCompleto: string,
  monto: number,
  motivo?: string
): Promise<void> {
  
  console.log('🔍 [EMAIL DEBUG] Iniciando envío de actualización de estado...')
  console.log('📧 Email:', email)
  console.log('📊 Estado:', estado)
  console.log('👤 Nombre:', nombreCompleto)
  console.log('💰 Monto:', monto)

  if (estado === 'Completado') {
    // Usar template específico para retiros completados
    const templateData = {
      solicitudId: `RET-${Date.now()}`, // Genera un ID temporal si no tienes uno
      nombreArtista: nombreCompleto,
      monto: monto.toLocaleString(),
      fechaCompletado: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      metodoPago: 'Transferencia bancaria',
      urlComprobante: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retiros/comprobante`, // URL temporal
      urlPanelArtista: `${process.env.NEXT_PUBLIC_BASE_URL}/artista/retiros`
    }

    // 🔍 DEBUG: Mostrar datos antes de renderizar
    console.log('🔍 [TEMPLATE DEBUG] Datos que se enviarán al template:')
    debugTemplate('retiro-completado', templateData)

    const html = renderTemplate('retiro-completado', templateData)
    
    // 🔍 DEBUG: Mostrar parte del HTML generado
    console.log('📄 [HTML DEBUG] Primeros 200 caracteres del HTML:')
    console.log(html.substring(0, 200) + '...')

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: `Backstage Pagos::: Tu retiro se ha completado`,
      html: html,
    }

    try {
      await sgMail.send(msg)
      console.log(`✅ [EMAIL SUCCESS] Retiro completado enviado a: ${email}`)
    } catch (error: any) {
      console.error(`❌ [EMAIL ERROR] Retiro completado a ${email}:`, error.response?.body || error)
      throw new Error(`Fallo al enviar actualización de estado.`)
    }

  } else {
    // Para otros estados, usar template genérico
    const templateData = {
      nombreCompleto,
      estado,
      montoFormateado: monto.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      motivo: motivo || ''
    }

    console.log('🔍 [TEMPLATE DEBUG] Datos para template genérico:')
    debugTemplate('cambio-estado', templateData)

    const html = renderTemplate('cambio-estado', templateData)

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: `Backstage Pagos::: Actualización de tu retiro`,
      html: html,
    }

    try {
      await sgMail.send(msg)
      console.log(`✅ [EMAIL SUCCESS] Actualización '${estado}' enviada a: ${email}`)
    } catch (error: any) {
      console.error(`❌ [EMAIL ERROR] Actualización estado a ${email}:`, error.response?.body || error)
      throw new Error(`Fallo al enviar actualización de estado.`)
    }
  }
}

/**
 * Nueva función específica para retiros completados (con debugging)
 */
export async function enviarRetiroCompletado(
  email: string,
  solicitudId: string,
  nombreArtista: string,
  monto: number
): Promise<void> {
  
  const templateData = {
    solicitudId: solicitudId,
    nombreArtista: nombreArtista,
    monto: monto.toLocaleString(),
    fechaCompletado: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }),
    metodoPago: 'Transferencia bancaria',
    urlComprobante: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retiros/${solicitudId}/comprobante`,
    urlPanelArtista: `${process.env.NEXT_PUBLIC_BASE_URL}/artista/retiros`
  }

  console.log('🎯 [RETIRO COMPLETADO] Enviando email específico...')
  debugTemplate('retiro-completado', templateData)

  const html = renderTemplate('retiro-completado', templateData)
  
  // Verificar que las variables se reemplazaron
  if (html.includes('{{')) {
    console.warn('⚠️ [TEMPLATE WARNING] Algunas variables no se reemplazaron en el HTML:')
    const unreplacedVars = html.match(/\{\{[^}]+\}\}/g)
    console.log('Variables sin reemplazar:', unreplacedVars)
  }

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: `Tu retiro #${solicitudId} ya está completado`,
    html: html,
  }

  try {
    await sgMail.send(msg)
    console.log(`✅ [EMAIL SUCCESS] Retiro completado enviado a: ${email}`)
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Retiro completado a ${email}:`, error.response?.body || error)
    throw new Error(`Fallo al enviar notificación de retiro completado.`)
  }
}

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
 * Envía un correo electrónico con un token de recuperación de contraseña.
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

export function debugearDatosEmail(titulo: string, data: any): void {
  console.log(`🔍 [${titulo}] Debugging datos de email:`);
  console.log('  - solicitudId:', data.solicitudId);
  console.log('  - nombreArtista:', data.nombreArtista);
  console.log('  - monto:', data.monto, typeof data.monto);
  console.log('  - nombreBanco:', data.nombreBanco);
  console.log('  - tipoCuenta:', data.tipoCuenta);
  console.log('  - ultimosDigitos:', data.ultimosDigitos);
  console.log('  - fecha:', data.fecha);
  console.log('  - Datos completos:', JSON.stringify(data, null, 2));
}

/**
 * Función de test para verificar templates
 */
export async function testTemplate(templateName: string, sampleData: Record<string, any>): Promise<string> {
  console.log(`🧪 [TEST] Probando template: ${templateName}`)
  debugTemplate(templateName, sampleData)
  
  const html = renderTemplate(templateName, sampleData)
  
  if (html.includes('{{')) {
    console.warn('⚠️ Variables sin reemplazar encontradas')
  } else {
    console.log('✅ Template renderizado correctamente')
  }
  
  return html
}