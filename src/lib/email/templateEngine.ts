import { readFileSync } from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

// Registrar un helper para comparar strings en las plantillas.
// Esto permite usar sintaxis como: {{#if (eq estado "Aprobado")}}
Handlebars.registerHelper('eq', (a, b) => a === b);

/**
 * Renderiza un template HTML usando Handlebars.js.
 * @param templateName - Nombre del archivo de la plantilla (sin .html).
 * @param data - Objeto con los datos para la plantilla.
 * @returns El HTML renderizado.
 */
export function renderTemplate(templateName: string, data: Record<string, any>): string {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', `${templateName}.html`);
    const source = readFileSync(templatePath, 'utf-8');

    // Compilar la plantilla una vez.
    const compiledTemplate = Handlebars.compile(source);

    // Renderizar la plantilla con los datos.
    const result = compiledTemplate(data);
    
    console.log(`✅ [TEMPLATE] Plantilla '${templateName}' renderizada exitosamente con Handlebars.`);
    
    return result;

  } catch (error: any) {
    console.error(`❌ [TEMPLATE ERROR] Error renderizando plantilla '${templateName}' con Handlebars:`, error);
    
    // Devolver un HTML de fallback en caso de error.
    return `
      <html><body>
        <h1>Error en el sistema de plantillas</h1>
        <p>No se pudo cargar la plantilla: ${templateName}</p>
        <p>Error: ${error.message}</p>
      </body></html>
    `;
  }
}

/**
 * Función auxiliar para debug - muestra qué variables están disponibles para Handlebars.
 */
export function debugTemplate(templateName: string, data: Record<string, any>): void {
  console.log(`🔍 [TEMPLATE DEBUG] Plantilla: ${templateName}`);
  console.log('📋 Variables disponibles:', Object.keys(data));
  console.log('📄 Datos completos:', JSON.stringify(data, null, 2));
}
