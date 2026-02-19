import React from 'react';
import { useProject } from '../services/projectContext';
import { Layers, Plus, CheckCircle, AlertTriangle, Camera, Lock } from 'lucide-react';

const ScenariosView = () => {
    const { projects, activeProjectId, addScenario, createSnapshot, setActiveScenario } = useProject();
    const project = projects.find(p => p.id === activeProjectId);
    if (!project) return null;

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-slate-900">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="text-indigo-600" /> Gestão de Cenários
                </h2>
                <button onClick={addScenario} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2">
                    <Plus size={16} /> Novo Cenário
                </button>
            </div>
            <div className="space-y-4">
                {project.scenarios.map(s => (
                    <div key={s.id} className={`border rounded-lg p-4 ${s.id === project.activeScenarioId ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-lg">{s.name}</h4>
                                <p className="text-xs text-slate-500">Atualizado: {new Date(s.lastUpdated).toLocaleString()}</p>
                                {s.validation && (
                                    <div className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${s.validation.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {s.validation.status === 'OK' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                        {s.validation.status}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {s.id !== project.activeScenarioId && (
                                    <button onClick={() => setActiveScenario(s.id)} className="text-sm text-indigo-600 hover:underline">Ativar</button>
                                )}
                                <button onClick={() => createSnapshot(s.id)} className="text-sm text-slate-600 hover:text-slate-900 border px-2 py-1 rounded flex items-center gap-1">
                                    <Camera size={14} /> Snapshot
                                </button>
                            </div>
                        </div>
                        {s.snapshots.length > 0 && (
                            <div className="mt-4 pl-4 border-l-2 border-slate-300">
                                <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Versões Fechadas</h5>
                                <div className="space-y-2">
                                    {s.snapshots.map(snap => (
                                        <div key={snap.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-100">
                                            <span className="flex items-center gap-2"><Lock size={12} className="text-slate-400" /> {snap.name}</span>
                                            <button onClick={() => setActiveScenario(snap.id)} className="text-xs text-indigo-600">Visualizar</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScenariosView;
