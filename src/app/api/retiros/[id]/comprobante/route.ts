// /src/app/api/retiros/[id]/comprobante/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { writeFile, readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { enviarActualizacionEstado } from '@/lib/email/emailService'
import { renderTemplate } from '@/lib/email/templateEngine'

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
    // ✅ FIX 1: Await params para Next.js 15
    const { id } = await params
    
    // Verificación de sesión
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)
    if (!session.isLoggedIn || session.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
    }

    // Validación de archivo
    const formData = await request.formData()
    const archivo = formData.get('comprobante') as File
    if (!archivo) {
      return NextResponse.json({ error: 'No se ha enviado ningún archivo' }, { status: 400 })
    }

    // Verificar retiro existente
    const retiro = await prisma.retiro.findUnique({ where: { id } })
    if (!retiro || retiro.estado !== 'Procesando') {
      return NextResponse.json({ error: 'Retiro no válido para esta operación' }, { status: 400 })
    }

    // Crear directorio y guardar archivo
    const uploadsDir = path.join(process.cwd(), 'uploads', 'comprobantes')
    try {
      await stat(uploadsDir)
    } catch {
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const extension = path.extname(archivo.name)
    const nombreArchivo = `comprobante_${id}_${timestamp}${extension}`
    const rutaArchivo = path.join(uploadsDir, nombreArchivo)
    const buffer = Buffer.from(await archivo.arrayBuffer())
    await writeFile(rutaArchivo, buffer)
    const urlComprobante = `uploads/comprobantes/${nombreArchivo}`

    // ✅ FIX 2: Actualizar retiro SIN include para obtener todos los campos
    const retiroActualizado = await prisma.retiro.update({
      where: { id },
      data: {
        estado: 'Completado',
        urlComprobante: urlComprobante,
        fechaActualizacion: new Date()
      }
    })

    // ✅ FIX 3: Obtener datos del usuario por separado
    const usuario = await prisma.usuario.findUnique({
      where: { id: retiroActualizado.usuarioId },
      select: {
        nombreCompleto: true,
        email: true
      }
    })

    console.log('🔍 Datos para email:', {
      email: usuario?.email,
      nombreCompleto: usuario?.nombreCompleto,
      monto: retiroActualizado.montoSolicitado,
      montoType: typeof retiroActualizado.montoSolicitado
    })

    // Enviar email de notificación
    try {
      if (usuario?.email && usuario?.nombreCompleto && retiroActualizado.montoSolicitado !== null) {
        console.log('📧 INTENTANDO ENVIAR EMAIL...')
        
        // Convertir Decimal a number para el email
        const montoNumerico = Number(retiroActualizado.montoSolicitado)

        // 🔥 AQUÍ ES DONDE AGREGAS EL DEBUG DEL TEMPLATE:
        // ------- AGREGA ESTO JUSTO AQUÍ -------
        const testHtml = renderTemplate('retiro-completado', {
          solicitudId: id,
          nombreArtista: usuario.nombreCompleto,
          monto: montoNumerico.toLocaleString(),
          fechaCompletado: new Date().toLocaleDateString('es-ES')
        })

        console.log('🧪 ¿Variables sin reemplazar?', testHtml.includes('{{'))
        console.log('📄 HTML preview:', testHtml.substring(0, 200))
        // ------- FIN DE LO QUE AGREGAS -------
        
        await enviarActualizacionEstado(
          usuario.email,
          'Completado',
          usuario.nombreCompleto,
          montoNumerico
        )
        
        console.log(`✅ [EMAIL] Notificación de retiro 'Completado' enviada a: ${usuario.email}`)
      } else {
        console.warn(`❌ [EMAIL WARN] Faltan datos del usuario o monto es null`, {
          email: usuario?.email,
          nombre: usuario?.nombreCompleto,
          monto: retiroActualizado.montoSolicitado
        })
      }
    } catch (emailError) {
      console.error(`💥 [EMAIL ERROR] Error completo:`, emailError)
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Comprobante subido y retiro completado exitosamente',
      data: {
        urlComprobante,
        retiro: {
          ...retiroActualizado,
          usuario
        }
      }
    })

  } catch (error) {
    console.error('Error al subir comprobante:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: 'Error interno del servidor al subir el comprobante' }, { status: 500 })
  }
}

/**
 * GET /api/retiros/[id]/comprobante
 * Descargar comprobante
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('=== DEBUG GET COMPROBANTE ===')
    
    // ✅ FIX 4: Await params para Next.js 15
    const { id } = await params
    console.log('1. ID recibido:', id)
    
    // Verificar sesión
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)
    
    if (!session.isLoggedIn) {
      return NextResponse.json({ 
        error: 'Usuario no autenticado',
        debug: 'session.isLoggedIn es false'
      }, { status: 401 })
    }
    
    if (session.rol !== 'admin') {
      return NextResponse.json({ 
        error: 'Acceso denegado - Solo administradores',
        debug: `Rol actual: ${session.rol}, requerido: admin`
      }, { status: 403 })
    }

    // Buscar retiro
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

    if (!retiro) {
      return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 })
    }

    if (!retiro.urlComprobante) {
      return NextResponse.json({ error: 'Este retiro no tiene comprobante' }, { status: 404 })
    }

    if (retiro.estado !== 'Completado') {
      return NextResponse.json({ 
        error: 'Solo se pueden ver comprobantes de retiros completados',
        debug: `Estado actual: ${retiro.estado}`
      }, { status: 400 })
    }

    // Verificar archivo físico
    const rutaArchivo = path.join(process.cwd(), retiro.urlComprobante)
    
    if (!existsSync(rutaArchivo)) {
      return NextResponse.json({ 
        error: 'Archivo no encontrado en el servidor',
        debug: `Archivo buscado en: ${rutaArchivo}`
      }, { status: 404 })
    }

    // Servir archivo
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

    const response = new NextResponse(archivoBuffer)
    response.headers.set('Content-Type', mimeType)
    response.headers.set('Content-Length', stats.size.toString())
    response.headers.set('Content-Disposition', `inline; filename="${nombreArchivo}"`)
    response.headers.set('Access-Control-Allow-Origin', '*')
    
    return response

  } catch (error) {
    console.error('💥 ERROR CRÍTICO en GET comprobante:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({
      error: 'Error interno del servidor',
      debug: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}