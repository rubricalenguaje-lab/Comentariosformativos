import React, { useState } from 'react';
import { Sparkles, Key, Settings, HelpCircle } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';

interface AiModelBadgeProps {
  modelUsed: string;
  userApiKey: string;
  onSaveApiKey: (key: string) => void;
  compact?: boolean;
}

export const AiModelBadge: React.FC<AiModelBadgeProps> = ({
  modelUsed,
  userApiKey,
  onSaveApiKey,
  compact = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Friendly names for models
  const getFriendlyModelName = (modelId: string) => {
    if (modelId.includes('3.5-flash')) return 'Gemini 3.5 Flash (Principal)';
    if (modelId.includes('flash-latest')) return 'Gemini Flash (Rápido)';
    if (modelId.includes('3.1-flash-lite')) return 'Gemini 3.1 Lite (Respaldo)';
    return modelId;
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 transition-colors text-slate-700 font-semibold px-3 py-1.5 rounded-full border border-slate-200">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
        <span className="font-mono text-[11px] md:text-xs">
          IA: {getFriendlyModelName(modelUsed)}
        </span>
      </div>

      {userApiKey ? (
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
          <Key className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px]">Créditos Propios Activos</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 bg-blue-50 text-blue-600 font-medium px-3 py-1.5 rounded-full border border-blue-100">
          <span className="text-[11px]">Créditos del Sistema</span>
        </div>
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-all flex items-center gap-1 cursor-pointer text-slate-600 hover:text-slate-800"
        title="Configurar API Key propia"
      >
        <Settings className="w-3.5 h-3.5 shrink-0" />
        {!compact && <span className="text-[11px] font-semibold pr-1">Configurar API Key</span>}
      </button>

      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userApiKey={userApiKey}
        onSave={onSaveApiKey}
      />
    </div>
  );
};
