// /src/app/api/admin/retiros/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { obtenerSolicitudesPorAdmin } from '@/lib/services/retiros'

/**
 * GET /api/admin/retiros
 * Obtener todas las solicitudes de retiro de los artistas asignados al admin
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener sesión
    const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Solo admins pueden acceder a esta ruta
    if (session.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden ver solicitudes de retiro' },
        { status: 403 }
      )
    }

    // Obtener parámetros de consulta opcionales
    const url = new URL(request.url)
    const estado = url.searchParams.get('estado')
    const conAlertas = url.searchParams.get('alertas') === 'true'
    const limite = parseInt(url.searchParams.get('limite') || '50')
    const pagina = parseInt(url.searchParams.get('pagina') || '1')

    // Obtener solicitudes
    const resultado = await obtenerSolicitudesPorAdmin(session.userId)

    if (!resultado.exito) {
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      )
    }

    let solicitudes = resultado.data

    // Aplicar filtros opcionales
    if (estado) {
      solicitudes = solicitudes.filter((retiro: any) => retiro.estado === estado)
    }

    if (conAlertas) {
      solicitudes = solicitudes.filter((retiro: any) => retiro.requiereRevision === true)
    }

    // Aplicar paginación
    const inicio = (pagina - 1) * limite
    const fin = inicio + limite
    const solicitudesPaginadas = solicitudes.slice(inicio, fin)

    // Calcular estadísticas para el dashboard
    const estadisticas = {
      total: solicitudes.length,
      pendientes: solicitudes.filter((r: any) => r.estado === 'Pendiente').length,
      procesando: solicitudes.filter((r: any) => r.estado === 'Procesando').length,
      completados: solicitudes.filter((r: any) => r.estado === 'Completado').length,
      rechazados: solicitudes.filter((r: any) => r.estado === 'Rechazado').length,
      conAlertas: solicitudes.filter((r: any) => r.requiereRevision === true).length,
      montoTotalPendiente: solicitudes
        .filter((r: any) => r.estado === 'Pendiente' || r.estado === 'Procesando')
        .reduce((sum: number, r: any) => sum + parseFloat(r.montoSolicitado.toString()), 0),
      montoTotalCompletado: solicitudes
        .filter((r: any) => r.estado === 'Completado')
        .reduce((sum: number, r: any) => sum + parseFloat(r.montoSolicitado.toString()), 0)
    }

    return NextResponse.json({
      success: true,
      solicitudes: solicitudesPaginadas,
      estadisticas,
      paginacion: {
        paginaActual: pagina,
        totalPaginas: Math.ceil(solicitudes.length / limite),
        totalElementos: solicitudes.length,
        elementosPorPagina: limite
      }
    })

  } catch (error) {
    console.error('Error en GET /api/admin/retiros:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}