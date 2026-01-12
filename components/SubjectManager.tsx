
import React, { useState } from 'react';
import { Plus, X, ListPlus } from 'lucide-react';

interface SubjectManagerProps {
  subjects: string[];
  onUpdate: (subs: string[]) => void;
}

const SUBJECT_COLORS = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 
  'bg-violet-600', 'bg-cyan-600', 'bg-orange-600', 'bg-fuchsia-600'
];

export const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, onUpdate }) => {
  const [newSub, setNewSub] = useState('');

  const addSubject = () => {
    if (newSub.trim() && !subjects.includes(newSub.trim())) {
      onUpdate([...subjects, newSub.trim()]);
      setNewSub('');
    }
  };

  const removeSubject = (name: string) => {
    onUpdate(subjects.filter(s => s !== name));
  };

  return (
    <div className="space-y-3">
      <div className="relative group">
        <input
          type="text"
          className="w-full pl-9 pr-10 py-2.5 text-[10px] md:text-xs bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-slate-950 dark:text-slate-200 font-black uppercase placeholder:text-slate-400"
          placeholder="Nova matéria..."
          value={newSub}
          onChange={(e) => setNewSub(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSubject()}
        />
        <ListPlus className="absolute left-3 top-2.5 text-slate-500" size={14} />
        <button 
          onClick={addSubject}
          className="absolute right-1.5 top-1.5 p-1.5 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-all shadow-md active:scale-90"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {subjects.map((s, idx) => (
          <div 
            key={s} 
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black text-white shadow-md transition-all border border-black/10 ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}`}
          >
            <span className="uppercase tracking-tight">{s}</span>
            <button 
              onClick={() => removeSubject(s)}
              className="hover:bg-black/20 p-0.5 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
