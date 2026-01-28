
import React, { useState } from 'react';
import { Plus, X, ListPlus, Edit2, Check, Palette } from 'lucide-react';
import { Subject } from '../types';

interface SubjectManagerProps {
  subjects: Subject[];
  onUpdate: (subs: Subject[]) => void;
}

const PRESET_COLORS = [
  '#0E6E85', '#FF7E67', '#F9C80E', '#10B981', '#3B82F6', 
  '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#F97316',
  '#84CC16', '#06B6D4', '#14B8A6', '#EC4899', '#71717A',
  '#78350F', '#1E3A8A', '#365314', '#581C87', '#451A03',
  '#FF0000', '#7F0000', '#FFABAB', '#00B404', '#F6D900'
];

export const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, onUpdate }) => {
  const [newSub, setNewSub] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const addSubject = () => {
    if (newSub.trim() && !subjects.find(s => s.name.toLowerCase() === newSub.trim().toLowerCase())) {
      onUpdate([...subjects, { name: newSub.trim(), color: selectedColor }]);
      setNewSub('');
      // Escolher cor aleatória pro próximo pra variar
      setSelectedColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
  };

  const removeSubject = (name: string) => {
    onUpdate(subjects.filter(s => s.name !== name));
  };

  const startEditing = (idx: number) => {
    setEditingIndex(idx);
    setEditName(subjects[idx].name);
    setEditColor(subjects[idx].color);
  };

  const saveEdit = () => {
    if (editingIndex === null || !editName.trim()) return;
    const newSubjects = [...subjects];
    newSubjects[editingIndex] = { name: editName.trim(), color: editColor };
    onUpdate(newSubjects);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Formulário de Criação */}
      <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
        <div className="relative group">
          <input
            type="text"
            className="w-full pl-9 pr-10 py-3 text-[10px] md:text-xs bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-slate-950 dark:text-slate-200 font-black uppercase placeholder:text-slate-400"
            placeholder="Nova matéria..."
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubject()}
          />
          <ListPlus className="absolute left-3 top-3.5 text-slate-500" size={14} />
          <button 
            onClick={addSubject}
            className="absolute right-1.5 top-1.5 p-2 bg-athena-teal text-white rounded-lg hover:bg-athena-coral transition-all shadow-md active:scale-90"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-lg transition-all border-2 ${selectedColor === color ? 'border-amber-500 scale-125 shadow-lg z-10' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: color }}
              title="Escolher Cor"
            />
          ))}
        </div>
      </div>

      {/* Lista de Matérias */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((s, idx) => (
          <div key={idx} className="relative group">
            {editingIndex === idx ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] border-2 border-slate-400 dark:border-slate-800 shadow-2xl p-8 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                     <Palette size={20} className="text-athena-teal" />
                     <h4 className="text-lg font-black uppercase tracking-tighter text-slate-950 dark:text-white">Editar Matéria</h4>
                   </div>
                   <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl border-2 border-slate-300 dark:bg-slate-800 text-sm font-bold outline-none focus:border-athena-teal"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                   />
                   <div className="flex flex-wrap gap-2 justify-center py-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={`w-8 h-8 rounded-xl transition-all border-2 ${editColor === color ? 'border-amber-500 scale-110 shadow-lg' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => setEditingIndex(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
                      <button onClick={saveEdit} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg">Salvar</button>
                   </div>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black text-white shadow-md transition-all border border-black/10 hover:shadow-lg"
                style={{ backgroundColor: s.color }}
              >
                <span className="uppercase tracking-tight">{s.name}</span>
                <div className="flex items-center gap-1 ml-1">
                  <button onClick={() => startEditing(idx)} className="hover:bg-black/20 p-1 rounded transition-colors"><Edit2 size={10} /></button>
                  <button onClick={() => removeSubject(s.name)} className="hover:bg-black/20 p-1 rounded transition-colors"><X size={10} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
