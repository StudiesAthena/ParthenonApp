
import React, { useState, useEffect, useRef } from 'react';

interface SideNotesProps {
  value: string;
  onChange: (val: string) => void;
}

export const SideNotes: React.FC<SideNotesProps> = ({ value, onChange }) => {
  const [internalValue, setInternalValue] = useState(value);
  const isFocused = useRef(false);

  // Sincroniza estado interno quando o valor externo muda, mas APENAS se o usuário não estiver focando o campo
  useEffect(() => {
    if (!isFocused.current) {
      setInternalValue(value);
    }
  }, [value]);

  // Sincroniza com o estado global com debounce de 1000ms para reduzir re-renders pesados
  useEffect(() => {
    if (!isFocused.current) return; // Não dispara se não foi interação do usuário

    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [internalValue, onChange, value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalValue(e.target.value);
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (internalValue !== value) {
      onChange(internalValue);
    }
  };

  return (
    <div className="relative group">
      <textarea
        className="w-full h-32 md:h-56 p-4 md:p-5 text-[12px] md:text-sm bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-3xl focus:ring-4 focus:ring-[#0E6E85]/10 focus:border-[#0E6E85] outline-none text-slate-950 dark:text-slate-100 font-bold resize-none transition-all placeholder:text-slate-400 shadow-inner"
        placeholder="Minhas anotações rápidas..."
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none text-[#0E6E85]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        </svg>
      </div>
    </div>
  );
};