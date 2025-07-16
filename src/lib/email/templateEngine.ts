// /src/lib/email/templateEngine.ts

import { readFileSync } from 'fs'
import path from 'path'

/**
 * Motor de plantillas simple pero efectivo
 */
export function renderTemplate(templateName: string, data: Record<string, any>): string {
  try {
    // Construir la ruta del template
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', `${templateName}.html`)
    
    // Leer el archivo HTML
    let htmlContent = readFileSync(templatePath, 'utf-8')
    
    // Función para reemplazar variables de forma recursiva
    const replaceVariables = (content: string, variables: Record<string, any>): string => {
      let result = content
      
      // Reemplazar variables simples {{variable}}
      Object.keys(variables).forEach(key => {
        const value = variables[key]
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        
        // Convertir el valor a string de forma segura
        const stringValue = value !== null && value !== undefined ? String(value) : ''
        result = result.replace(regex, stringValue)
      })
      
      return result
    }
    
    // Procesar variables anidadas (opcional)
    const flattenData = (obj: Record<string, any>, prefix = ''): Record<string, any> => {
      const flattened: Record<string, any> = {}
      
      Object.keys(obj).forEach(key => {
        const value = obj[key]
        const newKey = prefix ? `${prefix}.${key}` : key
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenData(value, newKey))
        } else {
          flattened[newKey] = value
        }
      })
      
      return flattened
    }
    
    // Aplanar datos para manejar objetos anidados
    const flatData = flattenData(data)
    
    // Reemplazar todas las variables
    htmlContent = replaceVariables(htmlContent, flatData)
    
    // Limpiar variables no reemplazadas (opcional)
    htmlContent = htmlContent.replace(/\{\{\s*\w+[\w.]*\s*\}\}/g, '')
    
    console.log(`✅ [TEMPLATE] Template '${templateName}' renderizado correctamente`)
    
    return htmlContent
    
  } catch (error) {
    console.error(`❌ [TEMPLATE ERROR] Error renderizando template '${templateName}':`, error)
    
    // Template de fallback
    return `
      <html>
        <body>
          <h1>Error en el template</h1>
          <p>No se pudo cargar el template: ${templateName}</p>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `
  }
}

/**
 * Función auxiliar para debug - muestra qué variables están disponibles
 */
export function debugTemplate(templateName: string, data: Record<string, any>): void {
  console.log(`🔍 [TEMPLATE DEBUG] Template: ${templateName}`)
  console.log('📋 Variables disponibles:', Object.keys(data))
  console.log('📄 Datos completos:', JSON.stringify(data, null, 2))
}

/**
 * Verifica si un template existe
 */
export function templateExists(templateName: string): boolean {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', `${templateName}.html`)
    readFileSync(templatePath, 'utf-8')
    return true
  } catch {
    return false
  }
}

/**
 * Lista todos los templates disponibles
 */
export function listTemplates(): string[] {
  try {
    const templatesDir = path.join(process.cwd(), 'src', 'lib', 'email', 'templates')
    const fs = require('fs')
    const files = fs.readdirSync(templatesDir)
    return files.filter(file => file.endsWith('.html')).map(file => file.replace('.html', ''))
  } catch {
    return []
  }
}