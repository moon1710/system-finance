// app/admin/alertas/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Interfaces de datos esperadas en el frontend
interface AlertaLocal {
  tipo: string;
  mensaje: string;
  nivel: 'warning' | 'danger';
}

interface SolicitudUrgenteLocal {
  id: string;
  usuarioNombre: string;
  monto: string;
  fecha: string;
  alertas: AlertaLocal[];
  requiereRevision: boolean; // Determinada por la existencia de alertas
}

interface ResumenAlertasLocal {
  totalAlertas: number;
  alertasNoResueltas: number;
  montoTotalAlertas: string;
  porTipo: {
    montoAlto: number;
    retirosMultiples: number;
    patronSospechoso: number; // No hay datos para esto en tu JSON, se inicializará en 0
    cuentaNueva: number;
  };
}

// Interfaces de la respuesta directa de la API (para mejor tipado al recibir datos)
interface RetiroAPI {
  id: string;
  usuarioId: string;
  cuentaBancariaId: string;
  montoSolicitado: string;
  estado: string;
  urlComprobante: string | null;
  notasAdmin: string | null;
  fechaSolicitud: string;
  fechaActualizacion: string;
  usuario: {
    id: string;
    nombreCompleto: string;
    email: string;
  };
  cuentaBancaria: {
    tipoCuenta: string;
    nombreTitular: string;
  };
  alertas: {
    id: string;
    retiroId: string;
    tipo: string;
    mensaje: string;
    resuelta: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
}

interface StatsAPI {
  total: number;
  pendientes: number;
  conAlertas: number;
  requierenRevision: number;
}

interface APIResponse {
  success: boolean;
  retiros: RetiroAPI[];
  stats: StatsAPI;
}

export default function AlertasDashboard() {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenAlertasLocal | null>(null);
  const [solicitudesUrgentes, setSolicitudesUrgentes] = useState<SolicitudUrgenteLocal[]>([]);
  const [configuracion, setConfiguracion] = useState({
    montoAlto: 50000,
    maxRetirosMes: 1,
    diasRevisionRapida: 7, // Este umbral no se usa en el procesamiento actual de alertas
  });
  const [editandoConfig, setEditandoConfig] = useState(false);
  const router = useRouter();

  // Función para obtener el color y estilo de la alerta
  const getNivelColor = (nivel: 'warning' | 'danger') => {
    return nivel === 'danger' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100';
  };

  // Función para obtener el icono de la alerta
  const getTipoAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'MONTO_ALTO':
        return '💰';
      case 'RETIROS_MULTIPLES':
        return '🔄';
      case 'PATRON_SOSPECHOSO':
        return '⚠️';
      case 'CUENTA_NUEVA':
        return '🆕';
      default:
        return '📌';
    }
  };

  // Carga de los datos principales del dashboard
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/alertas');
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/login');
        } else {
          console.error('Error al cargar alertas:', res.statusText);
        }
        return;
      }

      const data: APIResponse = await res.json();

      // Mapeo de retiros de la API a SolicitudUrgenteLocal
      const mappedSolicitudes: SolicitudUrgenteLocal[] = data.retiros.map(retiro => {
        const alertasLocales: AlertaLocal[] = retiro.alertas.map(alerta => ({
          tipo: alerta.tipo,
          mensaje: alerta.mensaje,
          // Determinar el nivel basado en el tipo de alerta (ejemplo de lógica)
          nivel: (alerta.tipo === 'MONTO_ALTO' || alerta.tipo === 'RETIROS_MULTIPLES') ? 'danger' : 'warning',
        }));

        // Una solicitud requiere revisión si tiene alguna alerta no resuelta
        const requiereRevision = alertasLocales.length > 0;

        return {
          id: retiro.id,
          usuarioNombre: retiro.usuario.nombreCompleto,
          monto: retiro.montoSolicitado,
          fecha: retiro.fechaSolicitud,
          alertas: alertasLocales,
          requiereRevision: requiereRevision,
        };
      });

      // Filtrar solo las solicitudes que requieren atención inmediata para la tabla
      const solicitudesParaTabla = mappedSolicitudes.filter(sol => sol.requiereRevision);
      setSolicitudesUrgentes(solicitudesParaTabla);

      // Cálculo del resumen de alertas
      const totalAlertas = mappedSolicitudes.reduce((sum, sol) => sum + sol.alertas.length, 0);
      const alertasNoResueltas = mappedSolicitudes.reduce((sum, sol) =>
        sum + sol.alertas.filter(alerta => alerta.nivel === 'danger' || alerta.nivel === 'warning').length, 0); // Asumiendo que cualquier alerta es "no resuelta" si se muestra aquí
      const montoTotalAlertas = mappedSolicitudes
        .filter(sol => sol.requiereRevision)
        .reduce((sum, sol) => sum + parseFloat(sol.monto), 0)
        .toFixed(2);

      const porTipo = {
        montoAlto: mappedSolicitudes.filter(sol => sol.alertas.some(alerta => alerta.tipo === 'MONTO_ALTO')).length,
        retirosMultiples: mappedSolicitudes.filter(sol => sol.alertas.some(alerta => alerta.tipo === 'RETIROS_MULTIPLES')).length,
        patronSospechoso: mappedSolicitudes.filter(sol => sol.alertas.some(alerta => alerta.tipo === 'PATRON_SOSPECHOSO')).length, // Se basará en el mapeo, si no hay en la API, será 0
        cuentaNueva: mappedSolicitudes.filter(sol => sol.alertas.some(alerta => alerta.tipo === 'CUENTA_NUEVA')).length,
      };

      setResumen({
        totalAlertas,
        alertasNoResueltas,
        montoTotalAlertas,
        porTipo,
      });

    } catch (error) {
      console.error('Error en cargarDatos:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Carga de la configuración
  const cargarConfiguracion = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/alertas/configuracion');
      if (res.ok) {
        const data = await res.json();
        setConfiguracion(data.configuracion);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }, []);

  // Guardar la configuración
  const guardarConfiguracion = async () => {
    try {
      const res = await fetch('/api/admin/alertas/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuracion),
      });

      if (res.ok) {
        setEditandoConfig(false);
        alert('Configuración actualizada');
        cargarDatos(); // Recargar datos con la nueva configuración
      } else {
        alert('Error al guardar configuración');
        console.error('Error al guardar configuración:', res.statusText);
      }
    } catch (error) {
      alert('Error al guardar configuración');
      console.error('Error al guardar configuración:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
    cargarConfiguracion();
  }, [cargarDatos, cargarConfiguracion]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-gray-700">
        Cargando alertas...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Centro de Alertas</h1>
        <p className="text-gray-600 mt-2">Monitoreo de solicitudes que requieren atención especial</p>
      </div>

      {/* Resumen de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Alertas</p>
              <p className="text-2xl font-semibold text-gray-900">{resumen?.totalAlertas || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Alertas No Resueltas</p>
              <p className="text-2xl font-semibold text-gray-900">{resumen?.alertasNoResueltas || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Montos Altos</p>
              <p className="text-2xl font-semibold text-gray-900">{resumen?.porTipo.montoAlto || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Monto Total con Alertas</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${parseFloat(resumen?.montoTotalAlertas || '0').toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tipos de Alertas */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-lg font-semibold mb-4">Distribución de Alertas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm text-gray-600">Montos Altos</p>
            <p className="text-xl font-semibold">{resumen?.porTipo.montoAlto || 0}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔄</div>
            <p className="text-sm text-gray-600">Retiros Múltiples</p>
            <p className="text-xl font-semibold">{resumen?.porTipo.retirosMultiples || 0}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-sm text-gray-600">Patrón Sospechoso</p>
            <p className="text-xl font-semibold">{resumen?.porTipo.patronSospechoso || 0}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🆕</div>
            <p className="text-sm text-gray-600">Cuenta Nueva</p>
            <p className="text-xl font-semibold">{resumen?.porTipo.cuentaNueva || 0}</p>
          </div>
        </div>
      </div>

      {/* Solicitudes Urgentes */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Solicitudes que Requieren Atención Inmediata</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alertas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {solicitudesUrgentes.length > 0 ? (
                solicitudesUrgentes.map((solicitud) => (
                  <tr key={solicitud.id} className={solicitud.requiereRevision ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{solicitud.usuarioNombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-semibold">
                        ${parseFloat(solicitud.monto).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {solicitud.alertas.map((alerta, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNivelColor(alerta.nivel)}`}
                          >
                            {getTipoAlertaIcon(alerta.tipo)} {alerta.mensaje}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(solicitud.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/admin/retiros/${solicitud.id}`)}
                        className="text-blue-600 hover:text-sky-950 font-medium"
                      >
                        Revisar →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No hay solicitudes urgentes en este momento
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuración de Umbrales */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Configuración de Umbrales</h2>
          <button
            onClick={() => editandoConfig ? guardarConfiguracion() : setEditandoConfig(true)}
            className={`px-4 py-2 rounded ${editandoConfig
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            {editandoConfig ? 'Guardar' : 'Editar'}
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="montoAlto" className="block text-sm font-medium text-gray-700 mb-1">
              Monto Alto (USD)
            </label>
            <input
              type="number"
              id="montoAlto"
              disabled={!editandoConfig}
              value={configuracion.montoAlto}
              onChange={(e) => setConfiguracion({ ...configuracion, montoAlto: parseInt(e.target.value) })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Retiros iguales o mayores a este monto generarán alerta
            </p>
          </div>

          <div>
            <label htmlFor="maxRetirosMes" className="block text-sm font-medium text-gray-700 mb-1">
              Máximo Retiros por Mes
            </label>
            <input
              type="number"
              id="maxRetirosMes"
              disabled={!editandoConfig}
              value={configuracion.maxRetirosMes}
              onChange={(e) => setConfiguracion({ ...configuracion, maxRetirosMes: parseInt(e.target.value) })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Más retiros que este número en un mes generarán alerta
            </p>
          </div>

          <div>
            <label htmlFor="diasRevisionRapida" className="block text-sm font-medium text-gray-700 mb-1">
              Días para Revisión Rápida
            </label>
            <input
              type="number"
              id="diasRevisionRapida"
              disabled={!editandoConfig}
              value={configuracion.diasRevisionRapida}
              onChange={(e) => setConfiguracion({ ...configuracion, diasRevisionRapida: parseInt(e.target.value) })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Retiros múltiples en este período se consideran patrón sospechoso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}