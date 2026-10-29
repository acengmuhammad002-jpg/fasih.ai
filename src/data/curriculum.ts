import { AppLevel, LevelConfig, Scenario, VocabItem, GrammarPitfall } from '../types';

export const LEVEL_CONFIGS: Record<AppLevel, LevelConfig> = {
  beginner: {
    id: 'beginner',
    cefr: 'A1 - A2',
    title: 'Pemula (Beginner)',
    subtitle: 'Sering nge-blank, butuh bantuan campur Bahasa Indonesia',
    description: 'Kalimat pendek, kosakata dasar, mendukung penuh mode gado-gado. Koreksi super santai dan tombol translate.',
    icon: '👶',
    borderColor: '#4ade80',
    bgColor: '#f0fdf4',
    activeBorderColor: '#22c55e',
    accentColor: '#16a34a',
    features: ['Mode Gado-Gado didukung', 'Tombol Terjemahan langsung', 'Koreksi santai 1-2 poin', 'Skenario aktivitas harian dasar'],
  },
  intermediate: {
    id: 'intermediate',
    cefr: 'B1 - B2',
    title: 'Menengah (Intermediate)',
    subtitle: 'Bisa membaca/mendengar, tapi masih kaku saat bicara',
    description: 'Percakapan natural, mulai menggunakan phrasal verbs, koreksi tenses (Past vs Present), dan saran kata lebih luwes.',
    icon: '👦',
    borderColor: '#38bdf8',
    bgColor: '#f0f9ff',
    activeBorderColor: '#0284c7',
    accentColor: '#0284c7',
    features: ['Phrasal Verbs umum', 'Koreksi tenses & grammar', 'Kecepatan obrolan natural', 'Skenario sosial & travel'],
  },
  advanced: {
    id: 'advanced',
    cefr: 'C1',
    title: 'Mahir (Advanced)',
    subtitle: 'Lancar, ingin belajar slang, idiom, dan ngobrol natural',
    description: '100% Bahasa Inggris, idiom & ekspresi penutur asli, analisis nada bicara (Tone), dan etika percakapan profesional.',
    icon: '🧑',
    borderColor: '#fb923c',
    bgColor: '#fff7ed',
    activeBorderColor: '#ea580c',
    accentColor: '#ea580c',
    features: ['Idiom & Slang Native', 'Evaluasi Tone & Kesopanan', '100% Full English', 'Skenario kerja & opini'],
  },
  expert: {
    id: 'expert',
    cefr: 'C2',
    title: 'Sangat Ahli (Expert)',
    subtitle: 'Siap untuk debat, negosiasi bisnis, dan TOEFL/IELTS',
    description: 'Kosakata akademis dan korporat tingkat tinggi, counter-argument tajam, koreksi nuansa kata super ketat.',
    icon: '🧙‍♂️',
    borderColor: '#c084fc',
    bgColor: '#faf5ff',
    activeBorderColor: '#9333ea',
    accentColor: '#9333ea',
    features: ['Debat & Negosiasi Keras', 'IELTS/TOEFL Speaking Rubric', 'Nuansa kata & Retorika', 'Koreksi paling ketat'],
  },
};

