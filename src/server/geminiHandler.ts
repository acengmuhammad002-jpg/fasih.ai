import { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Server-side Gemini instance with telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Primary ultra-fast, high-availability model with fallback cascade
const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.8-flash'];

export async function generateWithModelFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`[AI Studio] Model ${model} encountered an issue, trying next fallback:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError;
}
function readJsonBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body && typeof (req as any).body === 'object') {
    return Promise.resolve((req as any).body);
  }
  if ((req as any).body && typeof (req as any).body === 'string') {
    try {
      return Promise.resolve(JSON.parse((req as any).body));
    } catch {
      return Promise.resolve({});
    }
  }

  return new Promise((resolve) => {
    let body = '';
    req.setEncoding('utf-8');

    // If stream has already ended before listener attached
    if (req.readableEnded) {
      return resolve({});
    }

    const timer = setTimeout(() => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    }, 2500);

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });

    req.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

function sendJsonResponse(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  });
  res.end(JSON.stringify(data));
}

function cleanAndParseJSON(text: string | undefined, fallback: any) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (err) {
        console.error('Failed to parse json block', err);
      }
    }
    return fallback;
  }
}

export async function handleGeminiApiRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url?.split('?')[0];

  if (!url?.startsWith('/api/')) {
    return false;
  }

  if (req.method !== 'POST') {
    sendJsonResponse(res, 405, { error: 'Method not allowed' });
    return true;
  }

  try {
    const body = await readJsonBody(req);

    // 1. Icebreaker Diagnostic Route
    if (url === '/api/chat/icebreaker') {
      const { messages = [], selectedSelfLevel = 'intermediate', turnCount = 0 } = body;
      const isFinalAssessment = turnCount >= 3;

      const systemInstruction = `
You are "Piko", the friendly, highly capable explorer bird mascot and adaptive English coach on Fasih.ai.
Conduct "The Icebreaker" (a 3 to 4-turn casual diagnostic chat in natural English) to unobtrusively assess and calibrate the learner's actual CEFR English level.

Learner's self-selected level: "${selectedSelfLevel}".
Current turn index: ${turnCount}.
Is final assessment required: ${isFinalAssessment ? 'YES' : 'NO'}.

Guidelines:
- If isFinalAssessment is FALSE:
  - Respond warmly and specifically to whatever the user shared.
  - Ask ONE engaging, relatable conversational question (weekend plans, favorite food, dream job, study motivations).
  - Provide an accurate, natural Indonesian translation for beginners.
- If isFinalAssessment is TRUE:
  - Thoroughly evaluate their sentences: subject-verb agreement, tense consistency, vocabulary sophistication, Indonesian interference.
  - Determine their calibrated level: "beginner" | "intermediate" | "advanced" | "expert".
  - Provide an encouraging summary in Indonesian, highlighting 2-3 genuine strengths and 2 actionable growth areas.

Output strictly valid JSON:
{
  "reply": "string (Piko's warm message)",
  "indonesianTranslation": "string (Indonesian translation)",
  "isDiagnosticComplete": boolean,
  "assessedLevel": "beginner" | "intermediate" | "advanced" | "expert",
  "levelLabel": "string (e.g. Pemula Aktif (A2) / Menengah Mandiri (B1))",
  "feedbackNotes": "string (constructive and positive notes in Indonesian)",
  "strengths": ["string", "string"],
  "areasToImprove": ["string", "string"],
  "suggestedStarterPhrases": ["string", "string"]
}
`;

      const response = await generateWithModelFallback({
        contents: `Diagnostic history:\n${JSON.stringify(messages.slice(-6), null, 2)}\nTurn: ${turnCount}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      });

      const parsed = cleanAndParseJSON(response.text, {
        reply: "Hi there! I'm Piko. Tell me, what do you usually enjoy doing on weekends?",
        indonesianTranslation: 'Halo! Aku Piko. Ceritakan padaku, apa yang biasanya kamu sukai lakukan di akhir pekan?',
        isDiagnosticComplete: isFinalAssessment,
        assessedLevel: selectedSelfLevel,
        levelLabel: selectedSelfLevel === 'beginner' ? 'Pemula (A1-A2)' : 'Menengah (B1-B2)',
        feedbackNotes: 'Hebat! Kamu berani berbicara dan kalimatmu mudah dipahami.',
        strengths: ['Percaya diri merespons', 'Pemilihan kata dasar baik'],
        areasToImprove: ['Penambahan phrasal verbs', 'Kelancaran tenses'],
        suggestedStarterPhrases: ['I like listening to music', 'I usually hang out with friends'],
      });

      sendJsonResponse(res, 200, parsed);
      return true;
    }

