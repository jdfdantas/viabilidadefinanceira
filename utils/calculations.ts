import { 
  Scenario, 
  MonthlyFlow, 
  SimulationResults, 
  DistributionType,
  ValidationResult,
  ValidationIssue,
  QualityGateStatus,
  Project,
  PortfolioMetrics
} from '../types';

// --- Helpers ---

const annualToMonthlyRate = (annualRate: number): number => {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
};

// --- Financial Math ---

export const calculateNPV = (rate: number, cashFlows: number[]): number => {
  return cashFlows.reduce((acc, val, t) => {
    return acc + val / Math.pow(1 + rate, t);
  }, 0);
};

export const calculateIRR = (cashFlows: number[], guess = 0.1): number => {
  const maxIter = 1000;
  const precision = 1e-7;
  let rate = guess;

  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let derivativeNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const discountFactor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / discountFactor;
      derivativeNpv -= (t * cashFlows[t]) / (discountFactor * (1 + rate));
    }

    if (Math.abs(npv) < precision) {
      return rate * 100; // Return as percentage
    }

    if (derivativeNpv === 0) return 0;
    rate -= npv / derivativeNpv;
  }

  return 0; // Failed to converge
};

// --- Distribution Curves ---

const getDistributionCurve = (
  type: DistributionType, 
  months: number, 
  manualDist?: number[]
): number[] => {
  if (months <= 0) return [];
  if (type === DistributionType.MANUAL && manualDist && manualDist.length === months) {
    return manualDist.map(v => v / 100);
  }

  const curve: number[] = [];
  
  if (type === DistributionType.LINEAR) {
    const val = 1 / months;
    for (let i = 0; i < months; i++) curve.push(val);
  } else if (type === DistributionType.S_CURVE) {
    // Basic Normal Distribution approximation for S-Curve
    let total = 0;
    for (let i = 0; i < months; i++) {
      const x = (i / (months - 1 || 1)) * 6 - 3; // range -3 to 3 sigma
      const y = 1 / (1 + Math.exp(-x)); // Sigmoid
      curve.push(y);
      total += y;
    }
    // Normalize
    for (let i = 0; i < months; i++) curve[i] /= total;
  } else if (type === DistributionType.HEAD_LOADED) {
     let total = 0;
     for (let i = 0; i < months; i++) {
        const val = Math.max(0, 1 - (i / months));
        curve.push(val);
        total += val;
     }
     for(let i=0; i<months; i++) curve[i] /= total;
  } else if (type === DistributionType.TAIL_LOADED) {
     let total = 0;
     for (let i = 0; i < months; i++) {
        const val = (i+1) / months;
        curve.push(val);
        total += val;
     }
     for(let i=0; i<months; i++) curve[i] /= total;
  } else {
    // Default fallback linear
    const val = 1 / months;
    for (let i = 0; i < months; i++) curve.push(val);
  }

  return curve;
};

// --- Quality Gate / Validation ---

