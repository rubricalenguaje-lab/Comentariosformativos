import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, User, Search, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { Student } from '../types';

interface SelectStudentProps {
  students: Student[];
  onBack: () => void;
  onSelectStudent: (student: Student) => void;
}

export const SelectStudent: React.FC<SelectStudentProps> = ({
  students,
  onBack,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudent, setLoadingStudent] = useState<string | null>(null);

  const filteredStudents = students.filter((st) =>
    st.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (student: Student) => {
    setLoadingStudent(student.nombre);
    try {
      await onSelectStudent(student);
    } catch (err) {
      console.error('Error selecting student:', err);
    } finally {
      setLoadingStudent(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Cargar</span>
        </button>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold self-start sm:self-auto">
          {students.length} Estudiantes Identificados
        </span>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">
          Selecciona un Alumno
        </h2>
        <p className="text-gray-500 text-xs">
          A continuación se presentan los estudiantes detectados en ambos archivos. Selecciona uno para revisar su síntesis inteligente e iniciar el informe.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar estudiante por nombre..."
          className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400 outline-none transition-all shadow-2xs text-xs"
        />
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No se encontraron estudiantes con ese nombre.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 text-blue-600 hover:text-blue-800 font-semibold text-sm cursor-pointer"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents.map((st, idx) => {
            const isLoading = loadingStudent === st.nombre;
            return (
              <motion.button
                key={idx}
                whileHover={{ y: -2, scale: 1.01, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}
                whileTap={{ scale: 0.99 }}
                onClick={() => !isLoading && handleSelect(st)}
                disabled={loadingStudent !== null}
                className={`flex items-center justify-between p-3 bg-white rounded-lg border transition-all text-left group cursor-pointer ${
                  isLoading
                    ? 'border-blue-500 bg-blue-50/10 shadow-inner'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className={`p-1.5 rounded-md shrink-0 transition-colors ${
                    isLoading 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-xs text-gray-800 block truncate leading-tight group-hover:text-blue-600 transition-colors">
                      {st.nombre}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">
                      ID: #{idx + 1}
                    </span>
                  </div>
                </div>
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};
