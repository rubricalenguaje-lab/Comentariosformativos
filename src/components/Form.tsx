import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, User, Sparkles, BookOpen, Heart, Target, AlertCircle, Search, HelpCircle, Check, HelpCircle as Info, Edit2, X, RotateCcw, GraduationCap } from 'lucide-react';
import { FORTALEZAS_ACADEMICAS, FORTALEZAS_PERSONALES, DESAFIOS, TONE_OPTIONS } from '../data';
import { AiModelBadge } from './AiModelBadge';

interface FormProps {
  initialStudentName?: string;
  synthesisText?: string;
  onBack: () => void;
  onGenerateComment: (data: {
    name: string;
    gender: 'masculino' | 'femenino' | 'neutro';
    academics: string[];
    personals: string[];
    challenges: string[];
    tone: string;
  }) => void;
  isLoading: boolean;
  loadingText: string;
  savedCount: number;
  onViewSaved: () => void;
  modelUsed: string;
  userApiKey: string;
  onSaveApiKey: (key: string) => void;
  recommendedAcademics?: string[];
  recommendedPersonals?: string[];
  recommendedChallenges?: string[];
  hasCourse?: boolean;
}

export const Form: React.FC<FormProps> = ({
  initialStudentName = '',
  synthesisText = '',
  onBack,
  onGenerateComment,
  isLoading,
  loadingText,
  savedCount,
  onViewSaved,
  modelUsed,
  userApiKey,
  onSaveApiKey,
  recommendedAcademics = [],
  recommendedPersonals = [],
  recommendedChallenges = [],
  hasCourse = false,
}) => {
  const [studentName, setStudentName] = useState(initialStudentName);
  const [gender, setGender] = useState<'masculino' | 'femenino' | 'neutro'>('masculino');
  const [selectedAcademics, setSelectedAcademics] = useState<string[]>(() => recommendedAcademics);
  const [selectedPersonals, setSelectedPersonals] = useState<string[]>(() => recommendedPersonals);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(() => recommendedChallenges);
  const [tone, setTone] = useState('cálido y constructivo');

  // Load / save list states
  const [academicsList, setAcademicsList] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_fortalezas_academicas');
    return saved ? JSON.parse(saved) : FORTALEZAS_ACADEMICAS;
  });

  const [personalsList, setPersonalsList] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_fortalezas_personales');
    return saved ? JSON.parse(saved) : FORTALEZAS_PERSONALES;
  });

  const [challengesList, setChallengesList] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_fortalezas_desafios');
    return saved ? JSON.parse(saved) : DESAFIOS;
  });

  // Keep recommended indicators in local sync so edits propagate to highlighted suggested states too
  const [localRecAcademics, setLocalRecAcademics] = useState<string[]>(() => recommendedAcademics);
  const [localRecPersonals, setLocalRecPersonals] = useState<string[]>(() => recommendedPersonals);
  const [localRecChallenges, setLocalRecChallenges] = useState<string[]>(() => recommendedChallenges);

  React.useEffect(() => {
    localStorage.setItem('custom_fortalezas_academicas', JSON.stringify(academicsList));
  }, [academicsList]);

  React.useEffect(() => {
    localStorage.setItem('custom_fortalezas_personales', JSON.stringify(personalsList));
  }, [personalsList]);

  React.useEffect(() => {
    localStorage.setItem('custom_fortalezas_desafios', JSON.stringify(challengesList));
  }, [challengesList]);

  // Keep selection state in sync if recommended criteria lists are loaded asynchronously
  React.useEffect(() => {
    setSelectedAcademics(recommendedAcademics);
    setLocalRecAcademics(recommendedAcademics);
  }, [recommendedAcademics]);

  React.useEffect(() => {
    setSelectedPersonals(recommendedPersonals);
    setLocalRecPersonals(recommendedPersonals);
  }, [recommendedPersonals]);

  React.useEffect(() => {
    setSelectedChallenges(recommendedChallenges);
    setLocalRecChallenges(recommendedChallenges);
  }, [recommendedChallenges]);

  // Search filter query states
  const [academicSearch, setAcademicSearch] = useState('');
  const [personalSearch, setPersonalSearch] = useState('');
  const [challengeSearch, setChallengeSearch] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  // Editing state for each section
  const [editingAcademicKey, setEditingAcademicKey] = useState<string | null>(null);
  const [editingAcademicValue, setEditingAcademicValue] = useState('');

  const [editingPersonalKey, setEditingPersonalKey] = useState<string | null>(null);
  const [editingPersonalValue, setEditingPersonalValue] = useState('');

  const [editingChallengeKey, setEditingChallengeKey] = useState<string | null>(null);
  const [editingChallengeValue, setEditingChallengeValue] = useState('');

  const handleUpdateAcademic = (oldVal: string, newVal: string) => {
    const cleanNew = newVal.trim();
    if (!cleanNew || oldVal === cleanNew) {
      setEditingAcademicKey(null);
      return;
    }
    setAcademicsList(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setSelectedAcademics(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setLocalRecAcademics(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setEditingAcademicKey(null);
  };

  const handleUpdatePersonal = (oldVal: string, newVal: string) => {
    const cleanNew = newVal.trim();
    if (!cleanNew || oldVal === cleanNew) {
      setEditingPersonalKey(null);
      return;
    }
    setPersonalsList(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setSelectedPersonals(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setLocalRecPersonals(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setEditingPersonalKey(null);
  };

  const handleUpdateChallenge = (oldVal: string, newVal: string) => {
    const cleanNew = newVal.trim();
    if (!cleanNew || oldVal === cleanNew) {
      setEditingChallengeKey(null);
      return;
    }
    setChallengesList(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setSelectedChallenges(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setLocalRecChallenges(prev => prev.map(item => item === oldVal ? cleanNew : item));
    setEditingChallengeKey(null);
  };

  const filteredAcademics = academicsList.filter((item) =>
    item.toLowerCase().includes(academicSearch.toLowerCase())
  );

  const filteredPersonals = personalsList.filter((item) =>
    item.toLowerCase().includes(personalSearch.toLowerCase())
  );

  const filteredChallenges = challengesList.filter((item) =>
    item.toLowerCase().includes(challengeSearch.toLowerCase())
  );

  const getOrderedItems = (
    filteredList: string[],
    recommendedList: string[]
  ) => {
    return [...filteredList].sort((a, b) => {
      const aRec = recommendedList.includes(a);
      const bRec = recommendedList.includes(b);
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      return 0;
    });
  };

  const orderedAcademics = getOrderedItems(filteredAcademics, localRecAcademics);
  const orderedPersonals = getOrderedItems(filteredPersonals, localRecPersonals);
  const orderedChallenges = getOrderedItems(filteredChallenges, localRecChallenges);

  const toggleSelection = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    maxSelect?: number
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      if (maxSelect && list.length >= maxSelect) {
        // If there's a limit, replace the first or don't allow.
        // For challenges, picking 1-2 is best. Let's just allow multiple but warn or suggest.
        setList([...list, item]);
      } else {
        setList([...list, item]);
      }
    }
  };

  const handleGenerate = () => {
    if (!studentName.trim()) {
      setErrorMsg('El nombre del estudiante es requerido.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (selectedAcademics.length === 0) {
      setErrorMsg('Selecciona al menos una fortaleza académica.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }
    if (selectedPersonals.length === 0) {
      setErrorMsg('Selecciona al menos una fortaleza personal o conductual.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }
    if (selectedChallenges.length === 0) {
      setErrorMsg('Selecciona al menos un desafío escolar.');
      window.scrollTo({ top: 450, behavior: 'smooth' });
      return;
    }

    setErrorMsg('');
    onGenerateComment({
      name: studentName,
      gender,
      academics: selectedAcademics,
      personals: selectedPersonals,
      challenges: selectedChallenges,
      tone,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Top action bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Regresar</span>
          </button>
          {hasCourse && (
            <>
              <div className="h-4 w-[1px] bg-gray-250"></div>
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-100 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Volver al curso</span>
              </button>
            </>
          )}
        </div>
        <button
          onClick={onViewSaved}
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-all cursor-pointer"
        >
          Ver Guardados ({savedCount})
        </button>
      </div>

      {/* Header Profile Title */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="bg-blue-600 text-white p-2 w-12 h-12 rounded-xl shadow-md flex items-center justify-center shrink-0">
          <User className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            {studentName || 'Nuevo Estudiante'}
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Configura los parámetros, selecciona indicadores y genera un informe formativo personalizado.
          </p>
        </div>
      </div>

      {/* Error Block */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-rose-50 text-rose-800 border border-rose-100 flex items-start gap-3 rounded-xl text-sm"
        >
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold block">Error de Validación:</strong>
            {errorMsg}
          </div>
        </motion.div>
      )}

      {/* Amber Intelligent Synthesis Banner */}
      {synthesisText && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 shadow-xs relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100/30 rounded-full blur-2xl -mr-4 -mt-4"></div>
          <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-sm mb-2">
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Síntesis Inteligente del Alumno</span>
          </div>
          <div className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap font-sans pl-1 preserve-case">
            {synthesisText}
          </div>
        </motion.div>
      )}

      {/* Step 1: Profile and Core Settings */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 mb-4">
        {hasCourse && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-blue-700">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="text-[11px] md:text-xs font-semibold">
                Estudiante cargado desde el curso importado
              </span>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-[11px] md:text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-all hover:underline cursor-pointer"
            >
              <span>Volver al curso</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
            placeholder="Ej: Pérez García, Martín"
          />
        </div>
        
        {/* Gender Choice: Critical for Spanish concordance */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Género de Concordancia</label>
          <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
            {(['masculino', 'femenino', 'neutro'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`py-1.5 text-[11px] font-bold rounded-md transition-all capitalize cursor-pointer ${
                  gender === g
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {g === 'neutro' ? 'Inclusivo' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tono de Redacción</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white font-medium"
          >
            {TONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div></div>

      {/* Indicators Checklist Grids */}
      {/* 1. Academic Strengths */}
      <div className="mb-4 bg-white p-4 rounded-xl shadow-xs border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50">
          <div className="flex items-center gap-2 text-blue-600">
            <BookOpen className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-800">1. Fortalezas Académicas</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Selecciona los aspectos donde destaca intelectualmente (puedes editarlos pasando el cursor encima)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setAcademicsList(FORTALEZAS_ACADEMICAS);
              }}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-600 transition-colors cursor-pointer border border-gray-250 hover:border-blue-200 px-2 py-0.5 rounded bg-gray-50/50 hover:bg-blue-50/30"
              title="Restaurar fortalezas académicas originales"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Restaurar originales</span>
            </button>
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
              {selectedAcademics.length} seleccionadas
            </span>
          </div>
        </div>

        {/* Local Checklist Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <input
            type="text"
            value={academicSearch}
            onChange={(e) => setAcademicSearch(e.target.value)}
            placeholder="Filtrar fortalezas académicas..."
            className="block w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
          {orderedAcademics.map((item, idx) => {
            const isSelected = selectedAcademics.includes(item);
            const isRecommended = localRecAcademics.includes(item);
            const isEditing = editingAcademicKey === item;
            return (
              <label
                key={idx}
                className={`group flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all relative ${
                  isSelected
                    ? isRecommended
                      ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                      : 'bg-blue-50/50 border-blue-200 shadow-2xs'
                    : isRecommended
                      ? 'bg-white border-dashed border-amber-200 hover:bg-amber-50/30'
                      : 'hover:bg-gray-50/50 border-gray-150'
                }`}
              >
                {!isEditing && (
                  <input
                    type="checkbox"
                    className={`mt-1 w-4 h-4 rounded shrink-0 cursor-pointer ${
                      isRecommended ? 'accent-amber-500' : 'accent-blue-600'
                    }`}
                    checked={isSelected}
                    onChange={() => toggleSelection(item, selectedAcademics, setSelectedAcademics)}
                  />
                )}
                {isEditing ? (
                  <div 
                    className="flex items-center gap-1.5 w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <input
                      type="text"
                      value={editingAcademicValue}
                      onChange={(e) => setEditingAcademicValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUpdateAcademic(item, editingAcademicValue);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingAcademicKey(null);
                        }
                      }}
                      className="flex-1 p-1 text-[11px] md:text-xs border border-blue-400 rounded outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-800 font-medium"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleUpdateAcademic(item, editingAcademicValue);
                      }}
                      className="p-1 bg-green-50 text-green-700 hover:bg-green-100 rounded cursor-pointer"
                      title="Guardar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setEditingAcademicKey(null);
                      }}
                      className="p-1 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-1.5">
                    <span className={`text-[11px] md:text-xs leading-tight ${
                      isSelected
                        ? isRecommended
                          ? 'text-amber-900 font-semibold'
                          : 'text-blue-900 font-semibold'
                        : 'text-gray-600'
                    }`}>
                      {item}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isRecommended && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-extrabold rounded-md uppercase shrink-0">
                          <Sparkles className="w-2 h-2 text-amber-600 animate-pulse" />
                          <span>Sugerido</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingAcademicKey(item);
                          setEditingAcademicValue(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 rounded transition-all cursor-pointer"
                        title="Editar indicador"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Personal Strengths */}
      <div className="mb-4 bg-white p-4 rounded-xl shadow-xs border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50">
          <div className="flex items-center gap-2 text-emerald-600">
            <Heart className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-800">2. Fortalezas Personales y Conductuales</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Cualidades socioemocionales, actitudes y valores (puedes editarlos pasando el cursor encima)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setPersonalsList(FORTALEZAS_PERSONALES);
              }}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer border border-gray-250 hover:border-emerald-200 px-2 py-0.5 rounded bg-gray-50/50 hover:bg-emerald-50/30"
              title="Restaurar fortalezas personales originales"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Restaurar originales</span>
            </button>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
              {selectedPersonals.length} seleccionadas
            </span>
          </div>
        </div>

        {/* Local Checklist Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <input
            type="text"
            value={personalSearch}
            onChange={(e) => setPersonalSearch(e.target.value)}
            placeholder="Filtrar fortalezas socioemocionales..."
            className="block w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
          {orderedPersonals.map((item, idx) => {
            const isSelected = selectedPersonals.includes(item);
            const isRecommended = localRecPersonals.includes(item);
            const isEditing = editingPersonalKey === item;
            return (
              <label
                key={idx}
                className={`group flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all relative ${
                  isSelected
                    ? isRecommended
                      ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                      : 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                    : isRecommended
                      ? 'bg-white border-dashed border-amber-200 hover:bg-amber-50/30'
                      : 'hover:bg-gray-50/50 border-gray-150'
                }`}
              >
                {!isEditing && (
                  <input
                    type="checkbox"
                    className={`mt-1 w-4 h-4 rounded shrink-0 cursor-pointer ${
                      isRecommended ? 'accent-amber-500' : 'accent-emerald-600'
                    }`}
                    checked={isSelected}
                    onChange={() => toggleSelection(item, selectedPersonals, setSelectedPersonals)}
                  />
                )}
                {isEditing ? (
                  <div 
                    className="flex items-center gap-1.5 w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <input
                      type="text"
                      value={editingPersonalValue}
                      onChange={(e) => setEditingPersonalValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUpdatePersonal(item, editingPersonalValue);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingPersonalKey(null);
                        }
                      }}
                      className="flex-1 p-1 text-[11px] md:text-xs border border-emerald-400 rounded outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-gray-800 font-medium"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleUpdatePersonal(item, editingPersonalValue);
                      }}
                      className="p-1 bg-green-50 text-green-700 hover:bg-green-100 rounded cursor-pointer"
                      title="Guardar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setEditingPersonalKey(null);
                      }}
                      className="p-1 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-1.5">
                    <span className={`text-[11px] md:text-xs leading-tight ${
                      isSelected
                        ? isRecommended
                          ? 'text-amber-900 font-semibold'
                          : 'text-emerald-900 font-semibold'
                        : 'text-gray-600'
                    }`}>
                      {item}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isRecommended && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-extrabold rounded-md uppercase shrink-0">
                          <Sparkles className="w-2 h-2 text-amber-600 animate-pulse" />
                          <span>Sugerido</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingPersonalKey(item);
                          setEditingPersonalValue(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 rounded transition-all cursor-pointer"
                        title="Editar indicador"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Main Challenges */}
      <div className="mb-4 bg-white p-4 rounded-xl shadow-xs border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-50">
          <div className="flex items-center gap-2 text-orange-600">
            <Target className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-800">3. Áreas de Oportunidad y Desafíos</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Aspectos sugeridos para fortalecer el próximo periodo (puedes editarlos pasando el cursor encima)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setChallengesList(DESAFIOS);
              }}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-orange-600 transition-colors cursor-pointer border border-gray-250 hover:border-orange-200 px-2 py-0.5 rounded bg-gray-50/50 hover:bg-orange-50/30"
              title="Restaurar desafíos originales"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Restaurar originales</span>
            </button>
            <span className="text-[11px] font-semibold bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full">
              {selectedChallenges.length} seleccionadas
            </span>
          </div>
        </div>

        {/* Local Checklist Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <input
            type="text"
            value={challengeSearch}
            onChange={(e) => setChallengeSearch(e.target.value)}
            placeholder="Filtrar áreas de oportunidad..."
            className="block w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
          {orderedChallenges.map((item, idx) => {
            const isSelected = selectedChallenges.includes(item);
            const isRecommended = localRecChallenges.includes(item);
            const isEditing = editingChallengeKey === item;
            return (
              <label
                key={idx}
                className={`group flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all relative ${
                  isSelected
                    ? isRecommended
                      ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                      : 'bg-orange-50/50 border-orange-200 shadow-2xs'
                    : isRecommended
                      ? 'bg-white border-dashed border-amber-200 hover:bg-amber-50/30'
                      : 'hover:bg-gray-50/50 border-gray-150'
                }`}
              >
                {!isEditing && (
                  <input
                    type="checkbox"
                    className={`mt-1 w-4 h-4 rounded shrink-0 cursor-pointer ${
                      isRecommended ? 'accent-amber-500' : 'accent-orange-600'
                    }`}
                    checked={isSelected}
                    onChange={() => toggleSelection(item, selectedChallenges, setSelectedChallenges)}
                  />
                )}
                {isEditing ? (
                  <div 
                    className="flex items-center gap-1.5 w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <input
                      type="text"
                      value={editingChallengeValue}
                      onChange={(e) => setEditingChallengeValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUpdateChallenge(item, editingChallengeValue);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingChallengeKey(null);
                        }
                      }}
                      className="flex-1 p-1 text-[11px] md:text-xs border border-orange-400 rounded outline-none focus:ring-1 focus:ring-orange-500 bg-white text-gray-800 font-medium"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleUpdateChallenge(item, editingChallengeValue);
                      }}
                      className="p-1 bg-green-50 text-green-700 hover:bg-green-100 rounded cursor-pointer"
                      title="Guardar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setEditingChallengeKey(null);
                      }}
                      className="p-1 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-1.5">
                    <span className={`text-[11px] md:text-xs leading-tight ${
                      isSelected
                        ? isRecommended
                          ? 'text-amber-900 font-semibold'
                          : 'text-orange-900 font-semibold'
                        : 'text-gray-600'
                    }`}>
                      {item}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isRecommended && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-extrabold rounded-md uppercase shrink-0">
                          <Sparkles className="w-2 h-2 text-amber-600 animate-pulse" />
                          <span>Sugerido</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingChallengeKey(item);
                          setEditingChallengeValue(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 rounded transition-all cursor-pointer"
                        title="Editar indicador"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Generation Button Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-2 px-4 md:px-6 flex justify-center z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]">
        <div className="max-w-7xl w-full flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <AiModelBadge
              modelUsed={modelUsed}
              userApiKey={userApiKey}
              onSaveApiKey={onSaveApiKey}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 disabled:opacity-70 shadow-lg shadow-blue-100 transition-all cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{loadingText}</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
                <span>Redactar Comentario Formativo</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="h-16"></div>
    </div>
  );
};
