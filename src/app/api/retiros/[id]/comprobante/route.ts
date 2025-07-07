// /src/app/api/retiros/[id]/comprobante/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { subirComprobante, obtenerRetiroPorId } from '@/lib/services/retiros'
import fs from 'fs'
import path from 'path'

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

    // Subir comprobante usando el servicio
    const resultado = await subirComprobante(id, session.userId, archivo)

    if (!resultado.exito) {
      return NextResponse.json(
        { 
          error: resultado.mensaje,
          errores: resultado.errores 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: resultado.mensaje,
      data: resultado.data
    })

  } catch (error) {
    console.error('Error en POST /api/retiros/[id]/comprobante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al subir comprobante' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/retiros/[id]/comprobante
 * Descargar comprobante de forma segura
 * - Artistas: solo pueden descargar sus propios comprobantes
 * - Admins: solo pueden descargar comprobantes de sus artistas asignados
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

    // Verificar permisos para ver este retiro
    const resultadoRetiro = await obtenerRetiroPorId(id, session.userId)

    if (!resultadoRetiro.exito) {
      return NextResponse.json(
        { error: 'Retiro no encontrado o sin permisos' },
        { status: 404 }
      )
    }

    const retiro = resultadoRetiro.data

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
    if (!fs.existsSync(rutaArchivo)) {
      console.error(`Archivo no encontrado: ${rutaArchivo}`)
      return NextResponse.json(
        { error: 'Archivo de comprobante no encontrado' },
        { status: 404 }
      )
    }

    // Leer el archivo
    const archivoBuffer = fs.readFileSync(rutaArchivo)
    
    // Obtener información del archivo
    const stats = fs.statSync(rutaArchivo)
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