import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase limit to handle larger files
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Initialize Gemini SDK lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined. Using public fallback if available or failing on API calls.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Robust JSON parser helper
function safeParseJson(raw: string, fallbackValue: any = null) {
  try {
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('First JSON parse failed, attempting regex extraction:', e);
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (inner) {
        console.error('Regex JSON parse also failed:', inner);
      }
    }
    return fallbackValue;
  }
}

// Format and translate raw Gemini/API error messages into user-friendly Spanish
function cleanGeminiErrorMessage(error: any): string {
  if (!error) return 'Error de conexión desconocido con el servicio de IA.';
  
  let msg = '';
  if (typeof error === 'string') {
    msg = error;
  } else if (error.message) {
    msg = error.message;
  } else {
    msg = JSON.stringify(error);
  }

  // If the message is a raw stringified JSON from the Google GenAI SDK, parse the inner detail
  try {
    const trimmed = msg.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.error) {
        if (parsed.error.status === 'RESOURCE_EXHAUSTED' || parsed.error.code === 429) {
          return 'Se ha alcanzado el límite de cuota (429) de Gemini en el servidor. Por favor, introduce tu propia Clave API desde la esquina superior derecha o inténtalo de nuevo más tarde.';
        }
        if (parsed.error.status === 'PERMISSION_DENIED' || parsed.error.code === 403) {
          return 'Acceso denegado (403): La Clave API utilizada no tiene permisos válidos o es incorrecta. Por favor, verifícala.';
        }
        if (parsed.error.message) {
          msg = parsed.error.message;
        }
      }
    }
  } catch (e) {
    // Ignore JSON parsing issues and process as standard string
  }

  // Check common error keywords
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes('quota') || lowerMsg.includes('exhausted') || lowerMsg.includes('429')) {
    return 'Se ha alcanzado el límite de cuota (429) de Gemini en el servidor. Por favor, introduce tu propia Clave API desde la esquina superior derecha o inténtalo de nuevo más tarde.';
  }
  if (lowerMsg.includes('api key') || lowerMsg.includes('api_key') || lowerMsg.includes('key not valid') || lowerMsg.includes('403') || lowerMsg.includes('invalid api key')) {
    return 'La Clave de API de Gemini provista no es válida o está deshabilitada. Por favor, verifícala e intenta nuevamente.';
  }
  if (lowerMsg.includes('503') || lowerMsg.includes('service unavailable') || lowerMsg.includes('overloaded')) {
    return 'El servicio de Gemini se encuentra temporalmente sobrecargado o fuera de servicio. Por favor, inténtalo de nuevo en unos segundos.';
  }

  return msg || 'Ha ocurrido un error inesperado al procesar la solicitud con Inteligencia Artificial.';
}

