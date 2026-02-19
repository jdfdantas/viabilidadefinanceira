import React from 'react';
import { useProject } from '../services/projectContext';
import { Percent, Lock } from 'lucide-react';

const EconomicIndicesView = () => {
    const { getActiveScenario, updateScenario } = useProject();
    const scenario = getActiveScenario();
    if (!scenario) return null;
    const { indices } = scenario;
    const readOnly = scenario.isReadOnly;

    const handleChange = (field: keyof typeof indices, value: number) => {
        updateScenario(scenario.id, {
            indices: { ...indices, [field]: value }
        });
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 relative">
            {readOnly && (
                <div className="absolute top-4 right-4 text-amber-600 flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                    <Lock size={12} /> Leitura
                </div>
            )}
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Percent className="text-indigo-600" /> Indicadores Econômicos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <label className="block">
                    <span className="text-sm font-medium text-slate-700">INCC (% a.a.)</span>
                    <input
                        type="number"
                        step="0.1"
                        disabled={readOnly}
                        value={indices.incc}
                        onChange={(e) => handleChange('incc', Number(e.target.value))}
                        className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                    />
                    <span className="text-xs text-slate-500">Inflação de Obra</span>
                </label>
                <label className="block">
                    <span className="text-sm font-medium text-slate-700">IPCA (% a.a.)</span>
                    <input
                        type="number"
                        step="0.1"
                        disabled={readOnly}
                        value={indices.ipca}
                        onChange={(e) => handleChange('ipca', Number(e.target.value))}
                        className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                    />
                    <span className="text-xs text-slate-500">Inflação Geral</span>
                </label>
                <label className="block">
                    <span className="text-sm font-medium text-slate-700">CDI (% a.a.)</span>
                    <input
                        type="number"
                        step="0.1"
                        disabled={readOnly}
                        value={indices.cdi}
                        onChange={(e) => handleChange('cdi', Number(e.target.value))}
                        className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                    />
                    <span className="text-xs text-slate-500">Custo de Oportunidade</span>
                </label>
                <label className="block">
                    <span className="text-sm font-medium text-slate-700">Taxa de Desconto (TMA % a.a.)</span>
                    <input
                        type="number"
                        step="0.1"
                        disabled={readOnly}
                        value={indices.discountRate}
                        onChange={(e) => handleChange('discountRate', Number(e.target.value))}
                        className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                    />
                    <span className="text-xs text-slate-500">Para cálculo de VPL</span>
                </label>
            </div>
        </div>
    );
};

export default EconomicIndicesView;