export const INITIAL_SCENARIOS: Scenario[] = [
  // DIAGNOSTIC PLACEMENT / ICEBREAKER
  {
    id: 'icebreaker-test',
    title: 'The Icebreaker (Tes Penempatan Level)',
    category: 'Social',
    level: 'beginner',
    userRole: 'Learner yang ingin menguji kemampuan aslinya',
    aiRole: 'Piko Sang Explorer & Penguji Ramah',
    context: 'Sesi obrolan santai 3-4 pertanyaan untuk mengalibrasi level bahasa Inggrismu secara langsung.',
    targetGoal: 'Jawab pertanyaan dengan nyaman agar AI menentukan level belajarmu yang paling pas',
    initialMessage: "Hi there! I'm Piko, your adventure buddy. Let's do a quick diagnostic chat! Tell me, what do you usually love doing on your free days?",
    initialTranslation: "Halo! Aku Piko, teman petualanganmu. Yuk obrolan diagnostik kilat! Ceritakan padaku, apa yang biasanya kamu suka lakukan di hari liburmu?",
    suggestedStarterReplies: [
      "I usually hang out with friends and listen to music.",
      "I love watching movies and cooking at home.",
      "I often spend my free time studying and traveling."
    ],
    icon: '🧪'
  },
  // LEVEL 1: PEMULA (A1-A2)
  {
    id: 'beg-1',
    title: 'Perkenalan Diri di Kafe Internasional',
    category: 'Daily',
    level: 'beginner',
    userRole: 'Siswa baru yang ramah',
    aiRole: 'Barista & teman mengobrol yang sabar',
    context: 'Kamu baru tiba di kafe dekat kampus/tempat kerja dan ingin berkenalan santai sambil memesan minuman.',
    targetGoal: 'Perkenalkan namamu, asalmu dari Indonesia, dan pesan minuman favoritmu.',
    initialMessage: "Hi there! Welcome to our cafe! What is your name, and where are you from?",
    initialTranslation: "Halo! Selamat datang di kafe kami! Siapa namamu, dan kamu berasal dari mana?",
    suggestedStarterReplies: [
      "Hello! My name is ... and I come from Indonesia.",
      "Hi! I am new here. Can I order an iced tea, please?",
      "Good morning! Nice to meet you. I'm from Jakarta."
    ],
    icon: '☕'
  },
  {
    id: 'beg-2',
    title: 'Belanja di Minimarket 7-Eleven Luar Negeri',
    category: 'Daily',
    level: 'beginner',
    userRole: 'Pembeli yang mencari barang',
    aiRole: 'Kasir minimarket yang ramah',
    context: 'Kamu sedang mencari air mineral dan adaptor colokan listrik di minimarket.',
    targetGoal: 'Tanyakan letak barang dan total harga belanjaanmu.',
    initialMessage: "Good evening! Can I help you find something today?",
    initialTranslation: "Selamat malam! Ada yang bisa saya bantu carikan hari ini?",
    suggestedStarterReplies: [
      "Excuse me, where can I find bottled water?",
      "Do you sell power plug adapters here?",
      "How much is this chocolate bar, please?"
    ],
    icon: '🏪'
  },

  // LEVEL 2: MENENGAH (B1-B2)
  {
    id: 'int-1',
    title: 'Check-in Hotel & Kamar Bermasalah',
    category: 'Travel',
    level: 'intermediate',
    userRole: 'Tamu hotel yang lelah setelah perjalanan jauh',
    aiRole: 'Resepsionis hotel yang sigap dan sopan',
    context: 'Kamu baru saja masuk ke kamar hotel, tetapi AC tidak dingin dan kartu kuncinya sering macet.',
    targetGoal: 'Jelaskan keluhan dengan jelas dan minta pergantian kamar atau teknisi.',
    initialMessage: "Front desk, speaking. Good afternoon, how can I assist you with your room today?",
    initialTranslation: "Resepsionis berbicara. Selamat siang, bagaimana saya bisa membantu kendala kamar Anda hari ini?",
    suggestedStarterReplies: [
      "Hi, I just checked into room 402, but the air conditioner is not working properly.",
      "Could someone look into this? The room is really warm right now.",
      "I was wondering if it's possible to change to another room, please."
    ],
    icon: '🏨'
  },
  {
    id: 'int-2',
    title: 'Ngobrol Santai Soal Hobi & Rencana Weekend',
    category: 'Social',
    level: 'intermediate',
    userRole: 'Teman sekelas/rekan kerja yang asyik',
    aiRole: 'Teman bule yang ramah dan suka jalan-jalan',
    context: 'Hari Jumat sore di kantor/kampus, saatnya santai membahas film dan tempat hangout akhir pekan.',
    targetGoal: 'Ceritakan film terakhir yang kamu tonton dan ajak temanmu mencoba makanan enak.',
    initialMessage: "Hey! Finally Friday! Are you planning to hang out or just chill at home this weekend?",
    initialTranslation: "Hei! Akhirnya Jumat juga! Kamu berencana mau nongkrong atau santai di rumah aja akhir pekan ini?",
    suggestedStarterReplies: [
      "I'm thinking of checking out the new coffee shop downtown.",
      "To be honest, I'm pretty tired, so I might just binge-watch some movies.",
      "Would you like to grab some street food together on Saturday?"
    ],
    icon: '🍕'
  },

  // LEVEL 3: MAHIR (C1)
  {
    id: 'adv-1',
    title: 'Interview Kerja di Perusahaan Tech Global',
    category: 'Work',
    level: 'advanced',
    userRole: 'Kandidat profesional yang percaya diri',
    aiRole: 'Hiring Manager yang kritis dan menuntut data konkret',
    context: 'Kamu sedang diwawancarai untuk posisi kunci di perusahaan teknologi multinasional.',
    targetGoal: 'Jelaskan pencapaian terbesarmu dan cara kamu mengatasi konflik di dalam tim kerja.',
    initialMessage: "Thank you for joining us today. Looking at your resume, could you walk me through a complex project where you had to navigate conflicting stakeholder priorities?",
    initialTranslation: "Terima kasih sudah bergabung hari ini. Melihat resume Anda, bisakah Anda ceritakan proyek rumit di mana Anda harus menyelaraskan prioritas antar-pemangku kepentingan yang saling bertentangan?",
    suggestedStarterReplies: [
      "Certainly. In my previous role, our product and engineering teams had misaligned timelines...",
      "I tackled that by establishing a transparent prioritization framework rooted in user metrics.",
      "That is a great question. Let me share how we turned a delayed rollout into our biggest quarter."
    ],
    icon: '💼'
  },
  {
    id: 'adv-2',
    title: 'Komplain Barang Rusak ke Customer Support',
    category: 'Work',
    level: 'advanced',
    userRole: 'Pelanggan tegas yang menginginkan solusi segera',
    aiRole: 'Customer Support Supervisor yang berusaha meredam ketegangan',
    context: 'Laptop yang kamu beli online tiba dalam keadaan layar retak dan customer service sebelumnya berbelit-belit.',
    targetGoal: 'Gunakan bahasa yang tegas, profesional, dan minta kompensasi atau penggantian kilat.',
    initialMessage: "Hello, this is Sarah from escalations. I understand you've had an unacceptable experience with your recent delivery. How can I rectify this for you?",
    initialTranslation: "Halo, saya Sarah dari tim eskalasi. Saya memahami bahwa Anda mengalami pengalaman yang tidak mengenakkan dengan pengiriman barang Anda baru-baru ini. Bagaimana saya bisa memperbaikinya untuk Anda?",
    suggestedStarterReplies: [
      "Thank you Sarah. I appreciate you taking over. To cut straight to the chase, my laptop screen arrived cracked.",
      "Given the delay this has caused to my work, I expect an expedited replacement shipped today.",
      "I have attached photos of the package damage. Could you process a priority dispatch immediately?"
    ],
    icon: '📦'
  },

  // LEVEL 4: SANGAT AHLI (C2)
  {
    id: 'exp-1',
    title: 'Negosiasi Kenaikan Gaji dengan VP Eksekutif',
    category: 'Work',
    level: 'expert',
    userRole: 'Lead Specialist yang meminta kenaikan kompensasi signifikan',
    aiRole: 'VP of Finance & Operations yang sangat berhitung soal budget',
    context: 'Tinjauan kinerja tahunan. Kamu telah melampaui KPI 140%, namun perusahaan sedang menerapkan efisiensi anggaran.',
    targetGoal: 'Bantah argumen pembatasan budget dengan metrik ROI riil dan ajukan struktur kompensasi alternatif.',
    initialMessage: "Your contributions this past quarter have certainly been commendable. However, with macroeconomic headwinds, our executive team has placed a freeze on discretionary compensation adjustments. What makes your case an exception?",
    initialTranslation: "Kontribusi Anda kuartal kemarin tentu patut diapresiasi. Namun, dengan tantangan makroekonomi saat ini, tim eksekutif kami membekukan penyesuaian kompensasi diskresioner. Apa yang membuat kasus Anda layak menjadi pengecualian?",
    suggestedStarterReplies: [
      "I appreciate the macroeconomic constraints; however, my direct pipeline drove $420k in net retained revenue.",
      "If baseline salary adjustments are constrained, I propose structuring this via a performance-contingent milestone bonus.",
      "Let's examine the comparative market data for this tier of architectural stewardship."
    ],
    icon: '⚖️'
  },
  {
    id: 'exp-2',
    title: 'IELTS Speaking Part 3: Urbanization & AI Disruption',
    category: 'Academic',
    level: 'expert',
    userRole: 'Peserta tes IELTS membidik Band 8.5 - 9.0',
    aiRole: 'IELTS Senior Examiner yang menilai koherensi, leksikal, dan gramatikal',
    context: 'Ujian lisan tingkat tinggi menguji kemampuan berpikir kritis, argumen abstrak, dan sintaksis variatif.',
    targetGoal: 'Sajikan argumen seimbang dengan penalaran deduktif, ragam kosakata idiomatik, dan diskursus runut.',
    initialMessage: "Some sociologists argue that rapid artificial intelligence adoption will exacerbate societal inequalities in developing urban centers. To what extent do you endorse this perspective?",
    initialTranslation: "Beberapa sosiolog berargumen bahwa adopsi kecerdasan buatan yang pesat akan memperparah ketimpangan sosial di pusat-pusat perkotaan negara berkembang. Sejauh mana Anda mendukung perspektif ini?",
    suggestedStarterReplies: [
      "While it is tempting to view technological disruption purely through an exclusionary lens, the reality is nuanced.",
      "On one hand, low-barrier automation risks displacing conventional clerical sectors disproportionately.",
      "Conversely, AI-augmented public services could democratize access to municipal healthcare and education."
    ],
    icon: '🎓'
  }
];

