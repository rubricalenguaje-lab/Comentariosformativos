/**
 * Utility to fetch and safely parse JSON from local API endpoints,
 * with friendly handling of HTML error pages (e.g. 504 Gateway Timeout or server overload errors)
 */
export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Error del servidor (Código ${response.status})`);
    }
    return data as T;
  } else {
    const responseText = await response.text();
    console.error(`Non-JSON response from ${url}:`, responseText);
    
    // Check for common proxy / timeout / hosting environment error texts
    const lowerText = responseText.toLowerCase();
    if (response.status === 504 || lowerText.includes('timeout') || lowerText.includes('gateway')) {
      throw new Error(
        'El motor de IA tomó demasiado tiempo para responder (Tiempo de Espera Agotado / 504). Esto puede suceder si la información cargada es sumamente extensa. Intenta procesar menos texto o ingresa tu clave API personal.'
      );
    }
    if (response.status === 502 || response.status === 503 || lowerText.includes('overloaded') || lowerText.includes('unavailable') || lowerText.includes('bad gateway')) {
      throw new Error(
        'El servidor de IA se encuentra temporalmente sobrecargado o en mantenimiento (502/503). Por favor, espera unos segundos e inténtalo nuevamente.'
      );
    }
    
    throw new Error(
      `El servidor devolvió una respuesta no válida (HTML o Texto) en lugar de un formato JSON legible. (Código de estado: ${response.status})`
    );
  }
}
