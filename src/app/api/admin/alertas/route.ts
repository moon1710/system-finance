// app/api/admin/alertas/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  // Aquí deberías obtener los datos reales de tu base de datos o servicio.
  const mockData = {
    success: true,
    retiros: [
      {
        id: 'cef02730-b592-4048-a2f7-18e195ff7f20',
        usuarioId: '0c877f86-f33e-4043-93de-e0ddcee19b5c',
        cuentaBancariaId: '12c7a101-dc62-41b9-9424-866141909644',
        montoSolicitado: '1200',
        estado: 'Pendiente',
        urlComprobante: null,
        notasAdmin: 'notas de artista',
        fechaSolicitud: '2025-07-08T05:19:00.584Z',
        fechaActualizacion: '2025-07-08T05:19:00.584Z',
        usuario: {
          id: '0c877f86-f33e-4043-93de-e0ddcee19b5c',
          nombreCompleto: 'artistaPrueba',
          email: 'artistaPrueba@sistema01.com'
        },
        cuentaBancaria: {
          tipoCuenta: 'paypal',
          nombreTitular: 'Monse Caballero'
        },
        alertas: [
          {
            id: '23ea0e9b-7674-4a10-af78-ce588e3dac67',
            retiroId: 'cef02730-b592-4048-a2f7-18e195ff7f20',
            tipo: 'CUENTA_NUEVA',
            mensaje: 'Cuenta bancaria agregada recientemente',
            resuelta: false,
            createdAt: '2025-07-08T05:19:00.616Z',
            updatedAt: '2025-07-08T05:19:00.616Z'
          }
        ]
      },
      {
        id: '99afe2e4-1cf9-4f6c-b39c-18f401d529ba',
        usuarioId: 'f1321141-433f-43e6-aa54-f21a93edf6be',
        cuentaBancariaId: 'ad9f5b6d-6813-450b-bead-2a673dc5ab95',
        montoSolicitado: '477.13',
        estado: 'Completado',
        urlComprobante: 'uploads/comprobantes/comprobante_99afe2e4-1cf9-4f6c-b39c-18f401d529ba_1751917735229.jpg',
        notasAdmin: null,
        fechaSolicitud: '2025-07-07T18:03:31.098Z',
        fechaActualizacion: '2025-07-07T19:48:55.237Z',
        usuario: {
          id: 'f1321141-433f-43e6-aa54-f21a93edf6be',
          nombreCompleto: 'Artista Tres (Con Alertas Múltiples)',
          email: 'Ole_Krajcik@gmail.com'
        },
        cuentaBancaria: {
          tipoCuenta: 'nacional',
          nombreTitular: 'Artista Tres (Con Alertas Múltiples)'
        },
        alertas: [
          {
            id: 'f5c341bb-6017-49a0-8db8-c24f2e0e32f8',
            retiroId: '99afe2e4-1cf9-4f6c-b39c-18f401d529ba',
            tipo: 'RETIROS_MULTIPLES',
            mensaje: 'Múltiples retiros en el mes (3). Límite de 2 retiros/mes superado.',
            resuelta: false,
            createdAt: '2025-07-07T18:03:31.105Z',
            updatedAt: '2025-07-07T18:03:31.105Z'
          }
        ]
      },
      {
          "id": "34ff6703-0678-465e-8c30-2efeb5c2b42a",
          "usuarioId": "f1321141-433f-43e6-aa54-f21a93edf6be",
          "cuentaBancariaId": "ad9f5b6d-6813-450b-bead-2a673dc5ab95",
          "montoSolicitado": "826.96",
          "estado": "Pendiente",
          "urlComprobante": null,
          "notasAdmin": null,
          "fechaSolicitud": "2025-07-07T18:03:31.094Z",
          "fechaActualizacion": "2025-07-07T18:03:31.095Z",
          "usuario": {
              "id": "f1321141-433f-43e6-aa54-f21a93edf6be",
              "nombreCompleto": "Artista Tres (Con Alertas Múltiples)",
              "email": "Ole_Krajcik@gmail.com"
          },
          "cuentaBancaria": {
              "tipoCuenta": "nacional",
              "nombreTitular": "Artista Tres (Con Alertas Múltiples)"
          },
          "alertas": []
      },
      {
          "id": "836e6cb3-ab63-499a-b4c2-f37a5d2c3771",
          "usuarioId": "f1321141-433f-43e6-aa54-f21a93edf6be",
          "cuentaBancariaId": "ad9f5b6d-6813-450b-bead-2a673dc5ab95",
          "montoSolicitado": "803.39",
          "estado": "Pendiente",
          "urlComprobante": null,
          "notasAdmin": null,
          "fechaSolicitud": "2025-07-07T18:03:31.088Z",
          "fechaActualizacion": "2025-07-07T18:03:31.091Z",
          "usuario": {
              "id": "f1321141-433f-43e6-aa54-f21a93edf6be",
              "nombreCompleto": "Artista Tres (Con Alertas Múltiples)",
              "email": "Ole_Krajcik@gmail.com"
          },
          "cuentaBancaria": {
              "tipoCuenta": "nacional",
              "nombreTitular": "Artista Tres (Con Alertas Múltiples)"
          },
          "alertas": []
      },
      {
          "id": "968dd10b-c615-4a7c-9c1d-929c2a7f8141",
          "usuarioId": "39b6f301-7a2a-41de-9968-60e5dd90e39f",
          "cuentaBancariaId": "4cb508eb-6673-4aca-93b4-cd52940ab2a2",
          "montoSolicitado": "55000",
          "estado": "Pendiente",
          "urlComprobante": null,
          "notasAdmin": null,
          "fechaSolicitud": "2025-07-07T18:03:31.077Z",
          "fechaActualizacion": "2025-07-07T18:03:31.077Z",
          "usuario": {
              "id": "39b6f301-7a2a-41de-9968-60e5dd90e39f",
              "nombreCompleto": "Artista Dos (Con Alerta de Monto Alto)",
              "email": "Maverick.Kreiger@yahoo.com"
          },
          "cuentaBancaria": {
              "tipoCuenta": "nacional",
              "nombreTitular": "Artista Dos (Con Alerta de Monto Alto)"
          },
          "alertas": [
              {
                  "id": "3b52c009-1667-4174-ad5d-0232cfa9394b",
                  "retiroId": "968dd10b-c615-4a7c-9c1d-929c2a7f8141",
                  "tipo": "MONTO_ALTO",
                  "mensaje": "Monto elevado detectado: $55000.00 USD. Supera el umbral de $50000.00 USD.",
                  "resuelta": false,
                  "createdAt": "2025-07-07T18:03:31.082Z",
                  "updatedAt": "2025-07-07T18:03:31.082Z"
              }
          ]
      },
      {
          "id": "a2d4b99d-eb0b-453e-8779-3e3610105861",
          "usuarioId": "cfc7aea4-be53-4082-a1a3-6f63cdad902e",
          "cuentaBancariaId": "1384a3ce-79e2-4d4b-abd0-46ca2053b218",
          "montoSolicitado": "1250.5",
          "estado": "Pendiente",
          "urlComprobante": null,
          "notasAdmin": null,
          "fechaSolicitud": "2025-07-07T18:03:31.070Z",
          "fechaActualizacion": "2025-07-07T18:03:31.070Z",
          "usuario": {
              "id": "cfc7aea4-be53-4082-a1a3-6f63cdad902e",
              "nombreCompleto": "Artista Uno (Con Retiro Normal)",
              "email": "Sarina_Nienow14@yahoo.com"
          },
          "cuentaBancaria": {
              "tipoCuenta": "nacional",
              "nombreTitular": "Artista Uno (Con Retiro Normal)"
          },
          "alertas": []
      }
    ],
    stats: {
      total: 6,
      pendientes: 5,
      conAlertas: 3,
      requierenRevision: 0
    }
  };
  return NextResponse.json(mockData);
}