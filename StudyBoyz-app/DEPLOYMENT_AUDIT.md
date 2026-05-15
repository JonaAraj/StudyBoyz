# 📋 Auditoría: Configuración Render + Expo EAS Build

## ✅ Estado de la Auditoría

### Frontend (Expo)
- ✅ `app.json` configurado correctamente con EAS projectId
- ✅ `eas.json` con perfiles: development, preview, production
- ✅ Scripts de build: `npm run build:android`, `npm run build:ios`
- ✅ Dependencias de Expo actualizadas: `expo@54.0.33`, `expo-av`, `expo-document-picker`, etc.
- ✅ TypeScript configurado con `tsconfig.json`
- ⚠️ **Acción requerida**: Debes hacer `eas login` antes de usar `eas build`

### Backend (Node.js + Render)
- ✅ `server.js` escucha en `process.env.PORT || 3000`
- ✅ `Procfile` creado para Render: `web: node ./Back-end/server.js`
- ✅ `render.yaml` creado con configuración completa de despliegue
- ✅ Todas las dependencias necesarias en `package.json`:
  - `express`, `cors`, `dotenv`
  - `@supabase/supabase-js`, `@deepgram/sdk`
  - `multer`, `jsonwebtoken`, `bcryptjs`
- ✅ Middlewares CORS correctamente configurados
- ✅ Health check endpoint `/` activo

### Variables de Entorno
- ✅ `.env.example` creado con todas las variables necesarias
- ✅ `.gitignore` actualizado para excluir `.env` pero incluir `.env.example`
- ⚠️ **Acción requerida**: Copiar `.env.example` a `.env` y rellenar valores en local

### Package Manager
- ✅ `packageManager: "pnpm@9.0.0"` configurado en `package.json`
- ✅ `pnpm-lock.yaml` presente y actualizado
- ✅ Scripts agregados:
  - `pnpm start` → Expo development
  - `pnpm backend` → Node.js server
  - `pnpm build:android` → Expo EAS Android build
  - `pnpm build:ios` → Expo EAS iOS build

---

## 🚀 Pasos para Desplegar en Render

### 1. Preparar el repositorio Git
```bash
git init
git add .
git commit -m "Initial commit: StudyBoyz API + Expo Frontend"
git remote add origin https://github.com/tu-usuario/studyboyz.git
git push -u origin main
```

### 2. Crear servicio en Render
- Ir a [render.com](https://render.com)
- Click en "New +" → "Web Service"
- Conectar repositorio GitHub
- Usar `render.yaml` para la configuración automática
- O configurar manualmente:
  - **Build Command**: `pnpm install`
  - **Start Command**: `node ./Back-end/server.js`
  - **Environment Variables**: Ver sección 4

### 3. Configurar Variables de Entorno en Render
En el dashboard de Render, agregar:
```
SUPABASE_URL=https://xxewsaukucqjaqzucnnk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=<tu_jwt_secret>
DEEPGRAM_API_KEY=<tu_deepgram_key>
NODE_ENV=production
```

### 4. Deployar
- Render detectará `render.yaml` o `Procfile`
- Build automático tras push a `main`
- Servidor activo en `https://studyboyz.onrender.com`

---

## 📱 Pasos para Build en Expo EAS

### 1. Instalar EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login en EAS
```bash
eas login
```

### 3. Build para Android (APK)
```bash
pnpm build:android
```
O manualmente:
```bash
eas build --platform android --non-interactive
```

### 4. Build para iOS
```bash
pnpm build:ios
```

### 5. Descargar el build
- EAS mostrará un link de descarga
- APK se puede instalar directamente en Android
- IPA requiere configuración de certificados Apple

---

## 🔍 Testing Local

### Backend
```bash
pnpm backend:dev
# http://localhost:3000/
```

### Frontend
```bash
pnpm start
# Escanea QR en Expo Go
```

### API Health Check
```bash
curl https://studyboyz.onrender.com/
# Response: { "status": "ok", "app": "StudyBoyz API", "version": "1.2.0" }
```

---

## ⚠️ Checklist Pre-Despliegue

- [ ] `.env` configurado localmente (basado en `.env.example`)
- [ ] `eas login` completado
- [ ] Variables de Supabase válidas y activas
- [ ] API key de Deepgram válida
- [ ] JWT_SECRET generado seguro
- [ ] Repository Git creado y conectado
- [ ] Render dashboard con repo conectado
- [ ] `render.yaml` o `Procfile` presentes
- [ ] `pnpm install` ejecutado sin errores

---

## 🛠️ Troubleshooting

### Error en pnpm install
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error en Expo build
```bash
eas build --platform android --non-interactive --clear-cache
```

### Backend no inicia en Render
- Verificar `render.yaml` start command
- Revisar logs en Render dashboard
- Confirmar variables de entorno están seteadas

### API URL no responde desde frontend
- Usar `https://studyboyz.onrender.com/api` (no `http://`)
- Verificar CORS en `server.js` permite el origen del frontend
- Comprobar que Render service está activo

---

Generado: 2026-05-15
