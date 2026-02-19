import React from 'react';
import { useProject } from '../services/projectContext';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ComposedChart, Line } from 'recharts';

const CashFlowView = () => {
    const { getActiveScenario } = useProject();
    const scenario = getActiveScenario();
    if (!scenario || !scenario.results) return null;
    const { timeline } = scenario.results;
    const { costs } = scenario;

    const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef"];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-96">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Detalhamento de Custos (Mês a Mês)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)} />
                        <Legend />
                        {costs.map((cost, index) => (
                            <Bar
                                key={cost.id}
                                dataKey={`costBreakdown.${cost.name}`}
                                name={cost.name}
                                stackId="a"
                                fill={colors[index % colors.length]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-96">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Fluxo de Caixa Consolidado</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="netCashFlow" name="Fluxo Líquido Mensal" fill="#8884d8" barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="accumulatedCashFlow" name="Saldo Acumulado" stroke="#82ca9d" strokeWidth={3} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CashFlowView;
