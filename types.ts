// Domain Types

export enum DistributionType {
  LINEAR = 'LINEAR',
  S_CURVE = 'S_CURVE',
  HEAD_LOADED = 'HEAD_LOADED', // Pico Inicial
  TAIL_LOADED = 'TAIL_LOADED', // Pico Final
  MANUAL = 'MANUAL',
}

export type QualityGateStatus = 'BLOCKER' | 'ALERTA' | 'OK';

export interface ValidationIssue {
  type: 'BLOCKER' | 'ALERTA';
  message: string;
  field?: string;
}

export interface ValidationResult {
  status: QualityGateStatus;
  issues: ValidationIssue[];
  timestamp: number;
}

export interface AuditLog {
  timestamp: number;
  user: string;
  action: string;
  details: string;
}

export interface EconomicIndices {
  incc: number; // % annual
  ipca: number; // % annual
  cdi: number; // % annual
  discountRate: number; // % annual (TMA)
}

export interface ProjectData {
  name: string;
  location: string;
  type: string;
  
  // Areas & Units
  totalUnits: number;
  totalArea: number; // Área do Terreno
  efficiencyRatio: number; // Índice de Aproveitamento (Novo)
  
  // Land Acquisition
  acquisitionType: 'CASH' | 'BARTER'; // Compra ou Permuta
  landCashValue: number; // Valor se for Compra
  
  // New Fields
  totalPrivateArea: number;      // Área Privativa Total = Terreno * IA
  totalEquivalentArea: number;   // Área Equivalente Total (m²) - Base para Custo
  sellablePrivateArea: number;   // Área Privativa Vendável = Privativa Total * (1 - Permuta)
  physicalBarterPercentage: number; // Permuta Física (%) - Usado se acquisitionType == BARTER
  
  constructionDurationMonths: number;
  salesDurationMonths: number;
}

export interface SalesPremises {
  pricePerSqm: number;
  brokerageFee: number; // %
  taxes: number; // %
  barter: number; // % (Permuta Financeira)
  
  // Investor Logic
  investorDiscount: number; // % Desconto para investidores
  investorPercentage: number; // % Da obra vendida para investidores

  // Payment Terms
  downPayment: number; // % (Entrada)
  monthlyInstallments: number; // % (Mensais)
  keys: number; // % (Chaves/Financiamento)
  
  // Timing
  keysMonth: number; // Relative month when keys are collected

  // Detailed Schedule
  monthlySales: number[]; // Array of units sold per month (Index 0 = Month 1)
}

export interface CostCategory {
  id: string;
  name: string;
  totalValue: number;
  vgvPercentage?: number; // Optional: Link cost to VGV
  distributionType: DistributionType;
  startMonth: number;
  durationMonths: number;
  manualDistribution?: number[]; // Array of percentages summing to 100
}

export interface Scenario {
  id: string;
  name: string;
  isActive: boolean;
  status: 'Incomplete' | 'Ready' | 'Analyzed';
  
  // Governance
  isReadOnly: boolean; // True for Snapshots
  parentId?: string; // If this is a snapshot, points to original scenario ID
  snapshots: Scenario[]; // List of immutable versions
  logs: AuditLog[];
  validation?: ValidationResult;
  lastUpdated: number;

  // Inputs
  projectData: ProjectData;
  indices: EconomicIndices;
  salesPremises: SalesPremises;
  costs: CostCategory[];
  
  // Calculated Results (Cached)
  results?: SimulationResults;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  description?: string;
  scenarios: Scenario[];
  activeScenarioId: string; // The "Current" or "Main" scenario for portfolio rollup
}

export interface PortfolioMetrics {
  totalProjects: number;
  totalVGV: number;
  totalNetResult: number;
  totalNPV: number;
  totalExposure: number;
  weightedIRR: number;
  avgMOIC: number;
  consolidatedTimeline: MonthlyFlow[];
}

export interface GlobalAssumptions {
  defaultIndices: EconomicIndices;
  defaultCostCategories: Partial<CostCategory>[];
}

export interface MonthlyFlow {
  month: number;
  grossRevenue: number; // Receita Bruta (Vendas nominais)
  taxesAndFees: number; // Impostos e Comissões
  revenue: number; // Receita Líquida (Entrada de Caixa)
  
  constructionCost: number;
  otherCosts: number;
  costBreakdown: { [costId: string]: number }; // Detailed breakdown for charts
  totalCost: number;
  
  operationalCashFlow: number;
  financialCost: number;
  netCashFlow: number;
  accumulatedCashFlow: number;
  exposure: number;
  unitsSold: number;
  accumulatedUnitsSold: number;
  stock: number;
}

export interface SimulationResults {
  timeline: MonthlyFlow[];
  indicators: {
    grossVGV: number; // VGV Bruto
    netVGV: number;   // VGV Líquido (Receita Total)
    totalCost: number;
    netResult: number;
    margin: number; // %
    exposurePeak: number;
    npv: number; // VPL
    irr: number; // TIR Nominal
    realIrr: number; // TIR Corrigida (Real)
    moic: number;
    paybackMonth: number;
  };
}

export type ViewState = 
  | 'PORTFOLIO'
  | 'LIBRARY'
  | 'DASHBOARD'
  | 'PROJECT_DATA'
  | 'ECONOMIC_INDICES'
  | 'REVENUE'
  | 'COSTS'
  | 'CASH_FLOW'
  | 'DRE'
  | 'SCENARIOS';