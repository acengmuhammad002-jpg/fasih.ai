import React, { useState, useEffect, useRef } from 'react';
import { Scenario, ChatMessage, AppLevel, VocabItem, PronunciationEval } from '../types';
import { LEVEL_CONFIGS } from '../data/curriculum';
import { MascotBird } from './MascotBird';
import { PronunciationModal } from './PronunciationModal';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  BookmarkPlus,
  BookmarkCheck,
  CheckCircle,
  Lightbulb,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Languages,
} from 'lucide-react';
import {
  playClickSound,
  playSuccessSound,
  playLevelUpSound,
  speakEnglish,
  playMicBeep,
} from '../utils/soundEffects';

interface ScenarioChatProps {
  scenario: Scenario;
  userLevel: AppLevel;
  onBack: () => void;
  onCompleteScenario: (scenarioId: string, earnedXp: number) => void;
  onSaveVocab: (vocab: VocabItem) => void;
  savedVocabIds: Set<string>;
}

export const ScenarioChat: React.FC<ScenarioChatProps> = ({
  scenario,
  userLevel,
  onBack,
  onCompleteScenario,
  onSaveVocab,
  savedVocabIds,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [goalProgress, setGoalProgress] = useState(15);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(
    scenario.suggestedStarterReplies
  );
  const [activeTab, setActiveTab] = useState<'chat' | 'coach'>('chat');
  const [activePronunciationEval, setActivePronunciationEval] = useState<{
    eval: PronunciationEval;
    spokenText: string;
  } | null>(null);
  const [selectedWordDetail, setSelectedWordDetail] = useState<VocabItem | null>(null);
  const [visibleTranslations, setVisibleTranslations] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const levelInfo = LEVEL_CONFIGS[userLevel];

  // Initialize opening turn
  useEffect(() => {
    const initialMsg: ChatMessage = {
      id: 'init-1',
      role: 'assistant',
      content: scenario.initialMessage,
      translation: scenario.initialTranslation,
      timestamp: Date.now(),
      vocabHighlights: [],
    };
    setMessages([initialMsg]);
    // By default for beginner, show translation
    if (userLevel === 'beginner') {
      setVisibleTranslations({ 'init-1': true });
    }
    speakEnglish(scenario.initialMessage);
  }, [scenario, userLevel]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleTranslation = (id: string) => {
    playClickSound();
    setVisibleTranslations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    setLoading(true);

    try {
      // 1. If spoken, optionally trigger pronunciation evaluation in background
      if (wasSpoken) {
        fetch('/api/speech/pronounce-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spokenText: text.trim(),
            userLevel,
          }),
        })
          .then((res) => res.json())
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

      // 2. Fetch scenario roleplay response from server-side Gemini
      const response = await fetch('/api/chat/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          level: userLevel,
          latestUserMessage: text.trim(),
        }),
      });

      const data = await response.json();
      playSuccessSound();

      const aiMsgId = `ai-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: data.reply || "I see, let's keep going!",
        translation: data.indonesianTranslation,
        timestamp: Date.now(),
        corrections: data.corrections || [],
        vocabHighlights: data.vocabHighlights || [],
        toneFeedback: data.toneFeedback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.goalProgressPercent) {
        setGoalProgress((prev) => Math.min(100, Math.max(prev + 20, data.goalProgressPercent)));
      } else {
        setGoalProgress((prev) => Math.min(100, prev + 25));
      }

      if (data.suggestedReplies && data.suggestedReplies.length > 0) {
        setSuggestedReplies(data.suggestedReplies);
      }

      // If level is beginner, auto show translation
      if (userLevel === 'beginner') {
        setVisibleTranslations((prev) => ({ ...prev, [aiMsgId]: true }));
      }

      speakEnglish(data.reply);
    } catch (err) {
      console.error('Scenario chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: "I completely understand! What would you like to do next?",
        translation: 'Saya sangat mengerti! Apa yang ingin kamu lakukan selanjutnya?',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API Voice Input
  const toggleVoiceRecording = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser kamu belum mendukung Speech Recognition. Silakan gunakan ketik teks ya!');
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

  const handleFinishScenario = () => {
    playLevelUpSound();
    onCompleteScenario(scenario.id, 80);
  };

  return (
    <div className="min-h-screen bg-[#f0f7ff] flex flex-col justify-between">
      {/* Top Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onBack();
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{scenario.icon}</span>
                <h2 className="font-bubbly text-base sm:text-lg font-bold text-slate-800 leading-tight">
                  {scenario.title}
                </h2>
                <span
                  className="text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                  style={{ backgroundColor: levelInfo.bgColor, color: levelInfo.accentColor }}
                >
                  {levelInfo.title.split(' ')[0]}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Tujuan: {scenario.targetGoal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Goal progress */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[11px] font-bold text-slate-500">
                Progres Misi: {goalProgress}%
              </span>
              <div className="w-28 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 mt-0.5">
                <div
                  className="bg-[#22c55e] h-full transition-all duration-500"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>

            {/* Finish scenario button if progress >= 60 */}
            {goalProgress >= 60 && (
              <button
                type="button"
                onClick={handleFinishScenario}
                className="btn-3d btn-3d-green px-3.5 py-1.5 rounded-xl font-bubbly text-xs font-bold uppercase flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Selesai (+80 XP)
              </button>
            )}
          </div>
        </div>

        {/* Mobile Goal Bar */}
        <div className="md:hidden mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#22c55e] h-full transition-all duration-500"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col md:flex-row gap-4 p-3 sm:p-4 overflow-hidden">
        {/* Left Column: Chat Area */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col overflow-hidden h-[620px]">
          {/* Scenario Context Banner */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-2.5 border-b border-sky-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-bold text-sky-800">Peranmu:</span> {scenario.userRole}
              <span className="text-slate-300">|</span>
              <span className="font-bold text-sky-800">Partner AI:</span> {scenario.aiRole}
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-white px-2 py-0.5 rounded-lg border border-sky-200 text-sky-800 font-bold">
              {levelInfo.cefr}
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-xs relative ${
                    msg.role === 'user'
                      ? 'bg-[#1cb0f6] text-white rounded-br-xs'
                      : 'bg-[#f8fafc] text-slate-800 rounded-bl-xs border border-slate-200'
                  }`}
                >
                  {/* Top bar of message */}
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
                            className="p-1 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                            title="Dengarkan suara"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          {msg.translation && (
                            <button
                              type="button"
                              onClick={() => toggleTranslation(msg.id)}
                              className={`p-1 text-xs rounded-md transition-colors cursor-pointer ${
                                visibleTranslations[msg.id]
                                  ? 'bg-sky-100 text-sky-800 font-bold'
                                  : 'text-slate-400 hover:text-slate-700'
                              }`}
                              title="Terjemahkan ke bahasa Indonesia"
                            >
                              <Languages className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* If user spoke this message with mic */}
                      {msg.isSpoken && msg.spokenEvaluation && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePronunciationEval({
                              eval: msg.spokenEvaluation!,
                              spokenText: msg.content,
                            });
                          }}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                          title="Lihat skor pelafalan"
                        >
                          <Mic className="w-3 h-3" />
                          {msg.spokenEvaluation.pronunciationScore}%
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Indonesian Translation Accordion */}
                  {visibleTranslations[msg.id] && msg.translation && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600 italic flex items-start gap-1.5 bg-sky-50/70 p-2 rounded-xl">
                      <span className="font-bold text-sky-700 not-italic">🇮🇩:</span>
                      <span>{msg.translation}</span>
                    </div>
                  )}

                  {/* Vocab highlights pills */}
                  {msg.vocabHighlights && msg.vocabHighlights.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] font-bold text-slate-400">Kosakata:</span>
                      {msg.vocabHighlights.map((v, vIdx) => {
                        const isSaved = savedVocabIds.has(v.word.toLowerCase());
                        return (
                          <button
                            key={vIdx}
                            type="button"
                            onClick={() => {
                              playClickSound();
                              const item: VocabItem = {
                                id: `v-${Date.now()}-${vIdx}`,
                                word: v.word,
                                meaningId: v.meaning,
                                phonetic: '',
                                partOfSpeech: v.partOfSpeech,
                                level: userLevel === 'beginner' ? 'A2' : 'B2',
                                exampleSentence: v.example,
                                exampleTranslation: '',
                                memoryTip: 'Ditambahkan dari simulasi ' + scenario.title,
                                dateAdded: new Date().toISOString().split('T')[0],
                              };
                              setSelectedWordDetail(item);
                            }}
                            className="bg-white hover:bg-amber-50 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs font-semibold cursor-pointer"
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

                {/* Inline Grammar Correction Card right under the user's turn if there were corrections */}
                {msg.corrections && msg.corrections.length > 0 && (
                  <div className="max-w-[88%] sm:max-w-[80%] mt-2 bg-amber-50/90 rounded-2xl p-3 border border-amber-200 shadow-2xs text-left animate-fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Catatan Piko (Tips Tata Bahasa):</span>
                    </div>
                    {msg.corrections.map((corr, cIdx) => (
                      <div key={cIdx} className="text-xs space-y-1 mt-1 text-slate-700">
                        <div className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold shrink-0">Bisa lebih pas:</span>
                          <span className="line-through text-slate-500">"{corr.original}"</span>
                          <span className="text-emerald-700 font-bold">➜ "{corr.better}"</span>
                        </div>
                        <p className="text-slate-600 pl-4 text-[11px] italic">
                          {corr.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl w-fit border border-slate-200 animate-pulse">
                <MascotBird size={35} mood="talking" animated={false} />
                <span className="text-xs font-bold text-slate-500">
                  Partner AI sedang merespons skenario...
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Helper Suggestion Pills */}
          <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-1 font-bold text-slate-500 shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Ide Balasan:</span>
            </div>
            {suggestedReplies.map((reply, rIdx) => (
              <button
                key={rIdx}
                type="button"
                onClick={() => handleSendMessage(reply)}
                className="bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 px-3 py-1 rounded-full whitespace-nowrap border border-slate-200 shadow-2xs font-medium transition-colors cursor-pointer"
              >
                "{reply.length > 40 ? reply.slice(0, 40) + '...' : reply}"
              </button>
            ))}
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md ring-4 ring-rose-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={
                isListening
                  ? 'Sedang mendengarkan... Klik untuk berhenti'
                  : 'Bicara dengan Mikrofon (Voice Mode)'
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
                  ? 'Mendengarkan suaramu... Bicara sekarang!'
                  : userLevel === 'beginner'
                  ? 'Ketik balasan (boleh campur bahasa Indonesia)...'
                  : 'Type your message in English...'
              }
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

        {/* Right Column: AI Coach & Learning Assistant Panel */}
        <div className="w-full md:w-80 bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <MascotBird size={55} mood="thinking" animated={false} />
              <div>
                <h3 className="font-bubbly font-bold text-slate-800 text-base">
                  Piko AI Coach
                </h3>
                <p className="text-xs text-slate-500">
                  Asisten adaptif level {levelInfo.title.split(' ')[0]}
                </p>
              </div>
            </div>

            {/* Level Guidelines Reminder */}
            <div
              className="my-3 p-3 rounded-2xl text-xs space-y-1.5"
              style={{ backgroundColor: levelInfo.bgColor, borderColor: levelInfo.borderColor }}
            >
              <span className="font-bold text-slate-800 block">
                Aturan & Target Level Ini:
              </span>
              <ul className="space-y-1 text-slate-600">
                {levelInfo.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Tips */}
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200/80 mb-3 text-xs">
              <span className="font-bold text-amber-800 block mb-1">
                💡 Tips Berbicara Nyaman:
              </span>
              <p className="text-amber-900 leading-relaxed">
                Jangan takut salah tata bahasa! AI dirancang untuk memahamimu dan mengoreksi dengan santai. Tekan tombol mikrofon 🎤 untuk melatih kelancaran lidahmu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishScenario}
            className="btn-3d btn-3d-green w-full py-3 rounded-2xl font-bubbly text-sm font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            Selesaikan Skenario
          </button>
        </div>
      </div>

      {/* Word Detail & Save Modal */}
      {selectedWordDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bubbly text-xl font-bold text-slate-900">
                  {selectedWordDetail.word}
                </h4>
                <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                  {selectedWordDetail.partOfSpeech}
                </span>
              </div>
              <button
                type="button"
                onClick={() => speakEnglish(selectedWordDetail.word)}
                className="p-2 text-slate-400 hover:text-sky-600"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 space-y-2 text-xs">
              <p className="text-slate-800 font-medium">
                <span className="font-bold text-slate-500 block">Arti:</span>
                {selectedWordDetail.meaningId}
              </p>
              {selectedWordDetail.exampleSentence && (
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-500 block">Contoh Kalimat:</span>
                  "{selectedWordDetail.exampleSentence}"
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setSelectedWordDetail(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  playSuccessSound();
                  onSaveVocab(selectedWordDetail);
                  setSelectedWordDetail(null);
                }}
                className="btn-3d btn-3d-green flex-1 py-2.5 rounded-xl font-bubbly text-xs font-bold flex items-center justify-center gap-1"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                Simpan ke Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pronunciation Feedback Modal */}
      {activePronunciationEval && (
        <PronunciationModal
          evaluation={activePronunciationEval.eval}
          spokenText={activePronunciationEval.spokenText}
          onClose={() => setActivePronunciationEval(null)}
        />
      )}
    </div>
  );
};
