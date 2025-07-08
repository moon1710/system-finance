// pages/api/admin/alertas/configuracion.ts

import { NextApiRequest, NextApiResponse } from 'next';

// Simula la configuración almacenada. En un entorno real, esto vendría de una DB.
let currentConfig = {
  montoAlto: 50000,
  maxRetirosMes: 1,
  diasRevisionRapida: 7,
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({ configuracion: currentConfig });
  } else if (req.method === 'PATCH') {
    try {
      const { montoAlto, maxRetirosMes, diasRevisionRapida } = req.body;
      
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
      res.status(200).json({ success: true, message: 'Configuración actualizada con éxito', configuracion: currentConfig });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}