export const validateScenario = (scenario: Scenario): ValidationResult => {
  const issues: ValidationIssue[] = [];
  
  // 1. Check Project Data
  if (!scenario.projectData.name) issues.push({ type: 'BLOCKER', message: 'Nome do projeto é obrigatório.' });
  if (scenario.projectData.totalUnits <= 0) issues.push({ type: 'BLOCKER', message: 'Total de unidades deve ser maior que zero.' });
  if (scenario.projectData.totalArea <= 0) issues.push({ type: 'BLOCKER', message: 'Área total deve ser maior que zero.' });
  if (scenario.projectData.constructionDurationMonths <= 0) issues.push({ type: 'BLOCKER', message: 'Duração da obra inválida.' });

  // 2. Check Sales Premises
  if (scenario.salesPremises.pricePerSqm <= 0) issues.push({ type: 'BLOCKER', message: 'Preço por m² deve ser maior que zero.' });
  
  const paymentSum = scenario.salesPremises.downPayment + scenario.salesPremises.monthlyInstallments + scenario.salesPremises.keys;
  if (Math.abs(paymentSum - 100) > 0.1) {
    issues.push({ type: 'BLOCKER', message: `Fluxo de recebimento soma ${paymentSum}%, deve ser 100%.` });
  }

  // Check Sales Distribution Sum against SELLABLE UNITS (Stock)
  let sellableUnits = scenario.projectData.totalUnits;
  if (scenario.projectData.acquisitionType === 'BARTER') {
     sellableUnits = Math.floor(scenario.projectData.totalUnits * (1 - (scenario.projectData.physicalBarterPercentage || 0) / 100));
  }

  if (scenario.salesPremises.monthlySales && scenario.salesPremises.monthlySales.length > 0) {
    const totalSales = scenario.salesPremises.monthlySales.reduce((a, b) => a + b, 0);
    // Tolerance for floating point
    if (Math.abs(totalSales - sellableUnits) > 0.1) {
       issues.push({ type: 'ALERTA', message: `Distribuição de vendas soma ${totalSales.toFixed(1)} unidades, mas estoque vendável é ${sellableUnits}.` });
    }
  }

  // 3. Check Costs
  if (scenario.costs.length === 0) issues.push({ type: 'ALERTA', message: 'Nenhum custo cadastrado.' });
  
  const totalCost = scenario.costs.reduce((sum, c) => sum + c.totalValue, 0);
  if (totalCost <= 0 && scenario.costs.length > 0) issues.push({ type: 'BLOCKER', message: 'Custo total do projeto é zero.' });

  // 4. Financial Sanity
  if (scenario.indices.discountRate <= 0) issues.push({ type: 'BLOCKER', message: 'Taxa de desconto (TMA) inválida.' });

  let status: QualityGateStatus = 'OK';
  if (issues.some(i => i.type === 'BLOCKER')) status = 'BLOCKER';
  else if (issues.some(i => i.type === 'ALERTA')) status = 'ALERTA';

  return {
    status,
    issues,
    timestamp: Date.now()
  };
};

// --- Portfolio Consolidation ---

export const consolidatePortfolio = (projects: Project[]): PortfolioMetrics => {
  let totalVGV = 0;
  let totalNetResult = 0;
  let totalNPV = 0;
  let totalExposure = 0;
  let totalEquityInvested = 0; 
  let weightedIRRSum = 0;
  let moicSum = 0;
  let activeProjectsCount = 0;
  
  const maxMonths = 120; // Cap at 10 years for consolidation view
  const consolidatedTimeline: MonthlyFlow[] = Array(maxMonths).fill(null).map((_, i) => ({
    month: i,
    grossRevenue: 0,
    taxesAndFees: 0,
    revenue: 0,
    constructionCost: 0,
    otherCosts: 0,
    costBreakdown: {},
    totalCost: 0,
    operationalCashFlow: 0,
    financialCost: 0,
    netCashFlow: 0,
    accumulatedCashFlow: 0,
    exposure: 0,
    unitsSold: 0,
    accumulatedUnitsSold: 0,
    stock: 0
  }));

  projects.forEach(proj => {
    const activeScenario = proj.scenarios.find(s => s.id === proj.activeScenarioId);
    if (!activeScenario || !activeScenario.results) return;

    const res = activeScenario.results;
    activeProjectsCount++;

    totalVGV += res.indicators.grossVGV;
    totalNetResult += res.indicators.netResult;
    totalNPV += res.indicators.npv;
    totalExposure += res.indicators.exposurePeak; 
    
    const weight = Math.abs(res.indicators.exposurePeak) || res.indicators.totalCost;
    totalEquityInvested += weight;
    weightedIRRSum += res.indicators.irr * weight;
    moicSum += res.indicators.moic;

    // Timeline Aggregation
    res.timeline.forEach((monthData, idx) => {
      if (idx < maxMonths) {
        consolidatedTimeline[idx].revenue += monthData.revenue;
        consolidatedTimeline[idx].constructionCost += monthData.constructionCost;
        consolidatedTimeline[idx].otherCosts += monthData.otherCosts;
        consolidatedTimeline[idx].totalCost += monthData.totalCost;
        consolidatedTimeline[idx].operationalCashFlow += monthData.operationalCashFlow;
        consolidatedTimeline[idx].financialCost += monthData.financialCost;
        consolidatedTimeline[idx].netCashFlow += monthData.netCashFlow;
        
        // Summing accumulated flows for portfolio position
        consolidatedTimeline[idx].accumulatedCashFlow += monthData.accumulatedCashFlow;
        
        if (consolidatedTimeline[idx].accumulatedCashFlow < 0) {
            consolidatedTimeline[idx].exposure = consolidatedTimeline[idx].accumulatedCashFlow;
        } else {
            consolidatedTimeline[idx].exposure = 0;
        }
      }
    });
  });

  return {
    totalProjects: activeProjectsCount,
    totalVGV,
    totalNetResult,
    totalNPV,
    totalExposure, 
    weightedIRR: totalEquityInvested > 0 ? weightedIRRSum / totalEquityInvested : 0,
    avgMOIC: activeProjectsCount > 0 ? moicSum / activeProjectsCount : 0,
    consolidatedTimeline
  };
};