export const INITIAL_VOCAB_VAULT: VocabItem[] = [
  {
    id: 'v1',
    word: 'Hang out',
    meaningId: 'Menghabiskan waktu santai bersama teman-teman',
    phonetic: '/hæŋ aʊt/',
    partOfSpeech: 'Phrasal Verb',
    level: 'B1',
    exampleSentence: 'Do you want to hang out at the mall this Saturday?',
    exampleTranslation: 'Mau nongkrong di mall bareng hari Sabtu ini?',
    memoryTip: 'Daripada pakai kata kaku "spend time together", penutur asli selalu pakai "hang out"!',
    mastered: false,
    dateAdded: '2026-10-25'
  },
  {
    id: 'v2',
    word: 'Under the weather',
    meaningId: 'Kurang enak badan / agak sakit ringan',
    phonetic: '/ˈʌndə ðə ˈweðə/',
    partOfSpeech: 'Idiom',
    level: 'B2',
    exampleSentence: "I can't make it today because I'm feeling a bit under the weather.",
    exampleTranslation: 'Aku nggak bisa datang hari ini karena lagi kurang enak badan.',
    memoryTip: 'Keren untuk dipakai izin kerja daripada cuma bilang "I am sick".',
    mastered: false,
    dateAdded: '2026-10-26'
  },
  {
    id: 'v3',
    word: 'Touch base',
    meaningId: 'Menghubungi sebentar untuk update kabar atau urusan kerja',
    phonetic: '/tʌtʃ beɪs/',
    partOfSpeech: 'Idiom / Work Slang',
    level: 'C1',
    exampleSentence: "Let's touch base next Monday to discuss the quarterly progress.",
    exampleTranslation: 'Mari kita kontak-kontakan lagi Senin depan untuk bahas progres kuartalan.',
    memoryTip: 'Sangat sering muncul di email bisnis dan rapat kantor internasional.',
    mastered: true,
    dateAdded: '2026-10-27'
  },
  {
    id: 'v4',
    word: 'Call off',
    meaningId: 'Membatalkan rencana atau acara (cancel)',
    phonetic: '/kɔːl ɒf/',
    partOfSpeech: 'Phrasal Verb',
    level: 'B1',
    exampleSentence: 'They had to call off the football match because of heavy rain.',
    exampleTranslation: 'Mereka terpaksa membatalkan pertandingan bola karena hujan deras.',
    memoryTip: 'Lebih luwes diucapkan sehari-hari dibandingkan kata formal "cancel".',
    mastered: false,
    dateAdded: '2026-10-28'
  },
  {
    id: 'v5',
    word: 'Comfortable',
    meaningId: 'Nyaman (Perhatikan pelafalan kata ini)',
    phonetic: '/ˈkʌmf.tə.bəl/',
    partOfSpeech: 'Adjective',
    level: 'A2',
    exampleSentence: 'This sofa is exceptionally comfortable.',
    exampleTranslation: 'Sofa ini luar biasa nyaman.',
    memoryTip: 'Jangan dibaca "com-for-ta-ble"! Ucapkan cukup 3 suku kata: "KUMF-tuh-buhl".',
    mastered: false,
    dateAdded: '2026-10-29'
  },
  {
    id: 'v6',
    word: 'Island',
    meaningId: 'Pulau (Huruf "s" TIDAK DIBACA)',
    phonetic: '/ˈaɪ.lənd/',
    partOfSpeech: 'Noun',
    level: 'A1',
    exampleSentence: 'Bali is a renowned holiday island in Indonesia.',
    exampleTranslation: 'Bali adalah pulau liburan terkenal di Indonesia.',
    memoryTip: 'Silent "S"! Ucapkan "ai-lend", bukan "is-land".',
    mastered: true,
    dateAdded: '2026-10-29'
  }
];

