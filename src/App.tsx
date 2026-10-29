import React, { useState, useEffect, useRef } from 'react';
import { AppLevel, Scenario, ChatMessage, VocabItem, PronunciationEval } from './types';
import {
  LEVEL_CONFIGS,
  INITIAL_SCENARIOS,
  INITIAL_VOCAB_VAULT,
  INITIAL_GRAMMAR_PITFALLS,
} from './data/curriculum';
import { MascotBird } from './components/MascotBird';
import { PronunciationModal } from './components/PronunciationModal';
import { SandboxModal } from './components/SandboxModal';
import { VocabVault } from './components/VocabVault';
import { RapotDashboard } from './components/RapotDashboard';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Languages,
  Sparkles,
  BookmarkPlus,
  BookmarkCheck,
  ChevronDown,
  Layers,
  BarChart3,
  Flame,
  Heart,
  RotateCcw,
  Plus,
  Compass,
  CheckCircle2,
  Menu,
  X,
  VolumeX,
  Lightbulb,
} from 'lucide-react';
import {
  playClickSound,
  playSuccessSound,
  playLevelUpSound,
  speakEnglish,
  stopSpeech,
  playMicBeep,
} from './utils/soundEffects';

export default function App() {
  // Level & Profile State
  const [currentLevel, setCurrentLevel] = useState<AppLevel>('intermediate');
  const [hearts, setHearts] = useState(5);
  const [streakDays, setStreakDays] = useState(10);
  const [xp, setXp] = useState(380);

  // Core User Preference: Indonesian Translation Visibility Toggle (Bisa Muncul atau Tidak)
  const [showIndonesianTranslation, setShowIndonesianTranslation] = useState<boolean>(true);

  // Sound settings
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);

  // Scenarios & Active Chat Topic
  const [scenariosList, setScenariosList] = useState<Scenario[]>(INITIAL_SCENARIOS);
  const [activeScenario, setActiveScenario] = useState<Scenario>(INITIAL_SCENARIOS[0]);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [perMessageTranslation, setPerMessageTranslation] = useState<Record<string, boolean>>({});

  // Slide-over & Modals
  const [showTopicDrawer, setShowTopicDrawer] = useState(false);
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [showRapotModal, setShowRapotModal] = useState(false);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [activePronounceEval, setActivePronounceEval] = useState<{
    eval: PronunciationEval;
    spokenText: string;
  } | null>(null);

  // Saved Vocab Vault
  const [savedVocab, setSavedVocab] = useState<VocabItem[]>(INITIAL_VOCAB_VAULT);
  const [selectedWordToSave, setSelectedWordToSave] = useState<VocabItem | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const levelConfig = LEVEL_CONFIGS[currentLevel];

  // Initialize chat ONLY when activeScenario.id changes (not when currentLevel changes!)
  useEffect(() => {
    setLoading(false);
    const starterMsg: ChatMessage = {
      id: `init-${activeScenario.id}`,
      role: 'assistant',
      content: activeScenario.initialMessage,
      translation: activeScenario.initialTranslation,
      timestamp: Date.now(),
      vocabHighlights: [],
    };
    setMessages([starterMsg]);
    setSuggestedReplies(activeScenario.suggestedStarterReplies || []);
    if (autoPlayAudio) {
      speakEnglish(activeScenario.initialMessage);
    }
  }, [activeScenario.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Toggle translation on a specific message
  const toggleMessageTranslation = (id: string) => {
    playClickSound();
    setPerMessageTranslation((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? !showIndonesianTranslation : !prev[id],
    }));
  };

  // Determine if translation should show for a specific message
  const isTranslationVisible = (id: string) => {
    if (perMessageTranslation[id] !== undefined) {
      return perMessageTranslation[id];
    }
    return showIndonesianTranslation;
  };

  // Contextual fallback helper so AI NEVER hangs and always connects ("nyambung") to what the user said
  const getContextualFallback = (userText: string, scenario: Scenario, level: AppLevel) => {
    const corrections: Array<{ original: string; better: string; explanation: string }> = [];
    if (/\bi am agree\b/i.test(userText)) {
      corrections.push({ original: "I am agree", better: "I agree", explanation: "'Agree' adalah kata kerja, jadi cukup ucapkan 'I agree' tanpa to-be 'am'." });
    } else if (/\bshe don't\b|\bhe don't\b/i.test(userText)) {
      corrections.push({ original: "don't", better: "doesn't", explanation: "Untuk subjek tunggal (He/She/It), gunakan 'doesn't', bukan 'don't'." });
    } else if (/\byesterday i go\b/i.test(userText)) {
      corrections.push({ original: "yesterday I go", better: "yesterday I went", explanation: "Penanda waktu lampau (yesterday) membutuhkan kata kerja bentuk ke-2 (went)." });
    } else if (/\bmore better\b/i.test(userText)) {
      corrections.push({ original: "more better", better: "much better", explanation: "'Better' sudah berarti lebih baik. Gunakan 'much better' untuk penekanan." });
    }

    const lower = userText.toLowerCase();

    // 1. Topic: Video, YouTube, Movie, Documentary
    if (lower.includes('video') || lower.includes('youtube') || lower.includes('movie') || lower.includes('film') || lower.includes('watch')) {
      return {
        en: "A video! That sounds really fascinating. What was the central topic or story in the video that caught your attention the most?",
        id: "Sebuah video! Itu terdengar sangat menarik. Apa topik utama atau cerita dalam video tersebut yang paling menarik perhatianmu?",
        corrections,
        vocab: [{ word: "catch attention", meaning: "menarik perhatian", partOfSpeech: "idiom", example: "The visuals in the video really caught my attention." }],
        suggested: [
          "It was about learning new habits and productivity.",
          "It explained how technology and AI are shaping our future.",
          "It was a creative short film with an unexpected twist."
        ]
      };
    }

    // 2. Topic: Inspiration, Passion, Dream, Learning
    if (lower.includes('inspire') || lower.includes('passion') || lower.includes('dream') || lower.includes('learn') || lower.includes('study')) {
      return {
        en: "That is a powerful spark of inspiration. How do you plan to apply that new idea or motivation to your daily routine?",
        id: "Itu percikan inspirasi yang sangat berharga. Bagaimana kamu berencana menerapkan ide atau motivasi baru itu dalam rutinitas harianmu?",
        corrections,
        vocab: [{ word: "apply", meaning: "menerapkan atau mempraktikkan", partOfSpeech: "verb", example: "I want to apply what I learned into practice." }],
        suggested: [
          "I want to practice speaking for at least 15 minutes each day.",
          "I am starting a personal project to test the idea.",
          "I am taking small consistent steps every morning."
        ]
      };
    }

    // 3. Topic: Work, Career, Job, Business
    if (scenario.category === 'Work' || lower.includes('work') || lower.includes('job') || lower.includes('project') || lower.includes('boss')) {
      return {
        en: "I appreciate you sharing those details. From a strategic standpoint, what would be the most critical milestone you would prioritize first?",
        id: "Saya menghargai detail yang Anda bagikan tersebut. Dari sudut pandang strategis, apa pencapaian paling krusial yang akan Anda prioritaskan terlebih dahulu?",
        corrections,
        vocab: [{ word: "tangible results", meaning: "hasil nyata / konkret", partOfSpeech: "collocation", example: "We need tangible results before expanding the budget." }],
        suggested: [
          "My initial focus would be streamlining our current workflow.",
          "I would establish clear milestones with the team.",
          "Let's focus on delivering a quick prototype first."
        ]
      };
    }

    // 4. Topic: Travel, Hotel, Trip
    if (scenario.category === 'Travel' || lower.includes('hotel') || lower.includes('flight') || lower.includes('trip') || lower.includes('room')) {
      return {
        en: "I completely understand that situation. Let me personally look into this for you right away. What would be the most convenient solution for you?",
        id: "Saya sangat memahami situasi tersebut. Biar saya langsung bantu periksa sekarang juga. Solusi apa yang paling nyaman bagi Anda?",
        corrections,
        vocab: [{ word: "look into", meaning: "memeriksa atau mencari tahu", partOfSpeech: "phrasal verb", example: "Let me look into the room availability." }],
        suggested: [
          "Could you check if an alternative room is available?",
          "I would appreciate an update as soon as possible.",
          "Thank you for helping me resolve this quickly."
        ]
      };
    }

    // 5. Academic / IELTS / Debate
    if (scenario.category === 'Academic' || scenario.title.includes('IELTS') || lower.includes('society') || lower.includes('technology')) {
      return {
        en: "That is a well-argued point. To explore this deeper, what counter-arguments do you think skeptics might raise against that perspective?",
        id: "Itu argumen yang beralasan kuat. Untuk menggali lebih dalam, argumen bantahan apa yang menurut Anda mungkin diajukan oleh para skeptis?",
        corrections,
        vocab: [{ word: "counter-argument", meaning: "argumen sanggahan/bantahan", partOfSpeech: "noun", example: "Always prepare a counter-argument during debates." }],
        suggested: [
          "Skeptics would likely argue that short-term costs are too high.",
          "They might contend that public awareness is still insufficient.",
          "While there are valid concerns, the long-term benefits outweigh them."
        ]
      };
    }

    // 6. General Conversational default that dynamically reflects the user's input
    return {
      en: `That is really interesting! You mentioned "${userText.length > 25 ? userText.slice(0, 25) + '...' : userText}". What made you feel that way?`,
      id: `Itu sangat menarik! Kamu menyebutkan "${userText.length > 25 ? userText.slice(0, 25) + '...' : userText}". Apa yang membuatmu merasakan hal tersebut?`,
      corrections,
      vocab: [{ word: "point of view", meaning: "sudut pandang", partOfSpeech: "phrase", example: "I really appreciate your unique point of view." }],
      suggested: [
        "To be honest, it has been on my mind for a while.",
        "A friend of mine mentioned something similar recently.",
        "What are your thoughts on this topic?"
      ]
    };
  };

  // Send message - AI ALWAYS RESPONDS CONTINUOUSLY WITHOUT HANGING
  const handleSendMessage = async (textToSend?: string, wasSpoken: boolean = false) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    playClickSound();
    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
      isSpoken: wasSpoken,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText('');
    setSuggestedReplies([]); // Immediately clear suggestions to avoid stale chips
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      if (wasSpoken) {
        fetch('/api/speech/pronounce-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spokenText: text.trim(), userLevel: currentLevel }),
        })
          .then((r) => r.json())
          .then((evalData) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === userMsgId
                  ? {
                      ...m,
                      pronunciationScore: evalData.pronunciationScore,
                      spokenEvaluation: evalData,
                    }
                  : m
              )
            );
          })
          .catch(() => {});
      }

      // Send to scenario roleplay with timeout protection
      const response = await fetch('/api/chat/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          scenario: activeScenario,
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          level: currentLevel,
          latestUserMessage: text.trim(),
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Scenario response missing reply');
      }

      playSuccessSound();

      const aiMsgId = `ai-${Date.now()}`;

      const assistantMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: data.reply,
        translation: data.indonesianTranslation || '',
        timestamp: Date.now(),
        corrections: data.corrections || [],
        vocabHighlights: data.vocabHighlights || [],
        toneFeedback: data.toneFeedback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setXp((prev) => prev + 10);

      // Filter suggested replies to avoid any that the user has already sent
      if (data.suggestedReplies && Array.isArray(data.suggestedReplies)) {
        const pastUserSent = new Set(
          updated.filter((m) => m.role === 'user').map((m) => m.content.toLowerCase().trim())
        );
        const filteredSuggestions = data.suggestedReplies.filter(
          (reply: string) =>
            reply &&
            !pastUserSent.has(reply.toLowerCase().trim()) &&
            reply.toLowerCase().trim() !== text.toLowerCase().trim()
        );
        setSuggestedReplies(filteredSuggestions);
      }

      if (autoPlayAudio) {
        speakEnglish(assistantMsg.content);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Handling response with in-character fallback:', err);
      const fallback = getContextualFallback(text, activeScenario, currentLevel);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fallback.en,
        translation: fallback.id,
        timestamp: Date.now(),
        corrections: fallback.corrections,
        vocabHighlights: fallback.vocab,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setSuggestedReplies(fallback.suggested);
      if (autoPlayAudio) {
        speakEnglish(fallback.en);
      }
    } finally {
      setLoading(false);
    }
  };

  // Speech-to-text recognition
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser kamu belum mendukung Speech Recognition. Silakan ketik langsung ya!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      playMicBeep();
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleSendMessage(transcript, true);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Add vocab to vault
  const handleSaveVocab = (vocab: VocabItem) => {
    playSuccessSound();
    setSavedVocab((prev) => {
      const exists = prev.some((v) => v.word.toLowerCase() === vocab.word.toLowerCase());
      if (exists) return prev;
      return [vocab, ...prev];
    });
    setXp((prev) => prev + 15);
    setSelectedWordToSave(null);
  };

  const handleToggleMastered = (id: string) => {
    setSavedVocab((prev) =>
      prev.map((v) => (v.id === id ? { ...v, mastered: !v.mastered } : v))
    );
  };

  const savedWordsSet = new Set(savedVocab.map((v) => v.word.toLowerCase()));

  return (
    <div className="min-h-screen sm:h-screen w-full flex items-center justify-center bg-slate-900/10 p-0 sm:p-3 md:p-4 select-none">
      {/* 16:9 Aspect-Optimized Application Container (Desktop 16:9 + Mobile HP Fullscreen) */}
      <div className="w-full max-w-6xl h-screen sm:h-[94vh] sm:max-h-[880px] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border-2 sm:border-slate-200/80 relative">
        
        {/* Top Header Navbar */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 z-20 shrink-0 shadow-2xs">
          {/* Left: Mascot & Brand & Scenario Switcher Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowTopicDrawer(true);
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Pilih Topik Obrolan"
            >
              <Menu className="w-5 h-5" />
              <MascotBird size={36} mood="talking" animated={false} />
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bubbly text-xl sm:text-2xl font-black text-sky-500 leading-none">
                  Fasih.ai
                </span>
                <span className="text-xs">{activeScenario.icon}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTopicDrawer(true)}
                className="text-[11px] font-bold text-slate-600 hover:text-sky-600 flex items-center gap-1 cursor-pointer truncate max-w-[140px] sm:max-w-[220px]"
              >
                <span>{activeScenario.title}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Center / Right: Translation Toggle & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* OPSI BAHASA INDONESIA BISA MUNCUL ATAU TIDAK (REQUEST KHUSUS USER) */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowIndonesianTranslation(!showIndonesianTranslation);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer border ${
                showIndonesianTranslation
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200/50'
                  : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
              }`}
              title="Aktifkan atau sembunyikan terjemahan Bahasa Indonesia"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">🇮🇩 Terjemahan:</span>
              <span
                className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md ${
                  showIndonesianTranslation ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {showIndonesianTranslation ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Level Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setLevelDropdownOpen(!levelDropdownOpen);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer"
                style={{
                  backgroundColor: levelConfig.bgColor,
                  borderColor: levelConfig.borderColor,
                  color: levelConfig.accentColor,
                }}
              >
                <span>{levelConfig.icon}</span>
                <span className="hidden md:inline">{levelConfig.title.split(' ')[0]}</span>
                <span className="text-[10px] font-black bg-white/90 px-1 rounded">
                  {levelConfig.cefr}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {levelDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-60 bg-white rounded-2xl p-2 border-2 border-slate-200 shadow-2xl z-50 animate-scale-up">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 py-1">
                    Ubah Level Percakapan:
                  </span>
                  {(['beginner', 'intermediate', 'advanced', 'expert'] as AppLevel[]).map((lvl) => {
                    const cfg = LEVEL_CONFIGS[lvl];
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setCurrentLevel(lvl);
                          setLevelDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer ${
                          currentLevel === lvl
                            ? 'bg-sky-50 text-sky-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{cfg.icon}</span>
                          <div>
                            <p className="font-bubbly font-bold">{cfg.title}</p>
                            <p className="text-[10px] font-normal text-slate-500">{cfg.cefr}</p>
                          </div>
                        </div>
                        {currentLevel === lvl && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Action: Audio Autoplay Mute/Unmute */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                if (autoPlayAudio) stopSpeech();
                setAutoPlayAudio(!autoPlayAudio);
              }}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                autoPlayAudio
                  ? 'bg-sky-50 text-sky-600 border-sky-200'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
              title={autoPlayAudio ? 'Suara otomatis aktif' : 'Suara otomatis dibisukan'}
            >
              {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Vocab Vault Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowVocabModal(true);
              }}
              className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Buka Brankas Kosakata"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Vault</span>
              <span className="text-[10px] bg-amber-200/80 px-1 rounded-md font-black">
                {savedVocab.length}
              </span>
            </button>

            {/* Rapot Progres Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowRapotModal(true);
              }}
              className="flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Buka Rapot Progres Belajar"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Rapot</span>
            </button>

            {/* Reset / New Chat Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                const starterMsg: ChatMessage = {
                  id: `init-${activeScenario.id}-${Date.now()}`,
                  role: 'assistant',
                  content: activeScenario.initialMessage,
                  translation: activeScenario.initialTranslation,
                  timestamp: Date.now(),
                  vocabHighlights: [],
                };
                setMessages([starterMsg]);
                setSuggestedReplies(activeScenario.suggestedStarterReplies || []);
              }}
              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Mulai Obrolan Baru"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* End Conversation Button */}
            <button
              type="button"
              onClick={() => {
                playSuccessSound();
                setShowEndSessionModal(true);
              }}
              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Akhiri percakapan dan lihat rangkuman"
            >
              <span>🛑</span>
              <span className="hidden md:inline">Akhiri</span>
            </button>

            {/* Unlimited Chat & Streak Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-800">
              <span className="text-emerald-600">⚡ Tanpa Batas</span>
              <span className="text-emerald-300">|</span>
              <span className="text-amber-500">🔥 {streakDays}</span>
            </div>
          </div>
        </header>

        {/* Main Chatting Viewport */}
        <div className="flex-1 flex overflow-hidden relative bg-[#f8fafc]">
          
          {/* Chat Messages Stream */}
          <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
            
            {/* Top Scenario Context Alert */}
            <div className="bg-sky-50/90 border-b border-sky-100 px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-sky-900 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold">🎭 Peran:</span>
                <span className="truncate">{activeScenario.userRole}</span>
                <span className="text-sky-300">•</span>
                <span className="font-bold hidden sm:inline">Target:</span>
                <span className="truncate text-sky-800 hidden sm:inline">{activeScenario.targetGoal}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowSandboxModal(true);
                  }}
                  className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-white px-2 py-1 rounded-lg border border-sky-200 whitespace-nowrap cursor-pointer transition-colors"
                >
                  + Buat Skenario
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSuccessSound();
                    setShowEndSessionModal(true);
                  }}
                  className="text-[11px] font-bold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                  title="Akhiri sesi percakapan dan lihat rangkuman"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>Akhiri Percakapan</span>
                </button>
              </div>
            </div>

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  } animate-fade-in`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[78%] rounded-2xl p-4 shadow-xs relative transition-all ${
                      msg.role === 'user'
                        ? 'bg-[#1cb0f6] text-white rounded-br-xs'
                        : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200'
                    }`}
                  >
                    {/* Header line of message */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      <div className="flex items-center gap-1 shrink-0">
                        {msg.role === 'assistant' && (
                          <>
                            <button
                              type="button"
                              onClick={() => speakEnglish(msg.content)}
                              className="p-1 text-slate-400 hover:text-sky-600 rounded-md transition-colors cursor-pointer"
                              title="Dengarkan pelafalan"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            {/* Practice pronunciation of this sentence */}
                            <button
                              type="button"
                              onClick={() => {
                                playClickSound();
                                if (typeof window !== 'undefined') {
                                  const SpeechRec =
                                    (window as any).SpeechRecognition ||
                                    (window as any).webkitSpeechRecognition;
                                  if (SpeechRec) {
                                    const rec = new SpeechRec();
                                    rec.lang = 'en-US';
                                    rec.interimResults = false;
                                    playMicBeep();
                                    rec.onresult = (e: any) => {
                                      const spoken = e.results[0][0].transcript;
                                      fetch('/api/speech/pronounce-eval', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          spokenText: spoken,
                                          referenceText: msg.content,
                                          userLevel: currentLevel,
                                        }),
                                      })
                                        .then((r) => r.json())
                                        .then((evalData) => {
                                          setActivePronounceEval({
                                            eval: evalData,
                                            spokenText: spoken,
                                          });
                                        });
                                    };
                                    rec.start();
                                  } else {
                                    alert('Browser kamu belum mendukung input suara.');
                                  }
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded-md transition-colors cursor-pointer"
                              title="Tiru & Uji Pelafalanmu untuk kalimat ini"
                            >
                              <Mic className="w-4 h-4" />
                            </button>

                            {/* Individual toggle translation button */}
                            {msg.translation && (
                              <button
                                type="button"
                                onClick={() => toggleMessageTranslation(msg.id)}
                                className={`p-1 text-xs rounded-md transition-colors cursor-pointer ${
                                  isTranslationVisible(msg.id)
                                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title="Tampilkan/Sembunyikan terjemahan kalimat ini"
                              >
                                <Languages className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {/* Mic score badge if spoken */}
                        {msg.isSpoken && msg.spokenEvaluation && (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePronounceEval({
                                eval: msg.spokenEvaluation!,
                                spokenText: msg.content,
                              });
                            }}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                            title="Lihat analisis pelafalan"
                          >
                            <Mic className="w-3 h-3" />
                            {msg.spokenEvaluation.pronunciationScore}%
                          </button>
                        )}
                      </div>
                    </div>

                    {/* INDONESIAN TRANSLATION ACCORDION (KONTROL VISIBILITAS) */}
                    {msg.translation && isTranslationVisible(msg.id) && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-xs text-slate-600 italic flex items-start gap-1.5 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                        <span className="font-bold text-emerald-700 not-italic shrink-0">🇮🇩 ID:</span>
                        <span>{msg.translation}</span>
                      </div>
                    )}

                    {/* Vocab highlights chips */}
                    {msg.vocabHighlights && msg.vocabHighlights.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-bold text-slate-400">Kosakata:</span>
                        {msg.vocabHighlights.map((v, vIdx) => {
                          const isSaved = savedWordsSet.has(v.word.toLowerCase());
                          return (
                            <button
                              key={vIdx}
                              type="button"
                              onClick={() => {
                                playClickSound();
                                setSelectedWordToSave({
                                  id: `v-${Date.now()}-${vIdx}`,
                                  word: v.word,
                                  meaningId: v.meaning,
                                  phonetic: '',
                                  partOfSpeech: v.partOfSpeech,
                                  level: currentLevel === 'beginner' ? 'A2' : 'B2',
                                  exampleSentence: v.example,
                                  exampleTranslation: '',
                                  memoryTip: 'Dipakai saat simulasi: ' + activeScenario.title,
                                  dateAdded: new Date().toISOString().split('T')[0],
                                });
                              }}
                              className="bg-slate-50 hover:bg-amber-50 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 font-semibold cursor-pointer shadow-2xs"
                            >
                              <span>{v.word}</span>
                              {isSaved ? (
                                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <BookmarkPlus className="w-3.5 h-3.5 text-amber-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Inline Grammar Correction Card directly under user's response */}
                  {msg.corrections && msg.corrections.length > 0 && (
                    <div className="max-w-[92%] sm:max-w-[78%] mt-2 bg-amber-50/95 rounded-2xl p-3.5 border border-amber-200 shadow-2xs text-left animate-fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Catatan Tata Bahasa Piko:</span>
                      </div>
                      {msg.corrections.map((corr, cIdx) => (
                        <div key={cIdx} className="text-xs space-y-1 mt-1 text-slate-700">
                          <div className="flex items-start gap-1.5 flex-wrap">
                            <span className="text-rose-500 font-bold shrink-0">Perbaikan:</span>
                            <span className="line-through text-slate-400">"{corr.original}"</span>
                            <span className="text-emerald-700 font-bold">➜ "{corr.better}"</span>
                          </div>
                          {showIndonesianTranslation && (
                            <p className="text-slate-600 pl-4 text-[11px] italic">
                              {corr.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl w-fit border border-slate-200 shadow-xs animate-pulse">
                  <MascotBird size={36} mood="talking" animated={false} />
                  <span className="text-xs font-bold text-slate-500">
                    Piko sedang merespons...
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggested Reply Chips */}
            {suggestedReplies.length > 0 && (
              <div className="bg-white/80 px-3 py-1.5 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
                <div className="flex items-center gap-1 font-bold text-slate-500 shrink-0">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Ide:</span>
                </div>
                {suggestedReplies.map((reply, rIdx) => (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => handleSendMessage(reply)}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-800 px-3 py-1 rounded-full whitespace-nowrap border border-sky-200 font-medium transition-colors cursor-pointer text-xs"
                  >
                    "{reply.length > 36 ? reply.slice(0, 36) + '...' : reply}"
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Chat Input Bar (Mobile-friendly & 16:9 widescreen) */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-2xl transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md ring-4 ring-rose-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={
                  isListening
                    ? 'Sedang mendengarkan... Klik untuk berhenti'
                    : 'Bicara dengan mikrofon (Voice Mode)'
                }
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  isListening
                    ? 'Mendengarkan ucapanmu...'
                    : currentLevel === 'beginner'
                    ? 'Ketik balasan (bisa campur bahasa Indonesia)...'
                    : 'Type your message in English...'
                }
                className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-800"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || loading}
                className="btn-3d btn-3d-blue p-3 rounded-2xl disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* TOPIC / SCENARIO DRAWER (Slide-over) */}
        {showTopicDrawer && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-start">
            <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col justify-between animate-slide-right p-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bubbly text-lg font-bold text-slate-800">
                      Pilih Topik Obrolan
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTopicDrawer(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Skenario List */}
                <div className="my-4 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Skenario Roleplay Tersedia:
                  </span>
                  {scenariosList.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setActiveScenario(sc);
                        setShowTopicDrawer(false);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        activeScenario.id === sc.id
                          ? 'border-sky-500 bg-sky-50/80 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl shrink-0 mt-0.5">{sc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bubbly text-sm font-bold text-slate-900 truncate">
                          {sc.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {sc.context}
                        </p>
                        <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {sc.level}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Sandbox button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowTopicDrawer(false);
                    setShowSandboxModal(true);
                  }}
                  className="btn-3d btn-3d-purple w-full py-3 rounded-2xl font-bubbly text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer mb-4"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Buat Skenario Sendiri
                </button>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowTopicDrawer(false);
                    setShowVocabModal(true);
                  }}
                  className="btn-3d btn-3d-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  Vocab Vault
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowTopicDrawer(false);
                    setShowRapotModal(true);
                  }}
                  className="btn-3d btn-3d-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                  Rapot Progres
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VOCAB VAULT MODAL */}
        {showVocabModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border-4 border-white animate-scale-up relative">
              <div className="flex justify-end pb-2">
                <button
                  type="button"
                  onClick={() => setShowVocabModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <VocabVault
                vocabList={savedVocab}
                onToggleMastered={handleToggleMastered}
                onAddVocab={(v) => handleSaveVocab(v)}
              />
            </div>
          </div>
        )}

        {/* RAPOT PROGRES MODAL */}
        {showRapotModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border-4 border-white animate-scale-up relative">
              <div className="flex justify-end pb-2">
                <button
                  type="button"
                  onClick={() => setShowRapotModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <RapotDashboard
                stats={{
                  currentLevel,
                  hearts,
                  maxHearts: 5,
                  streakDays,
                  xp,
                  completedScenarios: [activeScenario.id],
                  savedVocab,
                  hasCompletedPlacement: true,
                  commonMistakes: INITIAL_GRAMMAR_PITFALLS,
                }}
                onRetakePlacement={() => {
                  setShowRapotModal(false);
                  setActiveScenario(INITIAL_SCENARIOS[0]);
                }}
              />
            </div>
          </div>
        )}

        {/* CUSTOM SANDBOX MODAL */}
        {showSandboxModal && (
          <SandboxModal
            userLevel={currentLevel}
            onClose={() => setShowSandboxModal(false)}
            onStartScenario={(newScenario) => {
              setScenariosList((prev) => [newScenario, ...prev]);
              setActiveScenario(newScenario);
              setShowSandboxModal(false);
            }}
          />
        )}

        {/* PRONUNCIATION EVALUATION MODAL */}
        {activePronounceEval && (
          <PronunciationModal
            evaluation={activePronounceEval.eval}
            spokenText={activePronounceEval.spokenText}
            onClose={() => setActivePronounceEval(null)}
          />
        )}

        {/* SAVE VOCAB QUICK POPUP */}
        {selectedWordToSave && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bubbly text-xl font-bold text-slate-900">
                    {selectedWordToSave.word}
                  </h4>
                  <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                    {selectedWordToSave.partOfSpeech}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish(selectedWordToSave.word)}
                  className="p-2 text-slate-400 hover:text-sky-600 cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="my-3 space-y-2 text-xs">
                <p className="text-slate-800 font-medium">
                  <span className="font-bold text-slate-500 block">Arti:</span>
                  {selectedWordToSave.meaningId}
                </p>
                {selectedWordToSave.exampleSentence && (
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500 block">Contoh:</span>
                    "{selectedWordToSave.exampleSentence}"
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedWordToSave(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVocab(selectedWordToSave)}
                  className="btn-3d btn-3d-green flex-1 py-2.5 rounded-xl font-bubbly text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Simpan ke Vault
                </button>
              </div>
            </div>
          </div>
        )}

        {/* END SESSION SUMMARY MODAL */}
        {showEndSessionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 overflow-hidden relative">
              {/* Header decoration */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏁</span>
                  <h3 className="font-bubbly text-lg font-bold text-slate-800">
                    Sesi Latihan Diakhiri
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEndSessionModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Celebration content */}
              <div className="text-center my-4">
                <div className="flex justify-center mb-2">
                  <MascotBird size={84} mood="celebrating" animated={true} />
                </div>
                <h4 className="font-bubbly text-2xl font-bold text-slate-900">
                  Kerja Luar Biasa! 🎉
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Kamu telah menyelesaikan latihan percakapan. AI merespons secara adaptif tanpa batas sampai kamu putuskan untuk mengakhirinya.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-2.5 my-4">
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 text-center">
                  <span className="text-xs text-sky-600 font-bold block">Interaksi</span>
                  <span className="text-lg font-bubbly font-black text-sky-900">
                    {messages.filter((m) => m.role === 'user').length} pesan
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
                  <span className="text-xs text-amber-600 font-bold block">XP Diperoleh</span>
                  <span className="text-lg font-bubbly font-black text-amber-900">
                    +{Math.max(messages.filter((m) => m.role === 'user').length * 15, 30)} XP
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                  <span className="text-xs text-emerald-600 font-bold block">Level Aktif</span>
                  <span className="text-lg font-bubbly font-black text-emerald-900">
                    {levelConfig.cefr}
                  </span>
                </div>
              </div>

              {/* Current Scenario Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-5 text-xs text-slate-700">
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-slate-900">Topik: {activeScenario.title}</span>
                  <span className="text-sky-600 font-semibold">{activeScenario.category}</span>
                </div>
                <p className="text-slate-500">
                  Peranmu: <span className="font-semibold text-slate-700">{activeScenario.userRole}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowEndSessionModal(false);
                  }}
                  className="w-full btn-3d btn-3d-blue py-3 rounded-2xl font-bubbly text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>💬 Lanjut Mengobrol (Tetap di Sini)</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      const starterMsg: ChatMessage = {
                        id: `init-${activeScenario.id}-${Date.now()}`,
                        role: 'assistant',
                        content: activeScenario.initialMessage,
                        translation: activeScenario.initialTranslation,
                        timestamp: Date.now(),
                        vocabHighlights: [],
                      };
                      setMessages([starterMsg]);
                      setSuggestedReplies(activeScenario.suggestedStarterReplies || []);
                      setShowEndSessionModal(false);
                    }}
                    className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ulangi Topik Ini</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShowEndSessionModal(false);
                      setShowTopicDrawer(true);
                    }}
                    className="py-2.5 rounded-xl border border-slate-200 bg-sky-50 text-sky-800 hover:bg-sky-100 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5 text-sky-600" />
                    <span>Pilih Topik Baru</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
