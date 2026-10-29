import React, { useState } from 'react';
import { Scenario, AppLevel } from '../types';
import { X, Sparkles, Wand2, Compass, Loader2 } from 'lucide-react';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';

interface SandboxModalProps {
  userLevel: AppLevel;
  onClose: () => void;
  onStartScenario: (scenario: Scenario) => void;
}

export const SandboxModal: React.FC<SandboxModalProps> = ({
  userLevel,
  onClose,
  onStartScenario,
}) => {
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    'Besok aku ada presentasi marketing produk sepatu ke bos yang galak. Ayo simulasi.',
    'Simulasi tawar-menawar harga souvenir unik di pasar malam London.',
    'Wawancara beasiswa S2 luar negeri dengan profesor yang kritis.',
    'Komplain ke kasir restoran karena salah memberikan tagihan dan makanan dingin.',
    'Debat santai dengan teman bule tentang kelebihan hidup di kota vs pedesaan.',
  ];

  const handleGenerate = async (presetText?: string) => {
    const text = presetText || ideaPrompt;
    if (!text.trim() || loading) return;

    playClickSound();
    setLoading(true);

    try {
      const response = await fetch('/api/roleplay/sandbox-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text.trim(),
          userLevel,
        }),
      });

      const data = await response.json();
      playSuccessSound();

      const newScenario: Scenario = {
        id: data.id || `custom-${Date.now()}`,
        title: data.title || 'Simulasi Kustom',
        category: (data.category as any) || 'Custom',
        level: userLevel,
        userRole: data.userRole || 'Learner',
        aiRole: data.aiRole || 'Partner',
        context: data.context || text,
        targetGoal: data.targetGoal || 'Berkomunikasi dengan lancar',
        initialMessage: data.initialMessage || "Hello! Let's get started with our scenario.",
        initialTranslation: data.initialTranslation || 'Halo! Mari kita mulai skenario kita.',
        suggestedStarterReplies: data.suggestedStarterReplies || ['Good day!', 'Let me explain my situation.'],
        icon: '🎭',
        isCustom: true,
      };

      onStartScenario(newScenario);
      onClose();
    } catch (err) {
      console.error('Sandbox error:', err);
      // Fallback custom scenario
      const fallback: Scenario = {
        id: `custom-${Date.now()}`,
        title: 'Simulasi: ' + text.slice(0, 25),
        category: 'Custom',
        level: userLevel,
        userRole: 'Kamu (Pembicara)',
        aiRole: 'Lawan Bicara',
        context: text,
        targetGoal: 'Selesaikan simulasi dengan percaya diri',
        initialMessage: "Hello! I am ready to practice with you. What would you like to say first?",
        initialTranslation: 'Halo! Saya siap berlatih dengan Anda. Apa yang ingin Anda katakan terlebih dahulu?',
        suggestedStarterReplies: ["Thank you for having me.", "Let's dive into our topic."],
        icon: '🎭',
        isCustom: true,
      };
      onStartScenario(fallback);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-4 border-white animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <div>
              <h3 className="font-bubbly text-xl font-bold text-slate-800">
                Custom Roleplay Sandbox
              </h3>
              <p className="text-xs text-slate-500">
                Rancang situasi atau skenario apa saja yang ingin kamu simulasikan!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input box */}
        <div className="my-4">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Tulis Skenario Impianmu:
          </label>
          <textarea
            value={ideaPrompt}
            onChange={(e) => setIdeaPrompt(e.target.value)}
            rows={3}
            placeholder='Contoh: "Besok aku ada presentasi marketing produk sepatu ke bos yang galak. Ayo simulasi."'
            className="w-full bg-slate-50 rounded-2xl p-4 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-800 placeholder:text-slate-400"
            disabled={loading}
          />
        </div>

        {/* Presets */}
        <div className="mb-6">
          <span className="text-xs font-bold text-slate-500 uppercase block mb-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            Atau pilih ide populer:
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setIdeaPrompt(preset)}
                className="w-full text-left text-xs bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 p-2.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{preset}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleGenerate()}
          disabled={!ideaPrompt.trim() || loading}
          className="btn-3d btn-3d-purple w-full py-3.5 rounded-2xl font-bubbly text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI Sedang Merancang Skenario...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Buat Simulasi & Mulai Roleplay!
            </>
          )}
        </button>
      </div>
    </div>
  );
};
