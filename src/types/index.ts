export type AppLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface LevelConfig {
  id: AppLevel;
  cefr: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  borderColor: string;
  bgColor: string;
  activeBorderColor: string;
  accentColor: string;
  features: string[];
}

export interface Scenario {
  id: string;
  title: string;
  category: 'Daily' | 'Travel' | 'Social' | 'Work' | 'Academic' | 'Custom';
  level: AppLevel;
  userRole: string;
  aiRole: string;
  context: string;
  targetGoal: string;
  initialMessage: string;
  initialTranslation: string;
  suggestedStarterReplies: string[];
  icon: string;
  isCustom?: boolean;
}

export interface Correction {
  original: string;
  better: string;
  explanation: string;
}

export interface VocabHighlight {
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  timestamp: number;
  corrections?: Correction[];
  vocabHighlights?: VocabHighlight[];
  toneFeedback?: string;
  isSpoken?: boolean;
  pronunciationScore?: number;
  spokenEvaluation?: PronunciationEval;
}

export interface PronunciationEval {
  pronunciationScore: number;
  fluencyScore: number;
  generalFeedback: string;
  praisePoint?: string;
  highlightedWords: Array<{
    word: string;
    isAccurate: boolean;
    phoneticIPA: string;
    spellingGuide: string;
    tip: string;
  }>;
}

export interface VocabItem {
  id: string;
  word: string;
  meaningId: string;
  phonetic: string;
  partOfSpeech: string;
  level: string;
  exampleSentence: string;
  exampleTranslation: string;
  memoryTip: string;
  mastered?: boolean;
  dateAdded: string;
}

export interface GrammarPitfall {
  rule: string;
  mistakeExample: string;
  correctedExample: string;
  count: number;
  tip: string;
}

export interface UserStats {
  currentLevel: AppLevel;
  hearts: number;
  maxHearts: number;
  streakDays: number;
  xp: number;
  completedScenarios: string[];
  savedVocab: VocabItem[];
  hasCompletedPlacement: boolean;
  diagnosedLevel?: AppLevel;
  diagnosticNotes?: string;
  commonMistakes: GrammarPitfall[];
}
