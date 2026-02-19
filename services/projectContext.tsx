import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Scenario, ProjectData, ViewState, DistributionType, Project, GlobalAssumptions, PortfolioMetrics } from '../types';
import { runSimulation, validateScenario, consolidatePortfolio } from '../utils/calculations.ts';

// --- Seeds ---

const DEFAULT_INDICES = {
  incc: 4.5,
  ipca: 4.0,
  cdi: 10.5,
  discountRate: 12.0,
};

// Helper to calc defaults
const calcAreas = (landArea: number, efficiency: number, barter: number) => {
  const totalPrivate = landArea * efficiency;
  const sellable = totalPrivate * (1 - barter / 100);
  return { totalPrivate, sellable };
};

const p1Areas = calcAreas(4000, 2.5, 0); // 4000m² terreno, IA 2.5
const DEFAULT_PROJECT_1_DATA: ProjectData = {
  name: "Residencial Horizonte",
  location: "São Paulo, SP",
  type: "Residencial Vertical",
  totalUnits: 100,
  totalArea: 4000, // Área do Terreno
  efficiencyRatio: 2.5,
  totalPrivateArea: p1Areas.totalPrivate,
  totalEquivalentArea: 12000,
  sellablePrivateArea: p1Areas.sellable,
  physicalBarterPercentage: 0,
  acquisitionType: 'CASH',
  landCashValue: 15000000,
  constructionDurationMonths: 24,
  salesDurationMonths: 30,
};

const p2Areas = calcAreas(2000, 3.0, 0); // 2000m² terreno, IA 3.0
const DEFAULT_PROJECT_2_DATA: ProjectData = {
  name: "Comercial Avenue",
  location: "Rio de Janeiro, RJ",
  type: "Lajes Corporativas",
  totalUnits: 40,
  totalArea: 2000,
  efficiencyRatio: 3.0,
  totalPrivateArea: p2Areas.totalPrivate,
  totalEquivalentArea: 7500,
  sellablePrivateArea: p2Areas.sellable,
  physicalBarterPercentage: 0,
  acquisitionType: 'CASH',
  landCashValue: 20000000,
  constructionDurationMonths: 30,
  salesDurationMonths: 36,
};

// Helper to generate default linear sales
const generateDefaultSales = (totalUnits: number, duration: number): number[] => {
  if (duration <= 0) return [];
  const monthly = totalUnits / duration;
  return Array(duration).fill(monthly);
};

const createScenario = (id: string, name: string, projectData: ProjectData): Scenario => {
  const s: Scenario = {
    id,
    name,
    isActive: true,
    status: 'Ready',
    isReadOnly: false,
    snapshots: [],
    logs: [],
    lastUpdated: Date.now(),
    projectData: { ...projectData },
    indices: { ...DEFAULT_INDICES },
    salesPremises: {
      pricePerSqm: projectData.name.includes("Comercial") ? 12000 : 8500,
      brokerageFee: 4,
      taxes: 6,
      barter: 0,
      investorDiscount: 0,
      investorPercentage: 0,
      downPayment: 20,
      monthlyInstallments: 60,
      keys: 20,
      keysMonth: projectData.constructionDurationMonths,
      monthlySales: generateDefaultSales(projectData.totalUnits, projectData.salesDurationMonths)
    },
    costs: [
      {
        id: 'c1',
        name: 'Terreno',
        totalValue: projectData.landCashValue || (projectData.name.includes("Comercial") ? 20000000 : 15000000),
        distributionType: DistributionType.HEAD_LOADED,
        startMonth: 0,
        durationMonths: 6,
      },
      {
        id: 'c2',
        name: 'Obra Civil',
        totalValue: projectData.name.includes("Comercial") ? 45000000 : 35000000,
        distributionType: DistributionType.S_CURVE,
        startMonth: 2,
        durationMonths: projectData.constructionDurationMonths,
      },
      {
        id: 'c3',
        name: 'Projetos',
        totalValue: 1500000,
        distributionType: DistributionType.LINEAR,
        startMonth: 0,
        durationMonths: 12,
      },
      {
        id: 'c4',
        name: 'Marketing',
        totalValue: 2000000,
        distributionType: DistributionType.HEAD_LOADED,
        startMonth: 0,
        durationMonths: projectData.salesDurationMonths,
      },
      {
        id: 'c5',
        name: 'Administração Central',
        totalValue: 2500000,
        distributionType: DistributionType.LINEAR,
        startMonth: 0,
        durationMonths: projectData.constructionDurationMonths + 6,
      },
      {
        id: 'c6',
        name: 'Taxa de Gestão da Incorporação',
        totalValue: 1000000,
        distributionType: DistributionType.LINEAR,
        startMonth: 0,
        durationMonths: projectData.constructionDurationMonths + 6,
      },
      {
        id: 'c7',
        name: 'Taxa Adm de Obra',
        totalValue: 3000000,
        distributionType: DistributionType.S_CURVE,
        startMonth: 2,
        durationMonths: projectData.constructionDurationMonths,
      }
    ]
  };
  s.results = runSimulation(s);
  s.validation = validateScenario(s);
  return s;
};

interface ProjectContextType {
  projects: Project[];
  activeProjectId: string | null;
  currentView: ViewState;
  globalAssumptions: GlobalAssumptions;
  portfolioMetrics: PortfolioMetrics;
  
