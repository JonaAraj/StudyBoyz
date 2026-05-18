# 🔍 Diagnóstico: Error de Autenticación con Deepgram - INVALID_AUTH

## Problema Identificado

La API key de Deepgram no se está cargando correctamente desde las variables de entorno. Cuando la API key es `undefined` o `null`, el SDK de Deepgram intenta usar credenciales por defecto (lo cual explica por qué la API key "se regenera automáticamente").

### Síntomas

✅ La API key está en `.env`: `DEEPGRAM_API_KEY=9ea06e9d5d55da5da85d164665e875f4e26f541f`
❌ Error: `INVALID_AUTH` - "Invalid credentials"
❌ Deepgram no registra logs de las peticiones
❌ La API key aparentemente se regenera en dos ocasiones

---

## Diagnóstico Paso a Paso

### 1. **Verificar que .env se carga correctamente**

Ejecuta este comando desde la carpeta `Back-end/`:

```bash
node check-env.js
```

Debería mostrar:
```
✅ DEEPGRAM_API_KEY: 9ea06e9d5...4e26f541f
✅ SUPABASE_URL: https://xxewsau...
✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGci...
✅ JWT_SECRET: 8547822...
✅ EXPO_API_BASE_URL: http://localhost:3000/api
```

Si alguna variable muestra `❌ NO DEFINIDA`, esto es el problema.

---

## Soluciones

### ✅ Solución 1: Verificar la ruta del archivo `.env`

**Ubicación correcta:**
```
StudyBoyz-app/Back-end/.env
```

**Verifica que:**
1. El archivo `.env` exista en la carpeta `Back-end/`
2. No sea `.env.example` sino `.env` (sin "example")
3. Contenga la línea: `DEEPGRAM_API_KEY=9ea06e9d5d55da5da85d164665e875f4e26f541f`

**Comando para crear el archivo si no existe:**
```bash
cd StudyBoyz-app/Back-end
# Desde el editor: copia el contenido del .env actual a un nuevo archivo llamado ".env"
```

---

### ✅ Solución 2: Usar la API key de forma explícita en deepgramService.js

**Ya está implementada.** El código ahora:
1. Verifica que `DEEPGRAM_API_KEY` esté definida al cargar el servicio
2. Lanza errores explícitos si la API key no está disponible
3. Registra los primeros y últimos caracteres de la API key en logs

---

### ✅ Solución 3: Mejorar los logs de diagnóstico

**Ya está implementada.** Ahora verás logs detallados como:

```
🔄 [recording-id] Iniciando transcripción...
   - Usuario: 123
   - Tipo MIME: audio/m4a
   - Modo: Buffer directo
   - API Key configurada: 9ea06e9d5...f4e26f541f
   - Transcribiendo desde buffer (145920 bytes)...
✅ [recording-id] Transcripción completada (1250 caracteres)
```

Si ves: `DEEPGRAM_API_KEY no está configurada`, entonces sabes exactamente cuál es el problema.

---

### ✅ Solución 4: Reiniciar el servidor después de agregar/cambiar .env

**Importante:** Después de cambiar variables en `.env`, debes:

1. Detener el servidor (Ctrl+C)
2. Ejecutar nuevamente: `npm start` o `node server.js`

**Nota:** Los cambios en `.env` NO se recargan automáticamente en Node.js una vez iniciado el servidor.

---

## Checklist de Verificación

Sigue este orden:

- [ ] 1. Verifica que existe: `StudyBoyz-app/Back-end/.env`
- [ ] 2. Ejecuta: `node check-env.js` desde `Back-end/`
- [ ] 3. Verifica que todas las variables muestren ✅
- [ ] 4. Si alguna es ❌, revisa el archivo `.env` y corrígela
- [ ] 5. Detén el servidor (Ctrl+C)
- [ ] 6. Reinicia: `npm start` o `node server.js`
- [ ] 7. Intenta una transcripción nuevamente
- [ ] 8. Revisa los logs para ver si la API key se carga correctamente

---

## Si aún no funciona

Si después de seguir estos pasos sigue dando error, recopila:

1. **Output de `node check-env.js`** → Ver si DEEPGRAM_API_KEY aparece
2. **Logs completos de la transcripción** → Ver si se registra la API key
3. **Error exacto de Deepgram** → Copiar el JSON del error
4. **Ubicación de .env** → Confirmar que está en `Back-end/` (no en raíz)

---

## Causa Raíz Probable

La API key probablemente **no se está cargando porque:**

1. El archivo `.env` está en la carpeta raíz (`StudyBoyz-app/.env`) en lugar de (`StudyBoyz-app/Back-end/.env`)
2. El archivo es `.env.example` en lugar de `.env`
3. El servidor se inició ANTES de crear/modificar el `.env` (requiere reinicio)
4. Hay problemas de permisos de archivo en Windows/Render

---

## Cambios Implementados

1. ✅ **check-env.js** → Script de diagnóstico rápido
2. ✅ **deepgramService.js** → Verificación explícita de API key con logs
3. ✅ **transcriptionEndPoints.js** → Logs detallados de cada paso del proceso

Ahora ejecuta: `node check-env.js` para empezar el diagnóstico.
