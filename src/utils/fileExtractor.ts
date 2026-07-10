import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

// Load PDF.js from CDN dynamically to avoid Vite worker build issues
let pdfjsLoadingPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (pdfjsLoadingPromise) return pdfjsLoadingPromise;

  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).pdfjsLib) {
      return resolve((window as any).pdfjsLib);
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      } else {
        reject(new Error('PDF.js script loaded but pdfjsLib is not defined.'));
      }
    };
    script.onerror = () => {
      reject(new Error('Error al cargar la librería PDF.js desde CDN.'));
    };
    document.head.appendChild(script);
  });

  return pdfjsLoadingPromise;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension) {
    throw new Error('El archivo no tiene una extensión válida.');
  }

  // 1. Plain Text or CSV
  if (['txt', 'csv'].includes(extension)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo de texto.'));
      reader.readAsText(file);
    });
  }

  // 2. Excel (XLSX / XLS)
  if (['xlsx', 'xls'].includes(extension)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          let fullText = '';
          
          workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            // Convert sheet to CSV style or text rows
            const csv = XLSX.utils.sheet_to_csv(sheet);
            fullText += `--- Hoja: ${sheetName} ---\n${csv}\n\n`;
          });
          
          resolve(fullText);
        } catch (error) {
          reject(new Error('Error al decodificar el libro de Excel.'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo Excel.'));
      reader.readAsArrayBuffer(file);
    });
  }

  // 3. Word (DOCX / DOC)
  if (['docx'].includes(extension)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          resolve(result.value || '');
        } catch (error) {
          reject(new Error('Error al extraer texto del documento de Word.'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo Word.'));
      reader.readAsArrayBuffer(file);
    });
  }

  // 4. PDF (using CDN pdfjsLib)
  if (extension === 'pdf') {
    const pdfjsLib = await loadPdfJs();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += `--- Página ${i} ---\n${pageText}\n\n`;
          }
          
          resolve(fullText);
        } catch (error) {
          reject(new Error('Error al decodificar el archivo PDF.'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo PDF.'));
      reader.readAsArrayBuffer(file);
    });
  }

  throw new Error(`El formato de archivo .${extension} no es soportado de manera directa. Intente con .txt, .pdf, .docx o .xlsx.`);
}