  // Actions
  setView: (view: ViewState) => void;
  setActiveProject: (id: string | null) => void;
  setActiveScenario: (id: string) => void; // within active project
  updateScenario: (scenarioId: string, data: Partial<Scenario>) => void;
  addProject: (data: ProjectData) => void;
  addScenario: () => void;
  createSnapshot: (scenarioId: string) => void;
  
  // Getters
  getActiveProject: () => Project | undefined;
  getActiveScenario: () => Scenario | undefined;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Init State
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'p1',
      name: DEFAULT_PROJECT_1_DATA.name,
      location: DEFAULT_PROJECT_1_DATA.location,
      activeScenarioId: 's1',
      scenarios: [createScenario('s1', 'Cenário Base', DEFAULT_PROJECT_1_DATA)]
    },
    {
      id: 'p2',
      name: DEFAULT_PROJECT_2_DATA.name,
      location: DEFAULT_PROJECT_2_DATA.location,
      activeScenarioId: 's2',
      scenarios: [createScenario('s2', 'Cenário Otimista', DEFAULT_PROJECT_2_DATA)]
    }
  ]);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null); // Null means Portfolio View
  const [currentView, setCurrentView] = useState<ViewState>('PORTFOLIO');
  
  const [globalAssumptions, setGlobalAssumptions] = useState<GlobalAssumptions>({
    defaultIndices: DEFAULT_INDICES,
    defaultCostCategories: []
  });

  // Consolidated Metrics
  const portfolioMetrics = consolidatePortfolio(projects);

  const setView = (view: ViewState) => {
    setCurrentView(view);
    if (view === 'PORTFOLIO' || view === 'LIBRARY') {
      setActiveProjectId(null);
    }
  };

  const setActiveProject = (id: string | null) => {
    setActiveProjectId(id);
    if (id) {
      setCurrentView('DASHBOARD');
    } else {
      setCurrentView('PORTFOLIO');
    }
  };

  const getActiveProject = () => projects.find(p => p.id === activeProjectId);

  const getActiveScenario = () => {
    const project = getActiveProject();
    if (!project) return undefined;
    
    // Search in scenarios or snapshots
    return project.scenarios.find(s => s.id === project.activeScenarioId) || 
           project.scenarios.flatMap(s => s.snapshots).find(s => s.id === project.activeScenarioId);
  };

  const setActiveScenario = (scenarioId: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return { ...p, activeScenarioId: scenarioId };
    }));
  };

  const updateScenario = (scenarioId: string, data: Partial<Scenario>) => {
    if (!activeProjectId) return;
    
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;

      const updatedScenarios = p.scenarios.map(s => {
        if (s.id !== scenarioId || s.isReadOnly) return s;
        
        const updated = { 
          ...s, 
          ...data,
          lastUpdated: Date.now()
        };
        
        // Auto-recalculate
        updated.results = runSimulation(updated);
        updated.validation = validateScenario(updated);
        
        return updated;
      });

      return { ...p, scenarios: updatedScenarios };
    }));
  };

  const addProject = (data: ProjectData) => {
    const newId = `p${projects.length + 1}`;
    const initialScenarioId = `s${Date.now()}`;
    const newProject: Project = {
      id: newId,
      name: data.name,
      location: data.location,
      activeScenarioId: initialScenarioId,
      scenarios: [createScenario(initialScenarioId, 'Cenário Inicial', data)]
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newId);
    setCurrentView('DASHBOARD');
  };

  const addScenario = () => {
    if (!activeProjectId) return;
    const project = projects.find(p => p.id === activeProjectId);
    if (!project) return;

    const base = project.scenarios.find(s => s.id === project.activeScenarioId) || project.scenarios[0];
    const newId = `s${Date.now()}`;
    const newScenario: Scenario = {
      ...JSON.parse(JSON.stringify(base)),
      id: newId,
      name: `${base.name} (Cópia)`,
      snapshots: [],
      isReadOnly: false,
      logs: [],
      status: 'Ready',
      validation: undefined,
      results: undefined
    };
    newScenario.results = runSimulation(newScenario);
    newScenario.validation = validateScenario(newScenario);

    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return { 
        ...p, 
        scenarios: [...p.scenarios, newScenario],
        activeScenarioId: newId 
      };
    }));
  };

  const createSnapshot = (scenarioId: string) => {
    if (!activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;

      const updatedScenarios = p.scenarios.map(s => {
        if (s.id !== scenarioId) return s;

        const snapshotId = `${s.id}-snap-${s.snapshots.length + 1}`;
        const snapshot: Scenario = {
          ...JSON.parse(JSON.stringify(s)),
          id: snapshotId,
          parentId: s.id,
          name: `${s.name} - v${s.snapshots.length + 1} (Oficial)`,
          isReadOnly: true,
          snapshots: [],
          status: 'Analyzed',
          lastUpdated: Date.now()
        };
        snapshot.validation = validateScenario(snapshot);
        snapshot.results = runSimulation(snapshot);

        return {
          ...s,
          snapshots: [...s.snapshots, snapshot]
        };
      });

      return { ...p, scenarios: updatedScenarios };
    }));
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProjectId,
      currentView,
      globalAssumptions,
      portfolioMetrics,
      setView,
      setActiveProject,
      setActiveScenario,
      updateScenario,
      addProject,
      addScenario,
      createSnapshot,
      getActiveProject,
      getActiveScenario
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};