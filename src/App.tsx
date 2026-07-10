import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Award, HelpCircle, Cloud, LogOut, X, AlertCircle, FileSpreadsheet, ExternalLink, RefreshCw } from 'lucide-react';
import { AppView, Student, SavedComment } from './types';
import { Dashboard } from './components/Dashboard';
import { Upload } from './components/Upload';
import { SelectStudent } from './components/SelectStudent';
import { Form } from './components/Form';
import { Edit } from './components/Edit';
import { Print } from './components/Print';
import { FORTALEZAS_ACADEMICAS, FORTALEZAS_PERSONALES, DESAFIOS } from './data';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout as firebaseLogout } from './utils/firebaseAuth';
import { saveCourseToDrive } from './utils/googleWorkspace';
import { safeFetchJson } from './utils/api';

export default function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [savedComments, setSavedComments] = useState<SavedComment[]>([]);
  
  // Google Drive & Sheets Integration State
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveFolderId, setDriveFolderId] = useState(() => {
    return localStorage.getItem('asistente_informes_drive_folder_id') || '';
  });
  const [courseName, setCourseName] = useState(() => {
    return localStorage.getItem('asistente_informes_course_name') || 'Curso Demo';
  });
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [createdSpreadsheet, setCreatedSpreadsheet] = useState<{ id: string; url: string } | null>(() => {
    const saved = localStorage.getItem('asistente_informes_spreadsheet_info');
    return saved ? JSON.parse(saved) : null;
  });

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDriveLogin = async () => {
    setDriveError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setDriveUser(result.user);
        setDriveToken(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setDriveError('Error de autenticación con Google: ' + (err.message || err));
    }
  };

  const handleDriveLogout = async () => {
    try {
      await firebaseLogout();
      setDriveUser(null);
      setDriveToken(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveToDrive = async () => {
    if (!courseName.trim()) {
      setDriveError('Por favor introduce un nombre para el curso.');
      return;
    }

    setIsSavingToDrive(true);
    setDriveError(null);

    try {
      localStorage.setItem('asistente_informes_drive_folder_id', driveFolderId);
      localStorage.setItem('asistente_informes_course_name', courseName);

      const commentsToSave = savedComments.map(c => ({
        name: c.name,
        date: c.date,
        comment: c.comment
      }));

      // Create or update Spreadsheet in Google Drive
      const result = await saveCourseToDrive({
        accessToken: driveToken!,
        folderId: driveFolderId.trim() || undefined,
        courseName: courseName,
        comments: commentsToSave,
        existingSpreadsheetId: createdSpreadsheet?.id
      });

      const spreadsheetInfo = { id: result.spreadsheetId, url: result.webViewLink };
      setCreatedSpreadsheet(spreadsheetInfo);
      localStorage.setItem('asistente_informes_spreadsheet_info', JSON.stringify(spreadsheetInfo));
      
      alert(`¡Planilla de curso "${courseName}" guardada con éxito en Google Drive!`);
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || 'Error al guardar la planilla en Google Drive.');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // File upload extracted data
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [synthesis, setSynthesis] = useState('');
  const [recommendedAcademics, setRecommendedAcademics] = useState<string[]>([]);
  const [recommendedPersonals, setRecommendedPersonals] = useState<string[]>([]);
  const [recommendedChallenges, setRecommendedChallenges] = useState<string[]>([]);

  // Editing comment data
  const [editingComment, setEditingComment] = useState<SavedComment | null>(null);
  const [generatedCommentText, setGeneratedCommentText] = useState('');

  // Global loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Manual API Key and active AI Model states
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem('asistente_informes_user_api_key') || '';
  });
  const [modelUsed, setModelUsed] = useState<string>('gemini-2.5-flash');

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    if (key) {
      localStorage.setItem('asistente_informes_user_api_key', key);
    } else {
      localStorage.removeItem('asistente_informes_user_api_key');
    }
  };

  // Load saved comments from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('asistente_informes_comments');
    if (stored) {
      try {
        setSavedComments(JSON.parse(stored));
      } catch (err) {
        console.error('Error loading stored comments:', err);
      }
    }
  }, []);

  // Sync saved comments to local storage
  const saveCommentsToStorage = (updatedList: SavedComment[]) => {
    setSavedComments(updatedList);
    localStorage.setItem('asistente_informes_comments', JSON.stringify(updatedList));
  };

  const handleImportComments = (imported: SavedComment[]) => {
    const updated = [...savedComments];
    imported.forEach((imp) => {
      // Avoid exact duplicates by id
      if (!updated.some((u) => u.id === imp.id)) {
        updated.push(imp);
      }
    });
    saveCommentsToStorage(updated);
  };

  const handleExportComments = () => {
    if (savedComments.length === 0) return;
    const jsonStr = JSON.stringify(savedComments, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Respaldo_Sesion_Informes_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllComments = () => {
    saveCommentsToStorage([]);
  };

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setIsGenerating(true);
    setLoadingText(`Generando diagnóstico pedagógico para ${student.nombre}...`);
    try {
      const data = await safeFetchJson<any>('/api/generate-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: student.nombre,
          personalidad: student.personalidad,
          notas: student.notas,
          customApiKey: userApiKey,
          academicsOptions: FORTALEZAS_ACADEMICAS,
          personalsOptions: FORTALEZAS_PERSONALES,
          challengesOptions: DESAFIOS,
        }),
      });
      setSynthesis(data.synthesis || '');
      setRecommendedAcademics(data.recommendedAcademics || []);
      setRecommendedPersonals(data.recommendedPersonals || []);
      setRecommendedChallenges(data.recommendedChallenges || []);
      
      if (data.modelUsed) {
        setModelUsed(data.modelUsed);
      }
      setView('form');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateComment = async (formData: {
    name: string;
    gender: 'masculino' | 'femenino' | 'neutro';
    academics: string[];
    personals: string[];
    challenges: string[];
    tone: string;
  }) => {
    setIsGenerating(true);
    setLoadingText(`Redactando comentario pedagógico formativo...`);
    try {
      const data = await safeFetchJson<any>('/api/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          gender: formData.gender,
          academics: formData.academics,
          personals: formData.personals,
          challenges: formData.challenges,
          tone: formData.tone,
          customApiKey: userApiKey,
        }),
      });

      if (data.modelUsed) {
        setModelUsed(data.modelUsed);
      }

      setEditingComment({
        id: Date.now().toString(),
        name: formData.name,
        comment: data.comment || '',
        date: new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        gender: formData.gender,
        academics: formData.academics,
        personals: formData.personals,
        challenges: formData.challenges,
      });
      setGeneratedCommentText(data.comment || '');
      setView('edit');
    } catch (err: any) {
      alert(`Error al generar: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFinalComment = (commentText: string) => {
    if (!editingComment) return;

    const existingIndex = savedComments.findIndex((c) => c.id === editingComment.id || c.name === editingComment.name);
    let updated: SavedComment[];

    if (existingIndex > -1) {
      // Overwrite comment of the same student or same id
      updated = [...savedComments];
      updated[existingIndex] = {
        ...editingComment,
        comment: commentText,
      };
    } else {
      // Append new comment
      updated = [
        ...savedComments,
        {
          ...editingComment,
          comment: commentText,
        },
      ];
    }

    saveCommentsToStorage(updated);
    
    // Reset temporary variables
    setEditingComment(null);
    setGeneratedCommentText('');
    setSynthesis('');
    setSelectedStudent(null);

    // If students are left in the batch list, go back to select them, otherwise go back to dashboard
    if (studentsList.length > 0) {
      setView('selectStudent');
    } else {
      setView('dashboard');
    }
  };

  const handleEditSavedComment = (comment: SavedComment) => {
    setEditingComment(comment);
    setGeneratedCommentText(comment.comment);
    setView('edit');
  };

  const handleDeleteSavedComment = (id: string) => {
    const updated = savedComments.filter((c) => c.id !== id);
    saveCommentsToStorage(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-gray-800">
      {/* Universal Sticky Header Bar */}
      <header className="print:hidden bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between">
          <button
            onClick={() => {
              setView('dashboard');
              setEditingComment(null);
              setSelectedStudent(null);
            }}
            className="flex items-center gap-2 group hover:opacity-90 cursor-pointer"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight block leading-none">
                Informe Rápido
              </span>
              <span className="text-[9px] text-gray-400 font-medium font-mono">
                AI Studio Assistant
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {savedComments.length > 0 && (
              <button
                onClick={() => setIsDriveModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-100 cursor-pointer transition-all"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guardar Curso</span>
                <span className="sm:inline hidden md:hidden">Guardar</span>
              </button>
            )}
            <span className="text-[11px] font-semibold text-gray-400 hidden md:inline">
              Periodo Académico Semestral
            </span>
            <div className="h-4 w-[1px] bg-gray-200 hidden md:inline"></div>
            <div className="flex items-center gap-1 bg-blue-50 px-2.5 py-0.5 rounded-full text-blue-700 text-[11px] font-bold">
              <Award className="w-3 h-3" />
              <span>Sesión Activa</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Render Box */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Dashboard
                onNavigate={(v) => {
                  if (v === 'form') {
                    setSelectedStudent(null);
                    setSynthesis('');
                    setRecommendedAcademics([]);
                    setRecommendedPersonals([]);
                    setRecommendedChallenges([]);
                  }
                  setView(v);
                }}
                savedCommentsCount={savedComments.length}
                onClearAll={handleClearAllComments}
                onImport={handleImportComments}
                onExport={handleExportComments}
                comments={savedComments}
                onOpenSaveToDrive={() => setIsDriveModalOpen(true)}
              />
            </motion.div>
          )}

          {view === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Upload
                onBack={() => setView('dashboard')}
                userApiKey={userApiKey}
                onProcessed={(list, extractionModel) => {
                  setStudentsList(list);
                  if (extractionModel) {
                    setModelUsed(extractionModel);
                  }
                  setView('selectStudent');
                }}
              />
            </motion.div>
          )}

          {view === 'selectStudent' && (
            <motion.div
              key="selectStudent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SelectStudent
                students={studentsList}
                onBack={() => setView('upload')}
                onSelectStudent={handleSelectStudent}
              />
            </motion.div>
          )}

          {view === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Form
                key={selectedStudent?.nombre || 'manual'}
                initialStudentName={selectedStudent?.nombre || ''}
                synthesisText={synthesis}
                hasCourse={studentsList.length > 0}
                onBack={() => {
                  if (studentsList.length > 0) {
                    setView('selectStudent');
                  } else {
                    setView('dashboard');
                  }
                }}
                onGenerateComment={handleGenerateComment}
                isLoading={isGenerating}
                loadingText={loadingText}
                savedCount={savedComments.length}
                onViewSaved={() => setView('print')}
                modelUsed={modelUsed}
                userApiKey={userApiKey}
                onSaveApiKey={handleSaveApiKey}
                recommendedAcademics={recommendedAcademics}
                recommendedPersonals={recommendedPersonals}
                recommendedChallenges={recommendedChallenges}
              />
            </motion.div>
          )}

          {view === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Edit
                studentName={editingComment?.name || ''}
                initialComment={generatedCommentText}
                onBack={() => setView('form')}
                onSaveComment={handleSaveFinalComment}
                modelUsed={modelUsed}
                userApiKey={userApiKey}
                onSaveApiKey={handleSaveApiKey}
              />
            </motion.div>
          )}

          {view === 'print' && (
            <motion.div
              key="print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Print
                comments={savedComments}
                onBack={() => setView('dashboard')}
                onEditComment={handleEditSavedComment}
                onDeleteComment={handleDeleteSavedComment}
                onClearAll={handleClearAllComments}
                onOpenSaveToDrive={() => setIsDriveModalOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Loading Screen Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-5 rounded-xl shadow-2xl max-w-sm w-full text-center border border-gray-100 flex flex-col items-center"
          >
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <GraduationCap className="w-4.5 h-4.5 text-blue-600 absolute inset-0 m-auto" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Procesamiento de IA</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{loadingText}</p>
          </motion.div>
        </div>
      )}

      {/* Google Drive Integration Modal */}
      <AnimatePresence>
        {isDriveModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden"
            >
              <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  <span className="font-bold text-sm">Guardar Curso en Google Drive</span>
                </div>
                <button 
                  onClick={() => setIsDriveModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Crea o actualiza una planilla de cálculo en tu cuenta de Google Drive con todos los comentarios del curso actualmente guardados en tu sesión.
                </p>

                {/* Google Sign In status */}
                <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-semibold text-gray-700">Estado de Google Drive</span>
                    </div>
                    {driveUser && (
                      <button 
                        onClick={handleDriveLogout}
                        className="text-[10px] text-gray-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Cerrar sesión de Google"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Desconectar</span>
                      </button>
                    )}
                  </div>

                  {driveUser ? (
                    <div className="mt-2.5 flex items-center gap-2.5">
                      {driveUser.photoURL ? (
                        <img 
                          src={driveUser.photoURL} 
                          alt={driveUser.displayName || 'Google User'} 
                          className="w-8 h-8 rounded-full border"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {driveUser.displayName?.charAt(0) || driveUser.email?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-gray-800 block leading-tight">
                          {driveUser.displayName || 'Usuario de Google'}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {driveUser.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-center">
                      <button
                        onClick={handleDriveLogin}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <span>Conectar Google Drive</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nombre del Curso / Sección
                    </label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Ej: 4to Básico A, Química I"
                      className="block w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      ID de la Carpeta de Drive <span className="text-[10px] text-gray-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={driveFolderId}
                      onChange={(e) => setDriveFolderId(e.target.value)}
                      placeholder="Dejar vacío para guardar en la raíz de Drive"
                      className="block w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    />
                    <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">
                      Ej. ID: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456 (extraído de la URL de la carpeta en Drive).
                    </p>
                  </div>
                </div>

                {driveError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight font-medium">{driveError}</span>
                  </div>
                )}

                {/* Link to existing spreadsheet if already created */}
                {createdSpreadsheet && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-emerald-800 block truncate">
                          Planilla Vinculada
                        </span>
                        <span className="text-[10px] text-emerald-600 block truncate">
                          Guardada en tu sesión
                        </span>
                      </div>
                    </div>
                    <a 
                      href={createdSpreadsheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      <span>Ver en Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Save button */}
                <button
                  type="button"
                  disabled={!driveUser || isSavingToDrive}
                  onClick={handleSaveToDrive}
                  className={`w-full py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    !driveUser 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : isSavingToDrive 
                        ? 'bg-emerald-500' 
                        : 'bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-emerald-100'
                  }`}
                >
                  {isSavingToDrive ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Escribiendo en Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{createdSpreadsheet ? 'Actualizar Planilla en Drive' : 'Crear y Guardar en Drive'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
