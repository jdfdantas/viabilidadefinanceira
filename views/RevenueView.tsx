import React from 'react';
import { useProject } from '../services/projectContext';
import { Wallet, CalendarClock, TrendingUp, TrendingDown, Clock, Zap, ArrowDownRight, Building2, Lock, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { ProjectData } from '../types';

const RevenueView = () => {
    const { getActiveScenario, updateScenario } = useProject();
    const scenario = getActiveScenario();
    if (!scenario) return null;
    const { salesPremises, projectData } = scenario;
    const readOnly = scenario.isReadOnly;

    let sellableUnits = projectData.totalUnits;
    if (projectData.acquisitionType === 'BARTER') {
        sellableUnits = Math.floor(projectData.totalUnits * (1 - (projectData.physicalBarterPercentage || 0) / 100));
    }

    const grossPrice = salesPremises.pricePerSqm;
    const totalDeductionsPct = salesPremises.brokerageFee + salesPremises.taxes;
    const baseNetPrice = grossPrice * (1 - totalDeductionsPct / 100);
    const invPct = (salesPremises.investorPercentage || 0) / 100;
    const invDisc = (salesPremises.investorDiscount || 0) / 100;
    const finalNetPrice = (baseNetPrice * (1 - invPct)) + (baseNetPrice * (1 - invDisc) * invPct);
    const avgUnitSize = sellableUnits > 0 ? (projectData.sellablePrivateArea / sellableUnits) : 0;
    const grossTicket = avgUnitSize * grossPrice;
    const netTicket = avgUnitSize * finalNetPrice;

    const handlePremiseChange = (field: keyof typeof salesPremises, value: any) => {
        updateScenario(scenario.id, {
            salesPremises: { ...salesPremises, [field]: value }
        });
    };

    const handleProjectDataChange = (field: keyof ProjectData, value: any) => {
        updateScenario(scenario.id, {
            projectData: { ...projectData, [field]: value }
        });
    };

    const handleMonthlySalesChange = (monthIndex: number, units: number) => {
        const newSchedule = [...(salesPremises.monthlySales || [])];
        while (newSchedule.length <= monthIndex) newSchedule.push(0);
        newSchedule[monthIndex] = units;
        handlePremiseChange('monthlySales', newSchedule);
    };

    const generateSalesScenario = (type: 'OPTIMISTIC' | 'CONSERVATIVE' | 'PESSIMISTIC') => {
        let duration = projectData.salesDurationMonths;
        let newSales: number[] = [];

        if (type === 'CONSERVATIVE') {
            const monthly = sellableUnits / duration;
            newSales = Array(duration).fill(monthly);
        }
        else if (type === 'OPTIMISTIC') {
            duration = Math.max(1, Math.floor(projectData.salesDurationMonths * 0.8));
            const launchPct = 0.15;
            const unitsLaunch = sellableUnits * launchPct;
            const unitsRemaining = sellableUnits - unitsLaunch;
            const monthlyRemaining = unitsRemaining / Math.max(1, duration - 1);
            newSales = [unitsLaunch, ...Array(duration - 1).fill(monthlyRemaining)];
        }
        else if (type === 'PESSIMISTIC') {
            duration = Math.floor(projectData.salesDurationMonths * 1.2);
            const monthly = sellableUnits / duration;
            newSales = Array(duration).fill(monthly);
        }
        handlePremiseChange('monthlySales', newSales);
    };

    const totalDistributed = (salesPremises.monthlySales || []).reduce((a, b) => a + b, 0);
    const distributionDiff = totalDistributed - sellableUnits;

    const keysMonthCalculated = projectData.constructionDurationMonths + 3;
    const exampleSaleMonth = 1;
    const simulationData = [];

    if (keysMonthCalculated > exampleSaleMonth) {
        const monthlyStart = exampleSaleMonth + 1;
        const monthlyEnd = keysMonthCalculated;
        const numMonths = monthlyEnd - monthlyStart + 1;

        for (let m = exampleSaleMonth; m <= keysMonthCalculated; m++) {
            let pct = 0;
            let type = '';
            if (m === exampleSaleMonth) {
                pct += salesPremises.downPayment;
                type = 'Entrada';
            }
            if (m >= monthlyStart && m <= monthlyEnd) {
                pct += salesPremises.monthlyInstallments / numMonths;
                type = type ? type + ' + Mensal' : 'Mensal';
            }
            if (m === keysMonthCalculated) {
                pct += salesPremises.keys;
                type = type ? type + ' + Chaves' : 'Chaves';
            }

            if (pct > 0) {
                simulationData.push({ month: m, pct: pct, type });
            }
        }
    }

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 relative">
                {readOnly && (
                    <div className="absolute top-4 right-4 text-amber-600 flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                        <Lock size={12} /> Leitura
                    </div>
                )}
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Wallet className="text-indigo-600" /> Premissas de Estoque e Venda
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 border-b border-slate-100 pb-8 text-slate-900">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">Estoque Vendável</span>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{sellableUnits} un.</p>
                        <span className="text-[10px] text-slate-400">
                            {projectData.acquisitionType === 'BARTER'
                                ? `Total (${projectData.totalUnits}) - Permuta (${projectData.physicalBarterPercentage}%)`
                                : `Igual ao Total (Compra em Dinheiro)`}
                        </span>
                    </div>
                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Duração Vendas (Meses)</span>
                        <input
                            type="number"
                            disabled={readOnly}
                            value={projectData.salesDurationMonths}
                            onChange={(e) => handleProjectDataChange('salesDurationMonths', Number(e.target.value))}
                            className={`mt-1 block w-full rounded-md border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-slate-100 pb-8">
                    <div className="bg-white p-4 rounded border border-slate-200 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Ticket Médio (Bruto)</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{formatBRL(grossTicket)}</p>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                                <Building2 size={20} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">VGV Bruto = {sellableUnits} un × {formatBRL(grossTicket)}</p>
                    </div>

                    <div className="bg-white p-4 rounded border border-emerald-200 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase">Ticket Médio Líquido (Efetivo)</p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatBRL(netTicket)}</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-full text-emerald-500">
                                <Wallet size={20} />
                            </div>
                        </div>
                        <p className="text-xs text-emerald-600/70">Receita Líq. = {sellableUnits} un × {formatBRL(netTicket)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 text-slate-900">
                    <div className="md:col-span-7 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <label className="block col-span-2">
                                <span className="text-sm text-slate-600 font-semibold">Preço Médio de Venda (R$/m²)</span>
                                <input
                                    type="number"
                                    disabled={readOnly}
                                    value={salesPremises.pricePerSqm}
                                    onChange={(e) => handlePremiseChange('pricePerSqm', Number(e.target.value))}
                                    className={`mt-1 block w-full rounded border-slate-300 border p-2 text-lg font-bold disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm text-slate-600">Comissão (%)</span>
                                <input
                                    type="number"
                                    disabled={readOnly}
                                    value={salesPremises.brokerageFee}
                                    onChange={(e) => handlePremiseChange('brokerageFee', Number(e.target.value))}
                                    className={`mt-1 block w-full rounded border-slate-300 border p-2 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm text-slate-600">Impostos (%)</span>
                                <input
                                    type="number"
                                    disabled={readOnly}
                                    value={salesPremises.taxes}
                                    onChange={(e) => handlePremiseChange('taxes', Number(e.target.value))}
                                    className={`mt-1 block w-full rounded border-slate-300 border p-2 disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                                />
                            </label>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                            <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2"><Users size={14} /> Estratégia de Investidores</h4>
                            <div className="grid grid-cols-2 gap-4 text-slate-900">
                                <label className="block">
                                    <span className="text-xs text-amber-900 font-medium">% Vendido a Investidores</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={readOnly}
                                        value={salesPremises.investorPercentage}
                                        onChange={(e) => handlePremiseChange('investorPercentage', Number(e.target.value))}
                                        className={`mt-1 block w-full rounded border-amber-200 border p-2 text-sm disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs text-amber-900 font-medium">Desconto Investidor (%)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={readOnly}
                                        value={salesPremises.investorDiscount}
                                        onChange={(e) => handlePremiseChange('investorDiscount', Number(e.target.value))}
                                        className={`mt-1 block w-full rounded border-amber-200 border p-2 text-sm disabled:opacity-50 text-slate-900 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-5 text-slate-900">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 h-full flex flex-col justify-center">
                            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b pb-2">Formação de Preço Líquido</h4>

                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">Preço Médio Bruto</span>
                                <span className="font-semibold text-slate-900">{formatBRL(grossPrice)}</span>
                            </div>

                            <div className="flex justify-between items-center mb-2 text-xs text-red-500">
                                <span className="pl-4 flex items-center gap-1"><ArrowDownRight size={10} /> Deduções ({totalDeductionsPct}%)</span>
                                <span>- {formatBRL(grossPrice * (totalDeductionsPct / 100))}</span>
                            </div>

                            <div className="flex justify-between items-center mb-4 pt-2 border-t border-slate-200 border-dashed">
                                <span className="text-sm font-medium text-slate-700">Preço Líquido (Base)</span>
                                <span className="font-bold text-slate-800">{formatBRL(baseNetPrice)}</span>
                            </div>

                            {salesPremises.investorPercentage > 0 && (
                                <div className="bg-amber-100/50 p-2 rounded mb-4 text-xs">
                                    <div className="flex justify-between text-amber-800 mb-1">
                                        <span>Mix Investidor ({salesPremises.investorPercentage}%)</span>
                                        <span>Desc. {salesPremises.investorDiscount}%</span>
                                    </div>
                                    <div className="flex justify-between text-amber-700 font-medium">
                                        <span>Impacto no Preço</span>
                                        <span>- {formatBRL(baseNetPrice - finalNetPrice)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto bg-white border border-emerald-200 p-3 rounded shadow-sm">
                                <span className="block text-xs font-bold text-emerald-600 uppercase">Preço Líquido Final (Efetivo)</span>
                                <span className="block text-2xl font-bold text-emerald-700 mt-1">{formatBRL(finalNetPrice)}</span>
                                <span className="text-[10px] text-slate-400">Base para cálculo de receita</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-6 text-slate-900">
                    <h3 className="font-semibold text-slate-700">Fluxo de Recebimento</h3>
                    <div className="bg-indigo-50 p-4 rounded-md space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span>Entrada (Ato)</span>
                            <input
                                type="number" className={`w-20 p-1 text-right border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                                disabled={readOnly}
                                value={salesPremises.downPayment}
                                onChange={(e) => handlePremiseChange('downPayment', Number(e.target.value))}
                            />
                            <span className="ml-1">%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span>Mensais (Até Chaves)</span>
                            <input
                                type="number" className={`w-20 p-1 text-right border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                                disabled={readOnly}
                                value={salesPremises.monthlyInstallments}
                                onChange={(e) => handlePremiseChange('monthlyInstallments', Number(e.target.value))}
                            />
                            <span className="ml-1">%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span>Chaves/Repasse</span>
                            <input
                                type="number" className={`w-20 p-1 text-right border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${readOnly ? 'bg-slate-100' : 'bg-white'}`}
                                disabled={readOnly}
                                value={salesPremises.keys}
                                onChange={(e) => handlePremiseChange('keys', Number(e.target.value))}
                            />
                            <span className="ml-1">%</span>
                        </div>
                        <div className="border-t border-indigo-200 pt-2 mt-2 flex justify-between font-bold text-sm">
                            <span className="text-slate-700">Total</span>
                            <span className={salesPremises.downPayment + salesPremises.monthlyInstallments + salesPremises.keys !== 100 ? "text-red-500" : "text-green-600"}>
                                {salesPremises.downPayment + salesPremises.monthlyInstallments + salesPremises.keys}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <CalendarClock className="text-indigo-600" /> Curva Padrão de Recebimento (Venda no Mês 1)
                    </h3>
                    <div className="h-48 w-full bg-slate-50 rounded border border-slate-200 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={simulationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" label={{ value: 'Mês', position: 'insideBottom', offset: -5 }} />
                                <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(val: number) => val.toFixed(2) + '%'} />
                                <Bar dataKey="pct" fill="#6366f1" name="% Recebido" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200 text-slate-900">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-indigo-600" /> Velocidade de Vendas
                        </h3>

                        {!readOnly && (
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                <span className="text-xs font-bold text-slate-400 px-2 uppercase">Gerar Cenário:</span>
                                <button
                                    onClick={() => generateSalesScenario('PESSIMISTIC')}
                                    className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                                    title="Vendas 20% mais lentas (Linear)"
                                >
                                    <TrendingDown size={14} /> Pessimista
                                </button>
                                <button
                                    onClick={() => generateSalesScenario('CONSERVATIVE')}
                                    className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors flex items-center gap-1"
                                    title="Vendas Lineares (Base)"
                                >
                                    <Clock size={14} /> Base
                                </button>
                                <button
                                    onClick={() => generateSalesScenario('OPTIMISTIC')}
                                    className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors flex items-center gap-1"
                                    title="Vendas 20% mais rápidas + Pico de Lançamento"
                                >
                                    <Zap size={14} /> Otimista
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mb-4 flex justify-end">
                        <div className={`text-sm font-medium ${Math.abs(distributionDiff) > 0.1 ? 'text-red-600' : 'text-emerald-600'}`}>
                            Total Distribuído: {totalDistributed.toFixed(1)} / {sellableUnits} (Estoque)
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg max-h-96">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mês</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase w-48">Unidades Vendidas</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">VGV Líquido (R$)*</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {Array.from({ length: Math.max(projectData.salesDurationMonths, (salesPremises.monthlySales || []).length) }).map((_, idx) => {
                                    const units = (salesPremises.monthlySales && salesPremises.monthlySales[idx]) || 0;
                                    const vgv = units * netTicket;

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 text-sm font-medium text-slate-700">Mês {idx}</td>
                                            <td className="px-4 py-2 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    disabled={readOnly}
                                                    value={units}
                                                    onChange={(e) => handleMonthlySalesChange(idx, Number(e.target.value))}
                                                    className={`w-full text-right border-slate-300 rounded p-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${readOnly ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-900 font-medium'}`}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right text-sm text-slate-600 font-medium">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(vgv)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-100 sticky bottom-0">
                                <tr>
                                    <td className="px-4 py-2 text-sm font-bold text-slate-800">Total</td>
                                    <td className={`px-4 py-2 text-right text-sm font-bold ${Math.abs(distributionDiff) > 0.1 ? 'text-red-600' : 'text-slate-800'}`}>
                                        {totalDistributed.toFixed(1)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm font-bold text-indigo-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalDistributed * netTicket)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueView;
