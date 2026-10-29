import React, { useState, useEffect, useRef } from 'react';
import { AppLevel } from '../types';
import { LEVEL_CONFIGS } from '../data/curriculum';
import { MascotBird } from './MascotBird';
import { Check, Sparkles, Send, Mic, MicOff, Volume2, ArrowRight } from 'lucide-react';
import { playClickSound, playSuccessSound, playLevelUpSound, speakEnglish, playMicBeep } from '../utils/soundEffects';

interface PlacementScreenProps {
  initialLevel?: AppLevel;
  onComplete: (calibratedLevel: AppLevel, diagnosticNotes: string) => void;
  hearts: number;
  streakDays: number;
}

interface IcebreakerMessage {
  role: 'assistant' | 'user';
  content: string;
  translation?: string;
}

export const PlacementScreen: React.FC<PlacementScreenProps> = ({
  initialLevel = 'intermediate',
  onComplete,
  hearts,
  streakDays,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<AppLevel>(initialLevel);
  const [stage, setStage] = useState<'selection' | 'icebreaker' | 'result'>('selection');

  // Icebreaker state
  const [chatMessages, setChatMessages] = useState<IcebreakerMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    assessedLevel: AppLevel;
    levelLabel: string;
    feedbackNotes: string;
    strengths: string[];
    areasToImprove: string[];
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loading]);

  // Start Icebreaker
  const startIcebreaker = async () => {
    playClickSound();
    setStage('icebreaker');
    setLoading(true);

    const initialPrompts: Record<AppLevel, { en: string; id: string }> = {
      beginner: {
        en: "Hi there! I'm Piko, your adventure buddy! To start, what is your name and what do you like to do in your free time?",
        id: "Halo! Aku Piko, teman petualanganmu! Untuk mulai, siapa namamu dan apa yang suka kamu lakukan di waktu luangmu?",
      },
      intermediate: {
        en: "Hey there! I'm Piko. Great choice! Tell me, how was your day today, and what do you usually do on weekends?",
        id: "Hai! Aku Piko. Pilihan yang mantap! Ceritakan, bagaimana harimu hari ini, dan apa yang biasanya kamu lakukan saat akhir pekan?",
      },
      advanced: {
        en: "Welcome! Piko here. I love meeting ambitious learners. If you could travel anywhere tomorrow, where would you go and why?",
        id: "Selamat datang! Piko di sini. Aku senang bertemu pembelajar ambisius. Kalau kamu bisa jalan-jalan ke mana saja besok, ke mana kamu akan pergi dan kenapa?",
      },
      expert: {
        en: "Greetings! Piko at your service. In your view, what is the single most critical challenge facing modern education today?",
        id: "Salam! Piko siap mendampingi. Menurut pandanganmu, apa tantangan paling krusial yang dihadapi dunia pendidikan modern saat ini?",
      },
    };

    const starter = initialPrompts[selectedLevel];
    setChatMessages([
      {
        role: 'assistant',
        content: starter.en,
        translation: starter.id,
      },
    ]);
    setTurnCount(1);
    setLoading(false);
    speakEnglish(starter.en);
  };

  // Send message in icebreaker
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    playClickSound();
    const updatedMessages: IcebreakerMessage[] = [
      ...chatMessages,
      { role: 'user', content: text.trim() },
    ];
    setChatMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/icebreaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          selectedSelfLevel: selectedLevel,
          turnCount: turnCount,
        }),
      });

      const data = await response.json();

      if (data.isDiagnosticComplete) {
        playLevelUpSound();
        setDiagnosticResult({
          assessedLevel: data.assessedLevel || selectedLevel,
          levelLabel: data.levelLabel || LEVEL_CONFIGS[selectedLevel].title,
          feedbackNotes: data.feedbackNotes || 'Hasil diagnostik menunjukkan kamu siap untuk petualangan ini!',
          strengths: data.strengths || ['Keberanian berkomunikasi', 'Kosakata aktif'],
          areasToImprove: data.areasToImprove || ['Tata bahasa dalam kalimat panjang'],
        });
        setStage('result');
      } else {
        playSuccessSound();
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            translation: data.indonesianTranslation,
          },
        ]);
        setTurnCount((prev) => prev + 1);
        speakEnglish(data.reply);
      }
    } catch (error) {
      console.error('Icebreaker error:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "That sounds wonderful! Can you also tell me what is your biggest goal in learning English?",
          translation: "Kedengarannya menyenangkan! Bisakah kamu ceritakan juga apa tujuan terbesarmu belajar bahasa Inggris?",
        },
      ]);
      setTurnCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // Voice speech-to-text
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser kamu belum mendukung Speech Recognition. Silakan ketik langsung di kolom teks ya!');
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
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#38bdf8] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background decorative clouds & leaves */}
      <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-[#0284c7]/30 to-transparent pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#22c55e] rounded-full opacity-90 blur-sm pointer-events-none" />
      <div className="absolute -bottom-14 left-20 w-52 h-40 bg-[#16a34a] rounded-full opacity-80 blur-xs pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-[#22c55e] rounded-full opacity-90 blur-sm pointer-events-none" />
      <div className="absolute -bottom-14 right-20 w-52 h-40 bg-[#16a34a] rounded-full opacity-80 blur-xs pointer-events-none" />

      {/* Floating stars */}
      <div className="absolute top-16 left-12 text-white/80 text-xl font-bold">✦</div>
      <div className="absolute top-28 right-16 text-white/80 text-2xl font-bold">✦</div>
      <div className="absolute top-44 left-1/4 text-white/60 text-sm font-bold">✦</div>

      {/* Top Bar Header */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 pt-4 pb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bubbly text-3xl font-extrabold text-white tracking-wide drop-shadow-sm">
            Fasih.ai
          </span>
        </div>

        {/* Phase / Progress */}
        <div className="flex-1 max-w-md hidden sm:flex flex-col items-center">
          <span className="text-white text-xs font-bold drop-shadow-xs mb-1">
            {stage === 'selection' && 'Fase 1: Mulai Petualanganmu!'}
            {stage === 'icebreaker' && `Fase 1B: Tes Diagnostik (${turnCount}/3 Pertanyaan)`}
            {stage === 'result' && 'Fase 1: Kalibrasi Level Selesai! 🎉'}
          </span>
          <div className="w-full bg-white/30 h-3.5 rounded-full p-0.5 backdrop-blur-xs border border-white/40">
            <div
              className="bg-[#22c55e] h-full rounded-full transition-all duration-500 shadow-inner"
              style={{
                width:
                  stage === 'selection'
                    ? '45%'
                    : stage === 'icebreaker'
                    ? `${Math.min(90, 45 + turnCount * 15)}%`
                    : '100%',
              }}
            />
          </div>
        </div>

        {/* Stats: Hearts & Streak */}
        <div className="flex items-center gap-3">
          <div className="bg-white/95 rounded-2xl px-3 py-1.5 shadow-sm border border-slate-100 flex items-center gap-1.5">
            <span className="text-rose-500 text-lg">❤️</span>
            <span className="font-bubbly font-bold text-slate-800 text-sm">{hearts}</span>
          </div>
          <div className="bg-white/95 rounded-2xl px-3 py-1.5 shadow-sm border border-slate-100 flex items-center gap-1.5">
            <span className="text-amber-500 text-lg">🔥</span>
            <span className="font-bubbly font-bold text-slate-800 text-sm">{streakDays}</span>
          </div>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 py-2 flex flex-col justify-center">
        {stage === 'selection' && (
          <div className="bg-white rounded-3xl p-5 md:p-8 shadow-2xl border-4 border-white/80 backdrop-blur-sm flex flex-col animate-fade-in">
            {/* Mascot and Bubble Speech */}
            <div className="flex items-start gap-3 sm:gap-6 mb-6">
              <div className="shrink-0 flex flex-col items-center">
                <MascotBird size={105} mood="talking" />
                <span className="font-bubbly text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full mt-1">
                  Piko Sang Explorer
                </span>
              </div>

              {/* Speech bubble */}
              <div className="relative flex-1 bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-200 shadow-sm speech-bubble-left">
                <p className="text-slate-800 font-bold text-base sm:text-lg leading-snug">
                  Halo! Sebelum kita mulai, seberapa jauh kamu sudah melangkah dalam Bahasa Inggris?
                </p>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5">
                  Pilih yang paling sesuai dengan kondisimu saat ini. Nanti Piko akan bantu kalibrasi!
                </p>
              </div>
            </div>

            {/* 4 Level Options matching the screenshot */}
            <div className="space-y-3 sm:space-y-3.5 mb-6">
              {/* Option 1: Pemula */}
              <button
                type="button"
                onClick={() => {
                  setSelectedLevel('beginner');
                  playClickSound();
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  selectedLevel === 'beginner'
                    ? 'border-[#22c55e] bg-[#f0fdf4] shadow-md ring-2 ring-[#4ade80]/40'
                    : 'border-[#4ade80]/70 bg-white hover:bg-[#f0fdf4]/50'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#dcfce7] flex items-center justify-center text-2xl shrink-0 border border-[#86efac]">
                    👶
                  </div>
                  <div>
                    <h3 className="font-bubbly text-base sm:text-lg font-bold text-slate-800">
                      Pemula (Beginner)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      Sering nge-blank, butuh bantuan campur Bahasa Indonesia
                    </p>
                  </div>
                </div>
                {selectedLevel === 'beginner' && (
                  <div className="w-7 h-7 rounded-full bg-[#22c55e] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Option 2: Menengah */}
              <button
                type="button"
                onClick={() => {
                  setSelectedLevel('intermediate');
                  playClickSound();
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  selectedLevel === 'intermediate'
                    ? 'border-[#0284c7] bg-[#f0f9ff] shadow-md ring-2 ring-[#38bdf8]/40'
                    : 'border-[#38bdf8]/70 bg-white hover:bg-[#f0f9ff]/50'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e0f2fe] flex items-center justify-center text-2xl shrink-0 border border-[#7dd3fc]">
                    👦
                  </div>
                  <div>
                    <h3 className="font-bubbly text-base sm:text-lg font-bold text-slate-800">
                      Menengah (Intermediate)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      Bisa membaca/mendengar, tapi masih kaku saat bicara
                    </p>
                  </div>
                </div>
                {selectedLevel === 'intermediate' && (
                  <div className="w-7 h-7 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Option 3: Mahir */}
              <button
                type="button"
                onClick={() => {
                  setSelectedLevel('advanced');
                  playClickSound();
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  selectedLevel === 'advanced'
                    ? 'border-[#ea580c] bg-[#fff7ed] shadow-md ring-2 ring-[#fb923c]/40'
                    : 'border-[#fb923c]/70 bg-white hover:bg-[#fff7ed]/50'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#ffedd5] flex items-center justify-center text-2xl shrink-0 border border-[#fdba74]">
                    🧑
                  </div>
                  <div>
                    <h3 className="font-bubbly text-base sm:text-lg font-bold text-slate-800">
                      Mahir (Advanced)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      Lancar, ingin belajar slang, idiom, dan ngobrol natural
                    </p>
                  </div>
                </div>
                {selectedLevel === 'advanced' && (
                  <div className="w-7 h-7 rounded-full bg-[#ea580c] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Option 4: Sangat Ahli */}
              <button
                type="button"
                onClick={() => {
                  setSelectedLevel('expert');
                  playClickSound();
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  selectedLevel === 'expert'
                    ? 'border-[#9333ea] bg-[#faf5ff] shadow-md ring-2 ring-[#c084fc]/40'
                    : 'border-[#c084fc]/70 bg-white hover:bg-[#faf5ff]/50'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f3e8ff] flex items-center justify-center text-2xl shrink-0 border border-[#d8b4fe]">
                    🧙‍♂️
                  </div>
                  <div>
                    <h3 className="font-bubbly text-base sm:text-lg font-bold text-slate-800">
                      Sangat Ahli (Expert)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      Siap untuk debat, negosiasi bisnis, dan TOEFL/IELTS
                    </p>
                  </div>
                </div>
                {selectedLevel === 'expert' && (
                  <div className="w-7 h-7 rounded-full bg-[#9333ea] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>

            {/* Giant 3D Green Continue Button */}
            <button
              type="button"
              onClick={startIcebreaker}
              className="btn-3d btn-3d-green w-full py-4 rounded-2xl font-bubbly text-xl font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              LANJUTKAN
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Stage 1B: "The Icebreaker" (Tes Diagnostik Terselubung) */}
        {stage === 'icebreaker' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border-4 border-white/90 backdrop-blur-sm flex flex-col h-[560px] animate-fade-in">
            {/* Header with mascot & explanation */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <MascotBird size={55} mood="talking" animated={false} />
                <div>
                  <h3 className="font-bubbly font-bold text-slate-800 text-lg">
                    The Icebreaker (Tes Diagnostik)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ngobrol santai 3-4 pertanyaan agar AI menyesuaikan kurikulummu!
                  </p>
                </div>
              </div>

              <div className="bg-sky-100 text-sky-800 font-bold text-xs px-3 py-1 rounded-full">
                Pertanyaan {turnCount} / 3
              </div>
            </div>

            {/* Chat conversation area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[#1cb0f6] text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm sm:text-base leading-relaxed">
                        {msg.content}
                      </p>
                      {msg.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => speakEnglish(msg.content)}
                          className="text-slate-400 hover:text-sky-600 p-1 shrink-0 cursor-pointer"
                          title="Dengarkan pelafalan"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {msg.translation && (
                      <div className="mt-2 pt-2 border-t border-slate-300/40 text-xs text-slate-600 italic">
                        💡 {msg.translation}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-600 rounded-2xl p-3.5 flex items-center gap-2 border border-slate-200">
                    <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs font-semibold text-slate-500 ml-1">
                      Piko sedang merespons & menganalisis...
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Helper Suggestion */}
            <div className="py-2 flex items-center gap-2 overflow-x-auto text-xs text-slate-600">
              <span className="font-semibold text-sky-700 shrink-0">💡 Butuh ide?</span>
              <button
                type="button"
                onClick={() => handleSendMessage("I usually hang out with friends and listen to music.")}
                className="bg-sky-50 hover:bg-sky-100 text-sky-800 px-3 py-1 rounded-full whitespace-nowrap border border-sky-200 cursor-pointer"
              >
                "I usually hang out with friends..."
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("To be honest, I want to improve my English for my career.")}
                className="bg-sky-50 hover:bg-sky-100 text-sky-800 px-3 py-1 rounded-full whitespace-nowrap border border-sky-200 cursor-pointer"
              >
                "I want to improve my English for my career..."
              </button>
            </div>

            {/* Input bar with mic */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-2xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md ring-4 ring-rose-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={isListening ? 'Berhenti mendengarkan' : 'Bicara dengan mikrofon'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? 'Sedang mendengarkan ucapanmu...' : 'Ketik balasanmu dalam bahasa Inggris (atau campur)...'}
                className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-800"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || loading}
                className="btn-3d btn-3d-blue p-3 rounded-2xl disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 1C: Diagnostic Result / Level Calibration */}
        {stage === 'result' && diagnosticResult && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-white/90 backdrop-blur-sm flex flex-col text-center animate-fade-in">
            <div className="flex justify-center -mt-2 mb-2">
              <MascotBird size={120} mood="celebrating" />
            </div>

            <div className="inline-flex items-center gap-1.5 self-center bg-amber-100 text-amber-800 text-xs font-black uppercase px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Hasil Kalibrasi AI Siap!
            </div>

            <h2 className="font-bubbly text-2xl sm:text-3xl font-extrabold text-slate-800 mb-1">
              Levelmu: {LEVEL_CONFIGS[diagnosticResult.assessedLevel].title}
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-5 font-medium">
              {diagnosticResult.feedbackNotes}
            </p>

            {/* Strengths & Focus Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6 max-w-lg mx-auto w-full">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                <span className="font-bubbly font-bold text-emerald-800 text-sm block mb-1.5 flex items-center gap-1">
                  ✨ Kelebihanmu:
                </span>
                <ul className="text-xs text-emerald-700 space-y-1">
                  {diagnosticResult.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200">
                <span className="font-bubbly font-bold text-sky-800 text-sm block mb-1.5 flex items-center gap-1">
                  🎯 Target Pengembangan:
                </span>
                <ul className="text-xs text-sky-700 space-y-1">
                  {diagnosticResult.areasToImprove.map((area, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-sky-500 font-bold">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSuccessSound();
                onComplete(diagnosticResult.assessedLevel, diagnosticResult.feedbackNotes);
              }}
              className="btn-3d btn-3d-green w-full max-w-md mx-auto py-4 rounded-2xl font-bubbly text-xl font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              MULAI PETUALANGAN BELAJAR!
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Leaf Accent */}
      <div className="relative z-10 text-center py-2 text-white/80 text-xs font-semibold">
        Fasih.ai • Belajar Bahasa Inggris Adaptif dengan Kecerdasan AI
      </div>
    </div>
  );
};
