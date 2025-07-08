// src/lib/sendgrid.ts

import sgMail from '@sendgrid/mail';

// Configura tu clave API de SendGrid
// Es CRÍTICO que esta clave se maneje como una variable de entorno y NO se exponga en el código fuente.
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export default sgMail;