import { STORY_BEATS, BOSS_DIALOGUE, UPGRADE_DIALOGUE, StoryBeat } from '../data/storyBeats';

export class NarrativeSystem {
  private seenStories: Set<string> = new Set();
  private storyQueue: StoryBeat[] = [];
  private onStoryTriggered?: (story: StoryBeat) => void;

  constructor() {
    // Load seen stories from localStorage
    this.loadSeenStories();
  }

  /**
   * Set callback for when a story should be displayed
   */
  setStoryCallback(callback: (story: StoryBeat) => void): void {
    this.onStoryTriggered = callback;
  }

  /**
   * Check if a wave should trigger a story
   */
  checkWaveStory(wave: number): void {
    const story = STORY_BEATS.find((beat) => beat.wave === wave);

    if (story && !this.seenStories.has(story.id)) {
      this.triggerStory(story);
    }
  }

  /**
   * Trigger boss-specific dialogue
   */
  checkBossStory(bossCount: number): void {
    let story: StoryBeat | undefined;

    if (bossCount === 1) {
      story = BOSS_DIALOGUE.find((b) => b.id === 'boss_1');
    } else if (bossCount === 5) {
      story = BOSS_DIALOGUE.find((b) => b.id === 'boss_5');
    }

    if (story && !this.seenStories.has(story.id)) {
      this.triggerStory(story);
    }
  }

  /**
   * Trigger upgrade-specific dialogue
   */
  checkUpgradeStory(upgradeId: string): void {
    const dialogue = UPGRADE_DIALOGUE[upgradeId];

    if (dialogue && !this.seenStories.has(`upgrade_${upgradeId}`)) {
      const story: StoryBeat = {
        id: `upgrade_${upgradeId}`,
        wave: 0,
        title: 'New Power Unlocked',
        speaker: 'Mentor AI',
        lines: dialogue,
        concept: 'Upgrade Milestone',
        isImportant: true,
      };

      this.triggerStory(story);
    }
  }

  /**
   * Trigger a story to be displayed
   */
  private triggerStory(story: StoryBeat): void {
    this.seenStories.add(story.id);
    this.saveSeenStories();

    if (this.onStoryTriggered) {
      this.onStoryTriggered(story);
    }
  }

  /**
   * Get all seen stories
   */
  getSeenStories(): string[] {
    return Array.from(this.seenStories);
  }

  /**
   * Get story by ID
   */
  getStoryById(id: string): StoryBeat | undefined {
    return STORY_BEATS.find((beat) => beat.id === id) ||
           BOSS_DIALOGUE.find((beat) => beat.id === id);
  }

  /**
   * Get all unlocked stories for story log
   */
  getUnlockedStories(): StoryBeat[] {
    const unlockedStories: StoryBeat[] = [];

    STORY_BEATS.forEach((beat) => {
      if (this.seenStories.has(beat.id)) {
        unlockedStories.push(beat);
      }
    });

    BOSS_DIALOGUE.forEach((beat) => {
      if (this.seenStories.has(beat.id)) {
        unlockedStories.push(beat);
      }
    });

    // Add upgrade stories
    Object.keys(UPGRADE_DIALOGUE).forEach((upgradeId) => {
      const id = `upgrade_${upgradeId}`;
      if (this.seenStories.has(id)) {
        const dialogue = UPGRADE_DIALOGUE[upgradeId];
        unlockedStories.push({
          id,
          wave: 0,
          title: `Unlocked: ${upgradeId}`,
          speaker: 'Mentor AI',
          lines: dialogue,
          concept: 'Upgrade',
          isImportant: false,
        });
      }
    });

    return unlockedStories.sort((a, b) => a.wave - b.wave);
  }

  /**
   * Get progress percentage
   */
  getProgress(): { seen: number; total: number; percent: number } {
    const total = STORY_BEATS.length + BOSS_DIALOGUE.length;
    const seen = this.getUnlockedStories().length;

    return {
      seen,
      total,
      percent: Math.floor((seen / total) * 100),
    };
  }

  /**
   * Save seen stories to localStorage
   */
  private saveSeenStories(): void {
    try {
      const data = Array.from(this.seenStories);
      localStorage.setItem('space-jewbles-stories', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save seen stories:', error);
    }
  }

  /**
   * Load seen stories from localStorage
   */
  private loadSeenStories(): void {
    try {
      const savedData = localStorage.getItem('space-jewbles-stories');
      if (savedData) {
        const data = JSON.parse(savedData) as string[];
        this.seenStories = new Set(data);
      }
    } catch (error) {
      console.error('Failed to load seen stories:', error);
    }
  }

  /**
   * Reset all seen stories (for testing)
   */
  resetStories(): void {
    this.seenStories.clear();
    this.saveSeenStories();
  }
}
