import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UploadCloud, FileText, Trash2, AlertCircle, Sparkles, Info } from 'lucide-react';
import { extractTextFromFile } from '../utils/fileExtractor';
import { safeFetchJson } from '../utils/api';
import { Student } from '../types';

interface UploadProps {
  onBack: () => void;
  onProcessed: (students: Student[], modelUsed?: string) => void;
  userApiKey: string;
}

export const Upload: React.FC<UploadProps> = ({ onBack, onProcessed, userApiKey }) => {
  const [filePersonalidadText, setFilePersonalidadText] = useState('');
  const [fileNotasText, setFileNotasText] = useState('');
  const [filePersonalidadName, setFilePersonalidadName] = useState('');
  const [fileNotasName, setFileNotasName] = useState('');

  const [isDragOverPers, setIsDragOverPers] = useState(false);
  const [isDragOverNotas, setIsDragOverNotas] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (
    file: File | undefined,
    setText: (t: string) => void,
    setName: (n: string) => void
  ) => {
    if (!file) return;
    setIsLoading(true);
    setLoadingText(`Procesando archivo: ${file.name}...`);
    setErrorMsg('');
    try {
      const text = await extractTextFromFile(file);
      if (!text || !text.trim()) {
        throw new Error('El archivo parece estar vacío o su formato no es legible.');
      }
      setText(text);
      setName(file.name);
    } catch (err: any) {
      setErrorMsg(`Error al procesar ${file.name}: ${err.message}`);
      setText('');
      setName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    setText: (t: string) => void,
    setName: (n: string) => void,
    setDrag: (d: boolean) => void
  ) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileChange(file, setText, setName);
    }
  };

  const processFiles = async () => {
    if (!filePersonalidadText || !fileNotasText) {
      setErrorMsg('Debes cargar ambos archivos para poder unificarlos.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    setLoadingText('Analizando documentos y unificando alumnos con Gemini AI...');

    try {
      const data = await safeFetchJson<any>('/api/extract-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePersonalidad: filePersonalidadText,
          fileNotas: fileNotasText,
          filePersonalidadName,
          fileNotasName,
          customApiKey: userApiKey,
        }),
      });

      if (data.error) {
        setErrorMsg(data.error);
        return;
      }

      const studentsList = data.students || data;
      const modelUsed = data.modelUsed;

      if (!Array.isArray(studentsList) || studentsList.length === 0) {
        throw new Error('No se lograron identificar estudiantes en el formato requerido.');
      }

      onProcessed(studentsList, modelUsed);
    } catch (err: any) {
      setErrorMsg(`Error del motor de extracción: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver al menú</span>
      </button>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Carga de Documentos Base</h2>
            <p className="text-xs text-gray-500 mt-0.5">Sube el archivo de notas/calificaciones y el de personalidad o conducta.</p>
          </div>
        </div>

        {/* Guía de Indicadores de Personalidad */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
              Guía de Equivalencias para Informe de Personalidad
            </h4>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
            Al procesar los reportes de conducta y convivencia escolar, el motor de inteligencia artificial interpretará y traducirá automáticamente las siguientes siglas de evaluación encontradas en los textos:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="w-8 h-5 flex items-center justify-center bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase shrink-0">
                AD
              </span>
              <span className="text-[11px] font-semibold text-gray-600 truncate">Altamente desarrollado</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="w-8 h-5 flex items-center justify-center bg-sky-100 text-sky-800 text-[10px] font-extrabold rounded-md uppercase shrink-0">
                D
              </span>
              <span className="text-[11px] font-semibold text-gray-600 truncate">Desarrollado</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="w-8 h-5 flex items-center justify-center bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md uppercase shrink-0">
                PD
              </span>
              <span className="text-[11px] font-semibold text-gray-600 truncate">Por desarrollar</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="w-8 h-5 flex items-center justify-center bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-md uppercase shrink-0">
                ND
              </span>
              <span className="text-[11px] font-semibold text-gray-600 truncate">No desarrollado</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-rose-50 text-rose-800 border border-rose-100 flex items-start gap-3 rounded-xl text-sm"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <strong className="font-semibold block">Atención:</strong>
              {errorMsg}
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {/* File Upload 1: Personality */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              1. Archivo de Personalidad, Conducta o Observaciones Cualitativas
            </label>
            {filePersonalidadName ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs text-blue-900 font-medium truncate">{filePersonalidadName}</span>
                </div>
                <button
                  onClick={() => {
                    setFilePersonalidadText('');
                    setFilePersonalidadName('');
                  }}
                  className="p-1 hover:bg-blue-100 text-blue-700 rounded-md transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOverPers(true); }}
                onDragLeave={() => setIsDragOverPers(false)}
                onDrop={(e) => handleDrop(e, setFilePersonalidadText, setFilePersonalidadName, setIsDragOverPers)}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragOverPers ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/30'
                }`}
                onClick={() => document.getElementById('file-pers')?.click()}
              >
                <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                <span className="font-semibold text-gray-700 text-xs text-center">
                  Arrastra o selecciona el archivo de personalidad
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  Formatos soportados: .txt, .pdf, .docx, .xlsx
                </span>
                <input
                  type="file"
                  id="file-pers"
                  accept=".txt,.csv,.docx,.xls,.xlsx,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0], setFilePersonalidadText, setFilePersonalidadName)}
                />
              </div>
            )}
          </div>

          {/* File Upload 2: Grades */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              2. Archivo de Notas, Calificaciones o Rendimiento Cuantitativo
            </label>
            {fileNotasName ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-900 font-medium truncate">{fileNotasName}</span>
                </div>
                <button
                  onClick={() => {
                    setFileNotasText('');
                    setFileNotasName('');
                  }}
                  className="p-1 hover:bg-emerald-100 text-emerald-700 rounded-md transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOverNotas(true); }}
                onDragLeave={() => setIsDragOverNotas(false)}
                onDrop={(e) => handleDrop(e, setFileNotasText, setFileNotasName, setIsDragOverNotas)}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragOverNotas ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50/30'
                }`}
                onClick={() => document.getElementById('file-notas')?.click()}
              >
                <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                <span className="font-semibold text-gray-700 text-xs text-center">
                  Arrastra o selecciona el archivo de rendimiento/notas
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  Formatos soportados: .txt, .pdf, .docx, .xlsx
                </span>
                <input
                  type="file"
                  id="file-notas"
                  accept=".txt,.csv,.docx,.xls,.xlsx,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0], setFileNotasText, setFileNotasName)}
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={processFiles}
          disabled={isLoading || !filePersonalidadText || !fileNotasText}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-blue-100"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span className="text-sm md:text-base font-semibold">{loadingText}</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-blue-200" />
              <span>Procesar y Unificar Alumnos</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
