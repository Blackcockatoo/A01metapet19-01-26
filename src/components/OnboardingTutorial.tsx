'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  UtensilsCrossed,
  Droplets,
  Sparkles,
  Zap,
  Heart,
  AlertTriangle,
  Trophy,
  Dna,
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
    description: "You've hatched a digital companion with unique genetics. Your job is to keep them happy and healthy!",
    icon: <Heart className="w-12 h-12 text-pink-400" />,
    tip: "Your pet's personality is determined by their genome - each one is unique!"
  },
  {
    title: "Keep Them Fed",
    description: "Watch the Hunger bar - when it gets low, tap Feed to give your pet food. A hungry pet gets grumpy!",
    icon: <UtensilsCrossed className="w-12 h-12 text-orange-400" />,
    tip: "Feed when hunger drops below 50% for the best mood."
  },
  {
    title: "Keep Them Clean",
    description: "The Hygiene bar shows how clean your pet is. Tap Clean regularly to keep them fresh and happy.",
    icon: <Droplets className="w-12 h-12 text-cyan-400" />,
    tip: "Cleaning also gives a small mood boost!"
  },
  {
    title: "Play Together",
    description: "Tap Play to have fun with your pet - this boosts their Mood but uses Energy. Balance is key!",
    icon: <Sparkles className="w-12 h-12 text-purple-400" />,
    tip: "Playing when energy is low will tire them out quickly."
  },
  {
    title: "Rest When Tired",
    description: "When Energy gets low, let your pet Sleep to recover. A tired pet can't play well!",
    icon: <Zap className="w-12 h-12 text-yellow-400" />,
    tip: "Put them to sleep before energy hits zero to prevent sickness."
  },
  {
    title: "Watch for Sickness",
    description: "If any stat hits zero, your pet may get sick! Sick pets need extra care to recover.",
    icon: <AlertTriangle className="w-12 h-12 text-red-400" />,
    tip: "Check on your pet regularly - neglect has consequences!"
  },
  {
    title: "Help Them Evolve",
    description: "With good care, your pet will evolve through 4 stages: Genetics → Neuro → Quantum → Speciation.",
    icon: <Dna className="w-12 h-12 text-green-400" />,
    tip: "Evolution requires time, interactions, and keeping vitals healthy."
  },
  {
    title: "Earn Achievements",
    description: "Complete challenges to unlock achievements and deepen your bond. Some unlock special features!",
    icon: <Trophy className="w-12 h-12 text-amber-400" />,
    tip: "Check the Achievements section to see what you can unlock."
  }
];

const STORAGE_KEY = 'metapet-onboarding-completed';

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
    if (forceShow || !completed) {
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
