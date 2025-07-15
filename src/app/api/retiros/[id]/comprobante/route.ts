// /src/app/api/retiros/[id]/comprobante/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { writeFile, readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/retiros/[id]/comprobante
 * Subir comprobante de pago (solo admins)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    console.log('=== SUBIR COMPROBANTE ===')
    console.log('ID retiro:', id)
    
    // Verificar autenticación
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Solo admins pueden subir comprobantes
    if (session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden subir comprobantes' },
        { status: 403 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de retiro requerido' },
        { status: 400 }
      )
    }

    // Obtener archivo del FormData
    const formData = await request.formData()
    const archivo = formData.get('comprobante') as File

    if (!archivo) {
      return NextResponse.json(
        { error: 'No se ha enviado ningún archivo' },
        { status: 400 }
      )
    }

    // Validar archivo
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (archivo.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo no puede exceder 5MB' },
        { status: 400 }
      )
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(archivo.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Use PDF, JPG o PNG' },
        { status: 400 }
      )
    }

    // Obtener retiro y verificar estado
    const retiro = await prisma.retiro.findUnique({
      where: { id }
    })

    if (!retiro) {
      return NextResponse.json(
        { error: 'Retiro no encontrado' },
        { status: 404 }
      )
    }

    if (retiro.estado !== 'Procesando') {
      return NextResponse.json(
        { error: 'Solo se pueden subir comprobantes a retiros en estado "Procesando"' },
        { status: 400 }
      )
    }

    // Crear directorio uploads/comprobantes
    const uploadsDir = path.join(process.cwd(), 'uploads', 'comprobantes')
    
    try {
      await stat(uploadsDir)
    } catch {
      const { mkdir } = require('fs/promises')
      await mkdir(uploadsDir, { recursive: true })
      console.log('Directorio uploads creado:', uploadsDir)
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const extension = path.extname(archivo.name)
    const nombreArchivo = `comprobante_${id}_${timestamp}${extension}`
    const rutaArchivo = path.join(uploadsDir, nombreArchivo)

    // Guardar archivo
    const arrayBuffer = await archivo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(rutaArchivo, buffer)

    // URL para la BD
    const urlComprobante = `uploads/comprobantes/${nombreArchivo}`

    // Completar el retiro
    const retiroActualizado = await prisma.retiro.update({
      where: { id },
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
    })

    return NextResponse.json({
      success: true,
      mensaje: 'Comprobante subido y retiro completado exitosamente',
      data: {
        urlComprobante,
        retiro: retiroActualizado
      }
    })

  } catch (error) {
    console.error('Error al subir comprobante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al subir el comprobante' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/retiros/[id]/comprobante
 * Descargar comprobante - VERSION CON DEBUG COMPLETO
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('=== DEBUG GET COMPROBANTE ===')
    
    const { id } = params
    console.log('1. ID recibido:', id)
    
    // HEADERS DEBUG
    console.log('2. Headers de la petición:')
    console.log('   - Origin:', request.headers.get('origin'))
    console.log('   - Referer:', request.headers.get('referer'))
    console.log('   - User-Agent:', request.headers.get('user-agent'))
    console.log('   - Cookie:', request.headers.get('cookie'))
    
    // Verificar sesión paso a paso
    console.log('3. Obteniendo sesión...')
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)
    
    console.log('4. Estado de la sesión:')
    console.log('   - isLoggedIn:', session.isLoggedIn)
    console.log('   - userId:', session.userId)
    console.log('   - rol:', session.rol)
    
    // PRIMERA VERIFICACIÓN: Sesión
    if (!session.isLoggedIn) {
      console.log('❌ Error: Usuario no logueado')
      return NextResponse.json({ 
        error: 'Usuario no autenticado',
        debug: 'session.isLoggedIn es false'
      }, { status: 401 })
    }
    
    if (!session.userId) {
      console.log('❌ Error: No hay userId en sesión')
      return NextResponse.json({ 
        error: 'Usuario no autenticado',
        debug: 'session.userId es null/undefined'
      }, { status: 401 })
    }
    
    // SEGUNDA VERIFICACIÓN: Rol
    if (session.rol !== 'admin') {
      console.log('❌ Error: Usuario no es admin, rol actual:', session.rol)
      return NextResponse.json({ 
        error: 'Acceso denegado - Solo administradores',
        debug: `Rol actual: ${session.rol}, requerido: admin`
      }, { status: 403 })
    }
    
    console.log('✅ Verificaciones de sesión pasadas')

    // TERCERA VERIFICACIÓN: ID
    if (!id) {
      console.log('❌ Error: ID no proporcionado')
      return NextResponse.json({ error: 'ID de retiro requerido' }, { status: 400 })
    }

    // CUARTA VERIFICACIÓN: Retiro en BD
    console.log('5. Buscando retiro en BD...')
    const retiro = await prisma.retiro.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            email: true
          }
        }
      }
    })

    console.log('6. Retiro encontrado:', {
      existe: !!retiro,
      estado: retiro?.estado,
      tieneComprobante: !!retiro?.urlComprobante
    })

    if (!retiro) {
      console.log('❌ Error: Retiro no encontrado en BD')
      return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 })
    }

    if (!retiro.urlComprobante) {
      console.log('❌ Error: Retiro sin comprobante')
      return NextResponse.json({ error: 'Este retiro no tiene comprobante' }, { status: 404 })
    }

    if (retiro.estado !== 'Completado') {
      console.log('❌ Error: Retiro no completado, estado:', retiro.estado)
      return NextResponse.json({ 
        error: 'Solo se pueden ver comprobantes de retiros completados',
        debug: `Estado actual: ${retiro.estado}`
      }, { status: 400 })
    }

    // QUINTA VERIFICACIÓN: Archivo físico
    console.log('7. Verificando archivo físico...')
    const rutaArchivo = path.join(process.cwd(), retiro.urlComprobante)
    console.log('   - Ruta construida:', rutaArchivo)
    console.log('   - URL en BD:', retiro.urlComprobante)

    if (!existsSync(rutaArchivo)) {
      console.log('❌ Error: Archivo no encontrado en el sistema de archivos')
      console.log('   - Ruta buscada:', rutaArchivo)
      return NextResponse.json({ 
        error: 'Archivo no encontrado en el servidor',
        debug: `Archivo buscado en: ${rutaArchivo}`
      }, { status: 404 })
    }

    console.log('✅ Archivo encontrado, leyendo...')

    // SERVIR ARCHIVO
    const archivoBuffer = await readFile(rutaArchivo)
    const stats = await stat(rutaArchivo)
    const nombreArchivo = path.basename(rutaArchivo)
    const extension = path.extname(nombreArchivo).toLowerCase()
    
    let mimeType = 'application/octet-stream'
    switch (extension) {
      case '.pdf': mimeType = 'application/pdf'; break
      case '.jpg': case '.jpeg': mimeType = 'image/jpeg'; break
      case '.png': mimeType = 'image/png'; break
    }

    console.log('8. Sirviendo archivo:')
    console.log('   - Nombre:', nombreArchivo)
    console.log('   - Tamaño:', stats.size, 'bytes')
    console.log('   - MIME Type:', mimeType)

    const response = new NextResponse(archivoBuffer)
    response.headers.set('Content-Type', mimeType)
    response.headers.set('Content-Length', stats.size.toString())
    response.headers.set('Content-Disposition', `inline; filename="${nombreArchivo}"`)
    
    // HEADERS ADICIONALES PARA EVITAR PROBLEMAS DE CORS/ORIGEN
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    console.log('✅ Archivo servido exitosamente')
    return response

  } catch (error) {
    console.error('💥 ERROR CRÍTICO en GET comprobante:', error)
    console.error('Stack trace:', error.stack)
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      debug: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}