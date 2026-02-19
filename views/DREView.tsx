import React from 'react';
import { useProject } from '../services/projectContext';
import { FileText } from 'lucide-react';

const DREView = () => {
    const { getActiveScenario } = useProject();
    const scenario = getActiveScenario();
    if (!scenario || !scenario.results) return null;
    const { timeline } = scenario.results;

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileText className="text-indigo-600" /> DRE Mensal Projetada (Regime de Caixa)
                </h3>

                <div className="overflow-x-auto border rounded-lg max-h-[600px] text-slate-900">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50 w-48">Rubrica</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-800 uppercase bg-slate-100 min-w-[120px]">TOTAL</th>
                                {timeline.map(t => (
                                    <th key={t.month} className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase min-w-[120px]">
                                        Mês {t.month}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                            <tr className="bg-slate-50/50">
                                <td className="px-4 py-2 font-bold text-slate-700 sticky left-0 bg-slate-50">Receita Bruta</td>
                                <td className="px-4 py-2 text-right font-bold text-slate-900 bg-slate-100">
                                    {formatMoney(timeline.reduce((acc, t) => acc + t.grossRevenue, 0))}
                                </td>
                                {timeline.map(t => (
                                    <td key={t.month} className="px-4 py-2 text-right text-slate-600">{formatMoney(t.grossRevenue)}</td>
                                ))}
                            </tr>

                            <tr className="text-red-500">
                                <td className="px-4 py-2 pl-8 sticky left-0 bg-white">(-) Impostos e Taxas</td>
                                <td className="px-4 py-2 text-right font-medium bg-slate-50">
                                    {formatMoney(timeline.reduce((acc, t) => acc + t.taxesAndFees, 0))}
                                </td>
                                {timeline.map(t => (
                                    <td key={t.month} className="px-4 py-2 text-right">{formatMoney(t.taxesAndFees)}</td>
                                ))}
                            </tr>

                            <tr className="bg-emerald-50 font-semibold">
                                <td className="px-4 py-2 text-emerald-800 sticky left-0 bg-emerald-50">(=) Receita Líquida</td>
                                <td className="px-4 py-2 text-right text-emerald-800 bg-emerald-100/50 border-l border-r border-emerald-100">
                                    {formatMoney(timeline.reduce((acc, t) => acc + t.revenue, 0))}
                                </td>
                                {timeline.map(t => (
                                    <td key={t.month} className="px-4 py-2 text-right text-emerald-700">{formatMoney(t.revenue)}</td>
                                ))}
                            </tr>

                            <tr className="text-slate-500">
                                <td className="px-4 py-2 pl-8 sticky left-0 bg-white">(-) Custos de Obra</td>
                                <td className="px-4 py-2 text-right font-medium bg-slate-50">
                                    {formatMoney(timeline.reduce((acc, t) => acc + t.constructionCost, 0))}
                                </td>
                                {timeline.map(t => (
                                    <td key={t.month} className="px-4 py-2 text-right">{formatMoney(t.constructionCost)}</td>
                                ))}
                            </tr>
                            <tr className="text-slate-500">
                                <td className="px-4 py-2 pl-8 sticky left-0 bg-white">(-) Outros Custos</td>
                                <td className="px-4 py-2 text-right font-medium bg-slate-50">
                                    {formatMoney(timeline.reduce((acc, t) => acc + t.otherCosts, 0))}
                                </td>
                                {timeline.map(t => (
                                    <td key={t.month} className="px-4 py-2 text-right">{formatMoney(t.otherCosts)}</td>
                                ))}
                            </tr>

                            <tr className="bg-slate-100 font-bold">
                                <td className="px-4 py-2 text-slate-800 sticky left-0 bg-slate-100">(=) Resultado Operacional</td>
                                <td className="px-4 py-2 text-right text-slate-900 bg-slate-200 border-l border-r border-slate-300">
                                    {formatMoney(timeline.reduce((acc, t) => acc + t.operationalCashFlow, 0))}
                                </td>
                                {timeline.map(t => (
                                    <td key={t.month} className="px-4 py-2 text-right text-slate-800">{formatMoney(t.operationalCashFlow)}</td>
                                ))}
                            </tr>

                            <tr className="text-red-500">
                                <td className="px-4 py-2 pl-8 sticky left-0 bg-white">(-) Custo Financeiro</td>
                                <td className="px-4 py-2 text-right font-medium bg-slate-50">
                                    {formatMoney(timeline.reduce((acc, t) => acc + t.financialCost, 0))}
                                </td>
                                {timeline.map(t => (
                                    <td key={t.month} className="px-4 py-2 text-right">{formatMoney(t.financialCost)}</td>
                                ))}
                            </tr>

                            <tr className="bg-indigo-50 font-bold text-indigo-900">
                                <td className="px-4 py-2 sticky left-0 bg-indigo-50 border-t border-indigo-200">(=) Resultado Líquido</td>
                                <td className="px-4 py-2 text-right bg-indigo-100 border-l border-r border-indigo-200 border-t">
                                    {formatMoney(timeline.reduce((acc, t) => acc + t.netCashFlow, 0))}
                                </td>
                                {timeline.map(t => (
                                    <td key={t.month} className="px-4 py-2 text-right border-t border-indigo-100">{formatMoney(t.netCashFlow)}</td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DREView;
