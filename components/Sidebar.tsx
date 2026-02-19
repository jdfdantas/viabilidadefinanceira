import React, { useState } from 'react';
import { useProject } from '../services/projectContext';
import {
    LayoutDashboard,
    Building2,
    Wallet,
    Hammer,
    TrendingUp,
    Layers,
    Settings,
    Plus,
    Briefcase,
    Globe,
    Percent,
    FileText,
    LogIn
} from 'lucide-react';
import { ViewState } from '../types';
import Modal from './Modal';
import { supabase } from '../services/supabase';

const Sidebar = () => {
    const { currentView, setView, projects, activeProjectId, setActiveProject, addProject } = useProject();
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const handleCreateProject = () => {
        if (!newProjectName) return;
        addProject({
            name: newProjectName,
            location: "Nova Localização",
            type: "Residencial",
            totalUnits: 100,
            totalArea: 4000,
            efficiencyRatio: 2.0,
            totalPrivateArea: 8000,
            totalEquivalentArea: 8000,
            sellablePrivateArea: 8000,
            physicalBarterPercentage: 0,
            acquisitionType: 'CASH',
            landCashValue: 0,
            constructionDurationMonths: 24,
            salesDurationMonths: 36
        });
        setNewProjectName('');
        setIsNewProjectModalOpen(false);
    };

    const corporateItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
        { id: 'PORTFOLIO', label: 'Visão Corporativa', icon: <Briefcase size={20} /> },
        { id: 'LIBRARY', label: 'Biblioteca Global', icon: <Globe size={20} /> },
    ];

    const projectItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
        { id: 'PROJECT_DATA', label: 'Empreendimento', icon: <Building2 size={20} /> },
        { id: 'ECONOMIC_INDICES', label: 'Índices Econômicos', icon: <Percent size={20} /> },
        { id: 'REVENUE', label: 'Receitas', icon: <Wallet size={20} /> },
        { id: 'COSTS', label: 'Custos', icon: <Hammer size={20} /> },
        { id: 'CASH_FLOW', label: 'Fluxo de Caixa', icon: <TrendingUp size={20} /> },
        { id: 'DRE', label: 'DRE', icon: <FileText size={20} /> },
        { id: 'SCENARIOS', label: 'Governança', icon: <Layers size={20} /> },
        { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ];

    return (
        <div className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                        P
                    </div>
                    PDR FinInvest
                </h1>
                <p className="text-xs text-slate-500 mt-1 ml-10">Plataforma v7.1</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Institucional
                </div>
                {corporateItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${currentView === item.id
                            ? 'bg-indigo-900/50 text-white border-r-4 border-indigo-500'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span className="font-medium text-sm">{item.label}</span>
                    </button>
                ))}

                <div className="mt-8 px-4 mb-2 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Projetos</span>
                    <button onClick={() => setIsNewProjectModalOpen(true)} className="hover:text-white"><Plus size={14} /></button>
                </div>

                <div className="px-4 mb-4 space-y-1">
                    {projects.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setActiveProject(p.id)}
                            className={`w-full text-left px-3 py-2 rounded text-sm truncate transition-colors ${activeProjectId === p.id
                                ? 'bg-slate-800 text-white shadow-inner'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>

                {activeProjectId && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="px-4 mb-2 mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Módulos do Projeto
                        </div>
                        {projectItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`w-full flex items-center gap-3 px-6 py-2 transition-colors ${currentView === item.id
                                    ? 'text-white font-semibold'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium text-sm">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-2">
                <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-2 py-2 rounded hover:bg-slate-800 transition-colors">
                    <Settings size={18} />
                    <span>Configurações</span>
                </button>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 w-full px-2 py-2 rounded hover:bg-slate-800 transition-colors"
                >
                    <LogIn className="rotate-180" size={18} />
                    <span>Sair</span>
                </button>
            </div>

            {isNewProjectModalOpen && (
                <Modal title="Novo Empreendimento" onClose={() => setIsNewProjectModalOpen(false)}>
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Nome do Projeto</span>
                            <input
                                autoFocus
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 text-slate-900"
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                placeholder="Ex: Reserva Imperial"
                            />
                        </label>
                        <button
                            onClick={handleCreateProject}
                            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                        >
                            Criar Projeto
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Sidebar;
