require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const { enviarAsignacion } = require('./mailer');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ───────── TAREAS ───────── */

// Obtener todas
app.get('/tareas', (req, res) => {
  try {
    const tareas = db.prepare('SELECT * FROM tareas ORDER BY creado_en DESC').all();
    res.json({ ok: true, data: tareas });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

// Obtener una
app.get('/tareas/:id', (req, res) => {
  try {
    const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(req.params.id);
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada' });
    res.json({ ok: true, data: tarea });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

// Crear
app.post('/tareas', async (req, res) => {
  try {
    const { titulo, descripcion, asignado_a, email_asignado } = req.body;
    if (!titulo || !asignado_a || !email_asignado) {
      return res.status(400).json({ ok: false, mensaje: 'titulo, asignado_a y email_asignado son requeridos' });
    }
    const r = db.prepare(
      'INSERT INTO tareas (titulo, descripcion, asignado_a, email_asignado) VALUES (?, ?, ?, ?)'
    ).run(titulo, descripcion || '', asignado_a, email_asignado);

    db.prepare('INSERT INTO auditoria (evento, autor, detalle) VALUES (?, ?, ?)')
      .run('ALTA', asignado_a, `Tarea creada: "${titulo}"`);

    await enviarAsignacion(email_asignado, asignado_a, titulo);

    res.status(201).json({ ok: true, mensaje: 'Tarea creada', id: r.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

// Actualizar
app.put('/tareas/:id', (req, res) => {
  try {
    const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(req.params.id);
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada' });

    const { titulo, descripcion, estado, asignado_a } = req.body;
    db.prepare('UPDATE tareas SET titulo=?, descripcion=?, estado=?, asignado_a=? WHERE id=?')
      .run(
        titulo       ?? tarea.titulo,
        descripcion  ?? tarea.descripcion,
        estado       ?? tarea.estado,
        asignado_a   ?? tarea.asignado_a,
        req.params.id
      );

    db.prepare('INSERT INTO auditoria (evento, autor, detalle) VALUES (?, ?, ?)')
      .run('ACTUALIZACIÓN', asignado_a ?? tarea.asignado_a, `Tarea #${req.params.id} modificada`);

    res.json({ ok: true, mensaje: 'Tarea actualizada' });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

// Eliminar
app.delete('/tareas/:id', (req, res) => {
  try {
    const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(req.params.id);
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada' });

    db.prepare('DELETE FROM tareas WHERE id = ?').run(req.params.id);
    db.prepare('INSERT INTO auditoria (evento, autor, detalle) VALUES (?, ?, ?)')
      .run('BAJA', 'sistema', `Tarea eliminada: "${tarea.titulo}"`);

    res.json({ ok: true, mensaje: 'Tarea eliminada' });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

/* ───────── AUDITORÍA ───────── */

app.get('/auditoria', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM auditoria ORDER BY timestamp DESC').all();
    res.json({ ok: true, data: logs });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

/* ───────── INICIO ───────── */
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
