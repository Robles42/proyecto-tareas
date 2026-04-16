require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('./database');
console.log("¿Dónde estoy buscando el .env?: ", process.cwd());
console.log("Valor de EMAIL_USER: ", process.env.EMAIL_USER);
const { enviarAsignacion } = require('./mailer');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

/* ───────── TAREAS ───────── */

app.get('/tareas', (req, res) => {
  try {
    const q = req.query.q;
    let tareas;
    if (q) {
      tareas = db.prepare('SELECT * FROM tareas WHERE titulo LIKE ? OR asignado_a LIKE ? ORDER BY creado_en DESC').all(`%${q}%`, `%${q}%`);
    } else {
      tareas = db.prepare('SELECT * FROM tareas ORDER BY creado_en DESC').all();
    }
    res.json({ ok: true, data: tareas });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

app.get('/tareas/:id', (req, res) => {
  try {
    const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(req.params.id);
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada' });
    res.json({ ok: true, data: tarea });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

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

app.put('/tareas/:id', (req, res) => {
  try {
    const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(req.params.id);
    if (!tarea) return res.status(404).json({ ok: false, mensaje: 'Tarea no encontrada' });

    const { titulo, descripcion, estado, asignado_a } = req.body;
    db.prepare('UPDATE tareas SET titulo=?, descripcion=?, estado=?, asignado_a=? WHERE id=?')
      .run(
        titulo ?? tarea.titulo,
        descripcion ?? tarea.descripcion,
        estado ?? tarea.estado,
        asignado_a ?? tarea.asignado_a,
        req.params.id
      );

    db.prepare('INSERT INTO auditoria (evento, autor, detalle) VALUES (?, ?, ?)')
      .run('ACTUALIZACIÓN', asignado_a ?? tarea.asignado_a, `Tarea #${req.params.id} modificada`);

    res.json({ ok: true, mensaje: 'Tarea actualizada' });
  } catch {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

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

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));