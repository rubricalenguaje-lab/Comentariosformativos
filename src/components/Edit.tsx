import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, RefreshCw, CheckCircle2, Copy, FileCheck, Clipboard } from 'lucide-react';
import { DEFAULT_ADJECTIVES } from '../data';
import { AiModelBadge } from './AiModelBadge';

interface EditProps {
  studentName: string;
  initialComment: string;
  onBack: () => void;
  onSaveComment: (comment: string) => void;
  modelUsed: string;
  userApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const Edit: React.FC<EditProps> = ({
  studentName,
  initialComment,
  onBack,
  onSaveComment,
  modelUsed,
  userApiKey,
  onSaveApiKey,
}) => {
  const [commentText, setCommentText] = useState(initialComment);
  const [adjectives, setAdjectives] = useState<string[]>(DEFAULT_ADJECTIVES);
  const [isGeneratingAdjectives, setIsGeneratingAdjectives] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerateNewAdjectives = async () => {
    setIsGeneratingAdjectives(true);
    try {
      const response = await fetch('/api/generate-adjectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customApiKey: userApiKey }),
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setAdjectives(data);
      }
    } catch (err) {
      console.error('Error generating adjectives:', err);
    } finally {
      setIsGeneratingAdjectives(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(commentText);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  // Click on adjective to insert at cursor position!
  const handleAdjectiveClick = (adj: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = commentText;

    // Insert with spaces if needed
    const before = text.substring(0, startPos);
    const after = text.substring(endPos, text.length);
    const spacingBefore = before.endsWith(' ') || before.length === 0 ? '' : ' ';
    const spacingAfter = after.startsWith(' ') || after.length === 0 ? '' : ' ';

    const newText = before + spacingBefore + adj + spacingAfter + after;
    setCommentText(newText);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      const cursorOffset = startPos + spacingBefore.length + adj.length + spacingAfter.length;
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    }, 50);
  };

  const handleSave = () => {
    onSaveComment(commentText);
    setShowSaveToast(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-semibold text-xs mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Ajustar parámetros</span>
      </button>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-blue-600 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-sans">Revisión y Edición</h2>
              <p className="text-[10px] text-blue-100 mt-0.5">{studentName}</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={handleCopyText}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              title="Copiar texto"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </button>
          </div>
        </div>

        {/* AI Info Status Sub-bar */}
        <div className="bg-slate-50 border-b border-gray-100 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Detalles de Generación
          </span>
          <AiModelBadge
            modelUsed={modelUsed}
            userApiKey={userApiKey}
            onSaveApiKey={onSaveApiKey}
          />
        </div>

        {/* Text Area Content */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full h-56 p-3 text-gray-800 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed font-sans preserve-case"
            placeholder="Escribe o edita el comentario aquí..."
          />

          {/* Toast Feedbacks */}
          <div className="h-6 relative">
            {showCopyToast && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute text-xs text-blue-600 font-semibold flex items-center gap-1 mt-1"
              >
                <Clipboard className="w-3.5 h-3.5" /> ¡Texto copiado al portapapeles!
              </motion.span>
            )}
          </div>

          {/* Adjective Bank Section */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  Banco de Vocabulario Pedagógico
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Haz clic en cualquier adjetivo para insertarlo automáticamente en tu cursor.
                </p>
              </div>

              <button
                onClick={handleGenerateNewAdjectives}
                disabled={isGeneratingAdjectives}
                className="text-[11px] flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-semibold transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isGeneratingAdjectives ? 'animate-spin' : ''}`} />
                <span>Nuevos Adjetivos</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {adjectives.map((adj, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAdjectiveClick(adj)}
                  className="px-2 py-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-gray-150 text-gray-600 rounded-md text-[11px] font-medium transition-all cursor-pointer"
                >
                  {adj}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-100 flex-wrap gap-2">
          {(() => {
            const wordCount = commentText.trim().split(/\s+/).filter(Boolean).length;
            const isPerfect = wordCount >= 90 && wordCount <= 100;
            return (
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                isPerfect 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                Palabras: {wordCount} (Objetivo: 90-100) {isPerfect ? '✓ Perfecto' : ''}
              </span>
            );
          })()}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold text-xs shadow-md shadow-emerald-50 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Guardar Comentario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
