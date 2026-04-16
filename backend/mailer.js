const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function enviarAsignacion(emailDestino, nombre, titulo) {
  try {
    await transporter.sendMail({
      from: `"Gestor de Tareas" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: '📋 Se te asignó una nueva tarea',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div style="background:#4f46e5;padding:24px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:1.4rem;">Nueva tarea asignada</h1>
          </div>
          <div style="padding:24px;">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Se te acaba de asignar la siguiente tarea:</p>
            <div style="background:#f8fafc;border-left:4px solid #4f46e5;padding:12px 16px;border-radius:4px;margin:16px 0;">
              <strong>${titulo}</strong>
            </div>
            <p style="color:#64748b;font-size:.9rem;">Ingresa al sistema para ver los detalles y actualizar su estado.</p>
          </div>
        </div>
      `,
    });
    console.log(`Correo enviado a ${emailDestino}`);
  } catch (err) {
    console.error('Error al enviar correo:', err.message);
  }
}

module.exports = { enviarAsignacion };
