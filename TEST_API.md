# 🔍 Diagnóstico y Pruebas del API

## 1️⃣ Verificar que el servidor esté corriendo

```powershell
# En la carpeta api_bamban
npm start
```

Deberías ver:
```
╔═══════════════════════════════════════════════╗
║     🚀 API Chambita en funcionamiento        ║
║     Puerto: 3000                              ║
╚═══════════════════════════════════════════════╝
```

## 2️⃣ Verificar conexión a la base de datos

Abre tu navegador o usa PowerShell:

```powershell
# Verificar health check
curl http://localhost:3000/health
```

Deberías recibir:
```json
{"status":"OK","database":"Connected"}
```

Si dice `"database":"Disconnected"` → **Tu SQL Server no está corriendo**

## 3️⃣ Inicializar la base de datos (si no lo has hecho)

```powershell
npm run init-db
```

Esto crea las tablas necesarias en SQL Server.

## 4️⃣ Probar el registro desde PowerShell

```powershell
# Registro de usuario de prueba
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "123456"
    role = "seeker"
    city = "Santa Cruz"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

Si funciona, deberías recibir:
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890-abc123",
    "name": "Test User",
    "email": "test@example.com",
    "role": "seeker"
  }
}
```

## 5️⃣ Probar el login con ese usuario

```powershell
$loginBody = @{
    email = "test@example.com"
    password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
```

## 6️⃣ Ver usuarios en la base de datos

```powershell
# Si tienes acceso a SQL Server Management Studio
# Ejecuta esta query:
SELECT id, name, email, role, city, createdAt FROM Users
```

---

## 🔧 Soluciones a problemas comunes

### ❌ Error: "database":"Disconnected"

**Solución:**
1. Verifica que SQL Server esté corriendo:
   - Busca "Servicios" en Windows
   - Busca "SQL Server (MSSQLSERVER)" o similar
   - Si está detenido, dale clic derecho → Iniciar

2. Verifica tus credenciales en `.env`:
   ```env
   DB_SERVER=localhost
   DB_PORT=1433
   DB_DATABASE=chambita
   DB_USER=sa
   DB_PASSWORD=TU_PASSWORD_AQUI
   ```

### ❌ Error: "El email ya está registrado"

**Solución:** El usuario ya existe. Usa otro email o elimina el usuario:
```sql
DELETE FROM Users WHERE email = 'test@example.com'
```

### ❌ Flutter no se conecta al API

**Problema:** `localhost` en Flutter no funciona (apunta al emulador, no a tu PC)

**Solución:** Usa tu IP local en Flutter:

1. Obtén tu IP:
   ```powershell
   ipconfig
   ```
   Busca "IPv4" (algo como `192.168.1.X`)

2. En tu `auth_service.dart` de Flutter:
   ```dart
   static const String baseUrl = 'http://192.168.1.X:3000'; // Tu IP aquí
   ```

3. **IMPORTANTE:** Asegúrate de que tu teléfono/emulador esté en la misma red WiFi

### ❌ Flutter dice "Connection refused"

**Causas posibles:**
1. El servidor Node no está corriendo → Ejecuta `npm start`
2. El firewall de Windows bloquea el puerto 3000 → Permite Node.js en el firewall
3. La IP es incorrecta → Verifica con `ipconfig`

---

## 📱 Configuración correcta en Flutter

### auth_service.dart

```dart
class AuthService {
  // CAMBIA ESTO por tu IP local (obtén con ipconfig)
  static const String baseUrl = 'http://192.168.1.5:3000'; 
  
  // ... resto del código
}
```

### Verificar desde Flutter

Agrega este botón de prueba temporal en tu LoginScreen:

```dart
ElevatedButton(
  onPressed: () async {
    try {
      final response = await http.get(
        Uri.parse('${AuthService.baseUrl}/health'),
      );
      print('✅ Respuesta: ${response.body}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Conexión OK: ${response.body}')),
      );
    } catch (e) {
      print('❌ Error: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  },
  child: Text('Probar conexión al servidor'),
)
```

Si este botón funciona → El problema está en el registro/login
Si no funciona → El problema es de conectividad

---

## 🎯 Checklist completo

- [ ] SQL Server está corriendo
- [ ] Base de datos inicializada (`npm run init-db`)
- [ ] Servidor Node corriendo (`npm start`)
- [ ] `/health` responde OK desde navegador
- [ ] Registro funciona desde PowerShell
- [ ] Login funciona desde PowerShell
- [ ] IP local obtenida con `ipconfig`
- [ ] Flutter configurado con IP correcta (no localhost)
- [ ] Teléfono en la misma red WiFi que la PC
- [ ] Botón de prueba en Flutter funciona

---

## 📞 Comandos rápidos de diagnóstico

```powershell
# Ver si el puerto 3000 está en uso
netstat -ano | findstr :3000

# Reiniciar el servidor
# Presiona Ctrl+C en la terminal donde corre npm start, luego:
npm start

# Ver logs del servidor
# Los verás en la terminal donde ejecutaste npm start
```

---

## 🆘 Si nada funciona

1. **Borra la base de datos y reinicia:**
   ```sql
   DROP TABLE IF EXISTS Reviews;
   DROP TABLE IF EXISTS Emprendimientos;
   DROP TABLE IF EXISTS Employees;
   DROP TABLE IF EXISTS Companies;
   DROP TABLE IF EXISTS JobOpportunities;
   DROP TABLE IF EXISTS JobPosts;
   DROP TABLE IF EXISTS Users;
   ```
   
   Luego ejecuta:
   ```powershell
   npm run init-db
   ```

2. **Verifica que `.env` exista y tenga todos los valores:**
   ```env
   PORT=3000
   NODE_ENV=development
   DB_SERVER=localhost
   DB_PORT=1433
   DB_DATABASE=chambita
   DB_USER=sa
   DB_PASSWORD=TuPassword123
   JWT_SECRET=tu_secreto_super_seguro
   JWT_EXPIRES_IN=7d
   ```

3. **Comparte el error exacto:**
   - Qué mensaje aparece en Flutter
   - Qué aparece en la terminal del servidor Node
   - Qué dice el health check

