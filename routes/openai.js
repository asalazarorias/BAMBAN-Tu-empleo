const express = require('express');
const router = express.Router();

/**
 * POST /api/openai
 * Endpoint para realizar búsquedas de empleo usando OpenAI
 */
router.post('/', async (req, res) => {
  try {
    const { userQuery } = req.body;

    // Validar que userQuery esté presente
    if (!userQuery) {
      return res.status(400).json({ error: 'userQuery es requerido' });
    }

    // Verificar que la API key de OpenAI esté configurada
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[OpenAI] OPENAI_API_KEY no configurada');
      return res.status(500).json({
        error: 'API key de OpenAI no configurada',
        fallback: getFallbackResponse()
      });
    }

    // Construir las instrucciones del sistema
    const systemInstructions = `Eres un asistente de búsqueda de empleos en BOLIVIA.

SÉ BREVE Y CONCISO. Responde en máximo 10 líneas.

FORMATO DE RESPUESTA:
1. Lista 2-3 portales de empleo bolivianos con links
2. Lista 2-3 empresas que contratan para "${userQuery}" en Bolivia

EJEMPLO:
🔍 Portales:
• CompuTrabajo: https://www.computrabajo.com.bo
• LinkedIn: https://www.linkedin.com/jobs/search/?location=Bolivia

🏢 Empresas que contratan:
• Banco Mercantil
• Deloitte Bolivia
• Tigo`;

    const userInput = `${systemInstructions}

Busco: ${userQuery} en Bolivia

Dame SOLO portales y empresas. Máximo 10 líneas.`;

    // Llamar a OpenAI API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        input: userInput,
        reasoning: {
          effort: 'minimal',
        },
        text: {
          verbosity: 'low',
        },
        max_output_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI] Error de API:', response.status, errorText);
      return res.status(500).json({
        error: `Error de OpenAI API: ${response.status}`,
        fallback: getFallbackResponse()
      });
    }

    const data = await response.json();
    
    // Extraer el texto de la respuesta
    let outputText = 'No se pudo generar una respuesta.';
    try {
      const output = data.output;
      if (output && output.length > 1) {
        const message = output[1];
        const content = message.content;
        if (content && content.length > 0) {
          outputText = content[0].text || outputText;
        }
      }
    } catch (e) {
      console.error('[OpenAI] Error parseando respuesta:', e);
      outputText = data.output_text?.toString() || 
                  data.text?.toString() || 
                  data.content?.toString() ||
                  outputText;
    }

    console.log('[OpenAI] Búsqueda exitosa para:', userQuery);
    return res.status(200).json({ result: outputText });

  } catch (error) {
    console.error('[OpenAI] Error:', error.message);
    return res.status(500).json({
      error: error.message,
      fallback: getFallbackResponse()
    });
  }
});

/**
 * Respuesta de fallback cuando OpenAI no está disponible
 */
function getFallbackResponse() {
  return `🔍 Portales en Bolivia:
• CompuTrabajo: https://www.computrabajo.com.bo
• LinkedIn: https://www.linkedin.com/jobs/search/?location=Bolivia
• Indeed: https://bo.indeed.com

🏢 Empresas bolivianas:
• Bancos: BNB, Banco Mercantil
• Tech: Viva, Tigo, Entel
• Consultoras: Deloitte, EY, KPMG`;
}

module.exports = router;
