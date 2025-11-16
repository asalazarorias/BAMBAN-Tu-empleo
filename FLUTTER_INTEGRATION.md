# 🎨 Guía de Integración del Chatbot en Flutter

Esta guía muestra cómo integrar el endpoint del chatbot en tu aplicación Flutter con manejo elegante de errores.

## 📦 Dependencias necesarias

Agrega en `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
  flutter_dotenv: ^5.1.0
```

## 🔧 Servicio de Chat (chat_service.dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ChatService {
  final String baseUrl;
  
  ChatService({required this.baseUrl});

  /// Envía un mensaje al chatbot
  /// Retorna un ChatResponse con ok, data o error
  Future<ChatResponse> sendMessage(String message, {Map<String, dynamic>? context}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/chat/ask'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': message,
          'context': context,
        }),
      ).timeout(
        Duration(seconds: 30),
        onTimeout: () {
          throw Exception('TIMEOUT_ERROR');
        },
      );

      final data = jsonDecode(response.body);
      
      return ChatResponse.fromJson(data);
    } on http.ClientException catch (e) {
      // Error de red (sin conexión, DNS, etc.)
      return ChatResponse(
        ok: false,
        error: ErrorInfo(
          code: 'NETWORK_ERROR',
          title: 'Sin conexión',
          message: '⚠️ No se pudo conectar al servicio. Por favor, verifica tu conexión a internet y vuelve a intentarlo.',
        ),
      );
    } catch (e) {
      // Error genérico
      return ChatResponse(
        ok: false,
        error: ErrorInfo(
          code: 'UNKNOWN_ERROR',
          title: 'Error inesperado',
          message: '❌ Ocurrió un error. Por favor, intenta nuevamente.',
          details: e.toString(),
        ),
      );
    }
  }

  /// Verifica el estado del servicio
  Future<bool> checkHealth() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/chat/health'),
      ).timeout(Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}

// Modelos de datos
class ChatResponse {
  final bool ok;
  final ChatData? data;
  final ErrorInfo? error;

  ChatResponse({required this.ok, this.data, this.error});

  factory ChatResponse.fromJson(Map<String, dynamic> json) {
    return ChatResponse(
      ok: json['ok'] ?? false,
      data: json['data'] != null ? ChatData.fromJson(json['data']) : null,
      error: json['error'] != null ? ErrorInfo.fromJson(json['error']) : null,
    );
  }
}

class ChatData {
  final String reply;
  final List<String>? suggestions;

  ChatData({required this.reply, this.suggestions});

  factory ChatData.fromJson(Map<String, dynamic> json) {
    return ChatData(
      reply: json['reply'] ?? '',
      suggestions: json['suggestions'] != null 
        ? List<String>.from(json['suggestions']) 
        : null,
    );
  }
}

class ErrorInfo {
  final String code;
  final String title;
  final String message;
  final String? details;

  ErrorInfo({
    required this.code,
    required this.title,
    required this.message,
    this.details,
  });

  factory ErrorInfo.fromJson(Map<String, dynamic> json) {
    return ErrorInfo(
      code: json['code'] ?? 'UNKNOWN_ERROR',
      title: json['title'] ?? 'Error',
      message: json['message'] ?? 'Ocurrió un error',
      details: json['details'],
    );
  }
}
```

## 🎨 Widget de Card de Error (error_card.dart)

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ErrorCard extends StatefulWidget {
  final String title;
  final String message;
  final String? details;
  final VoidCallback? onRetry;
  final VoidCallback? onContact;

  const ErrorCard({
    Key? key,
    required this.title,
    required this.message,
    this.details,
    this.onRetry,
    this.onContact,
  }) : super(key: key);

  @override
  State<ErrorCard> createState() => _ErrorCardState();
}

class _ErrorCardState extends State<ErrorCard> {
  bool _showDetails = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.red.shade50,
      elevation: 2,
      margin: EdgeInsets.all(12),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Título con ícono
            Row(
              children: [
                Icon(Icons.error_outline, color: Colors.red.shade700, size: 24),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.red.shade800,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            
            // Mensaje
            Text(
              widget.message,
              style: TextStyle(color: Colors.grey.shade800, fontSize: 14),
            ),
            SizedBox(height: 16),
            
            // Botones de acción
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (widget.onRetry != null)
                  ElevatedButton.icon(
                    onPressed: widget.onRetry,
                    icon: Icon(Icons.refresh, size: 18),
                    label: Text('Reintentar'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange.shade600,
                      foregroundColor: Colors.white,
                    ),
                  ),
                
                if (widget.details != null)
                  OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        _showDetails = !_showDetails;
                      });
                    },
                    icon: Icon(
                      _showDetails ? Icons.visibility_off : Icons.visibility,
                      size: 18,
                    ),
                    label: Text(_showDetails ? 'Ocultar detalles' : 'Ver detalles'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.orange.shade700,
                    ),
                  ),
                
                if (widget.onContact != null)
                  TextButton.icon(
                    onPressed: widget.onContact,
                    icon: Icon(Icons.support_agent, size: 18),
                    label: Text('Contactar soporte'),
                  ),
              ],
            ),
            
            // Detalles técnicos (colapsable)
            if (_showDetails && widget.details != null) ...[
              SizedBox(height: 12),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Detalles técnicos',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.copy, size: 16),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: widget.details!));
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Detalles copiados al portapapeles'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                          tooltip: 'Copiar',
                          padding: EdgeInsets.zero,
                          constraints: BoxConstraints(),
                        ),
                      ],
                    ),
                    SizedBox(height: 4),
                    SelectableText(
                      widget.details!,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade600,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

## 💬 Ejemplo de Pantalla de Chat (chat_screen.dart)

```dart
import 'package:flutter/material.dart';
import 'chat_service.dart';
import 'error_card.dart';

