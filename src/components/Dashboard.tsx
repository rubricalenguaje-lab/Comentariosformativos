import React from 'react';
import { motion } from 'motion/react';
import { FileUp, UserPlus, FileText, Download, Award, ShieldAlert, Sparkles, HelpCircle, Cloud } from 'lucide-react';
import { SavedComment } from '../types';

interface DashboardProps {
  onNavigate: (view: 'upload' | 'form' | 'print') => void;
  savedCommentsCount: number;
  onClearAll: () => void;
  onImport: (comments: SavedComment[]) => void;
  onExport: () => void;
  comments: SavedComment[];
  onOpenSaveToDrive: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  savedCommentsCount,
  onClearAll,
  onImport,
  onExport,
  comments,
  onOpenSaveToDrive,
}) => {
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onImport(imported);
          alert(`Se importaron ${imported.length} comentarios correctamente.`);
        } else {
          alert('El archivo no tiene un formato válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo de importación.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold mb-4 shadow-xs">
          <Sparkles className="w-3 h-3" />
          <span>Inteligencia Pedagógica Formativa</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-3 font-sans">
          Asistente de Informes Escolares
        </h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto font-sans font-normal leading-relaxed">
          Redacta de manera ágil y profesional las observaciones cualitativas para los boletines de tus estudiantes a partir de sus notas y personalidad.
        </p>
      </motion.div>

      {/* Statistics Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8"
      >
        <div className="bg-white p-3.5 rounded-lg border border-gray-100 shadow-xs text-center">
          <div className="text-xs font-medium text-gray-400 mb-0.5">Comentarios Guardados</div>
          <div className="text-xl font-bold text-gray-800">{savedCommentsCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-gray-100 shadow-xs text-center col-span-1">
          <div className="text-xs font-medium text-gray-400 mb-0.5">Indicadores Disponibles</div>
          <div className="text-xl font-bold text-blue-600">80+</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-gray-100 shadow-xs text-center col-span-2 md:col-span-1">
          <div className="text-xs font-medium text-gray-400 mb-0.5">Motor de Redacción</div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center justify-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Gemini 2.5 Flash
          </div>
        </div>
      </motion.div>

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Card 1: Intelligent Upload */}
        <motion.button
          whileHover={{ y: -3, boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.04)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('upload')}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-100 transition-colors">
              <FileUp className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 font-sans group-hover:text-blue-600 transition-colors">
              Carga Inteligente
            </h2>
            <p className="text-gray-500 text-xs leading-relaxed font-sans mb-4">
              Sube informes de notas y observaciones previas (PDF, Word, Excel o Texto) para que el asistente identifique automáticamente a los estudiantes y extraiga sus fortalezas y áreas de mejora.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
            Comenzar con archivos <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </motion.button>

        {/* Card 2: Manual Drafting */}
        <motion.button
          whileHover={{ y: -3, boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.04)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('form')}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="bg-emerald-50 w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-100 transition-colors">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 font-sans group-hover:text-emerald-600 transition-colors">
              Ingreso Manual
            </h2>
            <p className="text-gray-500 text-xs leading-relaxed font-sans mb-4">
              Escribe directamente el nombre de un estudiante y genera su comentario seleccionando indicadores clasificados de nuestra biblioteca pedagógica enriquecida.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            Redactar manualmente <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </motion.button>
      </div>

      {/* Bottom Option Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg bg-gray-50 border border-gray-100"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-600">
            Tienes <strong className="text-gray-800 font-bold">{savedCommentsCount}</strong> comentarios en tu sesión actual.
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {savedCommentsCount > 0 && (
            <>
              <button
                onClick={() => onNavigate('print')}
                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Visualizar y Exportar
              </button>
              <button
                onClick={onOpenSaveToDrive}
                className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                Guardar Curso
              </button>
              <button
                onClick={onExport}
                className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Respaldos
              </button>
            </>
          )}
          <label className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            Importar Sesión
          </label>
          {savedCommentsCount > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de querer borrar todos los comentarios guardados en esta sesión? Esta acción no se puede deshacer.')) {
                  onClearAll();
                }
              }}
              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md text-xs font-semibold transition-all cursor-pointer"
            >
              Borrar Todo
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
