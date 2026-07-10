import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Printer, Search, Copy, Trash2, Edit2, Download, 
  Check, Cloud, AlertCircle
} from 'lucide-react';
import { SavedComment } from '../types';

interface PrintProps {
  comments: SavedComment[];
  onBack: () => void;
  onEditComment: (comment: SavedComment) => void;
  onDeleteComment: (id: string) => void;
  onClearAll: () => void;
  onOpenSaveToDrive: () => void;
}

export const Print: React.FC<PrintProps> = ({
  comments,
  onBack,
  onEditComment,
  onDeleteComment,
  onClearAll,
  onOpenSaveToDrive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredComments = comments.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyComment = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Export all comments as TXT file
  const exportAsTxt = () => {
    const textContent = comments
      .map((c) => `ESTUDIANTE: ${c.name}\nFECHA: ${c.date}\nCOMENTARIO:\n${c.comment}\n----------------------------------------\n`)
      .join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Observaciones_Pedagogicas.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export all comments as CSV (Excel compatible)
  const exportAsCsv = () => {
    let csvContent = '\uFEFFNombre Estudiante,Fecha Registro,Observación\n';
    
    comments.forEach((c) => {
      const escapedName = `"${c.name.replace(/"/g, '""')}"`;
      const escapedDate = `"${c.date}"`;
      const escapedComment = `"${c.comment.replace(/"/g, '""')}"`;
      csvContent += `${escapedName},${escapedDate},${escapedComment}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Observaciones_Pedagogicas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top action bar hidden on Print */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-semibold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú</span>
        </button>
        
        <div className="flex flex-wrap gap-1.5">
          {comments.length > 0 && (
            <>
              <button
                onClick={exportAsTxt}
                className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold border border-gray-200 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                Descargar TXT
              </button>
              <button
                onClick={exportAsCsv}
                className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold border border-gray-200 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Descargar CSV
              </button>
              <button
                onClick={onOpenSaveToDrive}
                className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-100 cursor-pointer transition-all"
              >
                <Cloud className="w-3.5 h-3.5" />
                Guardar Curso
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md shadow-blue-100 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Todo
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 print:p-0 print:border-none print:shadow-none">
        <div className="print:block mb-4 border-b pb-3 border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Comentarios Pedagógicos Guardados
          </h1>
          <p className="text-gray-500 text-xs mt-0.5 print:hidden">
            Aquí se listan todos los informes completados en esta sesión. Puedes editarlos, borrarlos, copiarlos de manera individual o imprimirlos todos juntos.
          </p>
        </div>

        {/* Filter bar, hidden on print */}
        {comments.length > 0 && (
          <div className="print:hidden relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar comentarios por nombre de estudiante..."
              className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-xs"
            />
          </div>
        )}

        {/* List of comments */}
        {filteredComments.length === 0 ? (
          <div className="text-center py-16 p-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold text-lg">No hay comentarios para mostrar.</p>
            <p className="text-gray-400 text-sm mt-1">Escribe o procesa estudiantes para comenzar a rellenar la lista.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((c) => {
              const isCopied = copiedId === c.id;
              return (
                <div
                  key={c.id}
                  className="p-4 bg-gray-50/50 rounded-lg border border-gray-150 break-inside-avoid print:bg-white print:border-b print:border-gray-300 print:rounded-none print:p-3 print:my-2 transition-all"
                >
                  <div className="flex justify-between items-start gap-3 mb-2 pb-2 border-b border-gray-100 print:mb-1.5 print:pb-1">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 font-sans print:text-sm">
                        {c.name}
                      </h3>
                      <span className="text-[9px] text-gray-400 font-mono mt-0.5 block print:hidden">
                        Registrado: {c.date}
                      </span>
                    </div>

                    {/* Actions bar hidden during printing */}
                    <div className="print:hidden flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleCopyComment(c.id, c.comment)}
                        className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold ${
                          isCopied 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800'
                        }`}
                        title="Copiar texto"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                      <button
                        onClick={() => onEditComment(c)}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-md transition-all cursor-pointer"
                        title="Editar comentario"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de querer borrar el comentario de ${c.name}?`)) {
                            onDeleteComment(c.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-md transition-all cursor-pointer"
                        title="Eliminar comentario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed font-sans text-xs whitespace-pre-wrap preserve-case">
                    {c.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
