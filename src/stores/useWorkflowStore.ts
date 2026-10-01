import { create } from 'zustand';
import { WorkflowPhase } from '@/features/workflow/utils/workflowStatusEngine';

export type WorkflowViewMode = 'canvas' | 'checklist';
export type WorkflowPhaseFilter = 'all' | WorkflowPhase;

interface WorkflowState {
  activeModule: string | null;
  viewMode: WorkflowViewMode;
  selectedPhaseFilter: WorkflowPhaseFilter;
  setActiveModule: (moduleId: string | null) => void;
  setViewMode: (mode: WorkflowViewMode) => void;
  setSelectedPhaseFilter: (filter: WorkflowPhaseFilter) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  activeModule: null,
  viewMode: 'canvas',
  selectedPhaseFilter: 'all',
  setActiveModule: (moduleId) => set({ activeModule: moduleId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedPhaseFilter: (filter) => set({ selectedPhaseFilter: filter }),
}));
