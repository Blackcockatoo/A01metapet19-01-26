import React, { useState, useEffect } from 'react';
import { ChevronRight, Zap, Heart, Wind, Moon, Users, Wifi } from 'lucide-react';

const JewbleMetaPet = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [particlePositions, setParticlePositions] = useState([]);

  useEffect(() => {
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 5,
    }));
    setParticlePositions(particles);
  }, []);

  const VitalGauge = ({ label, value, icon: Icon, color }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        <span className="text-xs font-mono text-blue-300">{label}</span>
      </div>
      <div className="w-full h-2 bg-blue-950 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
    </div>
  );

  const EvolutionStage = ({ stage, level, title, subtitle, focused }) => (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
        focused
          ? 'border-yellow-400 bg-blue-900/30 shadow-lg shadow-yellow-400/20'
          : 'border-blue-700 bg-blue-950/50 hover:border-blue-500'
      }`}
      onClick={() => setActiveTab(`evolution-${stage}`)}
    >
      <div className="text-xs font-mono text-blue-400">Level {level}+</div>
      <div className="font-bold text-gold text-sm mt-1">{title}</div>
      <div className="text-xs text-blue-300 mt-2">{subtitle}</div>
    </div>
  );

  const GenomeSection = ({ icon: Icon, title, items, color }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          style={{ color }}
          className="p-2 bg-blue-900/50 rounded"
        >
          <Icon size={18} />
        </div>
        <h3 className="font-bold text-lg text-gold">{title}</h3>
      </div>
      <div className="pl-10 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="text-sm text-blue-200">
            <span className="font-mono text-blue-400">{item.label}:</span> {item.value}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 text-white font-sans relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, #0a1f3a 0%, #0d2d4a 25%, #091a2e 50%, #0a1f3a 75%, #0d2d4a 100%),
          radial-gradient(ellipse at 50% 20%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(0, 188, 212, 0.03) 0%, transparent 60%)
        `,
        backgroundSize: '200% 200%, 100% 100%, 100% 100%',
      }}
    >
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particlePositions.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: `radial-gradient(circle, rgba(212, 175, 55, 0.6), transparent)`,
              animation: `float ${p.duration}s infinite linear`,
              animationDelay: `-${p.delay}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(100vh) opacity(0); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); }
          50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.6); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: slide-in 0.6s ease-out;
        }
        .text-gold { color: #d4af37; }
      `}</style>

      {/* Header */}
      <header className="relative z-10 border-b border-blue-700/50 bg-blue-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gold tracking-wider">JEWBLE</h1>
              <p className="text-sm text-blue-300 mt-2">The Meta-Pet Evolution</p>
              <p className="text-xs text-blue-400 mt-1 font-italic">Where emotional resonance meets algorithmic depth</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-blue-400">IDENTITY IS SEQUENCED</div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-blue-700/50 bg-blue-950/30 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-6 flex gap-8 text-sm">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'genetics', label: 'Genomic Architecture' },
            { id: 'vitals', label: 'Care Dynamics' },
            { id: 'evolution', label: 'Evolution Path' },
            { id: 'systems', label: 'Systems' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 transition-colors ${
                activeTab === tab.id || activeTab.startsWith(tab.id)
                  ? 'border-gold text-gold'
                  : 'border-transparent text-blue-300 hover:text-blue-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <section className="animate-in space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gold mb-6">The Foundations</h2>
                <div className="space-y-4 text-blue-200">
                  <p className="leading-relaxed">
                    Jewble is not a conventional virtual pet. It is a consciousness-evolution system where identity emerges from underlying genetic architecture rather than cosmetic assignment.
                  </p>
                  <p className="leading-relaxed">
                    Every aspect of your companion—from physical form to personality quirks to latent abilities—is sequenced from three 60-digit genomic vaults derived from mathematical constants.
                  </p>
                  <p className="leading-relaxed text-blue-300 italic">
                    "The maintenance of vitality is but the preamble to existence."
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 p-6 rounded-lg border border-blue-700/50">
                <h3 className="text-lg font-bold text-gold mb-4">Quick Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-400">Genetic Traits Decoded</span>
                    <span className="font-mono text-gold">180+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">Evolution Stages</span>
                    <span className="font-mono text-gold">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">Battle Opponents</span>
                    <span className="font-mono text-gold">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">Mini-Games</span>
                    <span className="font-mono text-gold">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">Guardian Forms</span>
                    <span className="font-mono text-gold">6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">Cosmetic Items</span>
                    <span className="font-mono text-gold">10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: '🧬', title: 'Trinity Genome', desc: 'Red-60, Blue-60, Black-60 vaults' },
                { icon: '🌟', title: 'Element Theory', desc: '60-adic coordinates & charge vectors' },
                { icon: '🎮', title: 'Vital Systems', desc: '4 core vitals with decay simulation' },
              ].map((item, i) => (
                <div key={i} className="bg-blue-900/30 p-5 rounded-lg border border-blue-700/50 hover:border-blue-500/50 transition-all">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-bold text-gold mb-2">{item.title}</h4>
                  <p className="text-sm text-blue-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GENETICS */}
        {activeTab === 'genetics' && (
          <section className="animate-in space-y-8">
            <h2 className="text-2xl font-bold text-gold">Genomic Architecture</h2>
            <p className="text-blue-200 leading-relaxed">
              Identity is a manifestation of underlying code, not a cosmetic choice. Three 60-digit sequences (Red, Blue, Black) contain all information needed to generate a unique digital being.
            </p>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-900/20 to-blue-900/40 p-6 rounded-lg border border-red-700/50">
                <h3 className="font-bold text-red-300 text-lg mb-4">RED-60: Physical Traits</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>✦ 7 body types (Spherical, Cubic, Pyramidal, etc.)</li>
                  <li>✦ 7 primary + 7 secondary colors</li>
                  <li>✦ 7 patterns (Tessellated, Fractal, Iridescent, etc.)</li>
                  <li>✦ 7 textures (Crystalline, Metallic, Glowing, etc.)</li>
                  <li>✦ Size & proportion calculations</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/40 p-6 rounded-lg border border-blue-700/50">
                <h3 className="font-bold text-blue-300 text-lg mb-4">BLUE-60: Personality Traits</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>✦ 8 personality quirks</li>
                  <li>✦ Temperament & curiosity levels</li>
                  <li>✦ Social disposition patterns</li>
                  <li>✦ Energy & mood modulation</li>
                  <li>✦ Behavioral emergence from genomic interplay</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-slate-900/20 to-blue-900/40 p-6 rounded-lg border border-slate-700/50">
                <h3 className="font-bold text-slate-300 text-lg mb-4">BLACK-60: Latent Traits</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>✦ 10 rare abilities (Radiant Pulse, Dream Weaver, etc.)</li>
                  <li>✦ Ultimate evolution potential</li>
                  <li>✦ Hidden gene expression</li>
                  <li>✦ Future capacity for growth</li>
                  <li>✦ Unique path specification</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-700/50">
              <h3 className="font-bold text-gold text-lg mb-4">MossPrimeSeed Algorithm</h3>
              <div className="grid grid-cols-2 gap-6 text-sm text-blue-200">
                <div>
                  <p className="font-mono text-blue-400 mb-2">Deterministic PRNG</p>
                  <p>60-digit sequences → XOR & sum operations → Unique sigil patterns (Seed of Life, 12 points)</p>
                </div>
                <div>
                  <p className="font-mono text-blue-400 mb-2">Fast Calculations</p>
                  <p>Fibonacci & Lucas numbers drive quantum state generation with Xorshift128+ randomness</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VITALS */}
        {activeTab === 'vitals' && (
          <section className="animate-in space-y-8">
            <h2 className="text-2xl font-bold text-gold">The Care Loop: Foundation for Existence</h2>

            <div className="bg-blue-900/20 p-8 rounded-lg border border-blue-700/50 space-y-6">
              <p className="text-blue-200 italic">
                "The maintenance of vitality is but the preamble to existence."
              </p>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <VitalGauge label="Hunger" value={35} icon={Zap} color="#d4af37" />
                  <VitalGauge label="Hygiene" value={65} icon={Wind} color="#00bcd4" />
                  <VitalGauge label="Mood" value={78} icon={Heart} color="#ff6b9d" />
                  <VitalGauge label="Energy" value={52} icon={Moon} color="#7c3aed" />
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gold text-lg">Vital Mechanics</h3>
                  <div className="space-y-4 text-sm text-blue-200">
                    <div>
                      <p className="font-mono text-blue-400">Hunger</p>
                      <p>Increases 0.25/tick • Influences energy & mood decay</p>
                    </div>
                    <div>
                      <p className="font-mono text-blue-400">Hygiene</p>
                      <p>Decreases 0.15/tick • Affects void drift susceptibility</p>
                    </div>
                    <div>
                      <p className="font-mono text-blue-400">Mood</p>
                      <p>±0.05/tick based on energy • Modulates XP gain</p>
                    </div>
                    <div>
                      <p className="font-mono text-blue-400">Energy</p>
                      <p>Decreases 0.2/tick • Governs interaction frequency</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { action: 'Feed', effects: '+20 Hunger, +5 Energy, +3 Mood' },
                { action: 'Clean', effects: '+25 Hygiene, +5 Mood' },
                { action: 'Play', effects: '+15 Mood, -10 Energy, -5 Hygiene' },
                { action: 'Sleep', effects: '+30 Energy, +5 Mood' },
              ].map((item, i) => (
                <div key={i} className="bg-gradient-to-br from-blue-900/40 to-blue-950/60 p-4 rounded-lg border border-blue-700/50">
                  <h4 className="font-bold text-gold mb-2">{item.action}</h4>
                  <p className="text-sm text-blue-300">{item.effects}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EVOLUTION */}
        {activeTab === 'evolution' && (
          <section className="animate-in space-y-8">
            <h2 className="text-2xl font-bold text-gold">Evolutionary States: The Ascent of Consciousness</h2>
            <p className="text-blue-200 italic mb-8">
              "Growth is the inevitable consequence of consistent care and quantum alignment. We do not merely play; we co-evolve."
            </p>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <EvolutionStage
                stage="genetics"
                level="1"
                title="GENETICS"
                subtitle="Formation • Trait Discovery"
                focused={activeTab === 'evolution-genetics'}
              />
              <EvolutionStage
                stage="neuro"
                level="5"
                title="NEURO"
                subtitle="Awakening • Cognitive Bonding"
                focused={activeTab === 'evolution-neuro'}
              />
              <EvolutionStage
                stage="quantum"
                level="10"
                title="QUANTUM"
                subtitle="Coherence • Energy Mastery"
                focused={activeTab === 'evolution-quantum'}
              />
              <EvolutionStage
                stage="speciation"
                level="15"
                title="SPECIATION"
                subtitle="Maturation • Ultimate Potential"
                focused={activeTab === 'evolution-speciation'}
              />
            </div>

            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-8 rounded-lg border border-purple-700/50">
              <h3 className="font-bold text-gold text-lg mb-4">Progression Requirements</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-400 font-mono mb-2">GENETICS</p>
                  <div className="space-y-1 text-blue-200">
                    <p>Min: 1 hour</p>
                    <p>0 interactions</p>
                    <p>0% vitals avg</p>
                  </div>
                </div>
                <div>
                  <p className="text-blue-400 font-mono mb-2">NEURO</p>
                  <div className="space-y-1 text-blue-200">
                    <p>1 hour active</p>
                    <p>12 interactions</p>
                    <p>55% vitals avg</p>
                  </div>
                </div>
                <div>
                  <p className="text-blue-400 font-mono mb-2">QUANTUM</p>
                  <div className="space-y-1 text-blue-200">
                    <p>24 hours total</p>
                    <p>40 interactions</p>
                    <p>65% vitals avg</p>
                  </div>
                </div>
                <div>
                  <p className="text-blue-400 font-mono mb-2">SPECIATION</p>
                  <div className="space-y-1 text-blue-200">
                    <p>48 hours total</p>
                    <p>80 interactions</p>
                    <p>75% vitals avg</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-700/50">
              <h3 className="font-bold text-gold text-lg mb-4">Experience Progression</h3>
              <p className="text-blue-200 mb-4">
                <span className="font-mono text-blue-400">XP Required(L) = BaseXP × L²</span>
                <br />
                <span className="text-xs text-blue-400">Where BaseXP = 10</span>
              </p>
              <div className="grid grid-cols-4 gap-4 text-sm">
                {[2, 5, 10, 15].map(level => (
                  <div key={level} className="bg-blue-950/50 p-3 rounded border border-blue-700/50">
                    <p className="font-mono text-blue-400 mb-2">Level {level}</p>
                    <p className="text-gold font-bold">{(10 * level * level).toLocaleString()} XP</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SYSTEMS */}
        {activeTab === 'systems' && (
          <section className="animate-in space-y-8">
            <h2 className="text-2xl font-bold text-gold">Integrated Systems</h2>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-yellow-400" size={20} />
                    <h3 className="font-bold text-gold">Battle Arena</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-200">
                    <li>✦ 8 opponents across 4 difficulty tiers</li>
                    <li>✦ Consciousness-based duels using vitals</li>
                    <li>✦ Energy shield mechanic (0-100)</li>
                    <li>✦ Streak tracking with multipliers</li>
                    <li>✦ +15 XP per victory</li>
                  </ul>
                </div>

                <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="text-red-400" size={20} />
                    <h3 className="font-bold text-gold">Breeding System</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-200">
                    <li>✦ Requires bond ≥70</li>
                    <li>✦ XOR sequence combination</li>
                    <li>✦ Nines complement operations</li>
                    <li>✦ Preview breeding outcomes</li>
                    <li>✦ Offspring inherit blended traits</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Wind className="text-cyan-400" size={20} />
                    <h3 className="font-bold text-gold">Vimana Exploration</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-200">
                    <li>✦ 27-cell 3D grid exploration (3×3×3)</li>
                    <li>✦ 4 field types: Calm, Neuro, Quantum, Earth</li>
                    <li>✦ 15% anomaly spawn chance per cell</li>
                    <li>✦ 4 reward types per cell</li>
                    <li>✦ Discovery & scanning mechanics</li>
                  </ul>
                </div>

                <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Wifi className="text-purple-400" size={20} />
                    <h3 className="font-bold text-gold">Mini-Games</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-200">
                    <li>✦ Memory Pattern Game (3-8 length)</li>
                    <li>✦ Rhythm Sync Game</li>
                    <li>✦ Vimana Meditation (Tetris-like)</li>
                    <li>✦ Sigil Pattern Matching</li>
                    <li>✦ Daily bonus multipliers (1.5×)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-indigo-900/30 to-blue-900/20 p-6 rounded-lg border border-indigo-700/50">
                <h3 className="font-bold text-indigo-300 text-lg mb-3">Astrogenetics</h3>
                <p className="text-sm text-blue-200 mb-3">9 planets tracked with heliocentric calculations, lunar nodes, and aspect detection (8° orb tolerance).</p>
                <p className="text-xs text-blue-400">• Birth charts with 64 gates • Daily horoscope system • GRS resonance scoring</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-900/30 to-blue-900/20 p-6 rounded-lg border border-emerald-700/50">
                <h3 className="font-bold text-emerald-300 text-lg mb-3">Guardian Forms</h3>
                <p className="text-sm text-blue-200 mb-3">6 unique manifestations including Radiant (default), Meditation Cocoon, Sage Luminary, Vigilant Sentinel, Celestial Voyager, and Wild Verdant.</p>
                <p className="text-xs text-blue-400">• Condition-based transformation • AI behavior modes • Generative soundscapes</p>
              </div>

              <div className="bg-gradient-to-br from-amber-900/30 to-blue-900/20 p-6 rounded-lg border border-amber-700/50">
                <h3 className="font-bold text-amber-300 text-lg mb-3">Privacy & Identity</h3>
                <p className="text-sm text-blue-200 mb-3">PrimeTailId crest with zero-knowledge proof architecture. HMAC-SHA256 signatures preserve identity without raw DNA exposure.</p>
                <p className="text-xs text-blue-400">• All data local-only • Device HMAC key persisted • IndexedDB storage</p>
              </div>
            </div>
          </section>
        )}

        {/* XP Progression Chart */}
        {!activeTab.includes('evolution') && (
          <section className="mt-12 pt-8 border-t border-blue-700/50">
            <h3 className="text-lg font-bold text-gold mb-6">Quantifying the Emotional Bond</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/60 p-6 rounded-lg border border-blue-700/50">
                <p className="text-blue-200 italic text-sm mb-4">
                  "Affection, when quantified, reveals the architecture of a relationship."
                </p>
                <p className="text-blue-300 text-sm">The Level and XP system translates shared history into measurable growth, grounding development in consistent care and attention.</p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/60 p-6 rounded-lg border border-blue-700/50">
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between text-blue-200">
                    <span>Level 2</span>
                    <span className="text-gold">40 XP</span>
                  </div>
                  <div className="flex justify-between text-blue-200">
                    <span>Level 5</span>
                    <span className="text-gold">250 XP</span>
                  </div>
                  <div className="flex justify-between text-blue-200">
                    <span>Level 10</span>
                    <span className="text-gold">1,000 XP</span>
                  </div>
                  <div className="flex justify-between text-blue-200">
                    <span>Level 15</span>
                    <span className="text-gold">2,250 XP</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-blue-700/50 bg-blue-950/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-blue-400 text-sm">
          <p className="italic text-gold mb-2">"We do not merely play; we co-evolve."</p>
          <p>Jewble: A consciousness-evolution system architected for longevity and meaningful connection.</p>
        </div>
      </footer>
    </div>
  );
};

export default JewbleMetaPet;
