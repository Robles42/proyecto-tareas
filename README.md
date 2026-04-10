# 📋 Task Manager Pro — AWS Distributed Architecture

> Proyecto Final: Arquitectura de Servicios Distribuidos y Resilientes en AWS  

---

## 🧠 ¿Qué es este proyecto?

**Task Manager Pro** es una plataforma web de gestión de tareas construida con una arquitectura desacoplada y desplegada en Amazon Web Services. El frontend vive en **S3** como sitio estático y el backend corre en una instancia **EC2** con Node.js, mantenido activo 24/7 mediante **PM2**.

---

## 🏗️ Arquitectura---

## ⚙️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Node.js, Express.js |
| Base de datos | SQLite (better-sqlite3) |
| Proceso | PM2 |
| Email | Nodemailer + Gmail |
| Hosting Frontend | Amazon S3 (Static Website) |
| Hosting Backend | Amazon EC2 (Ubuntu 22.04 t2.micro) |
| Seguridad | dotenv (.env) |

---

## ✅ Funcionalidades

### CRUD Completo
- **Alta** — Crear tarea con título, descripción, responsable y email
- **Consulta** — Listar todas las tareas con estado y fecha
- **Actualización** — Editar título, descripción, responsable y estado
- **Baja** — Eliminar tarea con confirmación

### Auditoría (Trazabilidad)
Cada operación genera un registro con:
- `evento` — Acción realizada (ALTA, ACTUALIZACIÓN, BAJA)
- `autor` — Quién la realizó
- `detalle` — Descripción del cambio
- `timestamp` — Fecha y hora exacta

### Servicio de Terceros
Al crear una tarea, el sistema envía automáticamente un **correo de notificación** al responsable usando Nodemailer + Gmail.

### Resiliencia
- PM2 reinicia la API automáticamente si falla
- El frontend muestra pantallas de error amigables para códigos 404 y 500
- Feedback visual en cada acción (toasts animados)

---

## 📁 Estructura del Proyecto---

## 🚀 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/proyecto-tareas-aws.git
cd proyecto-tareas-aws

# Instalar dependencias
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor
node index.js
```

Abrir `frontend/index.html` en el navegador.

---

## 🔐 Variables de Entorno

Crear un archivo `backend/.env` con:> ⚠️ Nunca subas el archivo `.env` al repositorio.

---

## 🌐 Despliegue en AWS

### Frontend → S3
1. Crear bucket S3 con nombre único
2. Activar **Static Website Hosting**
3. Configurar política pública de lectura
4. Subir `frontend/index.html`
5. Cambiar `API` en el JS por la IP pública de EC2

### Backend → EC2
```bash
# En la instancia EC2 Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

git clone https://github.com/TU_USUARIO/proyecto-tareas-aws.git
cd proyecto-tareas-aws/backend
npm install
pm2 start index.js --name "task-manager"
pm2 startup && pm2 save
```

---

## 📡 Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/tareas` | Obtener todas las tareas |
| GET | `/tareas/:id` | Obtener una tarea |
| POST | `/tareas` | Crear tarea + enviar correo |
| PUT | `/tareas/:id` | Actualizar tarea |
| DELETE | `/tareas/:id` | Eliminar tarea |
| GET | `/auditoria` | Historial de movimientos |

### Respuestas HTTP
| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Creado exitosamente |
| 400 | Bad Request — datos inválidos |
| 404 | Not Found — recurso no existe |
| 500 | Internal Server Error |

---


---

## 📄 Licencia

MIT — libre para uso educativo.
