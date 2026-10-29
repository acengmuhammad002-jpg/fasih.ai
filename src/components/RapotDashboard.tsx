import React, { useState } from 'react';
import { UserStats } from '../types';
import { LEVEL_CONFIGS } from '../data/curriculum';
import { MascotBird } from './MascotBird';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  Flame,
  Heart,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';

interface RapotDashboardProps {
  stats: UserStats;
  onRetakePlacement: () => void;
}

export const RapotDashboard: React.FC<RapotDashboardProps> = ({
  stats,
  onRetakePlacement,
}) => {
  const currentLevelConfig = LEVEL_CONFIGS[stats.currentLevel];
  const [selectedPitfallIdx, setSelectedPitfallIdx] = useState<number | null>(null);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const handleTestPitfall = (pitfall: any, chosenOption: number, correctOption: number) => {
    playClickSound();
    setQuizAnswerSelected(chosenOption);
    if (chosenOption === correctOption) {
      playSuccessSound();
      setQuizFeedback('🎉 Tepat sekali! Kamu sudah memahami aturan ini.');
    } else {
      setQuizFeedback('💡 Belum tepat. Ingat tips: ' + pitfall.tip);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Profile & CEFR Summary Card */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <MascotBird size={85} mood="celebrating" animated={false} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bubbly text-2xl font-bold text-slate-800">
                Rapot Progres Belajar
              </h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Aktif
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Level Terkalibrasi: <strong className="text-slate-700">{currentLevelConfig.title}</strong> ({currentLevelConfig.cefr})
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-bold">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{stats.streakDays} Hari Beruntun</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 px-3 py-1.5 rounded-xl border border-rose-200">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>{stats.hearts} Nyawa</span>
              </div>
              <div className="flex items-center gap-1.5 bg-sky-50 text-sky-800 px-3 py-1.5 rounded-xl border border-sky-200">
                <Award className="w-4 h-4 text-sky-500" />
                <span>{stats.xp} Total XP</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            onRetakePlacement();
          }}
          className="btn-3d btn-3d-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <TrendingUp className="w-4 h-4 text-sky-600" />
          Tes Ulang Diagnostik
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Kosakata di Brankas
          </span>
          <span className="font-bubbly text-3xl font-black text-slate-800 block my-1">
            {stats.savedVocab.length}
            <span className="text-sm font-bold text-slate-400 ml-1">kata</span>
          </span>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {stats.savedVocab.filter((v) => v.mastered).length} sudah dihafal
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Skenario Selesai
          </span>
          <span className="font-bubbly text-3xl font-black text-slate-800 block my-1">
            {stats.completedScenarios.length}
            <span className="text-sm font-bold text-slate-400 ml-1">misi</span>
          </span>
          <p className="text-xs text-sky-600 font-semibold flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Simulasi roleplay sukses
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Indeks Kelancaran (Fluency)
          </span>
          <span className="font-bubbly text-3xl font-black text-slate-800 block my-1">
            87<span className="text-sm font-bold text-slate-400">/100</span>
          </span>
          <p className="text-xs text-purple-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Mendekati target {stats.currentLevel === 'beginner' ? 'B1' : 'C1'}
          </p>
        </div>
      </div>

      {/* Weekly Activity Tracker */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <h3 className="font-bubbly text-base font-bold text-slate-800">
              Aktivitas Latihan Pekan Ini
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Konsistensi 5-10 menit/hari
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {daysOfWeek.map((day, idx) => {
            const isCompleted = idx < 5; // Simulates active week days
            const isToday = idx === 3;
            return (
              <div
                key={day}
                className={`rounded-2xl p-3 border flex flex-col items-center gap-1.5 ${
                  isToday
                    ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold">{day}</span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : '•'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Common Grammar Pitfalls (Fitur khusus analisis kesalahan pengguna) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xs mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-bubbly text-lg font-bold text-slate-800">
            Analisis Kesalahan Grammar yang Sering Muncul
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mb-5">
          AI mencatat pola kalimat yang paling sering kamu keliru saat mengobrol. Pelajari polanya agar makin fasih!
        </p>

        <div className="space-y-3">
          {stats.commonMistakes.map((pitfall, pIdx) => (
            <div
              key={pIdx}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200 transition-all hover:border-amber-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Terdeteksi {pitfall.count}x
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {pitfall.rule}
                    </h4>
                  </div>

                  <div className="mt-2 text-xs space-y-1">
                    <p className="text-slate-500">
                      <span className="font-bold text-rose-500">Contoh keliru: </span>
                      <span className="line-through">{pitfall.mistakeExample}</span>
                    </p>
                    <p className="text-slate-700">
                      <span className="font-bold text-emerald-600">Perbaikan yang tepat: </span>
                      <span className="font-semibold">{pitfall.correctedExample}</span>
                    </p>
                  </div>

                  <p className="text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 mt-2.5 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Tips Piko:</strong> {pitfall.tip}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedPitfallIdx(selectedPitfallIdx === pIdx ? null : pIdx);
                    setQuizAnswerSelected(null);
                    setQuizFeedback(null);
                  }}
                  className="btn-3d btn-3d-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shrink-0 cursor-pointer"
                >
                  {selectedPitfallIdx === pIdx ? 'Tutup Kuis' : 'Tes Kilat'}
                </button>
              </div>

              {/* Quick Interactive Mini Quiz */}
              {selectedPitfallIdx === pIdx && (
                <div className="mt-4 pt-3 border-t border-slate-200 bg-white rounded-2xl p-4 border animate-fade-in">
                  <span className="text-xs font-bold text-sky-700 uppercase block mb-1">
                    🎯 Kuis Cepat: Pilih Kalimat yang Benar
                  </span>
                  <p className="text-xs text-slate-600 mb-3 font-medium">
                    Manakah kalimat yang mengikuti kaidah "{pitfall.rule}" dengan benar?
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleTestPitfall(pitfall, 1, 2)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        quizAnswerSelected === 1
                          ? 'border-rose-400 bg-rose-50 text-rose-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      A. {pitfall.mistakeExample}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestPitfall(pitfall, 2, 2)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        quizAnswerSelected === 2
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      B. {pitfall.correctedExample}
                    </button>
                  </div>

                  {quizFeedback && (
                    <p className="mt-3 text-xs font-bold p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                      {quizFeedback}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
