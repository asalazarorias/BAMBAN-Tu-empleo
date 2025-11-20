# Configuración de OpenAI - API Backend

## ✅ Cambios Realizados

Las llamadas a OpenAI ahora se realizan **a través del backend de Node.js** en lugar de hacerlas directamente desde el frontend. Esto mejora la seguridad al mantener la API key de OpenAI protegida en el servidor.

## 📁 Archivos Modificados

### 1. Backend (api_bamban)
- **`routes/openai.js`** (NUEVO): Endpoint para manejar las llamadas a OpenAI
- **`server.js`**: Registrado el nuevo endpoint `/api/openai`

### 2. Frontend (app_chambita)
- **`lib/services/ai_job_service.dart`**: Actualizado para llamar al backend de Node.js en lugar de Vercel

## 🔧 Configuración Requerida

### En el Backend (api_bamban)

1. Asegúrate de tener tu archivo `.env` con la API key de OpenAI:

```env
# Otros valores...
OPENAI_API_KEY=sk-tu_clave_de_openai_aqui
```

2. El endpoint está disponible en: `http://localhost:3000/api/openai` (desarrollo)

### En el Frontend (app_chambita)

No requiere configuración adicional. Usa automáticamente la URL del backend configurada en `lib/config/api_config.dart`:

```dart
static const String baseUrl = 'https://bamban-tu-empleo.onrender.com/api';
```

## 🚀 Cómo Funciona

### Flujo Anterior (❌ Inseguro)
```
Flutter App → OpenAI API directamente
```

### Flujo Nuevo (✅ Seguro)
```
Flutter App → Backend Node.js → OpenAI API
```

## 📡 Uso del Endpoint

### Request
```http
POST /api/openai
Content-Type: application/json

{
  "userQuery": "trabajos de programador en Bolivia"
}
```

### Response (Éxito)
```json
{
  "result": "🔍 Portales:\n• CompuTrabajo: https://www.computrabajo.com.bo\n• LinkedIn: https://www.linkedin.com/jobs/search/?location=Bolivia\n\n🏢 Empresas que contratan:\n• Banco Mercantil\n• Deloitte Bolivia\n• Tigo"
}
```

### Response (Error con Fallback)
```json
{
  "error": "Error de OpenAI API: 401",
  "fallback": "🔍 Portales en Bolivia:\n• CompuTrabajo: https://www.computrabajo.com.bo\n..."
}
```

## 🔐 Ventajas de Este Cambio

1. **Seguridad**: La API key de OpenAI nunca se expone en el frontend
2. **Control**: Puedes agregar logs, rate limiting, y monitoreo en el backend
3. **Consistencia**: Un solo punto de configuración para la API key
4. **Fallback**: Si OpenAI falla, se devuelve una respuesta predeterminada útil

## 🧪 Probar el Endpoint

Puedes probar el endpoint con PowerShell:

```powershell
$body = @{
    userQuery = "desarrollador web en La Paz"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/openai" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

O con curl:

```bash
curl -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"userQuery": "desarrollador web en La Paz"}'
```

## 📝 Notas Importantes

- El archivo `app_chambita/api/openai.js` (Vercel) ya no se usa si usas el backend de Node.js
- Asegúrate de que el servidor de Node.js esté corriendo antes de usar la búsqueda con IA
- En producción, la URL del backend debe estar configurada correctamente en `ApiConfig.baseUrl`

## 🐛 Solución de Problemas

### Error: "OPENAI_API_KEY no configurada"
- Verifica que el archivo `.env` en `api_bamban/` contiene `OPENAI_API_KEY=sk-...`
- Reinicia el servidor de Node.js después de agregar la variable

### Error: "Connection refused"
- Asegúrate de que el servidor de Node.js está corriendo en el puerto 3000
- Verifica la URL en `lib/config/api_config.dart`

### La respuesta tarda mucho
- Es normal, OpenAI puede tardar varios segundos en responder
- El timeout está configurado a 30 segundos en `ApiConfig`
