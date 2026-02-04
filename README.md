# StudyBoys - Asistente de Estudio por Voz

> Aplicación móvil que convierte grabaciones de clases en resúmenes automáticos mediante IA

## 📱 Descripción

StudyBoys ayuda a estudiantes a optimizar su tiempo de estudio permitiéndoles:
- Grabar clases o sesiones de estudio
- Obtener transcripciones automáticas
- Generar resúmenes con puntos clave
- Organizar notas por materia

## 🎯 MVP - Alcance (5 meses)

### Pantallas
1. **Inicio** - Acceso rápido a nueva grabación + últimas notas
2. **Grabación** - Interfaz de grabación con controles y timer
3. **Mis Materias** - Lista de materias y sus notas
4. **Detalle Nota** - Reproducir audio, ver transcripción y resumen
5. **Configuración** - Ajustes básicos de la app

### Funcionalidades Core
- ✅ Grabación y reproducción de audio
- ✅ Almacenamiento local
- ✅ Organización por materias
- ✅ Transcripción automática (Google Speech-to-Text)
- ✅ Generación de resúmenes (OpenAI GPT-4o-mini)
- ✅ Búsqueda de notas
- ✅ Solo Android

### Fuera de Alcance (v2.0+)
- ❌ Sincronización en la nube
- ❌ Calendario y recordatorios
- ❌ Estadísticas de estudio
- ❌ Compartir notas
- ❌ Autenticación de usuarios
- ❌ Versión iOS

## 🛠️ Stack Tecnológico

### Frontend
- **React Native** + **Expo** - Framework multiplataforma
- **JavaScript** - Lenguaje de programación
- **React Navigation** - Navegación entre pantallas
- **AsyncStorage** - Almacenamiento local
- **expo-av** - Grabación y reproducción de audio

### Backend
- **Node.js** + **Express** - API REST
- **Google Cloud Speech-to-Text** - Transcripción de audio
- **OpenAI API (GPT-4o-mini)** - Generación de resúmenes

### Infraestructura
- **Hosting**: Render o Railway (free tier)
- **Build**: Expo EAS Build
- **Deploy**: Google Play Store

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Expo CLI: `npm install -g expo-cli`
- Cuenta de Google Cloud (para Speech-to-Text API)
- Cuenta de OpenAI (para GPT API)
- Android Studio (opcional, para emulador)

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/studyboys.git
cd studyboys

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys
```

## ⚙️ Configuración

### Frontend (.env)
```env
API_URL=http://localhost:3000
```

### Backend (.env)
```env
PORT=3000
GOOGLE_CLOUD_API_KEY=tu_api_key_aqui
OPENAI_API_KEY=tu_api_key_aqui
```

## 💻 Desarrollo

### Iniciar Backend
```bash
cd backend
npm run dev
```

### Iniciar Frontend
```bash
cd frontend
npx expo start
```

Escanea el QR con la app de Expo Go (Android) o presiona `a` para abrir en emulador.

## 📁 Estructura del Proyecto

```
studyboys/
├── frontend/               # App React Native
│   ├── src/
│   │   ├── screens/       # Pantallas (5 principales)
│   │   ├── components/    # Componentes reutilizables
│   │   ├── services/      # Llamadas a API
│   │   ├── utils/         # Utilidades
│   │   └── navigation/    # Configuración de navegación
│   └── App.js
├── backend/               # API Node.js
│   ├── routes/           # Endpoints
│   ├── controllers/      # Lógica de negocio
│   ├── services/         # Integración con APIs externas
│   └── server.js
└── README.md
```

## 🔌 Endpoints de la API

### Transcripción
```
POST /api/transcribe
Body: { audioFile: File }
Response: { transcription: string }
```

### Resumen
```
POST /api/summarize
Body: { text: string }
Response: { summary: string }
```

## 📅 Cronograma de Desarrollo

| Mes | Objetivo Principal |
|-----|-------------------|
| **Mes 1** | Setup + Diseño UI/UX + Maquetado de 5 pantallas |
| **Mes 2** | Grabación de audio + Almacenamiento local |
| **Mes 3** | Backend + Transcripción automática |
| **Mes 4** | Generación de resúmenes + Funciones secundarias |
| **Mes 5** | Testing + Corrección de bugs + Lanzamiento |

## 💰 Presupuesto Estimado

- **Google Cloud Speech-to-Text**: $50-150 (5 meses)
- **OpenAI API**: $25-100 (5 meses)
- **Hosting**: $0 (free tier)
- **Google Play Store**: $25 (pago único)
- **TOTAL**: ~$100-275 USD

## 🧪 Testing

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

## 📦 Build para Producción

### Generar APK
```bash
cd frontend
eas build --platform android
```

### Deploy del Backend
```bash
cd backend
# Configurar en Render/Railway según documentación
git push origin main  # Auto-deploy configurado
```

## 📊 Métricas de Éxito del MVP

- ✅ 100% de funcionalidad sin crashes críticos
- ✅ ≥85% precisión en transcripción (español)
- ✅ App carga en <3 segundos
- ✅ ≥70% de usuarios satisfechos en beta
- ✅ Lanzamiento en ≤5 meses
- ✅ Presupuesto <$300 USD

## 🤝 Equipo Mínimo

- 1 Desarrollador Frontend (React Native)
- 1 Desarrollador Backend (Node.js)
- 1 Diseñador UI/UX (freelance, Mes 1)
- 1 QA Tester (opcional, puede ser dev)

## 📝 Tareas Inmediatas

1. [ ] Crear cuentas (Google Cloud, OpenAI, Render/Railway, Expo)
2. [ ] Configurar repositorio Git
3. [ ] Setup de entorno de desarrollo
4. [ ] Diseñar wireframes en Figma
5. [ ] Configurar herramienta de gestión (Trello/GitHub Projects)

## 🔐 Seguridad

- No commitear `.env` al repositorio
- Usar variables de entorno para API keys
- Validar input de usuario en backend
- Implementar rate limiting en endpoints

## 📚 Recursos

- [Documentación de React Native](https://reactnative.dev/)
- [Guía de Expo](https://docs.expo.dev/)
- [Google Speech-to-Text API](https://cloud.google.com/speech-to-text/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)

## 🐛 Troubleshooting

### Error: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error en build de Android
```bash
cd android
./gradlew clean
cd ..
npx expo start --clear
```

### API no responde
- Verificar que el backend esté corriendo
- Revisar API_URL en .env del frontend
- Comprobar API keys en .env del backend

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Equipo StudyBoys - [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com)

Repositorio: [https://github.com/tu-usuario/studyboys](https://github.com/tu-usuario/studyboys)

---

**¡Construyamos StudyBoys! 🚀📚**
