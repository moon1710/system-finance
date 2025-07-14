// src/email/templateEngine.ts
import fs from 'fs';
import path from 'path';

// Define los nombres de tus plantillas para tener autocompletado y evitar errores.
export type TemplateName = 'bienvenida' | 'confirmacion-retiro' | 'alerta-admin' | 'actualizacion-estado' | 'confirmacion-cambio-password' | 'recuperacion-password';

/**
 * Lee una plantilla HTML, inyecta los datos y devuelve el contenido final.
 * @param templateName - El nombre del archivo de la plantilla (sin .html).
 * @param data - Un objeto donde las claves son los nombres de los placeholders.
 * @returns El HTML como string con los datos inyectados.
 */
export function renderTemplate(templateName: TemplateName, data: Record<string, any>): string {
  try {
    // Construye la ruta al archivo de la plantilla
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', `${templateName}.html`);
    
    // Lee el contenido del archivo de forma síncrona
    let html = fs.readFileSync(templatePath, 'utf-8');
    
    // Reemplaza cada placeholder {{key}} con su valor correspondiente del objeto data
    for (const key in data) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    }
    
    return html;
  } catch (error) {
    console.error(`Error al renderizar la plantilla de email "${templateName}":`, error);
    // Devuelve un error o un HTML de fallback
    return `<p>Error: No se pudo cargar la plantilla de correo "${templateName}".</p>`;
  }
}