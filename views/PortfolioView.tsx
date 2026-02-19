import React from 'react';
import { useProject } from '../services/projectContext';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line } from 'recharts';

const PortfolioView = () => {
    const { portfolioMetrics } = useProject();
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-800">Visão Corporativa</h2>
                <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">
                    {portfolioMetrics.totalProjects} Projetos Ativos
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">VGV Total</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, notation: 'compact' }).format(portfolioMetrics.totalVGV)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Resultado Consolidado</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, notation: 'compact' }).format(portfolioMetrics.totalNetResult)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Exposição de Caixa</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, notation: 'compact' }).format(portfolioMetrics.totalExposure)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">TIR Ponderada</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                        {portfolioMetrics.weightedIRR.toFixed(1)}% a.a.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-96">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Fluxo de Caixa Consolidado (10 anos)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={portfolioMetrics.consolidatedTimeline}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" hide />
                        <YAxis yAxisId="left" orientation="left" stroke="#94a3b8" tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)} />
                        <YAxis yAxisId="right" orientation="right" stroke="#6366f1" tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)} />
                        <Tooltip labelFormatter={(label) => `Mês ${label}`} formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)} />
                        <Bar yAxisId="left" dataKey="netCashFlow" name="Fluxo Mensal" fill="#cbd5e1" barSize={10} />
                        <Line yAxisId="right" type="monotone" dataKey="accumulatedCashFlow" name="Acumulado" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PortfolioView;