// Helper to detect if a candidate reply repeats or closely mirrors past assistant messages
function isRepetitive(candidate: string, previousList: string[]): boolean {
  if (!candidate || candidate.trim().length === 0) return true;
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const candClean = clean(candidate);
  if (!candClean) return true;

  for (const prev of previousList) {
    const prevClean = clean(prev);
    if (!prevClean) continue;

    // Exact or near-identical string
    if (candClean === prevClean) return true;

    // Direct containment of substantial chunks (> 25 characters)
    if (candClean.length > 25 && prevClean.includes(candClean)) return true;
    if (prevClean.length > 25 && candClean.includes(prevClean)) return true;

    // Word set overlap (Jaccard similarity > 0.55 indicates repetitive sentence structure)
    const candWords = new Set(candClean.split(' '));
    const prevWords = new Set(prevClean.split(' '));
    let intersection = 0;
    candWords.forEach((w) => {
      if (prevWords.has(w)) intersection++;
    });
    const union = new Set([...candWords, ...prevWords]).size;
    if (union > 0 && intersection / union > 0.55) {
      return true;
    }
  }

  return false;
}

// Generate smart contextual non-repeating fallback
function buildSmartProgressionFallback(userText: string, scenario: any, pastAssistantMsgs: string[]) {
  const cleanText = userText.trim();
  const lower = cleanText.toLowerCase();

  const corrections: Array<{ original: string; better: string; explanation: string }> = [];
  if (/\bi am agree\b/i.test(cleanText)) {
    corrections.push({
      original: 'I am agree',
      better: 'I agree',
      explanation: "'Agree' adalah kata kerja (verb), cukup gunakan 'I agree' tanpa 'am'.",
    });
  } else if (/\bshe don't\b|\bhe don't\b/i.test(cleanText)) {
    corrections.push({
      original: "don't",
      better: "doesn't",
      explanation: "Untuk orang ketiga tunggal (he/she/it), gunakan 'doesn't'.",
    });
  } else if (/\byesterday i go\b/i.test(cleanText)) {
    corrections.push({
      original: 'yesterday I go',
      better: 'yesterday I went',
      explanation: "Bentuk lampau dari 'go' adalah 'went'.",
    });
  }

  // Pick fresh angle based on keywords
  let reply = '';
  let idTrans = '';
  let vocab = { word: 'step forward', meaning: 'langkah maju', partOfSpeech: 'phrase', example: 'Every practice is a step forward.' };
  let suggested = [
    'I definitely see what you mean.',
    'From my personal experience, it made a big difference.',
    'What do you recommend I should do next?',
  ];

  if (lower.includes('video') || lower.includes('youtube') || lower.includes('watch') || lower.includes('clip')) {
    reply = `That sounds very intriguing! What was the most eye-opening takeaway or quote from that video for you?`;
    idTrans = `Itu terdengar sangat memikat! Apa hal paling membuka mata atau kutipan favoritmu dari video tersebut?`;
    vocab = { word: 'eye-opening', meaning: 'membuka wawasan / mata', partOfSpeech: 'adjective', example: 'That video was truly eye-opening.' };
    suggested = [
      'It showed how consistent daily practice leads to huge results.',
      'The speaker explained a unique problem-solving framework.',
      'It gave practical real-life examples that I can test today.',
    ];
  } else if (lower.includes('inspire') || lower.includes('passion') || lower.includes('goal') || lower.includes('dream')) {
    reply = `Inspiration is fantastic! Now that you have that motivation, what is the very first tangible action step you'll take?`;
    idTrans = `Inspirasi itu luar biasa! Sekarang setelah punya motivasi itu, apa langkah aksi nyata pertama yang akan kamu ambil?`;
    vocab = { word: 'tangible', meaning: 'nyata dan terukur', partOfSpeech: 'adjective', example: 'We need a tangible action plan.' };
    suggested = [
      'I plan to spend 20 minutes every evening practicing.',
      'I am putting together a checklist to keep myself accountable.',
      'I will discuss this idea with my peers tomorrow.',
    ];
  } else {
    // Dynamic snippet reflection
    const snippet = cleanText.length > 20 ? cleanText.slice(0, 20) + '...' : cleanText;
    reply = `I really appreciate you elaborating on "${snippet}". Looking at this from another angle, how do you see this impacting your goals?`;
    idTrans = `Saya sangat menghargai penjelasanmu tentang "${snippet}". Dilihat dari sudut pandang lain, bagaimana hal ini memengaruhi targetmu?`;
    vocab = { word: 'another angle', meaning: 'sudut pandang yang berbeda', partOfSpeech: 'phrase', example: 'Let us view the issue from another angle.' };
    suggested = [
      'It definitely opens up new possibilities for me.',
      'I think it will help me overcome current bottlenecks.',
      'To be fair, there are still some uncertainties to figure out.',
    ];
  }

  return {
    reply,
    indonesianTranslation: idTrans,
    corrections,
    vocabHighlights: [vocab],
    suggestedReplies: suggested,
  };
}

    // 2. Scenario Roleplay Route (High-Speed & Strengthened Pedagogical AI)
    if (url === '/api/chat/scenario') {
      const {
        scenario,
        messages = [],
        level = 'intermediate',
        latestUserMessage = '',
      } = body;

      const levelGuidelines = {
        beginner: `
- Level: Pemula (Beginner / A1-A2).
- AI Persona: Warm, approachable explorer friend. Keep responses short and conversational (1-2 sentences).
- Understand Indonesian terms (Gado-Gado) effortlessly, responding in clear, accessible English.
- Correction style: Gentle and encouraging. Highlight at most 1 key point.
- Provide natural Indonesian translation.
`,
        intermediate: `
- Level: Menengah (Intermediate / B1-B2).
- AI Persona: Lively, natural peer or colleague. Use everyday idioms and phrasal verbs naturally (e.g. "catch on", "figure out", "dive into", "touch upon").
- Help user practice natural conversation flow and sentence variety.
- Correction style: Highlight subtle tense shifts (Past vs Present) or prepositions.
- Provide natural Indonesian translation.
`,
        advanced: `
- Level: Mahir (Advanced / C1).
- AI Persona: Articulate native speaker. Employ authentic nuances, evocative collocations, and varied sentence rhythms.
- Challenge the learner with thoughtful perspectives and natural English idioms.
- Correction style: Focus on tone appropriateness, conciseness, and discourse transitions.
- Provide natural Indonesian translation.
`,
        expert: `
- Level: Sangat Ahli (Expert / C2 / Professional Debate / IELTS 8.5+).
- AI Persona: Insightful sparring partner or senior executive. Use high-register vocabulary, sharp analytical counter-questions, and rhetorical variety.
- Correction style: Meticulous feedback on nuance, precision, and logical coherence.
- Provide natural Indonesian translation.
`,
      };

      const activeLevelPrompt = levelGuidelines[level as keyof typeof levelGuidelines] || levelGuidelines.intermediate;

      // Extract previous assistant messages to enforce strict anti-repetition
      const previousAssistantMessages: string[] = (messages || [])
        .filter((m: any) => m.role === 'assistant')
        .map((m: any) => String(m.content || '').trim())
        .filter(Boolean);

      // Extract questions already asked
      const previousQuestions: string[] = [];
      for (const msg of previousAssistantMessages) {
        const sentences = msg.split(/[.?!]/).map((s) => s.trim()).filter(Boolean);
        for (const s of sentences) {
          if (
            msg.includes(`${s}?`) ||
            /^(what|how|why|could|would|can|do you|did you|have you|are you|is there)/i.test(s)
          ) {
            previousQuestions.push(s);
          }
        }
      }

      // Format dialogue log cleanly
      const transcript = (messages || [])
        .slice(-8)
        .map((m: any, idx: number) => {
          const speaker = m.role === 'assistant' ? 'Piko (AI)' : 'Learner (User)';
          return `[Turn ${idx + 1}] ${speaker}: ${m.content}`;
        })
        .join('\n');

      const systemInstruction = `
You are "Piko", an expert English conversational coach on Fasih.ai.
Current Scenario:
- Title: ${scenario?.title || 'Daily Conversation'}
- Learner's Role: ${scenario?.userRole || 'Learner'}
- Your Character Role: ${scenario?.aiRole || 'Coach & Partner'}
- Target Goal: ${scenario?.targetGoal || 'Engage naturally'}

${activeLevelPrompt}

CONVERSATION PROGRESSION & STRICT ANTI-REPETITION RULES:
1. ALWAYS NYAMBUNG (DIRECT REACTION):
   - Immediately comment on or acknowledge the specific concept, noun, verb, or emotion in the learner's newest message ("${latestUserMessage}").
   - Deepen that exact train of thought.
2. ABSOLUTELY NO REPEATING OR LOOPING:
   - You MUST NOT repeat any sentence, greeting, or question that you already asked previously.
   - Do NOT circle back to starter questions.
   - Always pose ONE FRESH, insightful follow-up question that pushes the conversation forward to a new dimension.
3. GRAMMAR CHECK:
   - Check the learner's latest message ("${latestUserMessage}") for real errors (e.g. "I am agree" -> "I agree", "she don't" -> "she doesn't", "yesterday I go" -> "yesterday I went", "more better" -> "much better", missing plural 's').
   - If an error is present, give 1 helpful correction in "corrections". If grammatically fine, provide [].
4. VOCABULARY HIGHLIGHT:
   - Highlight 1 useful, authentic vocabulary item, idiom, or phrasal verb from your reply.
5. CONTEXTUAL SUGGESTED REPLIES:
   - Provide 3 completely fresh, natural English responses tailored specifically to answer YOUR new follow-up question. Never repeat the learner's previous inputs or old suggestions.

Output MUST be strictly valid JSON:
{
  "reply": "string (In-character English spoken response acknowledging user's statement and asking ONE fresh follow-up question)",
  "indonesianTranslation": "string (Accurate, natural Indonesian translation)",
  "corrections": [
    {
      "original": "string",
      "better": "string",
      "explanation": "string"
    }
  ],
  "vocabHighlights": [
    {
      "word": "string",
      "meaning": "string",
      "partOfSpeech": "string",
      "example": "string"
    }
  ],
  "suggestedReplies": ["string", "string", "string"]
}
`;

      const promptContents = `
CONVERSATION TRANSCRIPT:
${transcript || '(Starting fresh)'}

LEARNER'S LATEST MESSAGE:
"${latestUserMessage}"

PREVIOUS QUESTIONS ASKED BY PIKO (DO NOT REPEAT ANY OF THESE):
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') : '(None yet)'}

Generate Piko's next response as JSON. Remember: Acknowledge "${latestUserMessage}" directly and ask a brand-new follow-up question.`;

      let parsed: any = null;

      try {
        const response = await generateWithModelFallback({
          contents: promptContents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.75,
          },
        });

        parsed = cleanAndParseJSON(response.text, null);
      } catch (genError) {
        console.warn('Initial generation error, fallback will handle:', genError);
      }

      // Check for repetition against previous assistant messages
      if (parsed && parsed.reply && isRepetitive(parsed.reply, previousAssistantMessages)) {
        console.warn('[Anti-Repetition Triggered] Response repeated past content:', parsed.reply);
        try {
          const retryResponse = await generateWithModelFallback({
            contents: `Your previous generated reply: "${parsed.reply}" is REPETITIVE and was already said before.
The learner just said: "${latestUserMessage}".
Generate a completely DIFFERENT, FRESH follow-up response that unpacks "${latestUserMessage}" and moves the conversation to a new progressive angle.`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.9,
            },
          });
          const retryParsed = cleanAndParseJSON(retryResponse.text, null);
          if (retryParsed && retryParsed.reply && !isRepetitive(retryParsed.reply, previousAssistantMessages)) {
            parsed = retryParsed;
          }
        } catch (retryErr) {
          console.warn('Retry generation error:', retryErr);
        }
      }

      // If still missing or repetitive, use dynamic progression generator
      if (!parsed || !parsed.reply || isRepetitive(parsed.reply, previousAssistantMessages)) {
        console.log('[Anti-Repetition] Using smart progression fallback');
        parsed = buildSmartProgressionFallback(latestUserMessage, scenario, previousAssistantMessages);
      }

      // Ensure suggested replies do not repeat the user's latest statement
      if (Array.isArray(parsed.suggestedReplies)) {
        parsed.suggestedReplies = parsed.suggestedReplies.filter(
          (s: string) => s && s.toLowerCase().trim() !== latestUserMessage.toLowerCase().trim()
        );
      }

      sendJsonResponse(res, 200, parsed);
      return true;
    }

    // 3. Custom Roleplay Sandbox Generator
    if (url === '/api/roleplay/sandbox-generate') {
      const { prompt: userIdea, userLevel = 'intermediate' } = body;

      const systemInstruction = `
You are an expert curriculum designer for Fasih.ai.
Design an immersive, custom conversational roleplay scenario based on the user's idea: "${userIdea}".
Target Level: ${userLevel}.

Output strictly valid JSON:
{
  "id": "string (slug-like id)",
  "title": "string (engaging title in Indonesian/English)",
  "category": "Work | Travel | Daily | Academic | Social",
  "level": "${userLevel}",
  "userRole": "string (learner's specific role)",
  "aiRole": "string (AI partner's personality and position)",
  "context": "string (2-3 sentences setting up the situation in Indonesian)",
  "targetGoal": "string (clear conversational objective)",
  "initialMessage": "string (AI's lively opening English line to start)",
  "initialTranslation": "string (Indonesian translation of initialMessage)",
  "suggestedStarterReplies": ["string", "string", "string"]
}
`;

      const response = await generateWithModelFallback({
        contents: `Create custom scenario: "${userIdea}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const parsed = cleanAndParseJSON(response.text, {
        id: `custom-${Date.now()}`,
        title: 'Simulasi Kustom: ' + userIdea.slice(0, 30),
        category: 'Work',
        level: userLevel,
        userRole: 'Kamu (Learner)',
        aiRole: 'Lawan Bicara',
        context: `Simulasi khusus berdasarkan permintaanmu: ${userIdea}`,
        targetGoal: 'Berkomunikasi dengan lancar dan mencapai tujuan percakapan',
        initialMessage: "Good morning! Thank you for meeting with me today. Let's discuss your proposal.",
        initialTranslation: 'Selamat pagi! Terima kasih sudah bertemu dengan saya hari ini. Mari kita bahas proposal Anda.',
        suggestedStarterReplies: ['Thank you for your time.', 'Let me walk you through my idea.', 'Good morning!'],
      });

      sendJsonResponse(res, 200, parsed);
      return true;
    }

    // 4. Pronunciation Evaluation Route
    if (url === '/api/speech/pronounce-eval') {
      const { spokenText, referenceText, userLevel = 'intermediate' } = body;

      const systemInstruction = `
You are an expert AI pronunciation coach specifically trained on Indonesian phonological patterns when speaking English.
Common Indonesian learner challenges to assess:
- Silent letters: "island" (/ˈaɪ.lənd/, silent s), "knife" (silent k), "debt" (silent b), "receipt" (silent p).
- Vowel contrasts: "beach" vs "bitch", "sheet" vs "shit", "live" vs "leave", "pull" vs "pool".
- Consonant clusters and endings: "months", "clothes", "comfortable" (/ˈkʌmftəbl/), "vegetable", "schedule".
- Past tense "-ed" endings: /t/, /d/, or /ɪd/.

Analyze the spoken utterance: "${spokenText}"
Target/Reference: "${referenceText || spokenText}"
Learner Level: "${userLevel}".

Output strictly valid JSON:
{
  "pronunciationScore": number (0 to 100),
  "fluencyScore": number (0 to 100),
  "generalFeedback": "string (encouraging, precise assessment in Indonesian)",
  "highlightedWords": [
    {
      "word": "string (word inspected)",
      "isAccurate": boolean,
      "phoneticIPA": "string",
      "spellingGuide": "string (Indonesian phonetics guide, e.g. 'ai-lend')",
      "tip": "string (actionable Indonesian tip)"
    }
  ],
  "praisePoint": "string (one clear thing they did well)"
}
`;

      const response = await generateWithModelFallback({
        contents: `Evaluate spoken utterance: "${spokenText}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = cleanAndParseJSON(response.text, {
        pronunciationScore: 88,
        fluencyScore: 86,
        generalFeedback: 'Pengucapanmu cukup jelas dan mudah dipahami oleh penutur asli!',
        highlightedWords: [],
        praisePoint: 'Intonasimu mengalir dengan ritme yang baik.',
      });

      sendJsonResponse(res, 200, parsed);
      return true;
    }

    // 5. Vocab Vault Details (Word lookup)
    if (url === '/api/vocab/details') {
      const { word } = body;

      const systemInstruction = `
You are the lexicographer for Fasih.ai's Vocab Vault.
Provide a rich, learner-friendly card for the English word or idiom: "${word}".

Output strictly valid JSON:
{
  "word": "${word}",
  "phonetic": "string (e.g. /ˈɔːkwəd/)",
  "partOfSpeech": "noun | verb | phrasal verb | adjective | idiom | adverb",
  "meaningId": "string (definisi bahasa Indonesia yang akurat dan ringkas)",
  "level": "A1 | A2 | B1 | B2 | C1 | C2",
  "exampleSentence": "string (practical, natural English sentence)",
  "exampleTranslation": "string (terjemahan contoh kalimat)",
  "memoryTip": "string (tips jitu menghafal atau konteks penggunaan dalam bahasa Indonesia)",
  "synonyms": ["string", "string"]
}
`;

      const response = await generateWithModelFallback({
        contents: `Provide vocab card for "${word}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const parsed = cleanAndParseJSON(response.text, {
        word,
        phonetic: '/.../',
        partOfSpeech: 'word',
        meaningId: 'Kosakata penting dalam bahasa Inggris',
        level: 'B1',
        exampleSentence: `I use ${word} in daily conversation.`,
        exampleTranslation: `Saya menggunakan ${word} dalam percakapan sehari-hari.`,
        memoryTip: 'Hafalkan konteks kalimatnya secara utuh.',
        synonyms: [],
      });

      sendJsonResponse(res, 200, parsed);
      return true;
    }

    sendJsonResponse(res, 404, { error: 'Not found' });
    return true;
  } catch (error: any) {
    console.error('API route error:', error);
    sendJsonResponse(res, 500, { error: error?.message || 'Server error' });
    return true;
  }
}