export const INITIAL_GRAMMAR_PITFALLS: GrammarPitfall[] = [
  {
    rule: "Akhiran '-s / -es' untuk Subjek Tunggal (He / She / It)",
    mistakeExample: "He go to office every day.",
    correctedExample: "He goes to the office every day.",
    count: 6,
    tip: "Dalam Simple Present, subjek he, she, it atau satu orang wajib menambahkan -s/-es pada kata kerjanya."
  },
  {
    rule: "Past Tense untuk Kejadian yang Sudah Lewat",
    mistakeExample: "Yesterday I meet my friend in Bandung.",
    correctedExample: "Yesterday I met my friend in Bandung.",
    count: 4,
    tip: "Jika ada penanda waktu lampau (yesterday, last week, 2 years ago), ubah kata kerja ke bentuk ke-2 (V2)."
  },
  {
    rule: "Preposisi Waktu & Tempat (In vs On vs At)",
    mistakeExample: "I was born on July in 2001 at Jakarta.",
    correctedExample: "I was born in July, in 2001, in Jakarta.",
    count: 3,
    tip: "Gunakan 'at' untuk jam & titik spesifik, 'on' untuk hari & tanggal, 'in' untuk bulan, tahun & kota besar."
  },
  {
    rule: "Kata Benda Tak Terhitung (Uncountable Nouns)",
    mistakeExample: "Can you give me some advices and informations?",
    correctedExample: "Can you give me some advice and information?",
    count: 2,
    tip: "'Advice' dan 'Information' tidak pernah memakai akhiran 's'. Gunakan 'a piece of advice' jika ingin menghitungnya."
  }
];
