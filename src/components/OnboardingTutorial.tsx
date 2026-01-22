'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  UtensilsCrossed,
  Heart,
  ClipboardList,
  Gamepad2,
  Save,
  ChevronRight,
  X
} from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Meta-Pet!",
    description: "Meet your new digital companion. A few quick steps will help you keep them thriving.",
    icon: <Heart className="w-12 h-12 text-pink-400" />,
    tip: "Check in daily to keep your pet happy."
  },
  {
    title: "Feed Your Pet",
    description: "Use the Feed action whenever hunger dips. Keeping them fed maintains mood and growth.",
    icon: <UtensilsCrossed className="w-12 h-12 text-orange-400" />,
    tip: "Feed before hunger gets too low to avoid penalties."
  },
  {
    title: "Complete a Ritual",
    description: "Rituals give your pet a daily boost. Pick one to keep their stats balanced.",
    icon: <ClipboardList className="w-12 h-12 text-cyan-400" />,
    tip: "Rituals are best done once per day."
  },
  {
    title: "Play a Mini-Game",
    description: "Mini-games add fun and rewards. Try one to keep your pet engaged.",
    icon: <Gamepad2 className="w-12 h-12 text-purple-400" />,
    tip: "Mini-games can boost mood or resources."
  },
  {
    title: "Save or Export",
    description: "Save your progress or export your pet to keep them safe across devices.",
    icon: <Save className="w-12 h-12 text-emerald-400" />,
    tip: "Exporting helps protect your pet's progress."
  }
];

const STORAGE_KEY = 'metapet-onboarding-complete';

interface OnboardingTutorialProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function OnboardingTutorial({ onComplete, forceShow = false }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const completed = localStorage.getItem(STORAGE_KEY);
    if (forceShow || completed !== 'true') {
      setIsVisible(true);
    }
    setHasChecked(true);
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsVisible(false);
    onComplete?.();
  };

  if (!hasChecked || !isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-cyan-400'
                    : index < currentStep
                    ? 'bg-cyan-600'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Skip tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-800/50 rounded-full">
              {step.icon}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">
            {step.title}
          </h2>

          <p className="text-zinc-300 leading-relaxed">
            {step.description}
          </p>

          {step.tip && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-sm text-cyan-200">
              💡 <span className="font-medium">Tip:</span> {step.tip}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>

          <div className="flex gap-2">
            {!isLastStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-zinc-400 hover:text-white"
              >
                Skip
              </Button>
            )}
            <Button
              onClick={handleNext}
              size="sm"
              className="gap-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {isLastStep ? "Let's Go!" : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
