// const API = 'http://ec2-3-144-165-135.us-east-2.compute.amazonaws.com:3000'; // AWS Producción
const API = 'http://localhost:3000'; // Entorno Local

// ── PARTÍCULAS ──
const pc = document.getElementById('particles');
for (let i = 0; i < 30; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.cssText = `left:${Math.random() * 100}%;animation-duration:${8 + Math.random() * 15}s;animation-delay:${Math.random() * 10}s;--dx:${(Math.random() - .5) * 100}px;width:${1 + Math.random() * 2}px;height:${1 + Math.random() * 2}px;opacity:${.3 + Math.random() * .5}`;
  pc.appendChild(p);
}

// ── TABS ──
function showPage(p, el) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  el.classList.add('active');
  hideErrors();
  if (p === 'tareas') cargarTareas();
  if (p === 'auditoria') cargarAuditoria();
}

// ── TOAST ──
function toast(msg, tipo = 'ok') {
  const icons = { ok: '✓', err: '✕', info: 'ℹ' };
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast-item ${tipo}`;
  t.innerHTML = `<span style="font-size:1rem">${icons[tipo]}</span>${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 300) }, 3500);
}

// ── ERRORES ──
function hideErrors() {
  const e500 = document.getElementById('error-500');
  if (e500) e500.classList.remove('show');
  document.querySelectorAll('#page-tareas .card').forEach(x => x.style.display = '');
}
function manejarError(s) {
  hideErrors();
  if (s === 404) {
    const c = document.getElementById('lista-tareas');
    if (!c) return;
    c.innerHTML = `<div class="error-screen show" style="min-height: 25vh; padding: 2rem 0;">
      <div class="error-code" style="font-size: 4rem;">404</div>
      <div class="error-emoji" style="font-size: 2.5rem;">🔭</div>
      <div style="color:var(--muted);font-size:0.95rem;max-width:320px;line-height:1.5;margin-bottom:10px;">No encontramos lo que buscabas. Quizás fue eliminado o nunca existió por aquí.</div>
      <button class="error-btn" onclick="document.getElementById('buscador-tareas').value=''; cargarTareas()">Regresar</button>
    </div>`;
  } else {
    document.querySelectorAll('#page-tareas .card').forEach(x => x.style.display = 'none');
    const e500 = document.getElementById('error-500');
    if (e500) e500.classList.add('show');
  }
}

// ── STATS HEADER ──
function updateStats(data) {
  document.getElementById('hs-total').textContent = data.length;
  document.getElementById('hs-pend').textContent = data.filter(t => t.estado === 'pendiente').length;
  document.getElementById('hs-done').textContent = data.filter(t => t.estado === 'completada').length;
}

// ── CARGAR TAREAS ──
let globalTareas = [];

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

