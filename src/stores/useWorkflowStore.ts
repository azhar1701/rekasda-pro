import { create } from 'zustand';

interface WorkflowState {
  activeModule: string | null;
  setActiveModule: (moduleId: string | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  activeModule: null,
  setActiveModule: (moduleId) => set({ activeModule: moduleId }),
}));
