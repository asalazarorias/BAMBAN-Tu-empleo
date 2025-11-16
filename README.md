# 🚀 API Chambita - Node.js con SQL Server

API REST desarrollada en Node.js con Express para conectar la aplicación Flutter Chambita con SQL Server.

## 📋 Características

- ✅ Autenticación con JWT
- ✅ CRUD completo de usuarios (UserProfile)
- ✅ Gestión de publicaciones de trabajo (JobPost)
- ✅ Gestión de oportunidades de empleo (JobOpportunity)
- ✅ Gestión de empresas (Company)
- ✅ Gestión de empleados con memorandums y reconocimientos
- ✅ Gestión de emprendimientos
- ✅ Validación de datos
- ✅ Manejo de errores
- ✅ CORS habilitado

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **mssql** - Driver de SQL Server
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validación de datos

## 📦 Instalación

### 1. Instalar dependencias

```powershell
cd api_bamban
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus valores:

```powershell
Copy-Item .env.example .env
```

Edita el archivo `.env`:

```env
PORT=3000
NODE_ENV=development

# Configuración de SQL Server
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=chambita_db
DB_USER=sa
DB_PASSWORD=TuPasswordAqui

# JWT Secret
JWT_SECRET=tu_secret_key_muy_segura_cambiar_en_produccion
JWT_EXPIRES_IN=7d
```

### 3. Inicializar la base de datos

Este comando creará todas las tablas necesarias en SQL Server:

```powershell
npm run init-db
```

### 4. (Opcional) Insertar datos de ejemplo

Si deseas poblar la base de datos con usuarios y trabajos de prueba:

```powershell
npm run seed
```

**Nota:** Los datos de ejemplo incluyen:
- 16 usuarios con diferentes roles (buscadores de trabajo, proveedores de servicios, empresas)
- 2 publicaciones de trabajo
- Todos los usuarios tienen la contraseña: `123456`

### Alternativa: Usar SQL Server Management Studio

Si prefieres ejecutar el script SQL directamente:

1. Abre SQL Server Management Studio
2. Abre el archivo `scripts/init-database.sql`
3. Ejecuta el script

## 🚀 Ejecutar la API

### Modo desarrollo (con auto-reload)

```powershell
npm run dev
```

### Modo producción

```powershell
npm start
```

La API estará disponible en: `http://localhost:3000`

## 📚 Endpoints

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario autenticado |
| PUT | `/api/auth/change-password` | Cambiar contraseña |

**Ejemplo de registro:**
```json
POST /api/auth/register
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "role": "seeker",
  "phoneIntl": "59177123456",
  "city": "Santa Cruz"
}
```

**Roles disponibles:**
- `seeker` - Buscador de trabajo
- `serviceSeeker` - Proveedor de servicios (plomero, electricista, etc.)
- `employer` - Empresa

**Ejemplo de login:**
```json
POST /api/auth/login
{
  "email": "juan@example.com",
  "password": "123456"
}
```

### 👤 Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Listar usuarios (con filtros) | No |
| GET | `/api/users/:id` | Obtener usuario por ID | No |
| PUT | `/api/users/:id` | Actualizar perfil | Sí |
| DELETE | `/api/users/:id` | Eliminar usuario | Sí |
| POST | `/api/users/:id/reviews` | Agregar reseña | Sí |

**Filtros disponibles:**
- `?role=seeker|serviceSeeker|employer`
- `?city=Santa Cruz`
- `?isProfilePublic=true`
- `?search=texto`

### 💼 Trabajos (`/api/jobs`)

#### JobPosts (Publicaciones)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/jobs/posts` | Listar publicaciones | No |
| GET | `/api/jobs/posts/:id` | Obtener publicación | No |
| POST | `/api/jobs/posts` | Crear publicación | Sí |
| PUT | `/api/jobs/posts/:id` | Actualizar publicación | Sí |
| DELETE | `/api/jobs/posts/:id` | Eliminar publicación | Sí |

**Filtros:**
- `?city=Santa Cruz`
- `?type=fullTime|partTime`
- `?modality=onsite|remote|hybrid`
- `?employerId=id`

#### JobOpportunities (Oportunidades)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/jobs/opportunities` | Listar oportunidades | No |
| GET | `/api/jobs/opportunities/:id` | Obtener oportunidad | No |
| POST | `/api/jobs/opportunities` | Crear oportunidad | Sí |
| PUT | `/api/jobs/opportunities/:id` | Actualizar oportunidad | Sí |
| DELETE | `/api/jobs/opportunities/:id` | Eliminar oportunidad | Sí |

**Filtros:**
- `?department=Cochabamba`
- `?sector=Tecnología`
- `?city=Cochabamba`
- `?search=texto`

### 💬 Chat IA (`/api/chat`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat/ask` | Consultar asistente de empleos | No |
| GET | `/api/chat/health` | Estado del servicio de chat | No |

**Ejemplo de consulta:**
```json
POST /api/chat/ask
Content-Type: application/json

{
  "message": "Busco trabajo de enfermera en Santa Cruz de la Sierra Bolivia",
  "context": {
    "location": "Santa Cruz",
    "profession": "enfermera"
  }
}
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "data": {
    "reply": "Te daré portales de empleo, empresas que contratan, y consejos para tu búsqueda...",
    "suggestions": [
      "Portales de empleo en Bolivia",
      "Empresas que contratan",
      "Consejos para entrevistas"
    ]
  }
}
```

