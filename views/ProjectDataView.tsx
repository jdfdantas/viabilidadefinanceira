import React from 'react';
import { useProject } from '../services/projectContext';
import { Building2, Lock } from 'lucide-react';
import { ProjectData } from '../types';

const ProjectDataView = () => {
    const { getActiveScenario, updateScenario } = useProject();
    const scenario = getActiveScenario();
    if (!scenario) return null;
    const { projectData, costs } = scenario;
    const readOnly = scenario.isReadOnly;

    const handleChange = (field: keyof ProjectData, value: any) => {
        let updates: Partial<ProjectData> = { [field]: value };
        let updatedCosts = [...costs];

        if (field === 'totalArea' || field === 'efficiencyRatio') {
            const totalArea = field === 'totalArea' ? Number(value) : projectData.totalArea;
            const efficiency = field === 'efficiencyRatio' ? Number(value) : projectData.efficiencyRatio;
            const totalPrivateArea = totalArea * efficiency;
            updates = {
                ...updates,
                totalPrivateArea,
                sellablePrivateArea: totalPrivateArea
            };
        }

        if (field === 'acquisitionType' || field === 'landCashValue' || field === 'physicalBarterPercentage') {
            const type = field === 'acquisitionType' ? value : projectData.acquisitionType;
            const cashValue = field === 'landCashValue' ? Number(value) : projectData.landCashValue;
            const barterPct = field === 'physicalBarterPercentage' ? Number(value) : projectData.physicalBarterPercentage;

            updatedCosts = updatedCosts.map(c => {
                if (c.name.toLowerCase().includes('terreno')) {
                    if (type === 'CASH') {
                        return { ...c, totalValue: cashValue, vgvPercentage: 0 };
                    } else {
                        return { ...c, vgvPercentage: barterPct, totalValue: 0 };
                    }
                }
                return c;
            });
        }

        updateScenario(scenario.id, {
            projectData: { ...projectData, ...updates },
            costs: updatedCosts
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 relative">
                {readOnly && (
                    <div className="absolute top-4 right-4 text-amber-600 flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                        <Lock size={12} /> Leitura
                    </div>
                )}
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Building2 className="text-indigo-600" /> Dados do Empreendimento
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Nome do Projeto</span>
                        <input
                            type="text"
                            disabled={readOnly}
                            value={projectData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Total de Unidades</span>
                        <input
                            type="number"
                            disabled={readOnly}
                            value={projectData.totalUnits}
                            onChange={(e) => handleChange('totalUnits', Number(e.target.value))}
                            className={`mt-1 block w-full rounded-md border-slate-300 border p-2 font-bold focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                        />
                    </label>
                </div>

                <div className="border-t border-slate-100 pt-6 mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Aquisição do Terreno</h3>
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <label className="block">
                                <span className="text-sm font-medium text-slate-700">Formato de Aquisição</span>
                                <select
                                    disabled={readOnly}
                                    value={projectData.acquisitionType || 'CASH'}
                                    onChange={(e) => handleChange('acquisitionType', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 border p-2 bg-white text-slate-900"
                                >
                                    <option value="CASH">Compra (Dinheiro)</option>
                                    <option value="BARTER">Permuta Física</option>
                                </select>
                            </label>

                            {projectData.acquisitionType === 'CASH' ? (
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">Valor da Compra (R$)</span>
                                    <input
                                        type="number"
                                        disabled={readOnly}
                                        value={projectData.landCashValue}
                                        onChange={(e) => handleChange('landCashValue', Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-slate-300 border p-2 font-bold text-slate-900 bg-white"
                                    />
                                </label>
                            ) : (
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">Percentual de Permuta (%)</span>
                                    <input
                                        type="number"
                                        disabled={readOnly}
                                        value={projectData.physicalBarterPercentage}
                                        onChange={(e) => handleChange('physicalBarterPercentage', Number(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-slate-300 border p-2 font-bold text-slate-900 bg-white"
                                    />
                                </label>
                            )}

                            <div className="text-xs text-slate-500 pb-2">
                                {projectData.acquisitionType === 'CASH'
                                    ? "O custo 'Terreno' será atualizado com este valor fixo. Estoque Vendável = Total."
                                    : "O custo 'Terreno' será vinculado a este % do VGV. Estoque Vendável reduzido."}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-6 mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Quadro de Áreas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Área do Terreno (m²)</span>
                            <input
                                type="number"
                                disabled={readOnly}
                                value={projectData.totalArea}
                                onChange={(e) => handleChange('totalArea', Number(e.target.value))}
                                className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Índice de Aproveitamento</span>
                            <input
                                type="number"
                                disabled={readOnly}
                                step="0.1"
                                value={projectData.efficiencyRatio}
                                onChange={(e) => handleChange('efficiencyRatio', Number(e.target.value))}
                                className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                            />
                        </label>
                        <label className="block bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase">Área Privativa Total (m²)</span>
                            <input
                                type="number"
                                disabled={true}
                                value={projectData.totalPrivateArea}
                                className="mt-1 block w-full rounded-md border-slate-200 bg-slate-100 p-2 text-slate-500 cursor-not-allowed"
                            />
                            <span className="text-[10px] text-slate-400">Terreno × Índice</span>
                        </label>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Prazos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Duração da Obra (Meses)</span>
                            <input
                                type="number"
                                disabled={readOnly}
                                value={projectData.constructionDurationMonths}
                                onChange={(e) => handleChange('constructionDurationMonths', Number(e.target.value))}
                                className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">Duração de Vendas (Meses)</span>
                            <input
                                type="number"
                                disabled={readOnly}
                                value={projectData.salesDurationMonths}
                                onChange={(e) => handleChange('salesDurationMonths', Number(e.target.value))}
                                className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDataView;
