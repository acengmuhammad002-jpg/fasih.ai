import React, { useState } from 'react';
import { VocabItem } from '../types';
import {
  Search,
  Volume2,
  CheckCircle2,
  BookmarkCheck,
  RotateCw,
  Plus,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from 'lucide-react';
import {
  playClickSound,
  playSuccessSound,
  playCardFlipSound,
  speakEnglish,
} from '../utils/soundEffects';

interface VocabVaultProps {
  vocabList: VocabItem[];
  onToggleMastered: (id: string) => void;
  onAddVocab: (vocab: VocabItem) => void;
}

export const VocabVault: React.FC<VocabVaultProps> = ({
  vocabList,
  onToggleMastered,
  onAddVocab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWordInput, setNewWordInput] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);

  // Filtered list
  const filteredVocab = vocabList.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaningId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      selectedLevelFilter === 'all' || item.level.toUpperCase().includes(selectedLevelFilter);
    return matchesSearch && matchesLevel;
  });

  const handleFlipCard = () => {
    playCardFlipSound();
    setIsFlipped(!isFlipped);
  };

  const handleNextFlashcard = (markMastered: boolean) => {
    playClickSound();
    const currentCard = filteredVocab[flashcardIndex];
    if (currentCard && markMastered && !currentCard.mastered) {
      onToggleMastered(currentCard.id);
    }
    setIsFlipped(false);
    if (flashcardIndex + 1 < filteredVocab.length) {
      setFlashcardIndex(flashcardIndex + 1);
    } else {
      playSuccessSound();
      setIsFlashcardMode(false);
      setFlashcardIndex(0);
    }
  };

  const handleAddNewWord = async () => {
    if (!newWordInput.trim() || addingLoading) return;
    playClickSound();
    setAddingLoading(true);

    try {
      const response = await fetch('/api/vocab/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: newWordInput.trim() }),
      });
      const data = await response.json();
      playSuccessSound();

      const newVocab: VocabItem = {
        id: `custom-vocab-${Date.now()}`,
        word: data.word || newWordInput.trim(),
        meaningId: data.meaningId || 'Kata baru',
        phonetic: data.phonetic || '',
        partOfSpeech: data.partOfSpeech || 'Word',
        level: data.level || 'B1',
        exampleSentence: data.exampleSentence || `I use ${newWordInput} today.`,
        exampleTranslation: data.exampleTranslation || '',
        memoryTip: data.memoryTip || 'Gunakan dalam percakapan sehari-hari.',
        mastered: false,
        dateAdded: new Date().toISOString().split('T')[0],
      };

      onAddVocab(newVocab);
      setNewWordInput('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add vocab:', err);
    } finally {
      setAddingLoading(false);
    }
  };

  const currentFlashcard = filteredVocab[flashcardIndex] || filteredVocab[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">📦</span>
            <h2 className="font-bubbly text-2xl font-bold text-slate-800">
              Vocab Vault (Brankas Kosakata)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kumpulan kata, phrasal verbs, & idiom yang kamu pelajari dari percakapan.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowAddModal(true);
            }}
            className="btn-3d btn-3d-white flex-1 sm:flex-none px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            Tambah Kata
          </button>

          {filteredVocab.length > 0 && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsFlashcardMode(true);
                setFlashcardIndex(0);
                setIsFlipped(false);
              }}
              className="btn-3d btn-3d-green flex-1 sm:flex-none px-4 py-2.5 rounded-2xl font-bubbly text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              Kuis Flashcard ({filteredVocab.length})
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kata atau arti dalam bahasa Indonesia..."
            className="w-full bg-white rounded-2xl pl-10 pr-4 py-3 text-sm border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-800 shadow-2xs"
          />
        </div>

        {/* Level Filter Tabs */}
        <div className="flex gap-1.5 bg-white p-1 rounded-2xl border-2 border-slate-200 overflow-x-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'A', label: 'Pemula (A1-A2)' },
            { id: 'B', label: 'Menengah (B1-B2)' },
            { id: 'C', label: 'Mahir/Expert (C1-C2)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playClickSound();
                setSelectedLevelFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedLevelFilter === tab.id
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vocab Cards Grid */}
      {filteredVocab.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border-2 border-slate-200 text-center">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="font-bubbly text-lg font-bold text-slate-700">
            Belum ada kosakata yang cocok
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mulai obrolan skenario atau tambahkan kata favoritmu sekarang!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVocab.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-sky-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bubbly text-lg font-bold text-slate-900">
                      {item.word}
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                      {item.level}
                    </span>
                    <span className="text-xs text-slate-400 italic">
                      {item.partOfSpeech}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => speakEnglish(item.word)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Dengarkan pelafalan"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        onToggleMastered(item.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        item.mastered
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-slate-300 hover:text-slate-500'
                      }`}
                      title={item.mastered ? 'Sudah dihafal' : 'Tandai sudah dihafal'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.phonetic && (
                  <p className="text-xs text-slate-400 font-mono mb-2">
                    {item.phonetic}
                  </p>
                )}

                <p className="text-sm font-semibold text-slate-800 mb-3">
                  {item.meaningId}
                </p>

                {item.exampleSentence && (
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 mb-2 text-xs">
                    <p className="font-medium text-slate-700 italic">
                      "{item.exampleSentence}"
                    </p>
                    {item.exampleTranslation && (
                      <p className="text-slate-500 mt-1">
                        {item.exampleTranslation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {item.memoryTip && (
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{item.memoryTip}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Interactive Flashcard Modal */}
      {isFlashcardMode && currentFlashcard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-white animate-scale-up flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎴</span>
                <span className="font-bubbly font-bold text-slate-800">
                  Kartu {flashcardIndex + 1} dari {filteredVocab.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFlashcardMode(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3D Flip Card */}
            <div
              onClick={handleFlipCard}
              className="my-6 min-h-[220px] rounded-3xl border-2 border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-md hover:shadow-lg transition-all"
            >
              {!isFlipped ? (
                <>
                  <span className="text-xs uppercase tracking-wider font-extrabold text-sky-600 bg-sky-100 px-3 py-1 rounded-full mb-3">
                    {currentFlashcard.partOfSpeech} • {currentFlashcard.level}
                  </span>
                  <h3 className="font-bubbly text-3xl font-extrabold text-slate-900 mb-2">
                    {currentFlashcard.word}
                  </h3>
                  {currentFlashcard.phonetic && (
                    <p className="text-sm font-mono text-slate-400 mb-3">
                      {currentFlashcard.phonetic}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakEnglish(currentFlashcard.word);
                    }}
                    className="p-2 bg-sky-50 text-sky-600 rounded-full hover:bg-sky-100 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" /> Ketuk kartu untuk melihat arti
                  </p>
                </>
              ) : (
                <>
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Arti Bahasa Indonesia:
                  </span>
                  <h4 className="font-bubbly text-xl font-bold text-slate-800 mb-3">
                    {currentFlashcard.meaningId}
                  </h4>
                  {currentFlashcard.exampleSentence && (
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-200 italic mb-2 max-w-sm">
                      "{currentFlashcard.exampleSentence}"
                    </p>
                  )}
                  {currentFlashcard.memoryTip && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                      💡 {currentFlashcard.memoryTip}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" /> Ketuk untuk balik lagi
                  </p>
                </>
              )}
            </div>

            {/* Answer Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleNextFlashcard(false)}
                className="btn-3d btn-3d-white py-3 rounded-2xl font-bubbly text-sm font-bold text-rose-600 cursor-pointer"
              >
                Belum Hafal (Review)
              </button>
              <button
                type="button"
                onClick={() => handleNextFlashcard(true)}
                className="btn-3d btn-3d-green py-3 rounded-2xl font-bubbly text-sm font-bold cursor-pointer"
              >
                Sudah Hafal! ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Vocab Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-white animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bubbly text-lg font-bold text-slate-800">
                Tambah Kosakata Baru ke Brankas
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Ketik Kata / Idiom Bahasa Inggris:
              </label>
              <input
                type="text"
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewWord()}
                placeholder="Contoh: serendipity, look forward to, reluctant"
                className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-800"
                disabled={addingLoading}
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                AI akan otomatis mendeteksi arti, jenis kata, contoh kalimat, dan tips menghafalnya.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddNewWord}
              disabled={!newWordInput.trim() || addingLoading}
              className="btn-3d btn-3d-blue w-full py-3 rounded-2xl font-bubbly text-sm font-bold uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {addingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengambil Definisi AI...
                </>
              ) : (
                'Simpan ke Vault'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
