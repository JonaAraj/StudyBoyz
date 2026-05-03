# 🔧 SOLUCIONES PARA EL ERROR DE SUPABASE - ENOTFOUND

## 📋 Diagnóstico del Problema

**Error:** `TypeError: fetch failed - Error: getaddrinfo ENOTFOUND fvxqjbtrsvoaztxwkhrg.supabase.co`

**Causa:** Tu servidor NO puede resolver el dominio de Supabase, aunque SÍ tiene conexión a internet.

### Resultados de diagnóstico:
- ✅ Google.com: Se resuelve correctamente (142.250.65.206)
- ✅ GitHub.com: Se resuelve correctamente (140.82.113.3)
- ❌ Supabase.co: **NO se puede resolver**
- ❌ Google DNS (8.8.8.8): No ayuda

**Conclusión:** Hay un **firewall, proxy o ISP bloqueando específicamente a Supabase**

---

## 🚀 Soluciones (en orden de prioridad)

### 1️⃣ **OPCIÓN PREFERIDA: Resolver el acceso a internet**

#### Si estás en una Red Corporativa:
```
✉️ Contacta al equipo de IT/administrador de red
📋 Solicita desbloquear:
   - *.supabase.co
   - fvxqjbtrsvoaztxwkhrg.supabase.co
   
💡 Alternativa: Usa VPN corporativa
```

#### Si estás en casa:
```
1. En tu ROUTER:
   - Admin panel (192.168.1.1)
   - Busca "DNS"
   - Cambia a Google DNS: 8.8.8.8 y 8.8.4.4
   - Reinicia router

2. En tu PC (Windows):
   - Configuración > Red e Internet > Cambiar opciones de adaptador
   - Click derecho en tu conexión > Propiedades
   - IPv4 > Propiedades
   - Servidores DNS: 8.8.8.8 y 8.8.4.4
   - OK

3. Prueba:
   - nslookup fvxqjbtrsvoaztxwkhrg.supabase.co
```

#### Antivirus/Firewall:
```
⚠️ Temporalmente desactiva:
   - Windows Defender
   - Firewall de Windows
   - Antivirus tercero
   - Repite: npm run dev
   
✅ Si funciona → Agrega excepciones para Supabase
❌ Si no funciona → Es ISP
```

---

### 2️⃣ **OPCIÓN ALTERNATIVA: Usar Red Móvil**

```bash
# Desactiva Wi-Fi
# Activa datos móviles (hotspot)
# En tu PC, conecta al hotspot

npm run dev

# Esto puede funcionar si tu ISP de casa bloquea pero el mobile no
```

---

### 3️⃣ **PARA DESARROLLO SIN INTERNET (Temporal)**

Ya creé un Mock de Supabase para que puedas desarrollar sin conexión real:

#### Opción A: Usar el Mock fornecido

**Archivo:** `config/supabase-mock.js`

Cambiar en `config/supabase.js`:

```javascript
// ANTES:
const { createClient } = require("@supabase/supabase-js");

// DESPUÉS (desarrollo sin internet):
const { createClient } = require("./supabase-mock.js");
```

#### Opción B: Agregar variable de entorno

```bash
# En .env
SUPABASE_MODE=mock  # o "real"

# En config/supabase.js:
if (process.env.SUPABASE_MODE === "mock") {
  const { createClient } = require("./supabase-mock.js");
} else {
  const { createClient } = require("@supabase/supabase-js");
}
```

---

### 4️⃣ **Cambiar ISP o Proveedor**

Si nada funciona:
- Contacta a tu ISP
- Reporta que está bloqueando `supabase.co`
- Considera cambiar de ISP

---

## 🧪 Testing: Scripts de Diagnóstico

Ya hemos generado scripts que puedes re-ejecutar:

```bash
# Verificar conectividad general
node network-diagnostic.js

# Diagnóstico completo de Supabase
node diagnostic.js

# Diagnóstico con Google DNS
node diagnostic-with-google-dns.js
```

---

## 📝 Cambios ya hechos al código

1. ✅ **server.js**: Agrega Google DNS automáticamente
2. ✅ **supabase-mock.js**: Mock para desarrollo offline
3. ✅ **diagnostic.js**: Script de prueba completo

---

## ✅ Verificación Final

Una vez resuelvas el acceso:

```bash
cd Back-end

# Verifica que funciona
npm run dev

# En otra terminal, prueba:
curl http://localhost:3000/
# Debe responder: {"status":"ok","app":"StudyBoyz API","version":"1.2.0"}
```

---

## 📞 Si necesitas ayuda

1. Ejecuta todos los diagnósticos:
   ```bash
   node diagnostic.js
   node network-diagnostic.js
   node diagnostic-with-google-dns.js
   ```

2. Comparte los resultados

3. Verifica tu conexión de red:
   ```bash
   ipconfig
   ping google.com
   nslookup fvxqjbtrsvoaztxwkhrg.supabase.co
   ```

---

## 🎯 Resumen

| Problema | Solución |
|----------|----------|
| Firewall corporativo | Contactar IT / Usar VPN |
| ISP bloqueando | Contactar ISP / Cambiar DNS |
| Antivirus bloqueando | Desactivar / Agregar excepción |
| Necesito desarrollar ahora | Usar `supabase-mock.js` |

**El código está bien. El problema es de RED, no de código.** 🌐
