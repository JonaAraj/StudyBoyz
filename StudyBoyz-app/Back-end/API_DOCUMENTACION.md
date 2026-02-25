# API StudyBoyz - Documentación

## Instalación de PostgreSQL

### Windows:

1. Descargar desde: https://www.postgresql.org/download/windows/
2. Instalar con defaults (usuario: `postgres`, contraseña: `password`)
3. Crear base de datos:

```sql
CREATE DATABASE studyboyz_db;
```

### Verificar que PostgreSQL está corriendo:

- Windows: PostgreSQL debe estar en Servicios (Services)
- Puerto: 5432

## Iniciar el servidor

```bash
cd Back-end
node server.js
```

Si todo está bien:

```
✓ Base de datos sincronizada
✓ Servidor corriendo en http://localhost:3000
📝 Para usar, primero registrate en POST /auth/registro
```

---

## Endpoints disponibles

### 1. REGISTRO - Crear usuario

```
POST /auth/registro
Content-Type: application/json

{
  "nombre_usuario": "juan123",
  "email": "juan@example.com",
  "contraseña": "password123",
  "nombre_completo": "Juan Pérez"
}
```

**Respuesta:**

```json
{
  "mensaje": "Usuario creado exitosamente",
  "usuario": {
    "id": 1,
    "nombre_usuario": "juan123",
    "email": "juan@example.com"
  },
  "token": "eyJhbGc..."
}
```

---

### 2. LOGIN - Autenticar usuario

```
POST /auth/login
Content-Type: application/json

{
  "nombre_usuario": "juan123",
  "contraseña": "password123"
}
```

**Respuesta:** (Mismo formato que registro, retorna token)

---

### 3. SUBIR ARCHIVO (Audio o PDF)

```
POST /archivos/subir
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [archivo.mp3 o archivo.pdf]
descripcion: "Mi primer audio" (opcional)
```

**Respuesta:**

```json
{
  "mensaje": "Archivo subido exitosamente",
  "archivo": {
    "id": 1,
    "nombre_original": "clase_1.mp3",
    "tipo_archivo": "audio",
    "tamaño": 5242880,
    "ruta": "/uploads/1708608000000-123456789.mp3"
  }
}
```

---

### 4. OBTENER MIS ARCHIVOS

```
GET /archivos
Authorization: Bearer <token>

# Opcional: filtrar por tipo
GET /archivos?tipo=audio
GET /archivos?tipo=pdf
```

**Respuesta:**

```json
{
  "total": 2,
  "archivos": [
    {
      "id": 1,
      "usuario_id": 1,
      "nombre_original": "clase_1.mp3",
      "tipo_archivo": "audio",
      "tamaño": 5242880,
      "descripcion": "Mi primer audio",
      "descargado": false,
      "creado_en": "2026-02-23T10:30:00.000Z"
    }
  ]
}
```

---

### 5. DESCARGAR ARCHIVO

```
GET /archivos/descargar/1
Authorization: Bearer <token>
```

**Respuesta:** Descarga el archivo directamente

---

### 6. ELIMINAR ARCHIVO

```
DELETE /archivos/1
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "mensaje": "Archivo eliminado exitosamente"
}
```

---

## Estructura de carpetas generada

```
Back-end/
├── .env                  (Variables de entorno)
├── server.js            (Servidor principal)
├── config/
│   └── database.js      (Conexión a PostgreSQL)
├── models/
│   ├── Usuario.js       (Modelo de usuarios)
│   └── Archivo.js       (Modelo de archivos)
├── middleware/
│   ├── auth.js         (Autenticación JWT)
│   └── upload.js       (Configuración de multer)
└── uploads/             (Archivos subidos aquí - crear automáticamente)
```

---

## Variables de entorno (.env)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=studyboyz_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_jwt_secret_key_change_this
NODE_ENV=development
PORT=3000
UPLOAD_DIR=./uploads
```

---

## Notas importantes

- ✅ Las contraseñas se hashean automáticamente con bcrypt
- ✅ Los tokens JWT expiran en 7 días
- ✅ Máximo tamaño de archivo: 100MB
- ✅ Archivos permitidos: .mp3, .wav, .m4a, .pdf
- ✅ Todos los endpoints (excepto registro/login) requieren token
- ✅ Los archivos se guardan en `/uploads` con nombres únicos

---

## Próximos pasos

1. Instala y configura PostgreSQL
2. Crea la base de datos: `CREATE DATABASE studyboyz_db;`
3. Ejecuta: `node server.js`
4. Prueba los endpoints con Postman o Insomnia
