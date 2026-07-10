import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, X, Eye, EyeOff, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userApiKey: string;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  userApiKey,
  onSave,
}) => {
  const [keyInput, setKeyInput] = useState(userApiKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(keyInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setKeyInput('');
    onSave('');
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base md:text-lg">Clave API de Gemini</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6">
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Si experimentas retardos por alta demanda en el servicio, o deseas complementar los créditos provistos, puedes ingresar tu propia <strong>API Key de Google Gemini</strong>.
              </p>

              <div className="bg-blue-50/50 rounded-xl p-3 mb-4 border border-blue-100 flex gap-2 text-xs text-blue-800 leading-relaxed">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
                <div>
                  La clave se almacena de forma 100% segura en tu navegador local (localStorage). No se comparte con terceros ni se almacena en nuestros servidores.
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Tu API Key de Gemini
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-3 pr-10 py-2.5 text-sm font-mono border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <span>Obtener clave gratis</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex gap-2">
                  {userApiKey && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                    >
                      Quitar clave
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Guardada!</span>
                      </>
                    ) : (
                      <span>Guardar</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