// --- Main Engine ---

export const runSimulation = (scenario: Scenario): SimulationResults => {
  const { projectData, salesPremises, costs: rawCosts, indices } = scenario;
  
  // 1. Calculate Areas & Units
  
  // Stock (Sellable Units) depends on Acquisition Type
  let sellableUnits = projectData.totalUnits;
  if (projectData.acquisitionType === 'BARTER') {
      sellableUnits = Math.floor(projectData.totalUnits * (1 - (projectData.physicalBarterPercentage || 0) / 100));
  }
  
  const sellableArea = projectData.sellablePrivateArea > 0 ? projectData.sellablePrivateArea : projectData.totalArea;
  const avgUnitSize = sellableUnits > 0 ? sellableArea / sellableUnits : 0;

  // 2. VGV Calculations
  const grossTicket = avgUnitSize * salesPremises.pricePerSqm;
  const grossVGV = sellableUnits * grossTicket;

  // Net Price Base (Revenue per unit after deductions but before Investor Mix)
  const deductionsPct = (salesPremises.brokerageFee + salesPremises.taxes + salesPremises.barter) / 100;
  const baseNetTicket = grossTicket * (1 - deductionsPct);

  // Investor Logic
  const invPct = (salesPremises.investorPercentage || 0) / 100;
  const invDisc = (salesPremises.investorDiscount || 0) / 100;

  // Effective Net Ticket (Weighted Avg)
  // Part sold to market: (1 - invPct) * BaseNet
  // Part sold to investors: invPct * BaseNet * (1 - discount)
  const unitNetTicket = (baseNetTicket * (1 - invPct)) + (baseNetTicket * (1 - invDisc) * invPct);

  // Indicators PRE-CALCULATION
  // VGV Líquido (Receita Total Projetada) = Estoque Vendável * Ticket Médio Líquido Efetivo
  const netVGV = sellableUnits * unitNetTicket;

  // 3. Process Costs - Apply % of Gross VGV Logic
  const costs = rawCosts.map(c => {
    if (c.vgvPercentage !== undefined && c.vgvPercentage !== null && c.vgvPercentage > 0) {
      return { ...c, totalValue: grossVGV * (c.vgvPercentage / 100) };
    }
    return c;
  });

  // Rule: Keys are 3 months after construction end
  const keysMonthCalculated = projectData.constructionDurationMonths + 3;

  const totalDuration = Math.max(
    keysMonthCalculated + 12, // Buffer beyond keys
    projectData.salesDurationMonths,
    costs.reduce((max, c) => Math.max(max, c.startMonth + c.durationMonths), 0)
  );

  const timeline: MonthlyFlow[] = [];
  let accumulatedCashFlow = 0;
  let accumulatedUnitsSold = 0;
  const monthlyDiscountRate = annualToMonthlyRate(indices.discountRate);
  // Financial cost model: interest on negative balance
  const monthlyBorrowingRate = annualToMonthlyRate(indices.cdi + 2); // Spread assumption
  const monthlyInflation = annualToMonthlyRate(indices.ipca);

  // Sales Pace Logic
  // Fallback to Linear if monthlySales array is missing or length doesn't match salesDuration
  let useManualSales = false;
  if (salesPremises.monthlySales && salesPremises.monthlySales.length >= projectData.salesDurationMonths) {
    useManualSales = true;
  }
  
  const salesPacePerMonthLinear = sellableUnits / (projectData.salesDurationMonths || 1);

  for (let m = 0; m <= totalDuration; m++) {
    // 1. Calculate Revenue
    let monthlyNetRevenue = 0;
    let monthlyGrossRevenue = 0;
    
    // Iterate through previous months sales to apply payment terms
    for (let saleMonth = 0; saleMonth <= m; saleMonth++) {
      if (saleMonth > projectData.salesDurationMonths) break;
      
      let unitsSoldInMonth = 0;
      
      if (useManualSales && saleMonth < salesPremises.monthlySales.length) {
         unitsSoldInMonth = salesPremises.monthlySales[saleMonth];
      } else {
         // Fallback linear capped at Stock
         unitsSoldInMonth = (saleMonth < projectData.salesDurationMonths) 
          ? Math.min(salesPacePerMonthLinear, sellableUnits - (salesPacePerMonthLinear * saleMonth))
          : 0;
      }

      if (unitsSoldInMonth <= 0) continue;

      // Payment Schedule Logic
      let pctReceivedThisMonth = 0;

      // a. Down Payment (Immediate at saleMonth)
      if (m === saleMonth) {
        pctReceivedThisMonth += (salesPremises.downPayment / 100);
      }
      
      // b. Monthly Installments (From saleMonth+1 until Keys)
      const installmentMonthsStart = saleMonth + 1;
      const installmentMonthsEnd = keysMonthCalculated; 
      const numberOfInstallments = Math.max(1, installmentMonthsEnd - installmentMonthsStart + 1); 
      
      if (m >= installmentMonthsStart && m <= installmentMonthsEnd) {
         pctReceivedThisMonth += (salesPremises.monthlyInstallments / 100) / numberOfInstallments;
      }

      // c. Keys (At Keys Month)
      if (m === keysMonthCalculated) {
        pctReceivedThisMonth += (salesPremises.keys / 100);
      }

      if (pctReceivedThisMonth > 0) {
          monthlyNetRevenue += unitsSoldInMonth * unitNetTicket * pctReceivedThisMonth;
          monthlyGrossRevenue += unitsSoldInMonth * grossTicket * pctReceivedThisMonth;
      }
    }

    const monthlyTaxesAndFees = monthlyGrossRevenue - monthlyNetRevenue;

    // 2. Calculate Costs
    let monthlyConstructionCost = 0;
    let monthlyOtherCost = 0;
    const costBreakdown: { [key: string]: number } = {};

    costs.forEach(cost => {
      if (m >= cost.startMonth && m < cost.startMonth + cost.durationMonths) {
        const curve = getDistributionCurve(cost.distributionType, cost.durationMonths, cost.manualDistribution);
        const monthIndex = m - cost.startMonth;
        const val = cost.totalValue * curve[monthIndex];
        
        costBreakdown[cost.name] = val; // Populate detailed breakdown

        if (cost.name.toLowerCase().includes('obra') || cost.name.toLowerCase().includes('civil') || cost.name.toLowerCase().includes('construction')) {
          monthlyConstructionCost += val;
        } else {
          monthlyOtherCost += val;
        }
      }
    });

    const totalCost = monthlyConstructionCost + monthlyOtherCost;
    const operationalCashFlow = monthlyNetRevenue - totalCost;

    // 3. Financial Costs
    // If previous accumulated balance was negative, apply interest
    const previousBalance = m > 0 ? timeline[m-1].accumulatedCashFlow : 0;
    let financialCost = 0;
    if (previousBalance < 0) {
      financialCost = Math.abs(previousBalance) * monthlyBorrowingRate;
    }

    const netCashFlow = operationalCashFlow - financialCost;
    accumulatedCashFlow += netCashFlow;

    // Units Logic (Current Month)
    let currentMonthSales = 0;
    if (useManualSales && m < salesPremises.monthlySales.length) {
       currentMonthSales = salesPremises.monthlySales[m];
    } else {
       currentMonthSales = (m < projectData.salesDurationMonths) 
         ? Math.min(salesPacePerMonthLinear, sellableUnits - accumulatedUnitsSold)
         : 0;
    }
    
    accumulatedUnitsSold += currentMonthSales;

    timeline.push({
      month: m,
      grossRevenue: monthlyGrossRevenue,
      taxesAndFees: monthlyTaxesAndFees,
      revenue: monthlyNetRevenue,
      constructionCost: monthlyConstructionCost,
      otherCosts: monthlyOtherCost,
      costBreakdown,
      totalCost,
      operationalCashFlow,
      financialCost,
      netCashFlow,
      accumulatedCashFlow,
      exposure: accumulatedCashFlow < 0 ? accumulatedCashFlow : 0,
      unitsSold: currentMonthSales,
      accumulatedUnitsSold,
      stock: Math.max(0, sellableUnits - accumulatedUnitsSold)
    });
  }

  // Calculate Indicators
  const totalProjectCost = timeline.reduce((sum, t) => sum + t.totalCost, 0);
  const netResult = timeline[timeline.length - 1].accumulatedCashFlow;
  
  // NOTE: netVGV is now pre-calculated (Theoretical Total) instead of Sum(CashFlow)
  // to ensure it matches: Sellable Units * Net Ticket.
  
  const margin = netVGV > 0 ? (netResult / netVGV) * 100 : 0;
  
  const cashFlowsForNPV = timeline.map(t => t.netCashFlow);
  const npv = calculateNPV(monthlyDiscountRate, cashFlowsForNPV);
  const irr = calculateIRR(cashFlowsForNPV); // monthly IRR
  const annualIRR = Math.pow(1 + (irr/100), 12) - 1;

  // Real IRR (Approximation: (1+Nominal) / (1+Inflation) - 1)
  const annualInflation = indices.ipca / 100;
  const realIrr = ((1 + annualIRR) / (1 + annualInflation)) - 1;

  // Exposure Peak (Min accumulated cashflow)
  const exposurePeak = Math.min(...timeline.map(t => t.accumulatedCashFlow));

  // MOIC: Total Positive Flows / Total Negative Flows
  const totalInflows = timeline.reduce((sum, t) => sum + (t.netCashFlow > 0 ? t.netCashFlow : 0), 0);
  const totalOutflows = timeline.reduce((sum, t) => sum + (t.netCashFlow < 0 ? Math.abs(t.netCashFlow) : 0), 0);
  const moic = totalOutflows > 0 ? totalInflows / totalOutflows : 0;

  // Payback
  const paybackIndex = timeline.findIndex(t => t.accumulatedCashFlow >= 0 && t.month > 0);

  return {
    timeline,
    indicators: {
      grossVGV,
      netVGV,
      totalCost: totalProjectCost,
      netResult,
      margin,
      exposurePeak,
      npv,
      irr: annualIRR * 100,
      realIrr: realIrr * 100,
      moic,
      paybackMonth: paybackIndex
    }
  };
};