import React from 'react';
import { TutorialSystem } from './TutorialSystem';
import { TutorialProvider as TutorialContextProvider } from './TutorialContext';

interface TutorialProviderProps {
  children: React.ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  return (
    <TutorialContextProvider>
      {children}
      <TutorialSystem />
    </TutorialContextProvider>
  );
}