// Robust fallback & retry mechanism to handle 503 Service Unavailable / high demand
async function callGeminiWithFallback(config: {
  contents: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  customApiKey?: string;
}) {
  const models = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-3.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-pro',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview'
  ];
  const maxRetriesPerModel = 3;
  let lastError: any = null;

  // Use the custom API key if provided, otherwise the system default
  const ai = config.customApiKey && config.customApiKey.trim() !== ''
    ? new GoogleGenAI({
        apiKey: config.customApiKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      })
    : getGeminiClient();

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`Calling Gemini API using model: ${model} (attempt ${attempt}/${maxRetriesPerModel})`);
        const response = await ai.models.generateContent({
          model: model,
          contents: config.contents,
          config: {
            responseMimeType: config.responseMimeType,
            systemInstruction: config.systemInstruction,
            responseSchema: config.responseSchema,
          }
        });
        // Attach modelUsed so endpoints can pass it to the frontend
        (response as any).modelUsed = model;
        return response;
      } catch (error: any) {
        lastError = error;
        const statusCode = error.status || error.code || '429';
        console.log(`[INFO] Model ${model} returned code ${statusCode} on attempt ${attempt}. Handling error...`);
        
        const errMessage = error.message || '';
        const lowerMessage = errMessage.toLowerCase();
        
        // 1. Is it a definitive quota or resource exhausted error?
        const isQuotaError = error.status === 429 || 
                             error.status === 'RESOURCE_EXHAUSTED' || 
                             lowerMessage.includes('429') || 
                             lowerMessage.includes('quota') || 
                             lowerMessage.includes('exhausted');

        // 2. Auth error - fails fast for the entire request
        const isAuthError = error.status === 403 || 
                            lowerMessage.includes('api key') || 
                            lowerMessage.includes('invalid api key') ||
                            lowerMessage.includes('api_key') ||
                            lowerMessage.includes('403');

        if (isAuthError) {
          console.log(`[AUTH_ERROR] Invalid API key or permission denied. Aborting and throwing immediately: ${errMessage}`);
          throw error;
        }

        // 3. Model not found or unsupported features (404, 400 client error on this specific model)
        const isModelSpecificError = error.status === 404 || 
                                     error.status === 400 ||
                                     lowerMessage.includes('not found') ||
                                     lowerMessage.includes('not supported') ||
                                     lowerMessage.includes('unsupported') ||
                                     lowerMessage.includes('404') ||
                                     lowerMessage.includes('400');

        if (isQuotaError || isModelSpecificError) {
          console.log(`[MODEL_ERROR] Model ${model} failed with non-retriable/quota/404/400 error: ${errMessage}. Skipping further attempts on this model and trying next fallback model...`);
          break; // Break the attempt loop to move to the next model!
        }

        // Wait with exponential backoff and jitter before retrying
        if (attempt < maxRetriesPerModel) {
          const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 1000);
          console.log(`Waiting ${delay}ms before retrying model ${model}...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error('No se pudo establecer conexión con los modelos de Gemini.');
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});// Endpoint to extract students from text files
app.post('/api/extract-students', async (req, res) => {
  try {
    const { filePersonalidad, fileNotas, filePersonalidadName, fileNotasName, customApiKey } = req.body;
    const resolvedApiKey = customApiKey || req.headers['x-api-key'] as string || undefined;

    if (!filePersonalidad || !fileNotas) {
      return res.status(400).json({ error: 'Faltan los textos de personalidad o de notas.' });
    }

    const prompt = `Analiza los siguientes textos e identifica a todos los estudiantes mencionados.
Para cada estudiante, asocia su información de comportamiento/personalidad (del archivo de personalidad) y sus calificaciones/rendimiento (del archivo de notas).

INFORMACIÓN CLAVE DE EVALUACIÓN DE CONDUCTA / PERSONALIDAD:
En los reportes de personalidad, las siguientes siglas representan categorías de desarrollo:
- AD: Altamente desarrollado
- D: Desarrollado
- PD: Por desarrollar
- ND: No desarrollado
Interpreta y traduce adecuadamente estas siglas cuando las encuentres (ej. "Respeto: AD" significa que tiene el respeto Altamente desarrollado).

REGLAS IMPORTANTES:
1. Si el "Texto Personalidad" no contiene información sobre estudiantes, devuelve: {"error": "El archivo de Personalidad (${filePersonalidadName}) no parece contener datos legibles de estudiantes."}
2. Si el "Texto Notas" no contiene información sobre estudiantes, devuelve: {"error": "El archivo de Notas (${fileNotasName}) no parece contener datos legibles de estudiantes."}
3. Si la información es válida, extrae el listado completo y asócialo. Devuelve ÚNICAMENTE un arreglo JSON con el siguiente formato:
[
  {
    "nombre": "Nombre Completo del Estudiante (Apellido, Nombre si es posible)",
    "personalidad": "Resumen o extracto de lo que dice de su comportamiento, participación y actitud en clases",
    "notes_summary": "Resumen o extracto de su rendimiento académico, asignaturas destacadas y promedios si los hay"
  }
]

No incluyas explicaciones, introducciones ni bloques de Markdown. Solo devuelve el JSON puro.

Texto Personalidad:
${filePersonalidad}

Texto Notas:
${fileNotas}`;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nombre: { type: Type.STRING, description: 'Nombre completo del estudiante (Apellido, Nombre)' },
          personalidad: { type: Type.STRING, description: 'Resumen o extracto de su comportamiento, participación y actitud' },
          notes_summary: { type: Type.STRING, description: 'Resumen o extracto de su rendimiento académico y asignaturas' }
        },
        required: ['nombre', 'personalidad', 'notes_summary']
      }
    };

    const response = await callGeminiWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      systemInstruction: 'Eres un extractor de datos escolares altamente preciso. Tu objetivo es procesar las listas de alumnos de dos archivos diferentes y unificarlas por el nombre del estudiante. Si encuentras indicadores como AD, D, PD, ND, interpreta que significan Altamente desarrollado, Desarrollado, Por desarrollar y No desarrollado respectivamente. Devuelve siempre un JSON válido.',
      customApiKey: resolvedApiKey,
    });

    const parsedData = safeParseJson(response.text || '', []);

    // Map keys to match the expectation in the front-end if model returned notes_summary instead of notes
    const mappedData = Array.isArray(parsedData) ? parsedData.map((st: any) => ({
      nombre: st.nombre,
      personalidad: st.personalidad,
      notas: st.notas || st.notes_summary || ''
    })) : parsedData;

    res.json({ students: mappedData, modelUsed: (response as any).modelUsed });
  } catch (error: any) {
    console.error('Error in /api/extract-students:', error);
    res.status(500).json({ error: cleanGeminiErrorMessage(error) });
  }
});

// Endpoint to generate student synthesis
app.post('/api/generate-synthesis', async (req, res) => {
  try {
    const { nombre, personalidad, notas, customApiKey, academicsOptions, personalsOptions, challengesOptions } = req.body;
    const resolvedApiKey = customApiKey || req.headers['x-api-key'] as string || undefined;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del estudiante es obligatorio.' });
    }

    const prompt = `Analiza detalladamente la información del estudiante:
Nombre: ${nombre}
Personalidad/Conducta: ${personalidad || 'No especificado'}
Notas/Rendimiento: ${notas || 'No especificado'}

INFORMACIÓN CLAVE DE EVALUACIÓN DE CONDUCTA / PERSONALIDAD:
En los reportes, las siglas representan categorías de desarrollo:
- AD: Altamente desarrollado
- D: Desarrollado
- PD: Por desarrollar
- ND: No desarrollado
Si encuentras estas siglas en la información de Personalidad/Conducta, tradúcelas y descríbelas con sus significados correspondientes en español.

TAREAS:
1. Genera una síntesis pedagógica profesional y ejecutiva del estudiante (máximo 4 puntos o viñetas muy breves). Destaca fortalezas académicas, personales y áreas de mejora. Escribe en un lenguaje formal, empático y constructivo (evita adjetivos exagerados).
2. De las siguientes opciones de fortalezas académicas disponibles, selecciona entre 1 y 3 opciones que mejor se adapten a este alumno:
${JSON.stringify(academicsOptions || [])}

3. De las siguientes opciones de fortalezas personales disponibles, selecciona entre 1 y 3 opciones que mejor se adapten a este alumno:
${JSON.stringify(personalsOptions || [])}

4. De las siguientes opciones de desafíos/oportunidades disponibles, selecciona entre 1 y 3 opciones que mejor se adapten a este alumno:
${JSON.stringify(challengesOptions || [])}

DEBES DEVOLVER TU RESPUESTA ÚNICAMENTE EN FORMATO JSON, con las claves:
{
  "synthesis": "texto de la síntesis en viñetas/puntos",
  "recommendedAcademics": ["opción exacta 1", "opción exacta 2"],
  "recommendedPersonals": ["opción exacta 1"],
  "recommendedChallenges": ["opción exacta 1", "opción exacta 2"]
}
Las opciones en los arreglos deben coincidir EXACTAMENTE (carácter por carácter) con los textos de las listas que se te han proporcionado. No inventes opciones nuevas.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        synthesis: { 
          type: Type.STRING, 
          description: 'Texto de la síntesis en viñetas/puntos breves y constructivos' 
        },
        recommendedAcademics: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Arreglo con de 1 a 3 opciones exactas de fortalezas académicas proporcionadas' 
        },
        recommendedPersonals: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Arreglo con de 1 a 3 opciones exactas de fortalezas personales proporcionadas'
        },
        recommendedChallenges: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Arreglo con de 1 a 3 opciones exactas de desafíos/oportunidades proporcionadas'
        }
      },
      required: ['synthesis', 'recommendedAcademics', 'recommendedPersonals', 'recommendedChallenges']
    };

    const response = await callGeminiWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      systemInstruction: 'Eres un psicopedagogo y orientador experto. Tu tarea es analizar datos cualitativos y cuantitativos de un estudiante y resumirlos en formato JSON válido. IMPORTANTE: El valor del campo "synthesis" debe ser una cadena de texto JSON válida. No dejes saltos de línea reales dentro de la cadena; usa \\n para separar líneas. Evita usar adjetivos tajantes como "notable", "excelente" o "sobresaliente" en tus descripciones. Devuelve siempre un JSON válido que coincida con la estructura solicitada.',
      customApiKey: resolvedApiKey,
    });

    const parsed = safeParseJson(response.text || '', {});
    let parsedResult = {
      synthesis: parsed?.synthesis || response.text || '',
      recommendedAcademics: (Array.isArray(parsed?.recommendedAcademics) ? parsed.recommendedAcademics : []) as string[],
      recommendedPersonals: (Array.isArray(parsed?.recommendedPersonals) ? parsed.recommendedPersonals : []) as string[],
      recommendedChallenges: (Array.isArray(parsed?.recommendedChallenges) ? parsed.recommendedChallenges : []) as string[],
    };

    res.json({
      synthesis: parsedResult.synthesis,
      recommendedAcademics: parsedResult.recommendedAcademics,
      recommendedPersonals: parsedResult.recommendedPersonals,
      recommendedChallenges: parsedResult.recommendedChallenges,
      modelUsed: (response as any).modelUsed
    });
  } catch (error: any) {
    console.error('Error in /api/generate-synthesis:', error);
    res.status(500).json({ error: cleanGeminiErrorMessage(error) });
  }
});

