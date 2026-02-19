import React from 'react';
import { useProject } from '../services/projectContext';
import { Building2, Wallet, TrendingUp, TrendingDown, Zap, CheckCircle } from 'lucide-react';
import CashFlowView from './CashFlowView';

const DashboardView = () => {
    const { getActiveScenario } = useProject();
    const scenario = getActiveScenario();
    if (!scenario || !scenario.results) return <div className="p-8 text-slate-500 font-bold">Carregando Resultados...</div>;
    const { indicators } = scenario.results;

    const kpis = [
        { label: "VGV Bruto", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(indicators.grossVGV), icon: <Building2 className="text-indigo-500" /> },
        { label: "VGV Líquido", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(indicators.netVGV), icon: <Wallet className="text-emerald-500" /> },
        { label: "Resultado Líquido", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(indicators.netResult), icon: <TrendingUp className="text-blue-500" /> },
        { label: "Exposição Máxima", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(indicators.exposurePeak), icon: <TrendingDown className="text-red-500" /> },
        { label: "TIR (Nominal)", value: indicators.irr.toFixed(1) + '% a.a.', icon: <Zap className="text-purple-500" /> },
        { label: "TIR (Real)", value: indicators.realIrr.toFixed(1) + '% a.a.', icon: <CheckCircle className="text-amber-500" /> },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard do Projeto: {scenario.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((k, i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">{k.label}</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{k.value}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-full">
                            {k.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Margem Líquida</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-emerald-600">{indicators.margin.toFixed(1)}%</span>
                        <span className="text-sm text-slate-400 font-medium">sobre Receita Líquida</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Multiplicador (MOIC)</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-amber-600">{indicators.moic.toFixed(2)}x</span>
                        <span className="text-sm text-slate-400 font-medium">Retorno sobre Capital</span>
                    </div>
                </div>
            </div>

            <CashFlowView />
        </div>
    );
};

export default DashboardView;
