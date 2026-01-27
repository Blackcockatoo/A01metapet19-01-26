'use client';

import { useWellnessStore } from '@/lib/wellness';
import {
  REMINDER_MODE_LABELS,
  REMINDER_MODE_DESCRIPTIONS,
  type ReminderMode,
  type WellnessFeatures,
} from '@/lib/wellness/types';
import { triggerHaptic } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassOverlay } from '@/components/GlassCard';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Bell,
  BellOff,
  Eye,
  Heart,
  Droplets,
  Moon,
  Anchor,
  Timer,
  Smartphone,
  Flower2,
  PiggyBank,
  GraduationCap,
  Footprints,
  Check,
} from 'lucide-react';

interface WellnessSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const REMINDER_MODES: { mode: ReminderMode; icon: React.ReactNode }[] = [
  { mode: 'gentle', icon: <Eye className="w-4 h-4" /> },
  { mode: 'direct', icon: <Bell className="w-4 h-4" /> },
  { mode: 'silent', icon: <BellOff className="w-4 h-4" /> },
];

const FEATURE_CONFIG: {
  key: keyof WellnessFeatures;
  label: string;
  description: string;
  icon: React.ReactNode;
  phase: 1 | 2 | 3;
}[] = [
  {
    key: 'mirrorVitals',
    label: 'Mirror Vitals',
    description: 'Pet reflects your mood',
    icon: <Heart className="w-4 h-4" />,
    phase: 1,
  },
  {
    key: 'hydration',
    label: 'Hydration',
    description: 'Track water intake',
    icon: <Droplets className="w-4 h-4" />,
    phase: 1,
  },
  {
    key: 'sleep',
    label: 'Sleep',
    description: 'Track rest patterns',
    icon: <Moon className="w-4 h-4" />,
    phase: 1,
  },
  {
    key: 'anxiety',
    label: 'Grounding',
    description: 'Anxiety management tools',
    icon: <Anchor className="w-4 h-4" />,
    phase: 1,
  },
  {
    key: 'pomodoro',
    label: 'Focus Sessions',
    description: 'Pomodoro timer with XP',
    icon: <Timer className="w-4 h-4" />,
    phase: 2,
  },
  {
    key: 'sabbath',
    label: 'Digital Sabbath',
    description: 'Screen break rewards',
    icon: <Smartphone className="w-4 h-4" />,
    phase: 2,
  },
  {
    key: 'gratitude',
    label: 'Gratitude',
    description: 'Journal as nourishment',
    icon: <Flower2 className="w-4 h-4" />,
    phase: 2,
  },
  {
    key: 'savings',
    label: 'Savings Goals',
    description: 'Financial milestones',
    icon: <PiggyBank className="w-4 h-4" />,
    phase: 3,
  },
  {
    key: 'learning',
    label: 'Learning',
    description: 'Skill building tracker',
    icon: <GraduationCap className="w-4 h-4" />,
    phase: 3,
  },
  {
    key: 'movement',
    label: 'Movement',
    description: 'Activity tracking',
    icon: <Footprints className="w-4 h-4" />,
    phase: 3,
  },
];

export function WellnessSettings({ isOpen, onClose }: WellnessSettingsProps) {
  const reminderMode = useWellnessStore(state => state.reminderMode);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);
  const setReminderMode = useWellnessStore(state => state.setReminderMode);
  const toggleFeature = useWellnessStore(state => state.toggleFeature);
  const completeSetup = useWellnessStore(state => state.completeSetup);
  const setupCompletedAt = useWellnessStore(state => state.setupCompletedAt);

  const handleModeChange = (mode: ReminderMode) => {
    setReminderMode(mode);
    triggerHaptic('light');
  };

  const handleToggleFeature = (feature: keyof WellnessFeatures) => {
    toggleFeature(feature);
    triggerHaptic('light');
  };

  const handleCompleteSetup = () => {
    completeSetup();
    triggerHaptic('medium');
    onClose();
  };

  // Group features by phase
  const phase1Features = FEATURE_CONFIG.filter(f => f.phase === 1);
  const phase2Features = FEATURE_CONFIG.filter(f => f.phase === 2);
  const phase3Features = FEATURE_CONFIG.filter(f => f.phase === 3);

  return (
    <GlassOverlay isOpen={isOpen} onClose={onClose}>
      <GlassCard className="p-6 max-h-[85vh] overflow-y-auto" showClose onClose={onClose}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Wellness Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Reminder Mode */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Reminder Style</h3>
            <p className="text-sm text-zinc-400">
              How should your companion communicate wellness feedback?
            </p>

            <div className="grid grid-cols-3 gap-3">
              {REMINDER_MODES.map(({ mode, icon }) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`flex flex-col items-center p-4 rounded-xl border transition-all touch-manipulation ${
                    reminderMode === mode
                      ? 'bg-emerald-500/20 border-emerald-500/50 ring-2 ring-emerald-500/30'
                      : 'bg-white/5 border-white/10 hover:border-emerald-500/30'
                  }`}
                >
                  <div className={`mb-2 ${reminderMode === mode ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {icon}
                  </div>
                  <span className={`text-sm font-medium ${
                    reminderMode === mode ? 'text-emerald-300' : 'text-zinc-300'
                  }`}>
                    {REMINDER_MODE_LABELS[mode]}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-sm text-zinc-400 text-center">
              {REMINDER_MODE_DESCRIPTIONS[reminderMode]}
            </p>
          </div>

          {/* Phase 1 Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Core Wellness</h3>
              <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
                Phase 1
              </span>
            </div>

            <div className="space-y-2">
              {phase1Features.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`${enabledFeatures[feature.key] ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-base font-medium text-white">{feature.label}</p>
                      <p className="text-sm text-zinc-400">{feature.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={enabledFeatures[feature.key]}
                    onCheckedChange={() => handleToggleFeature(feature.key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Phase 2 Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Productivity</h3>
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full font-medium">
                Phase 2
              </span>
            </div>

            <div className="space-y-2">
              {phase2Features.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`${enabledFeatures[feature.key] ? 'text-blue-400' : 'text-zinc-500'}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-base font-medium text-white">{feature.label}</p>
                      <p className="text-sm text-zinc-400">{feature.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={enabledFeatures[feature.key]}
                    onCheckedChange={() => handleToggleFeature(feature.key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Phase 3 Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Goals & Growth</h3>
              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full font-medium">
                Phase 3
              </span>
            </div>

            <div className="space-y-2">
              {phase3Features.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-zinc-500">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-base font-medium text-zinc-400">{feature.label}</p>
                      <p className="text-sm text-zinc-500">{feature.description}</p>
                    </div>
                  </div>
                  <span className="text-sm text-zinc-500 font-medium">Coming Soon</span>
                </div>
              ))}
            </div>
          </div>

          {/* Setup complete button */}
          {!setupCompletedAt && (
            <Button
              onClick={handleCompleteSetup}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-semibold text-lg touch-manipulation"
            >
              <Check className="w-5 h-5 mr-2" />
              Complete Setup
            </Button>
          )}
        </div>
      </GlassCard>
    </GlassOverlay>
  );
}

// Settings button for quick access
export function WellnessSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      className="flex items-center justify-center w-10 h-10 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-full text-zinc-400 hover:text-emerald-400 transition-all touch-manipulation"
    >
      <Settings className="w-5 h-5" />
    </button>
  );
}
