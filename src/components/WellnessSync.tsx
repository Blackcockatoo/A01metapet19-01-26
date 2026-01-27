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
import { GlassCard, GlassOverlay } from '@/components/GlassCard';
import { Heart, Sparkles } from 'lucide-react';

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
      <GlassOverlay isOpen={showPrompt} onClose={() => setShowPrompt(false)}>
        <GlassCard className="p-6" showClose onClose={() => setShowPrompt(false)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Wellness Reflection</h2>
          </div>

          <div className="py-4">
            <p className="text-white text-center text-lg font-medium">
              {prompt.directMessage}
            </p>
          </div>

          <div className="flex gap-3 justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowPrompt(false)}
              className="h-12 px-6 border-white/20 bg-white/5 hover:bg-white/10 text-white touch-manipulation"
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                setShowPrompt(false);
              }}
              className="h-12 px-6 bg-cyan-600 hover:bg-cyan-500 font-semibold touch-manipulation"
            >
              Log Self-Care
            </Button>
          </div>
        </GlassCard>
      </GlassOverlay>
    );
  }

  // Main mood check-in dialog
  return (
    <GlassOverlay isOpen={isOpen} onClose={onClose}>
      <GlassCard className="p-6" showClose onClose={onClose}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{greeting}!</h2>
        </div>

        <div className="space-y-6">
          <p className="text-zinc-300 text-center text-lg font-medium">How are you feeling?</p>

          {/* Mood selector */}
          <div className="flex justify-center gap-3">
            {MOODS.map((mood) => (
              <button
                key={mood}
                onClick={() => handleMoodSelect(mood)}
                className={`flex flex-col items-center p-4 rounded-xl transition-all touch-manipulation ${
                  selectedMood === mood
                    ? 'bg-purple-500/30 ring-2 ring-purple-400 scale-110'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="text-3xl">{USER_MOOD_ICONS[mood]}</span>
                <span className="text-xs text-zinc-300 mt-2 font-medium">
                  {USER_MOOD_LABELS[mood]}
                </span>
              </button>
            ))}
          </div>

          {/* Selected mood feedback */}
          {selectedMood && (
            <div className="text-center space-y-3 animate-in fade-in p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white font-medium">
                {selectedMood === 'struggling' && "It's okay to have tough days. Your companion is here for you."}
                {selectedMood === 'low' && "Taking it slow is fine. Small steps count."}
                {selectedMood === 'neutral' && "A steady day. That's perfectly alright."}
                {selectedMood === 'good' && "Nice! Your positive energy shows."}
                {selectedMood === 'great' && "Wonderful! Your companion feels your joy."}
              </p>

              {/* Pet vitals mirror effect preview */}
              <div className="flex items-center justify-center gap-4 mt-3 p-3 bg-black/20 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-zinc-400 font-medium">Your mood</p>
                  <p className="text-2xl mt-1">{USER_MOOD_ICONS[selectedMood]}</p>
                </div>
                <span className="text-zinc-500">=</span>
                <div className="text-center">
                  <p className="text-xs text-zinc-400 font-medium">Pet energy</p>
                  <div className="h-3 w-20 bg-zinc-700 rounded-full overflow-hidden mt-2">
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
              <label className="text-sm text-zinc-300 font-medium">
                Add a note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How's your day going?"
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-base text-white placeholder:text-zinc-500 resize-none focus:border-purple-500/50 focus:outline-none"
                rows={2}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 px-6 border-white/20 bg-white/5 hover:bg-white/10 text-white touch-manipulation"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMood}
            className="h-12 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-semibold touch-manipulation"
          >
            Check In
          </Button>
        </div>
      </GlassCard>
    </GlassOverlay>
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
