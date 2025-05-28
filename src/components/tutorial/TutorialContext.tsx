import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { supabase } from '../../lib/supabase';

interface TutorialContextType {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  showTutorial: () => void;
  hideTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const showTutorial = () => setIsVisible(true);
  const hideTutorial = () => setIsVisible(false);

  return (
    <TutorialContext.Provider
      value={{
        isVisible,
        setIsVisible,
        showTutorial,
        hideTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
    // Tutorial auto-popup is disabled

    // Users can still access it from the Cosmo AI Guide page
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}