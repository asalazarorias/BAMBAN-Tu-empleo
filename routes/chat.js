const express = require('express');
const router = express.Router();
const { safeExternalCall, sendErrorResponse } = require('../utils/errorHandler');

/**
 * Simulación de llamada a API de OpenAI
 * En producción, aquí usarías el SDK oficial de OpenAI o fetch
 */
async function callOpenAI(userMessage, context = {}) {
  // Ejemplo con fetch (requiere node-fetch o Node.js 18+)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente virtual que ayuda a buscar empleos en Bolivia. Proporciona información sobre portales de empleo, empresas que contratan, y consejos para la búsqueda de trabajo.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = new Error(`OpenAI API error: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return {
    reply: data.choices[0].message.content,
    usage: data.usage
  };
}

/**
 * POST /api/chat/ask
 * Endpoint para el asistente de empleos IA
 * Body: { message: string, context?: object }
 */
router.post('/ask', async (req, res) => {
  try {
    const { message, context } = req.body;

    // Validación básica
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          title: 'Mensaje inválido',
          message: '⚠️ Por favor, escribe un mensaje para continuar.'
        }
      });
    }

    // Validación de API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: {
          code: 'CONFIG_ERROR',
          title: 'Configuración incompleta',
          message: '⚙️ El servicio de IA no está configurado. Contacta al administrador.'
        }
      });
    }

    // Llamada segura a OpenAI con manejo de errores
    const result = await safeExternalCall(() => callOpenAI(message, context));

    // Si hay error, enviarlo formateado
    if (!result.ok) {
      return sendErrorResponse(res, result);
    }

    // Respuesta exitosa
    res.json({
      ok: true,
      data: {
        reply: result.data.reply,
        suggestions: [
          'Portales de empleo en Bolivia',
          'Empresas que contratan',
          'Consejos para entrevistas'
        ]
      }
    });

  } catch (error) {
    // Captura de errores inesperados
    console.error('❌ Error inesperado en /api/chat/ask:', error);
    res.status(500).json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        title: 'Error interno',
        message: '💥 Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/chat/health
 * Health check del servicio de chat
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  res.json({
    status: hasApiKey ? 'OK' : 'NOT_CONFIGURED',
    service: 'Chat AI',
    apiKeyConfigured: hasApiKey
  });
});

module.exports = router;