// Endpoint to generate final pedagogical comment
app.post('/api/generate-comment', async (req, res) => {
  try {
    const { name, academics, personals, challenges, gender, tone, customApiKey } = req.body;
    const resolvedApiKey = customApiKey || req.headers['x-api-key'] as string || undefined;

    if (!name || !academics || !personals || !challenges) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos para generar el comentario.' });
    }

    // Extract first name for direct vocative
    let firstName = name.trim();
    if (name.includes(',')) {
      firstName = name.split(',')[1].trim().split(' ')[0];
    } else {
      firstName = name.split(' ')[0];
    }

    const prompt = `Redacta el comentario final para el boletín escolar de un estudiante con los siguientes parámetros:
- Nombre: ${firstName}
- Género para concordancia gramatical: ${gender || 'neutro/inclusivo'}
- Fortalezas Académicas: ${academics.join(', ')}
- Fortalezas Personales: ${personals.join(', ')}
- Desafíos: ${challenges.join(', ')}
- Tono de redacción sugerido: ${tone || 'cálido y constructivo'}

REGLAS DE REDACCIÓN:
1. Dirígete directamente al estudiante en segunda persona singular ("tú" o "te"). Empieza con su primer nombre de manera afectuosa y cercana.
2. Estructura el párrafo de forma fluida:
   - Comienza reconociendo sus fortalezas académicas y cómo se manifiestan.
   - Sigue integrando de forma natural sus virtudes personales y actitudinales.
   - Introduce de forma constructiva el desafío principal como una meta estimulante y alcanzable para el próximo ciclo.
   - Termina con un cierre de aliento personalizado, cálido y motivador.
3. Evita usar adjetivos absolutos o de alta intensidad evaluativa (como "notable", "excelente", "sobresaliente", "destacado", "impecable" o "ejemplar"). Prefiere un lenguaje formativo, descriptivo, moderado, progresivo y menos tajante, utilizando términos sobrios como "favorable", "constante", "activo", "comprometido", "atento", "receptivo" o "colaborativo".
4. Asegúrate de respetar estrictamente la concordancia de género indicada (${gender}).
5. Extensión estricta: El comentario redactado DEBE tener obligatoriamente entre 90 y 100 palabras en total. Cuenta las palabras antes de responder para asegurarte de estar exactamente en el rango de 90 a 100 palabras. No uses viñetas ni subtítulos; debe ser un solo párrafo continuo.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      systemInstruction: 'Eres un docente y psicopedagogo mentor con excelente pluma. Redactas comentarios que motivan a los alumnos y entregan retroalimentación formativa, moderada, progresiva y accionable, evitando adjetivos absolutos o exagerados. Te aseguras de que el comentario resultante tenga de forma rigurosa entre 90 y 100 palabras en total.',
      customApiKey: resolvedApiKey,
    });

    res.json({ comment: response.text || '', modelUsed: (response as any).modelUsed });
  } catch (error: any) {
    console.error('Error in /api/generate-comment:', error);
    res.status(500).json({ error: cleanGeminiErrorMessage(error) });
  }
});

// Endpoint to generate custom adjectives
app.post('/api/generate-adjectives', async (req, res) => {
  try {
    const { customApiKey } = req.body;
    const resolvedApiKey = customApiKey || req.headers['x-api-key'] as string || undefined;

    const prompt = `Genera un listado de 20 adjetivos o frases cortas de valoración pedagógica descriptiva y positiva para usar en informes escolares (ej. "perseverante", "con disposición al diálogo", "metódico/a").
Evita términos demasiado pretenciosos o clichés.
Devuelve únicamente un JSON con formato:
["adjetivo1", "adjetivo2", ...]`;

    const responseSchema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Listado de 20 adjetivos o frases cortas de valoración pedagógica descriptiva y positiva'
    };

    const response = await callGeminiWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      systemInstruction: 'Devuelve solo un array JSON de strings.',
      customApiKey: resolvedApiKey,
    });

    const parsed = safeParseJson(response.text || '', []);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/generate-adjectives:', error);
    res.status(500).json({ error: cleanGeminiErrorMessage(error) });
  }
});

// Serve frontend with Vite in development, static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} with NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startServer();
