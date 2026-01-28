'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useWellnessStore } from '@/lib/wellness';
import {
  USER_MOOD_VALUES,
  USER_MOOD_LABELS,
  USER_MOOD_ICONS,
  type UserMood,
} from '@/lib/bond/types';
import { WELLNESS_PROMPTS } from '@/lib/wellness/types';
import { triggerHaptic } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart, X, Sparkles } from 'lucide-react';

interface WellnessSyncProps {
  isOpen: boolean;
  onClose: () => void;
  lastAction?: 'feed' | 'clean' | 'play' | 'sleep' | null;
}

const MOODS: UserMood[] = ['struggling', 'low', 'neutral', 'good', 'great'];

export function WellnessSync({ isOpen, onClose, lastAction }: WellnessSyncProps) {
  const [selectedMood, setSelectedMood] = useState<UserMood | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [note, setNote] = useState('');

  const vitals = useStore(state => state.vitals);
  const reminderMode = useWellnessStore(state => state.reminderMode);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  // Get time context
  const getTimeContext = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const timeContext = getTimeContext();
  const greeting = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Late night',
  }[timeContext];

  // Show action-triggered prompt
  useEffect(() => {
    if (lastAction && reminderMode === 'direct' && enabledFeatures.mirrorVitals) {
      setShowPrompt(true);
    }
  }, [lastAction, reminderMode, enabledFeatures.mirrorVitals]);

  const handleMoodSelect = (mood: UserMood) => {
    setSelectedMood(mood);
    triggerHaptic('light');
  };

  const handleSubmit = () => {
    if (!selectedMood) return;

    // TODO: Integrate with bond system mood check-in
    // For now, just close and provide feedback
    triggerHaptic('medium');
    onClose();
    setSelectedMood(null);
    setNote('');
  };

  // Get wellness prompt for last action
  const prompt = lastAction
    ? WELLNESS_PROMPTS.find(p => p.action === lastAction)
    : null;

  if (!enabledFeatures.mirrorVitals) return null;

  // Action prompt dialog (Direct mode)
  if (showPrompt && prompt && reminderMode === 'direct') {
    return (
      <Dialog open={showPrompt} onOpenChange={() => setShowPrompt(false)}>
        <DialogContent className="bg-zinc-900/95 border-cyan-500/30 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="w-5 h-5" />
              Wellness Reflection
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-zinc-300 text-center text-lg">
              {prompt.directMessage}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="border-zinc-600"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowPrompt(false);
                // Could open hydration or other tracker here
              }}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              Log Self-Care
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main mood check-in dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900/95 border-purple-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-400">
            <Heart className="w-5 h-5" />
            {greeting}! How are you feeling?
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Mood selector */}
          <div className="flex justify-center gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all touch-manipulation ${
                  selectedMood === mood
                    ? 'bg-purple-500/30 ring-2 ring-purple-400 scale-110'
                    : 'bg-zinc-800/50 hover:bg-zinc-700/50'
                }`}
              >
                <span className="text-2xl">{USER_MOOD_ICONS[mood]}</span>
                <span className="text-xs text-zinc-400 mt-1">
                  {USER_MOOD_LABELS[mood]}
                </span>
              </button>
            ))}
          </div>

          {/* Selected mood feedback */}
          {selectedMood && (
            <div className="text-center space-y-2 animate-in fade-in">
              <p className="text-zinc-300">
                {selectedMood === 'struggling' && "It's okay to have tough days. Your companion is here for you."}
                {selectedMood === 'low' && "Taking it slow is fine. Small steps count."}
                {selectedMood === 'neutral' && "A steady day. That's perfectly alright."}
                {selectedMood === 'good' && "Nice! Your positive energy shows."}
                {selectedMood === 'great' && "Wonderful! Your companion feels your joy."}
              </p>

              {/* Pet vitals mirror effect preview */}
              <div className="flex items-center justify-center gap-4 mt-4 p-3 bg-zinc-800/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Your mood</p>
                  <p className="text-lg">{USER_MOOD_ICONS[selectedMood]}</p>
                </div>
                <span className="text-zinc-600">=</span>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Pet energy</p>
                  <div className="h-2 w-16 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{ width: `${USER_MOOD_VALUES[selectedMood] * 20}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Optional note */}
          {selectedMood && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-500">
                Add a note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How's your day going?"
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-300 placeholder:text-zinc-600 resize-none"
                rows={2}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-zinc-600"
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedMood}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
          >
            Check In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick mood button for floating actions
export function QuickMoodButton({ onClick }: { onClick: () => void }) {
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  if (!enabledFeatures.mirrorVitals) return null;

  return (
    <button
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-full text-purple-300 text-sm transition-all touch-manipulation"
    >
      <Heart className="w-4 h-4" />
      <span>How are you?</span>
    </button>
  );
}
