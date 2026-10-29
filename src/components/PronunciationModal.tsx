import React from 'react';
import { PronunciationEval } from '../types';
import { X, Volume2, Award, CheckCircle2 } from 'lucide-react';
import { speakEnglish, playClickSound } from '../utils/soundEffects';

interface PronunciationModalProps {
  evaluation: PronunciationEval;
  spokenText: string;
  onClose: () => void;
}

export const PronunciationModal: React.FC<PronunciationModalProps> = ({
  evaluation,
  spokenText,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-white animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎤</span>
            <h3 className="font-bubbly text-xl font-bold text-slate-800">
              Analisis Pelafalan (Pronunciation)
            </h3>
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

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Skor Pelafalan (Pronunciation)
            </span>
            <span className="font-bubbly text-3xl font-black text-emerald-600 block my-1">
              {evaluation.pronunciationScore}
              <span className="text-sm font-bold text-emerald-400">/100</span>
            </span>
            <div className="flex items-center justify-center gap-1 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sangat Baik
            </div>
          </div>

          <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 text-center">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">
              Skor Kelancaran (Fluency)
            </span>
            <span className="font-bubbly text-3xl font-black text-sky-600 block my-1">
              {evaluation.fluencyScore}
              <span className="text-sm font-bold text-sky-400">/100</span>
            </span>
            <div className="flex items-center justify-center gap-1 text-xs text-sky-700 font-medium">
              <Award className="w-3.5 h-3.5" /> Mengalir Natural
            </div>
          </div>
        </div>

        {/* Spoken Utterance Preview */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 mb-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Ucapan yang Kamu Katakan:
            </span>
            <p className="font-semibold text-slate-800 text-sm mt-0.5 italic">
              "{spokenText}"
            </p>
          </div>
          <button
            type="button"
            onClick={() => speakEnglish(spokenText)}
            className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 hover:bg-sky-50 text-sky-600 transition-colors cursor-pointer"
            title="Dengarkan kembali"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* General Feedback */}
        <p className="text-sm text-slate-600 mb-4 bg-amber-50 p-3 rounded-2xl border border-amber-200/80">
          💡 <span className="font-medium">{evaluation.generalFeedback}</span>
        </p>

        {/* Highlighted Pitfall Words */}
        {evaluation.highlightedWords && evaluation.highlightedWords.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-bold text-slate-700 uppercase block mb-2">
              Kata yang Perlu Diperhatikan:
            </span>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {evaluation.highlightedWords.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.word}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {item.phoneticIPA}
                      </span>
                      <span className="text-[11px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-semibold">
                        Baca: {item.spellingGuide}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 font-medium">{item.tip}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglish(item.word)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 cursor-pointer"
                    title="Dengarkan kata ini"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="btn-3d btn-3d-blue w-full py-3 rounded-2xl font-bubbly text-base font-bold shadow-sm cursor-pointer"
        >
          Siap, Paham! Lanjut Ngobrol
        </button>
      </div>
    </div>
  );
};
