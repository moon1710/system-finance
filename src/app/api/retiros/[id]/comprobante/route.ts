// /src/app/api/retiros/[id]/comprobante/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { obtenerRetiroPorId } from '@/lib/services/retiros'
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

    console.log('Archivo recibido:', archivo?.name, archivo?.size)

    if (!archivo) {
      return NextResponse.json(
        { error: 'No se ha enviado ningún archivo' },
        { status: 400 }
      )
    }

    // Validar archivo básico
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

    console.log('Retiro encontrado:', retiro.estado)

    // Crear directorio si no existe
    const uploadsDir = path.join(process.cwd(), 'uploads', 'comprobantes')
    
    try {
      await stat(uploadsDir)
    } catch {
      // El directorio no existe, crearlo
      const { mkdir } = require('fs/promises')
      await mkdir(uploadsDir, { recursive: true })
      console.log('Directorio creado:', uploadsDir)
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const extension = path.extname(archivo.name)
    const nombreArchivo = `comprobante_${id}_${timestamp}${extension}`
    const rutaArchivo = path.join(uploadsDir, nombreArchivo)

    console.log('Guardando en:', rutaArchivo)

    // Convertir File a Buffer y guardar
    const arrayBuffer = await archivo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(rutaArchivo, buffer)

    console.log('Archivo guardado exitosamente')

    // URL relativa para la BD (sin slash inicial)
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

    console.log('Retiro completado:', retiroActualizado.estado)

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
 * Descargar comprobante de forma segura
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Verificar autenticación
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de retiro requerido' },
        { status: 400 }
      )
    }

    // Obtener retiro
    const retiro = await prisma.retiro.findUnique({
      where: { id },
      include: {
        usuario: true
      }
    })

    if (!retiro) {
      return NextResponse.json(
        { error: 'Retiro no encontrado' },
        { status: 404 }
      )
    }

    // TEMPORAL: Permitir a cualquier admin o al artista dueño
    const puedeVer = session.rol === 'admin' || 
                     (session.rol === 'artista' && retiro.usuarioId === session.userId)

    if (!puedeVer) {
      return NextResponse.json(
        { error: 'Sin permisos para ver este comprobante' },
        { status: 403 }
      )
    }

    // Verificar que el retiro tenga comprobante
    if (!retiro.urlComprobante) {
      return NextResponse.json(
        { error: 'Este retiro no tiene comprobante disponible' },
        { status: 404 }
      )
    }

    // Verificar que el retiro esté completado
    if (retiro.estado !== 'Completado') {
      return NextResponse.json(
        { error: 'Solo se pueden descargar comprobantes de retiros completados' },
        { status: 400 }
      )
    }

    // Construir la ruta del archivo
    const rutaArchivo = path.join(process.cwd(), retiro.urlComprobante)

    // Verificar que el archivo existe
    if (!existsSync(rutaArchivo)) {
      console.error(`Archivo no encontrado: ${rutaArchivo}`)
      return NextResponse.json(
        { error: 'Archivo de comprobante no encontrado' },
        { status: 404 }
      )
    }

    // Leer el archivo
    const archivoBuffer = await readFile(rutaArchivo)
    
    // Obtener información del archivo
    const stats = await stat(rutaArchivo)
    const nombreArchivo = path.basename(rutaArchivo)
    const extension = path.extname(nombreArchivo).toLowerCase()
    
    // Determinar el tipo MIME
    let mimeType = 'application/octet-stream'
    switch (extension) {
      case '.pdf':
        mimeType = 'application/pdf'
        break
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg'
        break
      case '.png':
        mimeType = 'image/png'
        break
    }

    // Crear respuesta con el archivo
    const response = new NextResponse(archivoBuffer)
    
    // Establecer headers apropiados
    response.headers.set('Content-Type', mimeType)
    response.headers.set('Content-Length', stats.size.toString())
    response.headers.set('Content-Disposition', `attachment; filename="${nombreArchivo}"`)
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error('Error en GET /api/retiros/[id]/comprobante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al descargar comprobante' },
      { status: 500 }
    )
  }
}