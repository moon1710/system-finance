import nodemailer from 'nodemailer'

// Crear el transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Template para Magic Link
export async function sendMagicLinkEmail(email: string, token: string) {
  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Acceso a Sistema de Pagos',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #3b82f6; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Acceso al Sistema de Pagos</h2>
            <p>Has solicitado acceso al sistema. Haz clic en el siguiente enlace para iniciar sesión:</p>
            <a href="${magicLink}" class="button">Iniciar Sesión</a>
            <p>Este enlace expirará en 15 minutos por seguridad.</p>
            <p>Si no solicitaste este acceso, puedes ignorar este correo.</p>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Template para notificación de retiro
export async function sendWithdrawalNotification(
  email: string, 
  amount: number, 
  status: 'aprobado' | 'rechazado',
  notes?: string
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Solicitud de retiro ${status === 'aprobado' ? 'aprobada' : 'rechazada'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .status-aprobado { color: #22c55e; font-weight: bold; }
            .status-rechazado { color: #ef4444; font-weight: bold; }
            .amount { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Actualización de tu solicitud de retiro</h2>
            <p>Tu solicitud de retiro ha sido <span class="${status === 'aprobado' ? 'status-aprobado' : 'status-rechazado'}">${status}</span>.</p>
            <p class="amount">Monto: $${amount.toLocaleString('es-MX')}</p>
            ${notes ? `<p><strong>Notas del administrador:</strong> ${notes}</p>` : ''}
            ${status === 'aprobado' ? '<p>El pago será procesado en las próximas 24-48 horas hábiles.</p>' : ''}
            <div class="footer">
              <p>Si tienes alguna pregunta, contacta a tu administrador.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}