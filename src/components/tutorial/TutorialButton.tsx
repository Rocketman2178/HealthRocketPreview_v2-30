import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTutorial } from './TutorialContext';

export function TutorialButton() {
  const { showTutorial } = useTutorial();
  
  return (
    <button
      onClick={showTutorial}
      className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
    >
      <HelpCircle size={16} />
      <span>Launch Cosmo Guided Tutorial</span>
    </button>
  );
}