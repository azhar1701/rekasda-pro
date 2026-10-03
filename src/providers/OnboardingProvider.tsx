import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingState {
    hasSeenWelcome: boolean;
    completedSteps: string[];
    isChecklistVisible: boolean;
}

interface OnboardingContextType extends OnboardingState {
    setHasSeenWelcome: (value: boolean) => void;
    completeStep: (stepId: string) => void;
    setChecklistVisible: (value: boolean) => void;
    resetOnboarding: (keepWelcome?: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'rekasda_onboarding_v1';

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<OnboardingState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {
            hasSeenWelcome: false,
            completedSteps: [],
            isChecklistVisible: true
        };
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const setHasSeenWelcome = (value: boolean) => {
        setState(prev => ({ ...prev, hasSeenWelcome: value }));
    };

    const completeStep = (stepId: string) => {
        setState(prev => {
            if (prev.completedSteps.includes(stepId)) return prev;
            return { ...prev, completedSteps: [...prev.completedSteps, stepId] };
        });
    };

    const setChecklistVisible = (value: boolean) => {
        setState(prev => ({ ...prev, isChecklistVisible: value }));
    };

    const resetOnboarding = (keepWelcome = false) => {
        setState(prev => ({
            hasSeenWelcome: keepWelcome ? prev.hasSeenWelcome : false,
            completedSteps: [],
            isChecklistVisible: true
        }));
    };

    return (
        <OnboardingContext.Provider value={{
            ...state,
            setHasSeenWelcome,
            completeStep,
            setChecklistVisible,
            resetOnboarding
        }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
