import React from 'react';
import { useProject } from '../services/projectContext';
import { Hammer, Trash2, Plus } from 'lucide-react';
import { CostCategory, DistributionType } from '../types';

const CostsView = () => {
    const { getActiveScenario, updateScenario } = useProject();
    const scenario = getActiveScenario();
    if (!scenario) return null;
    const { costs, projectData, salesPremises } = scenario;
    const readOnly = scenario.isReadOnly;

    const sellableUnits = Math.floor(projectData.totalUnits * (1 - (projectData.physicalBarterPercentage || 0) / 100));
    const sellableArea = projectData.sellablePrivateArea > 0 ? projectData.sellablePrivateArea : projectData.totalArea;
    const avgUnitSize = sellableUnits > 0 ? sellableArea / sellableUnits : 0;

    const grossTicket = avgUnitSize * salesPremises.pricePerSqm;
    const grossVGV = sellableUnits * grossTicket;

    const handleCostChange = (id: string, field: keyof CostCategory, value: any) => {
        const newCosts = costs.map(c => {
            if (c.id !== id) return c;
            const updates: Partial<CostCategory> = { [field]: value };
            if (field === 'vgvPercentage') {
                const pct = Number(value);
                updates.vgvPercentage = pct;
                updates.totalValue = (grossVGV * pct) / 100;
            }
            if (field === 'totalValue') {
                const val = Number(value);
                updates.totalValue = val;
                updates.vgvPercentage = 0;
            }
            return { ...c, ...updates };
        });
        updateScenario(scenario.id, { costs: newCosts });
    };

    const addCost = () => {
        const newCost: CostCategory = {
            id: `c-${Date.now()}`,
            name: 'Novo Item de Custo',
            totalValue: 0,
            distributionType: DistributionType.LINEAR,
            startMonth: 0,
            durationMonths: 12
        };
        updateScenario(scenario.id, { costs: [...costs, newCost] });
    };

    const removeCost = (id: string) => {
        updateScenario(scenario.id, { costs: costs.filter(c => c.id !== id) });
    };

    const totalCost = costs.reduce((sum, c) => sum + c.totalValue, 0);

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Hammer className="text-indigo-600" /> Custos e Cronograma
                </h2>
                <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase">Custo Total</p>
                    <p className="text-xl font-bold text-red-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalCost)}
                    </p>
                    <p className="text-xs text-slate-400">{(grossVGV > 0 ? (totalCost / grossVGV) * 100 : 0).toFixed(1)}% do VGV Bruto</p>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg text-slate-900">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-1/4">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-600 uppercase w-24">% VGV</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-40">Valor Total (R$)</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">Início (Mês)</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">Duração</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Curva</th>
                            {!readOnly && <th className="px-4 py-3 w-10"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {costs.map(cost => (
                            <tr key={cost.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        disabled={readOnly}
                                        value={cost.name}
                                        onChange={e => handleCostChange(cost.id, 'name', e.target.value)}
                                        className="w-full border-slate-300 rounded p-1.5 text-sm font-medium text-slate-700 bg-white"
                                    />
                                </td>
                                <td className="px-4 py-2 bg-indigo-50/30">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            disabled={readOnly}
                                            value={cost.vgvPercentage || ''}
                                            onChange={e => handleCostChange(cost.id, 'vgvPercentage', e.target.value)}
                                            placeholder="-"
                                            className="w-full border-indigo-200 rounded p-1.5 text-sm font-bold text-indigo-700 text-right pr-6 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        />
                                        <span className="absolute right-2 top-1.5 text-indigo-400 text-xs">%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        disabled={readOnly || (cost.vgvPercentage !== undefined && cost.vgvPercentage > 0)}
                                        value={cost.totalValue}
                                        onChange={e => handleCostChange(cost.id, 'totalValue', Number(e.target.value))}
                                        className={`w-full border-slate-300 rounded p-1.5 text-sm ${cost.vgvPercentage && cost.vgvPercentage > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'}`}
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        disabled={readOnly}
                                        value={cost.startMonth}
                                        onChange={e => handleCostChange(cost.id, 'startMonth', Number(e.target.value))}
                                        className="w-full border-slate-300 rounded p-1.5 text-sm text-center bg-white text-slate-900"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        disabled={readOnly}
                                        value={cost.durationMonths}
                                        onChange={e => handleCostChange(cost.id, 'durationMonths', Number(e.target.value))}
                                        className="w-full border-slate-300 rounded p-1.5 text-sm text-center bg-white text-slate-900"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <select
                                        disabled={readOnly}
                                        value={cost.distributionType}
                                        onChange={e => handleCostChange(cost.id, 'distributionType', e.target.value)}
                                        className="w-full border-slate-300 rounded p-1.5 text-sm bg-white text-slate-900"
                                    >
                                        {Object.values(DistributionType).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </td>
                                {!readOnly && (
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => removeCost(cost.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!readOnly && (
                <button onClick={addCost} className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                    <Plus size={20} /> Adicionar Item de Custo
                </button>
            )}
        </div>
    );
};

export default CostsView;
