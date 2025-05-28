import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Target, Trophy, Radio, MessageSquare, Users } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { supabase } from '../../lib/supabase';
import { Play, Pause } from 'lucide-react'; 
import { useTutorial } from './TutorialContext';

interface TutorialStep {
  title: string;
  content: React.ReactNode;
  media?: {
    type: 'image' | 'video';
    src: string;
  };
}

export function TutorialSystem() {
  const { isVisible, setIsVisible } = useTutorial();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useSupabase();

  // Reset to first step when tutorial becomes visible
  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
    }
  }, [isVisible]);

  // Close tutorial
  const handleClose = () => {
    setIsVisible(false);
  };

  // Next step
  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  // Previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Toggle video playback
  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  // Tutorial steps
  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to Health Rocket!",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Let's take a quick tour to help you understand how to complete the Preview 100 Challenge and add 20+ years of healthy life!
          </p>
          <p className="text-gray-300">
            This tutorial will show you how to:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Complete Daily Boosts to build your Burn Streak</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Select Challenges & Quests</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Join Contests and win rewards</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Get help from Cosmo AI Guide</span>
            </li>
          </ul>
        </div>
      ), 
      media: {
        type: 'image',
        src: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      }
    },
    {
      title: "Daily Boosts & Burn Streak",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            <strong className="text-orange-500">Daily Boosts</strong> are quick 5-15 minute actions that earn you Fuel Points (FP).
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Complete up to 3 boosts per day</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Each boost earns 1-9 FP based on difficulty</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Completing at least 1 boost daily builds your <strong>Burn Streak</strong></span>
            </li>
          </ul>
          <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
            <p className="text-white font-medium">Preview 100 Challenge:</p>
            <p className="text-gray-300 text-sm">
              Complete a 42-Day Burn Streak to earn 2,500 equity shares with a chance to win up to 100,000 additional shares!
            </p>
          </div>
        </div>
      ), 
      media: {
        type: 'image',
        src: "https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      }
    },
    {
      title: "Challenges & Quests",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            <strong className="text-orange-500">Challenges</strong> are 21-day focused health protocols that earn you 50+ FP.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Start with the Morning Basics Challenge</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">You can have up to 2 active challenges at once</span>
            </li>
          </ul>
          
          <p className="text-gray-300 mt-4">
            <strong className="text-orange-500">Quests</strong> are 90-day journeys that combine multiple challenges for 150+ FP.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Complete Morning Basics to unlock Quests</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">You can have 1 active Quest at a time</span>
            </li>
          </ul>
        </div>
      ), 
      media: {
        type: 'image',
        src: "https://images.pexels.com/photos/4098228/pexels-photo-4098228.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      }
    },
    {
      title: "Contests & Prizes",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            <strong className="text-orange-500">Contests</strong> are skill-based competitions where you can win rewards.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Enter contests using your Contest Credits</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Top 10% of players share 75% of the prize pool</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Top 50% get their credit back</span>
            </li>
          </ul>
          
          <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 mt-4">
            <p className="text-white font-medium">Monthly Prize Pool:</p>
            <p className="text-gray-300 text-sm">
              Your status determines your prize eligibility:
            </p>
            <ul className="mt-2 space-y-1">
              <li className="text-gray-300 text-sm">• Hero Status (Top 50%): 2X Prize Chances</li>
              <li className="text-gray-300 text-sm">• Legend Status (Top 10%): 5X Prize Chances</li>
            </ul>
          </div>
        </div>
      ), 
      media: {
        type: 'image',
        src: "https://images.pexels.com/photos/3755440/pexels-photo-3755440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      }
    },
    {
      title: "Cosmo AI Guide",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            <strong className="text-orange-500">Cosmo</strong> is your AI guide to help you navigate Health Rocket and optimize your health journey.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Ask Cosmo anything about the game</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Get personalized health guidance</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Learn about expert protocols</span>
            </li>
          </ul>
          
          <p className="text-gray-300 mt-4">
            You can access Cosmo by:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Clicking the Cosmo AI Guide tab in the main navigation</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Using the Help Topics section for quick answers</span>
            </li>
          </ul>
        </div>
      ), 
      media: {
        type: 'image',
        src: "https://images.pexels.com/photos/8438922/pexels-photo-8438922.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      }
    },
    {
      title: "Tracking Your Progress",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Track your progress through multiple features:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300"><strong>Launch Progress:</strong> Shows your Fuel Points and progress to the next level</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300"><strong>Player Standings:</strong> Shows your rank in the community</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300"><strong>Challenge Progress:</strong> Shows your active challenges and completion status</span>
            </li>
          </ul>
          
          <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 mt-4">
            <p className="text-white font-medium">Preview 100 Challenge Progress:</p>
            <p className="text-gray-300 text-sm">
              Your Burn Streak counter shows your progress toward the 42-Day goal. Keep it going by earning at least 1 FP every day!
            </p>
          </div>
        </div>
      ), 
      media: {
        type: 'image',
        src: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      }
    },
    {
      title: "You're Ready to Launch!",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            You're now ready to start your health optimization journey!
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Complete Daily Boosts to build your Burn Streak</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Start with the Morning Basics Challenge</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Join Contests to compete and win rewards</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Radio size={14} className="text-orange-500" />
              </div>
              <span className="text-gray-300">Ask Cosmo for help anytime</span>
            </li>
          </ul>
          
          <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 mt-4">
            <p className="text-white font-medium">Remember:</p>
            <p className="text-gray-300 text-sm">
              You can relaunch this tutorial anytime from the Cosmo AI Guide page by clicking "Launch Cosmo Guided Tutorial".
            </p>
          </div>
        </div>
      ), 
      media: {
        type: 'image',
        src: "https://images.pexels.com/photos/3760810/pexels-photo-3760810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
      }
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-1 mb-6">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-orange-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
            {/* Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">{tutorialSteps[currentStep].title}</h2>
              <div className="text-gray-300">
                {tutorialSteps[currentStep].content}
              </div>
            </div>

            {/* Image */}
            <div className="mt-4 md:mt-0 flex items-center justify-center">
              {tutorialSteps[currentStep].media && (
                tutorialSteps[currentStep].media.type === 'image' ? (
                  <div className="rounded-lg overflow-hidden h-60 md:h-80 border border-gray-700">
                    <img
                      src={tutorialSteps[currentStep].media.src}
                      alt={tutorialSteps[currentStep].title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Failed to load image: ${tutorialSteps[currentStep].media?.src}`);
                        e.currentTarget.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden h-60 md:h-80 border border-gray-700 relative">
                    <video
                      ref={videoRef}
                      src={tutorialSteps[currentStep].media.src}
                      className="w-full h-full object-contain"
                      controls={false}
                      onEnded={() => setIsVideoPlaying(false)}
                      onError={(e) => {
                        console.error(`Failed to load video: ${tutorialSteps[currentStep].media?.src}`);
                      }}
                    />
                    <button
                      onClick={toggleVideoPlayback}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                    >
                      {isVideoPlaying ? (
                        <Pause size={48} className="text-white opacity-80" />
                      ) : (
                        <Play size={48} className="text-white opacity-80" />
                      )}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white'
              }`}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={20} />
              <span>Previous</span>
            </button>

            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <span>{currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}