**Respuesta con error (sin conexión):**
```json
{
  "ok": false,
  "error": {
    "code": "NETWORK_ERROR",
    "title": "Sin conexión",
    "message": "⚠️ No se pudo conectar al servicio. Por favor, verifica tu conexión a internet y vuelve a intentarlo."
  }
}
```

**Tipos de errores manejados:**
- `NETWORK_ERROR` - Sin conexión a internet
- `TIMEOUT_ERROR` - Tiempo de espera agotado
- `AUTH_ERROR` - Credenciales inválidas (problema del servidor)
- `RATE_LIMIT` - Demasiadas solicitudes
- `INVALID_INPUT` - Mensaje vacío o inválido
- `CONFIG_ERROR` - API key no configurada

**Configuración requerida:**
Agrega tu API key de OpenAI en `.env`:
```env
OPENAI_API_KEY=tu_clave_aqui
```

### 🏢 Empresas (`/api/companies`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/companies` | Listar empresas | No |
| GET | `/api/companies/:id` | Obtener empresa | No |
| POST | `/api/companies` | Crear empresa | Sí |
| PUT | `/api/companies/:id` | Actualizar empresa | Sí |
| DELETE | `/api/companies/:id` | Eliminar empresa | Sí |

**Filtros:**
- `?department=Santa Cruz`
- `?city=Santa Cruz`
- `?sector=Minería`
- `?region=Oriente`
- `?search=texto`

### 👥 Empleados (`/api/employees`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/employees` | Listar empleados | Sí |
| GET | `/api/employees/:id` | Obtener empleado (con memorandums y reconocimientos) | Sí |
| POST | `/api/employees` | Crear empleado | Sí |
| PUT | `/api/employees/:id` | Actualizar empleado | Sí |
| DELETE | `/api/employees/:id` | Eliminar empleado | Sí |

#### Memorandums

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/employees/:id/memorandums` | Listar memorandums | Sí |
| POST | `/api/employees/:id/memorandums` | Crear memorandum | Sí |
| DELETE | `/api/employees/:id/memorandums/:memoId` | Eliminar memorandum | Sí |

#### Reconocimientos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/employees/:id/recognitions` | Listar reconocimientos | Sí |
| POST | `/api/employees/:id/recognitions` | Crear reconocimiento | Sí |
| DELETE | `/api/employees/:id/recognitions/:recId` | Eliminar reconocimiento | Sí |

### 🏪 Emprendimientos (`/api/emprendimientos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/emprendimientos` | Listar emprendimientos | No |
| GET | `/api/emprendimientos/:id` | Obtener emprendimiento | No |
| POST | `/api/emprendimientos` | Crear emprendimiento | Sí |
| PUT | `/api/emprendimientos/:id` | Actualizar emprendimiento | Sí |
| DELETE | `/api/emprendimientos/:id` | Eliminar emprendimiento | Sí |

**Filtros:**
- `?ownerId=id`
- `?search=texto`

## 🔑 Autenticación

Para endpoints protegidos, incluye el token JWT en el header:

```
Authorization: Bearer <tu_token>
```

## 🗄️ Estructura de la Base de Datos

La API utiliza las siguientes tablas:

- **Users** - Perfiles de usuario
- **Companies** - Empresas
- **JobPosts** - Publicaciones de trabajo
- **JobOpportunities** - Oportunidades de empleo
- **Employees** - Empleados
- **Memorandums** - Amonestaciones
- **Recognitions** - Reconocimientos
- **Emprendimientos** - Emprendimientos

## 📱 Integración con Flutter

### 1. Configurar la URL base

```dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:3000/api';
  // O para dispositivos físicos:
  // static const String baseUrl = 'http://TU_IP:3000/api';
}
```

### 2. Ejemplo de login

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    final token = data['token'];
    // Guardar token para futuras peticiones
  }
}
```

### 3. Ejemplo con autenticación

```dart
Future<List<JobPost>> getJobPosts(String token) async {
  final response = await http.get(
    Uri.parse('${ApiConfig.baseUrl}/jobs/posts'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );

  if (response.statusCode == 200) {
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => JobPost.fromJson(json)).toList();
  }
  throw Exception('Error al cargar publicaciones');
}
```

## 🔧 Configuración de SQL Server

### Windows con SQL Server Express

1. Instalar SQL Server Express
2. Habilitar autenticación mixta (SQL y Windows)
3. Crear usuario y contraseña
4. Habilitar TCP/IP en SQL Server Configuration Manager
5. Crear la base de datos:

```sql
CREATE DATABASE chambita_db;
```

### Docker (Alternativa)

```powershell
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=TuPassword123!" -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2022-latest
```

## 🐛 Solución de Problemas

### Error de conexión a SQL Server

1. Verifica que SQL Server esté corriendo
2. Verifica el puerto (default 1433)
3. Verifica usuario y contraseña
4. Verifica que TCP/IP esté habilitado
5. Verifica el firewall

### Error de autenticación

- Verifica que el token JWT sea válido
- Verifica que el token no haya expirado
- Incluye el header `Authorization: Bearer <token>`

## 📄 Licencia

ISC

## 👤 Autor

API Chambita - Sistema de gestión de empleos y emprendimientos para Bolivia
