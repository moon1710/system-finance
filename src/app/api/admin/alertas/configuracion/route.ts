// app/api/admin/alertas/configuracion/route.ts

import { NextResponse } from 'next/server';

// Simula la configuración almacenada. En un entorno real, esto vendría de una DB.
let currentConfig = {
  montoAlto: 50000,
  maxRetirosMes: 1,
  diasRevisionRapida: 7,
};

export async function GET() {
  return NextResponse.json({ configuracion: currentConfig });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { montoAlto, maxRetirosMes, diasRevisionRapida } = body;
    
    // Validar que los valores sean números y positivos si es necesario
    if (typeof montoAlto === 'number') {
      currentConfig.montoAlto = montoAlto;
    }
    if (typeof maxRetirosMes === 'number') {
      currentConfig.maxRetirosMes = maxRetirosMes;
    }
    if (typeof diasRevisionRapida === 'number') {
      currentConfig.diasRevisionRapida = diasRevisionRapida;
    }

    // En un entorno real, aquí se actualizaría la base de datos
    console.log('Configuración actualizada en el servidor (mock):', currentConfig);
    return NextResponse.json({ success: true, message: 'Configuración actualizada con éxito', configuracion: currentConfig });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}