class ChatScreen extends StatefulWidget {
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _chatService = ChatService(baseUrl: 'http://localhost:3000');
  
  List<ChatMessage> _messages = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(text: text, isUser: true));
      _isLoading = true;
      _messageController.clear();
    });

    _scrollToBottom();

    final response = await _chatService.sendMessage(text);

    setState(() {
      _isLoading = false;
      if (response.ok && response.data != null) {
        _messages.add(ChatMessage(
          text: response.data!.reply,
          isUser: false,
          suggestions: response.data!.suggestions,
        ));
      } else if (response.error != null) {
        _messages.add(ChatMessage(
          text: '',
          isUser: false,
          error: response.error,
        ));
      }
    });

    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.smart_toy),
            SizedBox(width: 8),
            Text('Asistente de Empleos IA'),
          ],
        ),
        backgroundColor: Colors.orange,
      ),
      body: Column(
        children: [
          // Lista de mensajes
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: EdgeInsets.all(8),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return message.error != null
                    ? ErrorCard(
                        title: message.error!.title,
                        message: message.error!.message,
                        details: message.error!.details,
                        onRetry: () => _sendMessage(),
                      )
                    : _buildMessageBubble(message);
              },
            ),
          ),

          // Indicador de carga
          if (_isLoading)
            Padding(
              padding: EdgeInsets.all(8),
              child: Row(
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 8),
                  Text('Escribiendo...', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ),

          // Input de mensaje
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 4,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Ej: Busco trabajo de...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                SizedBox(width: 8),
                IconButton(
                  onPressed: _sendMessage,
                  icon: Icon(Icons.send),
                  color: Colors.orange,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 4),
        padding: EdgeInsets.all(12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: message.isUser ? Colors.orange.shade100 : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message.text),
            if (message.suggestions != null && message.suggestions!.isNotEmpty) ...[
              SizedBox(height: 8),
              Wrap(
                spacing: 4,
                runSpacing: 4,
                children: message.suggestions!
                    .map((s) => Chip(label: Text(s, style: TextStyle(fontSize: 12))))
                    .toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final List<String>? suggestions;
  final ErrorInfo? error;

  ChatMessage({
    required this.text,
    required this.isUser,
    this.suggestions,
    this.error,
  });
}
```

## 🚀 Uso en tu App

En tu `main.dart` o donde inicialices rutas:

```dart
MaterialApp(
  home: ChatScreen(),
  // ... resto de tu configuración
)
```

## ✅ Checklist de Integración

- [ ] Instalar dependencias (`http`, `flutter_dotenv`)
- [ ] Copiar `chat_service.dart` a tu proyecto
- [ ] Copiar `error_card.dart` a tu proyecto
- [ ] Configurar la URL base del API (localhost:3000 o tu servidor)
- [ ] Agregar la API key de OpenAI en el backend (`.env`)
- [ ] Probar con y sin conexión para ver el manejo de errores
- [ ] Personalizar colores y estilos según tu tema

## 🎨 Personalización

Puedes cambiar:
- Colores del tema (naranja → tu color)
- Íconos y emojis
- Textos de los mensajes de error
- Agregar más acciones (compartir, reportar bug, etc.)

## 📱 Preview del Comportamiento

1. **Usuario envía mensaje** → Aparece en la derecha
2. **IA responde** → Aparece en la izquierda con sugerencias
3. **Error de red** → Aparece `ErrorCard` con botón "Reintentar"
4. **Usuario hace clic en "Ver detalles"** → Muestra info técnica
5. **Usuario hace clic en "Reintentar"** → Reenvía el último mensaje

---

**¡Listo!** Ahora tu chatbot mostrará errores bonitos y profesionales en lugar de excepciones crudas 🎉