function renderTareas(data, query = '') {
  const c = document.getElementById('lista-tareas');
  if (!data.length) {
    c.innerHTML = `<div class="empty"><div class="empty-icon">${query ? '🔍' : '📭'}</div><div>${query ? 'No hay coincidencias para tu búsqueda.' : 'Sin tareas aún. ¡Crea la primera!'}</div></div>`;
    return;
  }
  c.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Tarea</th><th>Responsable</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr></thead>
    <tbody>${data.map((t, i) => `<tr class="row-enter" style="animation-delay:${i * .04}s">
      <td><span style="color:var(--muted);font-size:.8rem">#${t.id}</span></td>
      <td>
        <div style="font-weight:600;font-size:.9rem">${highlightMatch(t.titulo, query)}</div>
        ${t.descripcion ? `<div style="color:var(--muted);font-size:.78rem;margin-top:2px">${t.descripcion}</div>` : ''}
      </td>
      <td>
        <div style="font-size:.88rem">${highlightMatch(t.asignado_a, query)}</div>
        <div style="color:var(--muted);font-size:.75rem">${t.email_asignado}</div>
      </td>
      <td><span class="badge ${t.estado}">${t.estado}</span></td>
      <td style="color:var(--muted);font-size:.78rem">${new Date(t.creado_en).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-warning btn-sm" onclick="abrirEditar(${t.id},'${t.titulo.replace(/'/g, "\\'")}','${(t.descripcion || '').replace(/'/g, "\\'")}','${t.asignado_a.replace(/'/g, "\\'")}','${t.estado}')">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="eliminar(${t.id})">🗑️</button>
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

async function cargarTareas() {
  hideErrors();
  const buscador = document.getElementById('buscador-tareas');
  const q = buscador ? buscador.value.trim() : '';
  try {
    const url = q ? API + '/tareas?q=' + encodeURIComponent(q) : API + '/tareas';
    const r = await fetch(url);
    if (!r.ok) {
      return manejarError(r.status);
    }
    const { data } = await r.json();
    globalTareas = data;
    if (!q) updateStats(data);
    renderTareas(data, q);
  } catch { manejarError(500) }
}

// ── CREAR ──
async function crearTarea() {
  const titulo = document.getElementById('f-titulo').value.trim();
  const descripcion = document.getElementById('f-desc').value.trim();
  const asignado_a = document.getElementById('f-nombre').value.trim();
  const email_asignado = document.getElementById('f-email').value.trim();

  if (!titulo || !asignado_a || !email_asignado) {
    return toast('Error 400: Faltan campos obligatorios', 'err');
  }
  try {
    const r = await fetch(API + '/tareas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descripcion, asignado_a, email_asignado })
    });

    const d = await r.json();

    if (!r.ok) {
      return toast(`Error ${r.status}: ${d.mensaje || 'Error al crear'}`, 'err');
    }

    toast('Tarea creada ✓');
    ['f-titulo', 'f-desc', 'f-nombre', 'f-email'].forEach(id => document.getElementById(id).value = '');
    cargarTareas();
  } catch {
    manejarError(500);
  }
}

// ── EDITAR ──
function abrirEditar(id, titulo, desc, nombre, estado) {
  document.getElementById('e-id').value = id;
  document.getElementById('e-titulo').value = titulo;
  document.getElementById('e-desc').value = desc;
  document.getElementById('e-nombre').value = nombre;
  document.getElementById('e-estado').value = estado;
  document.getElementById('modal-editar').classList.add('open');
}
function cerrarModal() { document.getElementById('modal-editar').classList.remove('open') }
async function guardarEdicion() {
  const id = document.getElementById('e-id').value;
  const body = { titulo: document.getElementById('e-titulo').value.trim(), descripcion: document.getElementById('e-desc').value.trim(), asignado_a: document.getElementById('e-nombre').value.trim(), estado: document.getElementById('e-estado').value };
  try {
    const r = await fetch(API + '/tareas/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { r.status === 404 ? manejarError(404) : toast(d.mensaje, 'err'); return }
    cerrarModal(); toast('Tarea actualizada correctamente'); cargarTareas();
  } catch { manejarError(500) }
}

// ── ELIMINAR ──
async function eliminar(id) {
  const result = await Swal.fire({
    title: `<span style="color:#f1f5f9; font-family:'Inter',sans-serif;">¿Eliminar tarea?</span>`,
    html: `<p style="color:#64748b; font-size:0.9rem;">Estás por borrar la tarea <b>#${id}</b>.<br>Esta acción no se puede deshacer.</p>`,
    icon: 'warning',
    iconColor: '#ef4444',
    showCancelButton: true,
    background: '#16162a',
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#2a2a4a',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    backdrop: `rgba(15,15,26,0.8)`,
    customClass: { popup: 'border-sweet-alert' }
  });

  if (!result.isConfirmed) return;

  try {
    const r = await fetch(API + '/tareas/' + id, { method: 'DELETE' });
    const d = await r.json();

    if (!r.ok) {
      return Swal.fire({
        icon: 'error',
        title: `<span style="color:#f1f5f9;">Error ${r.status}</span>`,
        text: d.mensaje || 'No se pudo eliminar',
        background: '#16162a',
        confirmButtonColor: '#6366f1',
        color: '#f1f5f9',
        customClass: { popup: 'border-sweet-alert' }
      });
    }

    toast('Tarea eliminada correctamente ✓');
    cargarTareas();
  } catch {
    manejarError(500);
  }
}

// ── AUDITORÍA ──
async function cargarAuditoria() {
  try {
    const r = await fetch(API + '/auditoria');
    if (!r.ok) return;
    const { data } = await r.json();
    const c = document.getElementById('lista-auditoria');
    if (!data.length) { c.innerHTML = `<div class="empty"><div class="empty-icon">📜</div><div>Sin movimientos aún.</div></div>`; return }
    const icons = { ALTA: '➕', BAJA: '🗑️', 'ACTUALIZACIÓN': '✏️' };
    const cls = { ALTA: 'alta', BAJA: 'baja', 'ACTUALIZACIÓN': 'actualizacion' };
    c.innerHTML = `<div class="timeline">${data.map((m, i) => `
      <div class="tl-item" style="animation-delay:${i * .03}s">
        <div class="tl-dot ${cls[m.evento] || 'alta'}">${icons[m.evento] || '•'}</div>
        <div class="tl-body">
          <div class="tl-evento">${m.detalle}</div>
          <div class="tl-meta">por <strong>${m.autor}</strong></div>
        </div>
        <div class="tl-time">${new Date(m.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</div>
      </div>`).join('')}</div>`;
  } catch { console.error('Error auditoría') }
}

// ── INIT ──
cargarTareas();