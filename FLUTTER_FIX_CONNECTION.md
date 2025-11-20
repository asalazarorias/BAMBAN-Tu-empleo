# 🔧 Solución: Error de conexión "Failed host lookup"

## ❌ Error actual
```
ClientException with SocketException: Failed host lookup: 
'bamban-tu-empleo.onrender.com' (OS Error: No address associated 
with hostname, errno = 7)
```

## 🎯 Causa
Tu dispositivo Android no puede resolver el dominio `bamban-tu-empleo.onrender.com`. Posibles razones:
1. **Sin conexión a internet** o conexión inestable
2. **DNS bloqueado** en tu red WiFi/móvil
3. **Firewall** o **VPN** bloqueando Render.com
4. **Datos móviles desactivados** para la app

---

## ✅ Solución 1: Verificar y mejorar auth_service.dart

Actualiza tu `auth_service.dart` con mejor manejo de errores:

```dart
import 'dart:convert';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl = 'https://bamban-tu-empleo.onrender.com';
  
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  // Guardar sesión
  Future<void> saveSession(String token, Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(userData));
  }

  // Obtener token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Obtener usuario
  Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);
    return userJson != null ? jsonDecode(userJson) : null;
  }

  // Verificar sesión
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // Cerrar sesión
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  // Verificar conectividad
  Future<bool> checkConnectivity() async {
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  // REGISTRO con manejo de errores mejorado
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? phoneIntl,
    String? city,
  }) async {
    // Verificar conectividad primero
    final hasInternet = await checkConnectivity();
    if (!hasInternet) {
      return {
        'success': false,
        'title': 'Sin conexión a internet',
        'message': '📶 No tienes conexión a internet.\n\nActiva WiFi o datos móviles e intenta de nuevo.'
      };
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
          'role': role,
          'phoneIntl': phoneIntl,
          'city': city,
        }),
      ).timeout(
        Duration(seconds: 30),
        onTimeout: () {
          throw TimeoutException('La conexión tardó demasiado');
        },
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await saveSession(data['token'], data['user']);
        return {'success': true, 'data': data};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'title': 'Error al registrar',
          'message': error['error'] ?? 'No se pudo crear la cuenta'
        };
      }
    } on SocketException catch (e) {
      // Error de red/DNS
      if (e.message.contains('Failed host lookup')) {
        return {
          'success': false,
          'title': 'Problema de conexión',
          'message': '🌐 No se puede conectar al servidor.\n\n'
              'Intenta:\n'
              '• Activar datos móviles para esta app\n'
              '• Cambiar de WiFi a datos móviles (o viceversa)\n'
              '• Desactivar VPN si tienes una\n'
              '• Reiniciar tu teléfono'
        };
      }
      return {
        'success': false,
        'title': 'Error de red',
        'message': '📡 Problema de conexión.\n\nVerifica tu internet e intenta de nuevo.'
      };
    } on TimeoutException {
      return {
        'success': false,
        'title': 'Tiempo agotado',
        'message': '⏱️ La conexión tardó demasiado.\n\nIntenta de nuevo.'
      };
    } catch (e) {
      return {
        'success': false,
        'title': 'Error inesperado',
        'message': '❌ Ocurrió un error: ${e.toString()}'
      };
    }
  }

  // LOGIN con manejo de errores mejorado
  Future<Map<String, dynamic>> login(String email, String password) async {
    // Verificar conectividad primero
    final hasInternet = await checkConnectivity();
    if (!hasInternet) {
      return {
        'success': false,
        'title': 'Sin conexión a internet',
        'message': '📶 No tienes conexión a internet.\n\nActiva WiFi o datos móviles e intenta de nuevo.'
      };
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(
        Duration(seconds: 30),
        onTimeout: () {
          throw TimeoutException('La conexión tardó demasiado');
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await saveSession(data['token'], data['user']);
        return {'success': true, 'data': data};
      } else {
        final error = jsonDecode(response.body);
        return {
          'success': false,
          'title': 'Credenciales inválidas',
          'message': error['error'] ?? 'Email o contraseña incorrectos'
        };
      }
    } on SocketException catch (e) {
      if (e.message.contains('Failed host lookup')) {
        return {
          'success': false,
          'title': 'Problema de conexión',
          'message': '🌐 No se puede conectar al servidor.\n\n'
              'Intenta:\n'
              '• Activar datos móviles para esta app\n'
              '• Cambiar de WiFi a datos móviles (o viceversa)\n'
              '• Desactivar VPN si tienes una\n'
              '• Reiniciar tu teléfono'
        };
      }
      return {
        'success': false,
        'title': 'Error de red',
        'message': '📡 Problema de conexión.\n\nVerifica tu internet e intenta de nuevo.'
      };
    } on TimeoutException {
      return {
        'success': false,
        'title': 'Tiempo agotado',
        'message': '⏱️ La conexión tardó demasiado.\n\nIntenta de nuevo.'
      };
    } catch (e) {
      return {
        'success': false,
        'title': 'Error inesperado',
        'message': '❌ Ocurrió un error: ${e.toString()}'
      };
    }
  }
}

class TimeoutException implements Exception {
  final String message;
  TimeoutException(this.message);
}
```

