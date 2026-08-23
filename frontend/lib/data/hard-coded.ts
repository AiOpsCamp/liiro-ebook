/* eslint-disable no-useless-escape */
const RESPONSE_DATA = {
  courseLanguage: {
    name: "finnish",
    iso: "fi",
  },
  userLanguage: {
    name: "english",
    iso: "en",
  },
  userDefaultLanguage: {
    name: "finnish",
    iso: "fi",
  },
  metadata: {
    limit: 20,
    returned: 19,
    cycleTerms: 4,
    totalCycles: 8,
    buckets: {
      newOrWeak: {
        requested: 8,
        picked: 19,
        totalAvailable: 149,
      },
      reviewLearned: {
        requested: 8,
        picked: 0,
        totalAvailable: 0,
      },
      forgotten: {
        requested: 4,
        picked: 0,
        totalAvailable: 0,
      },
    },
    strategy: "langowords_session_mix_srs_learnflow_slim_v1",
  },
  cycles: [
    {
      cycleType: "learn",
      learnCount: 4,
      termIds: [
        "6714365f9037c6d2d8679b66",
        "6714365f9037c6d2d8679c1c",
        "671436609037c6d2d8679c62",
        "671436609037c6d2d8679ce4",
      ],
      tests: {
        standardQuiz: [
          {
            type: "standard_quiz",
            category: "standard_quiz",
            termId: "671436609037c6d2d8679ce4",
            question: `"What is the meaning of \"Brush\"?`,
            optionTermIds: [
              "6714365f9037c6d2d8679b66",
              "6714365f9037c6d2d8679c1c",
              "671436609037c6d2d8679c62",
              "671436609037c6d2d8679ce4",
            ],
            correctTermId: "671436609037c6d2d8679ce4",
          },
        ],
        trueFalse: [
          {
            type: "true_false",
            category: "true_false",
            termId: "6714365f9037c6d2d8679c1c",
            statement: `"\"Get up\" means \"Harjata\".`,
            correctOptionId: "false",
          },
        ],
        audioListening: [
          {
            type: "audio_listening",
            category: "audio_listening",
            termId: "6714365f9037c6d2d8679b66",
            question: "Which word did you hear?",
            audioTermId: "6714365f9037c6d2d8679b66",
            optionTermIds: [
              "6714365f9037c6d2d8679b66",
              "6714365f9037c6d2d8679c1c",
              "671436609037c6d2d8679c62",
              "671436609037c6d2d8679ce4",
            ],
            correctTermId: "6714365f9037c6d2d8679b66",
          },
        ],
        imageSelect: [
          {
            type: "image_select",
            category: "image_select",
            termId: "6714365f9037c6d2d8679c1c",
            imageTermId: "6714365f9037c6d2d8679c1c",
            question: "Which word matches this image?",
            optionTermIds: [
              "6714365f9037c6d2d8679b66",
              "6714365f9037c6d2d8679c1c",
              "671436609037c6d2d8679c62",
              "671436609037c6d2d8679ce4",
            ],
            correctTermId: "6714365f9037c6d2d8679c1c",
          },
        ],
        finalReview: [
          {
            type: "final_review",
            category: "final_review",
            termId: "6714365f9037c6d2d8679b66",
            question: `"What is the meaning of \"Wake up\"?`,
            optionTermIds: [
              "6714365f9037c6d2d8679b66",
              "6714365f9037c6d2d8679c1c",
              "671436609037c6d2d8679c62",
              "671436609037c6d2d8679ce4",
            ],
            correctTermId: "6714365f9037c6d2d8679b66",
          },
        ],
        imageMatch: [
          {
            type: "image_match",
            category: "image_match",
            question: "Match each word to the correct image.",
            termIds: [
              "6714365f9037c6d2d8679b66",
              "6714365f9037c6d2d8679c1c",
              "671436609037c6d2d8679c62",
              "671436609037c6d2d8679ce4",
            ],
          },
        ],
      },
      index: 1,
    },
    {
      cycleType: "learn",
      learnCount: 4,
      termIds: [
        "671436619037c6d2d8679d8a",
        "671436619037c6d2d8679e74",
        "671436629037c6d2d8679f76",
        "671436639037c6d2d8679ff3",
      ],
      tests: {
        standardQuiz: [
          {
            type: "standard_quiz",
            category: "standard_quiz",
            termId: "671436639037c6d2d8679ff3",
            question: `"What is the meaning of \"Work\"?`,
            optionTermIds: [
              "671436639037c6d2d8679ff3",
              "671436619037c6d2d8679d8a",
              "671436609037c6d2d8679ce4",
              "6714365f9037c6d2d8679b66",
            ],
            correctTermId: "671436639037c6d2d8679ff3",
          },
        ],
        trueFalse: [
          {
            type: "true_false",
            category: "true_false",
            termId: "671436619037c6d2d8679e74",
            statement: `"\"Dress\" means \"Pukeutua\".`,
            correctOptionId: "true",
          },
        ],
        audioListening: [
          {
            type: "audio_listening",
            category: "audio_listening",
            termId: "671436609037c6d2d8679ce4",
            question: "Which word did you hear?",
            audioTermId: "671436609037c6d2d8679ce4",
            optionTermIds: [
              "671436609037c6d2d8679ce4",
              "671436609037c6d2d8679c62",
              "671436619037c6d2d8679e74",
              "671436629037c6d2d8679f76",
            ],
            correctTermId: "671436609037c6d2d8679ce4",
          },
        ],
        imageSelect: [
          {
            type: "image_select",
            category: "image_select",
            termId: "671436619037c6d2d8679e74",
            imageTermId: "671436619037c6d2d8679e74",
            question: "Which word matches this image?",
            optionTermIds: [
              "671436619037c6d2d8679e74",
              "671436639037c6d2d8679ff3",
              "671436609037c6d2d8679c62",
              "6714365f9037c6d2d8679c1c",
            ],
            correctTermId: "671436619037c6d2d8679e74",
          },
        ],
        finalReview: [
          {
            type: "final_review",
            category: "final_review",
            termId: "671436629037c6d2d8679f76",
            question: `"What is the meaning of \"Clothes\"?`,
            optionTermIds: [
              "671436629037c6d2d8679f76",
              "6714365f9037c6d2d8679b66",
              "671436639037c6d2d8679ff3",
              "671436609037c6d2d8679ce4",
            ],
            correctTermId: "671436629037c6d2d8679f76",
          },
        ],
        imageMatch: [
          {
            type: "image_match",
            category: "image_match",
            question: "Match each word to the correct image.",
            termIds: [
              "671436619037c6d2d8679d8a",
              "671436619037c6d2d8679e74",
              "671436629037c6d2d8679f76",
              "671436639037c6d2d8679ff3",
            ],
          },
        ],
      },
      index: 2,
    },
  ],
  flatTerms: [
    {
      id: "6714365f9037c6d2d8679b66",
      slug: "wake-up",
      term: "Wake up",
      definition: "Herää",
      examples: [
        {
          sentence: "I wake up early.",
          meaning: "Herään aikaisin.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/i-wake-up-early-fi.mp3",
        },
        {
          sentence: "I wake up at seven.",
          meaning: "Herään seitsemältä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/i-wake-up-at-seven-fi.mp3",
        },
        {
          sentence: "He wakes up at 6 am.",
          meaning: "Hän herää kello 6.00.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/he-wakes-up-at-6-am-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375894/lingocamp/wake_up.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/wake-up-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "6714365f9037c6d2d8679c1c",
      slug: "get-up",
      term: "Get up",
      definition: "Nousta",
      examples: [
        {
          sentence: "She gets up quickly.",
          meaning: "Hän nousee nopeasti ylös.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/she-gets-up-quickly-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1726903275/lingocamp/get_along.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/get-up-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436609037c6d2d8679c62",
      slug: "breakfast",
      term: "Breakfast",
      definition: "Aamiainen",
      examples: [
        {
          sentence: "He ate a bagel for breakfast.",
          meaning: "Hän söi bagelin aamiaiseksi.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/he-ate-a-bagel-for-breakfast-fi.mp3",
        },
        {
          sentence: "I eat bread for breakfast.",
          meaning: "Syön leipää aamiaiseksi.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/i-eat-bread-for-breakfast-fi.mp3",
        },
        {
          sentence: "The hotel offers a breakfast buffet.",
          meaning: "Hotelli tarjoaa aamiaisbuffetin.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/the-hotel-offers-a-breakfast-buffet-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725376593/lingocamp/breakfast.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/breakfast-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436609037c6d2d8679ce4",
      slug: "brush",
      term: "Brush",
      definition: "Harjata",
      examples: [
        {
          sentence: "Brush your teeth before bed.",
          meaning: "Harjaa hampaasi ennen nukkumaanmenoa.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/brush-your-teeth-before-bed-fi.mp3",
        },
        {
          sentence: "She removed stains using a scrub brush.",
          meaning: "Hän poisti tahrat kuorintaharjalla.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/she-removed-stains-using-a-scrub-brush-fi.mp3",
        },
      ],
      image:
        "http://res.cloudinary.com/dndwns70m/image/upload/v1728824875/lingocamp/healing_brush.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/brush-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436619037c6d2d8679d8a",
      slug: "shower",
      term: "Shower",
      definition: "Suihku",
      examples: [
        {
          sentence: "She used a squeegee to clean the shower doors.",
          meaning: "Hän käytti puristusta suihkuovien puhdistamiseen.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/she-used-a-squeegee-to-clean-the-shower-doors-fi.mp3",
        },
        {
          sentence: "He takes a shower every day.",
          meaning: "Hän käy suihkussa joka päivä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/he-takes-a-shower-every-day-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725376602/lingocamp/shower.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/shower-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436619037c6d2d8679e74",
      slug: "dress",
      term: "Dress",
      definition: "Pukeutua",
      examples: [
        {
          sentence: "She wore a bold red dress.",
          meaning: "Hänellä oli rohkea punainen mekko.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/she-wore-a-bold-red-dress-fi.mp3",
        },
        {
          sentence: "They bought a dress from a boutique.",
          meaning: "He ostivat mekon putiikista.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/they-bought-a-dress-from-a-boutique-fi.mp3",
        },
        {
          sentence: "She wore a blue dress.",
          meaning: "Hän käytti sinistä mekkoa.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/she-wore-a-blue-dress-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725376508/lingocamp/dress.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/dress-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436629037c6d2d8679f76",
      slug: "clothes",
      term: "Clothes",
      definition: "Vaatteet",
      examples: [
        {
          sentence: "Browse the store for clothes.",
          meaning: "Selaa myymälää vaatteille.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/browse-the-store-for-clothes-fi.mp3",
        },
        {
          sentence: "Change your clothes after gym.",
          meaning: "Vaihda vaatteet kuntosalin jälkeen.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/change-your-clothes-after-gym-fi.mp3",
        },
        {
          sentence: "He bought new clothes for the summer.",
          meaning: "Hän osti uusia vaatteita kesäksi.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/he-bought-new-clothes-for-the-summer-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725376607/lingocamp/clothes.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/clothes-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436639037c6d2d8679ff3",
      slug: "work",
      term: "Work",
      definition: "Työ",
      examples: [
        {
          sentence: "Career advancement requires hard work.",
          meaning: "Uran eteneminen vaatii kovaa työtä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/career-advancement-requires-hard-work-fi.mp3",
        },
        {
          sentence: "Civil service officers work in various government departments.",
          meaning: "Virkamiesten virkamiehet työskentelevät eri valtion laitoksilla.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/civil-service-officers-work-in-various-government-departments-fi.mp3",
        },
        {
          sentence: "My cv includes all my work experience.",
          meaning: "Ansioluetteloni sisältää kaiken työkokemukseni.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/my-cv-includes-all-my-work-experience-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725376610/lingocamp/work.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/work-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436029037c6d2d867243b",
      slug: "office",
      term: "Office",
      definition: "Toimisto",
      examples: [
        {
          sentence: "She is at the office.",
          meaning: "Hän on toimistossa.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/she-is-at-the-office-fi.mp3",
        },
        {
          sentence: "They hired a cleaning service for their office.",
          meaning: "He palkkasivat siivouspalvelun toimistolleen.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/they-hired-a-cleaning-service-for-their-office-fi.mp3",
        },
        {
          sentence: "My father works in an office.",
          meaning: "Isäni työskentelee toimistossa.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/my-father-works-in-an-office-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375579/lingocamp/office.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/office-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436639037c6d2d867a0f2",
      slug: "school",
      term: "School",
      definition: "Koulutus",
      examples: [
        {
          sentence: "The roads were icy; consequently, the school closed.",
          meaning: "Tiet olivat jäisiä; Näin ollen koulu suljettiin.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/the-roads-were-icy-consequently-the-school-closed-fi.mp3",
        },
        {
          sentence: "We go to school.",
          meaning: "Menemme kouluun.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/we-go-to-school-fi.mp3",
        },
        {
          sentence: "We go to school by bus.",
          meaning: "Menemme kouluun bussilla.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/we-go-to-school-by-bus-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375582/lingocamp/school.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/school-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436649037c6d2d867a11c",
      slug: "study",
      term: "Study",
      definition: "Opiskelu",
      examples: [
        {
          sentence: "The library is a quiet place to study.",
          meaning: "Kirjasto on hiljainen opiskelupaikka.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/the-library-is-a-quiet-place-to-study-fi.mp3",
        },
        {
          sentence: "They study together in the library.",
          meaning: "He opiskelevat yhdessä kirjastossa.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/they-study-together-in-the-library-fi.mp3",
        },
        {
          sentence: "Study for your exams.",
          meaning: "Opiskele tenttejäsi.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/study-for-your-exams-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375585/lingocamp/study.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/study-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436649037c6d2d867a1c5",
      slug: "lunch",
      term: "Lunch",
      definition: "Lounas",
      examples: [
        {
          sentence: "They have lunch at noon.",
          meaning: "Heillä on lounas keskipäivällä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/they-have-lunch-at-noon-fi.mp3",
        },
        {
          sentence: "They had a green salad for lunch.",
          meaning: "Heillä oli vihreä salaatti lounaaksi.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/they-had-a-green-salad-for-lunch-fi.mp3",
        },
        {
          sentence: "Have a bowl of soup for lunch.",
          meaning: "Pidä kulho keittoa lounaaksi.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/have-a-bowl-of-soup-for-lunch-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375586/lingocamp/lunch.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/lunch-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436659037c6d2d867a226",
      slug: "dinner",
      term: "Dinner",
      definition: "Päivällinen",
      examples: [
        {
          sentence: "They ordered three courses for dinner.",
          meaning: "He tilasivat kolme kurssia päivälliselle.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/they-ordered-three-courses-for-dinner-fi.mp3",
        },
        {
          sentence: "Enjoy a piece of chocolate after dinner.",
          meaning: "Nauti pala suklaata illallisen jälkeen.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/enjoy-a-piece-of-chocolate-after-dinner-fi.mp3",
        },
        {
          sentence: "Wash the dishes after dinner.",
          meaning: "Pese astiat illallisen jälkeen.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/wash-the-dishes-after-dinner-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375590/lingocamp/dinner.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/dinner-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436659037c6d2d867a25f",
      slug: "commute",
      term: "Commute",
      definition: "Matkustaa",
      examples: [
        {
          sentence: "Her daily commute takes about 30 minutes.",
          meaning: "Hänen päivittäinen työmatka kestää noin 30 minuuttia.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/her-daily-commute-takes-about-30-minutes-fi.mp3",
        },
        {
          sentence: "I commute by bike every morning.",
          meaning: "Käännyn pyörällä joka aamu.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/i-commute-by-bike-every-morning-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725376613/lingocamp/commute.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/commute-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436659037c6d2d867a337",
      slug: "drive",
      term: "Drive",
      definition: "Ajaa",
      examples: [
        {
          sentence: "I drive the car in the city center.",
          meaning: "Ajan autoa kaupungin keskustassa.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/i-drive-the-car-in-the-city-center-fi.mp3",
        },
        {
          sentence: "He drives to work every day.",
          meaning: "Hän ajaa töihin joka päivä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/he-drives-to-work-every-day-fi.mp3",
        },
        {
          sentence: "He drives a blue car.",
          meaning: "Hän ajaa sinistä autoa.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/he-drives-a-blue-car-fi.mp3",
        },
      ],
      image:
        "http://res.cloudinary.com/dndwns70m/image/upload/v1725375587/lingocamp/hard_drive.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/drive-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436669037c6d2d867a3af",
      slug: "walk",
      term: "Walk",
      definition: "Kävellä",
      examples: [
        {
          sentence: "We went for a walk afterwards.",
          meaning: "Menimme kävelylle myöhemmin.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/we-went-for-a-walk-afterwards-fi.mp3",
        },
        {
          sentence: "Although it was cold, they went for a walk.",
          meaning: "Vaikka se oli kylmä, he menivät kävelylle.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/although-it-was-cold-they-went-for-a-walk-fi.mp3",
        },
        {
          sentence: "It was raining; however, we went for a walk.",
          meaning: "Satoi; Menimme kuitenkin kävelylle.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/it-was-raining-however-we-went-for-a-walk-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375574/lingocamp/walk.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/walk-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436669037c6d2d867a493",
      slug: "exercise",
      term: "Exercise",
      definition: "Käyttää",
      examples: [
        {
          sentence: "How often do you exercise?",
          meaning: "Kuinka usein käytät?",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/how-often-do-you-exercise-fi.mp3",
        },
        {
          sentence: "Exercise improves endurance.",
          meaning: "Liikunta parantaa kestävyyttä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/exercise-improves-endurance-fi.mp3",
        },
        {
          sentence: "Exercise is important for well-being.",
          meaning: "Liikunta on tärkeää hyvinvoinnin kannalta.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/exercise-is-important-for-well-being-fi.mp3",
        },
      ],
      image:
        "http://res.cloudinary.com/dndwns70m/image/upload/v1725026631/lingocamp/daily_routine_listening_exercise.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/exercise-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436679037c6d2d867a521",
      slug: "sleep",
      term: "Sleep",
      definition: "Nukkua",
      examples: [
        {
          sentence: "I sleep on the bed.",
          meaning: "Nukun sängyllä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/i-sleep-on-the-bed-fi.mp3",
        },
        {
          sentence: "Bedtime routine helps the child calm down before sleep.",
          meaning: "Nukkumaanmenon rutiini auttaa lasta rauhoittumaan ennen unta.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/bedtime-routine-helps-the-child-calm-down-before-sleep-fi.mp3",
        },
        {
          sentence: "They sleep for eight hours.",
          meaning: "He nukkuvat kahdeksan tuntia.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/they-sleep-for-eight-hours-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375577/lingocamp/sleep.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/sleep-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
    {
      id: "671436679037c6d2d867a55e",
      slug: "rest",
      term: "Rest",
      definition: "Levätä",
      examples: [
        {
          sentence: "Muscles need rest to recover.",
          meaning: "Lihakset tarvitsevat lepoa toipuakseen.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/muscles-need-rest-to-recover-fi.mp3",
        },
        {
          sentence: "Sunday is a day for rest.",
          meaning: "Sunnuntai on lepopäivä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/sunday-is-a-day-for-rest-fi.mp3",
        },
        {
          sentence: "Sunday is a day of rest.",
          meaning: "Sunnuntai on lepopäivä.",
          audio:
            "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/sunday-is-a-day-of-rest-fi.mp3",
        },
      ],
      image: "http://res.cloudinary.com/dndwns70m/image/upload/v1725375592/lingocamp/rest.jpg",
      type: "N/A",
      audio:
        "https://lingocamp.fra1.cdn.digitaloceanspaces.com/vocabulary-pack-audio/routine/fi/rest-fi.mp3",
      progress: {
        confidence: 0,
        worstConfidence: 0,
        favorite: false,
        markedForReview: false,
        isLearned: false,
        firstSeenAt: "2025-10-21T00:22:32.854Z",
        lastPractisedAt: "2025-10-21T00:22:32.854Z",
        lastChangedAt: "2025-10-21T00:22:32.854Z",
        exposures: 0,
        timesSeen: 0,
        correctCount: 0,
        incorrectCount: 0,
        memoryScore: 0,
        nextReviewAt: null,
        memoryStrength: 0,
        predictedForgettingDate: null,
        difficultyIndex: 0.7,
      },
      packSlug: "routine",
      bucket: "newOrWeak",
    },
  ],
};

export default RESPONSE_DATA;
