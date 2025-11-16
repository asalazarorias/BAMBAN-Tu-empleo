/**
 * Utility para manejo de errores de APIs externas
 * Sanitiza errores técnicos y devuelve respuestas amigables al usuario
 */

/**
 * Clasifica el tipo de error basado en la excepción
 * @param {Error} error - Error capturado
 * @returns {Object} Objeto con código, título y mensaje amigable
 */
function classifyError(error) {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  // Errores de red/DNS
  if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN' || 
      errorMessage.includes('failed host lookup') || 
      errorMessage.includes('no address associated')) {
    return {
      code: 'NETWORK_ERROR',
      title: 'Sin conexión',
      message: '⚠️ No se pudo conectar al servicio. Por favor, verifica tu conexión a internet y vuelve a intentarlo.',
      httpStatus: 503
    };
  }

  // Timeout
  if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
    return {
      code: 'TIMEOUT_ERROR',
      title: 'Tiempo de espera agotado',
      message: '⏱️ La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.',
      httpStatus: 504
    };
  }

  // Errores de autenticación
  if (error.status === 401 || errorMessage.includes('unauthorized') || 
      errorMessage.includes('invalid api key')) {
    return {
      code: 'AUTH_ERROR',
      title: 'Error de autenticación',
      message: '🔒 Hubo un problema con las credenciales del servicio. Contacta al administrador.',
      httpStatus: 502
    };
  }

  // Rate limit
  if (error.status === 429 || errorMessage.includes('rate limit')) {
    return {
      code: 'RATE_LIMIT',
      title: 'Demasiadas solicitudes',
      message: '🚦 Has alcanzado el límite de solicitudes. Por favor, espera un momento e intenta de nuevo.',
      httpStatus: 429
    };
  }

  // Error genérico del servicio externo
  return {
    code: 'EXTERNAL_SERVICE_ERROR',
    title: 'Error del servicio',
    message: '❌ El servicio de IA no está disponible en este momento. Por favor, intenta más tarde.',
    httpStatus: 502
  };
}

/**
 * Envuelve llamadas a APIs externas con manejo de errores
 * @param {Function} apiCallFn - Función async que realiza la llamada a la API
 * @returns {Promise<Object>} Resultado con ok:true/false y data o error
 */
async function safeExternalCall(apiCallFn) {
  try {
    const result = await apiCallFn();
    return { ok: true, data: result };
  } catch (error) {
    const errorInfo = classifyError(error);
    
    // Log técnico para debugging (solo en servidor)
    console.error('🔴 Error en llamada externa:', {
      timestamp: new Date().toISOString(),
      code: errorInfo.code,
      originalError: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    return {
      ok: false,
      error: {
        code: errorInfo.code,
        title: errorInfo.title,
        message: errorInfo.message,
        // Solo incluir detalles técnicos en desarrollo
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      httpStatus: errorInfo.httpStatus
    };
  }
}

/**
 * Middleware para enviar respuestas de error consistentes
 * @param {Object} res - Response object de Express
 * @param {Object} errorResponse - Respuesta de error de safeExternalCall
 */
function sendErrorResponse(res, errorResponse) {
  const status = errorResponse.httpStatus || 500;
  res.status(status).json({
    ok: false,
    error: errorResponse.error
  });
}

module.exports = {
  classifyError,
  safeExternalCall,
  sendErrorResponse
};