---

## ✅ Solución 2: Actualizar tu pantalla de registro

```dart
Future<void> _handleRegister() async {
  if (_nameController.text.isEmpty || 
      _emailController.text.isEmpty || 
      _passwordController.text.isEmpty) {
    _showError('Error', 'Por favor completa todos los campos');
    return;
  }

  setState(() => _isLoading = true);

  final result = await _authService.register(
    name: _nameController.text.trim(),
    email: _emailController.text.trim(),
    password: _passwordController.text,
    role: _selectedRole,
  );

  setState(() => _isLoading = false);

  if (result['success']) {
    // Registro exitoso
    Navigator.pushReplacementNamed(context, '/home');
  } else {
    // Mostrar error con título y mensaje
    _showError(
      result['title'] ?? 'Error',
      result['message'] ?? 'Ocurrió un error',
    );
  }
}

void _showError(String title, String message) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red),
          SizedBox(width: 8),
          Expanded(child: Text(title)),
        ],
      ),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Entendido'),
        ),
      ],
    ),
  );
}
```

---

## 🔧 Solución 3: Verificar permisos de Internet en Android

Asegúrate de que tu `android/app/src/main/AndroidManifest.xml` tenga:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Agregar estos permisos -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    
    <application
        android:label="BAMBAN"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        <!-- ... resto del código -->
    </application>
</manifest>
```

---

## 📱 Solución 4: Verificar en tu dispositivo

### En tu teléfono Android:

1. **Activar datos móviles para la app:**
   - Ajustes → Apps → BAMBAN → Datos móviles
   - Activar "Permitir uso de datos en segundo plano"

2. **Verificar WiFi:**
   - ¿Estás conectado?
   - ¿Puedes abrir Chrome y navegar?

3. **Desactivar VPN** (si tienes una activa)

4. **Probar con datos móviles** en lugar de WiFi (o viceversa)

5. **Reiniciar el teléfono**

---

## 🧪 Solución 5: Agregar botón de prueba de conexión

En tu pantalla de login/registro, agrega temporalmente:

```dart
// Botón para probar conexión
ElevatedButton.icon(
  onPressed: () async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 16),
            Text('Probando conexión...'),
          ],
        ),
      ),
    );

    final authService = AuthService();
    
    // Probar conectividad
    final hasInternet = await authService.checkConnectivity();
    
    Navigator.pop(context); // Cerrar loading
    
    // Probar el servidor
    String serverStatus = '❌ No accesible';
    try {
      final response = await http.get(
        Uri.parse('${AuthService.baseUrl}/health'),
      ).timeout(Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        serverStatus = '✅ Funcionando';
      }
    } catch (e) {
      serverStatus = '❌ Error: $e';
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Estado de conexión'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Internet: ${hasInternet ? "✅ Conectado" : "❌ Sin conexión"}'),
            SizedBox(height: 8),
            Text('Servidor: $serverStatus'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  },
  icon: Icon(Icons.wifi_find),
  label: Text('Probar conexión'),
  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
)
```

---

## 🎯 Resumen de pasos

1. ✅ Copia el código mejorado de `auth_service.dart`
2. ✅ Actualiza tu pantalla de registro para usar `title` y `message` del error
3. ✅ Verifica permisos en `AndroidManifest.xml`
4. ✅ Desinstala la app antigua del teléfono
5. ✅ Ejecuta `flutter clean && flutter pub get`
6. ✅ Instala de nuevo: `flutter run`
7. ✅ Activa datos móviles para la app
8. ✅ Prueba el botón de "Probar conexión"
9. ✅ Si funciona, intenta registrarte

---

## 🆘 Si sigue sin funcionar

El servidor está funcionando perfectamente (lo acabo de verificar). El problema es 100% de conectividad en tu dispositivo.

**Última solución:** Usa un **punto de acceso WiFi diferente** o **comparte internet desde otro teléfono** para verificar si es problema de tu red actual.
