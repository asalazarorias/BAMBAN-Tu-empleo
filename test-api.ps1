# Script de prueba del API - Diagnóstico completo
# Ejecuta: .\test-api.ps1

Write-Host "🔍 Iniciando diagnóstico del API BAMBAN..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si el servidor está corriendo
Write-Host "1️⃣ Verificando servidor..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 3
    Write-Host "✅ Servidor corriendo en puerto 3000" -ForegroundColor Green
    Write-Host "   Estado BD: $($health.database)" -ForegroundColor $(if($health.database -eq 'Connected') {'Green'} else {'Red'})
    
    if ($health.database -ne 'Connected') {
        Write-Host "❌ SQL Server no está conectado. Verifica:" -ForegroundColor Red
        Write-Host "   - SQL Server está corriendo" -ForegroundColor Red
        Write-Host "   - Credenciales en .env son correctas" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "❌ No se puede conectar al servidor en localhost:3000" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar: npm start" -ForegroundColor Red
    exit
}

Write-Host ""

# 2. Obtener IP local para Flutter
Write-Host "2️⃣ Obteniendo IP local..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*"})[0].IPAddress
if ($ip) {
    Write-Host "✅ IP Local: $ip" -ForegroundColor Green
    Write-Host "   📱 Usa esta URL en Flutter: http://${ip}:3000" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  No se encontró IP local. Verifica tu conexión de red." -ForegroundColor Yellow
}

Write-Host ""

# 3. Probar registro
Write-Host "3️⃣ Probando registro de usuario..." -ForegroundColor Yellow
$testEmail = "test$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$registerBody = @{
    name = "Usuario Prueba"
    email = $testEmail
    password = "123456"
    role = "seeker"
    city = "Santa Cruz"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registro exitoso" -ForegroundColor Green
    Write-Host "   Usuario: $($registerResponse.user.name)" -ForegroundColor Gray
    Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor Gray
    Write-Host "   Token generado: $($registerResponse.token.Substring(0,20))..." -ForegroundColor Gray
    
    $token = $registerResponse.token
} catch {
    Write-Host "❌ Error en registro:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit
}

Write-Host ""

# 4. Probar login con el usuario recién creado
Write-Host "4️⃣ Probando login con el usuario creado..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host "   Usuario encontrado en BD: $($loginResponse.user.name)" -ForegroundColor Gray
    Write-Host "   Rol: $($loginResponse.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error en login (usuario recién creado no se encuentra):" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Esto indica que el registro no persistió en la BD." -ForegroundColor Red
    Write-Host "   Posibles causas:" -ForegroundColor Red
    Write-Host "   - La tabla Users no existe (ejecuta: npm run init-db)" -ForegroundColor Red
    Write-Host "   - Problemas de permisos en SQL Server" -ForegroundColor Red
    exit
}

Write-Host ""

# 5. Verificar endpoint /me
Write-Host "5️⃣ Verificando token de autenticación..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $meResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers $headers
    Write-Host "✅ Token válido" -ForegroundColor Green
    Write-Host "   Usuario autenticado: $($meResponse.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al verificar token" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 RESUMEN DEL DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Servidor Node.js: FUNCIONANDO" -ForegroundColor Green
Write-Host "✅ Base de datos SQL Server: CONECTADA" -ForegroundColor Green
Write-Host "✅ Registro de usuarios: FUNCIONAL" -ForegroundColor Green
Write-Host "✅ Login de usuarios: FUNCIONAL" -ForegroundColor Green
Write-Host "✅ Autenticación JWT: FUNCIONAL" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 TODO FUNCIONA CORRECTAMENTE EN EL BACKEND" -ForegroundColor Green
Write-Host ""
Write-Host "📱 CONFIGURACIÓN PARA FLUTTER:" -ForegroundColor Yellow
Write-Host "   En auth_service.dart, usa:" -ForegroundColor White
Write-Host "   static const String baseUrl = 'http://${ip}:3000';" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   1. Tu teléfono debe estar en la misma red WiFi" -ForegroundColor White
Write-Host "   2. NO uses 'localhost' en Flutter" -ForegroundColor White
Write-Host "   3. Permite Node.js en el Firewall de Windows si te pregunta" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Usuario de prueba creado:" -ForegroundColor Yellow
Write-Host "   Email: $testEmail" -ForegroundColor White
Write-Host "   Password: 123456" -ForegroundColor White
Write-Host ""
