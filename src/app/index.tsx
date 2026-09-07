import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// NOTE: This screen now depends on three extra Expo packages that weren't
// used before. Install them with:
//   npx expo install expo-image-picker expo-file-system expo-audio

const MEMORY_OBJECTS = [
  '🍎',
  '🔑',
  '🚗',
  '🐱',
  '🌸',
  '⚽',
  '🍕',
  '🐶',
  '🌳',
  '📱',
  '🎈',
  '🧸',
  '🍩',
  '🎁',
  '⏰',
  '🌞',
];

type Screen =
  | 'home'
  | 'memory'
  | 'attention'
  | 'pattern'
  | 'routine'
  | 'family'
  | 'tunes';

type MemoryLevel = 1 | 2 | 3 | 4 | 5;

const MEMORY_LEVELS: Record<
  MemoryLevel,
  {
    objectCount: number;
    memorizeTime: number;
  }
> = {
  1: {
    objectCount: 3,
    memorizeTime: 6,
  },
  2: {
    objectCount: 4,
    memorizeTime: 5,
  },
  3: {
    objectCount: 5,
    memorizeTime: 4,
  },
  4: {
    objectCount: 6,
    memorizeTime: 3,
  },
  5: {
    objectCount: 7,
    memorizeTime: 3,
  },
};

// ======================================================
// FAMILY FACES — types & shared data
// ======================================================

export type FamilyMember = {
  id: string;
  uri: string;
  name: string;
  relation: string;
};

type FamilyLevel = 1 | 2 | 3 | 4 | 5;

const FAMILY_LEVELS: Record<
  FamilyLevel,
  { optionsCount: number; rounds: number }
> = {
  1: { optionsCount: 2, rounds: 3 },
  2: { optionsCount: 3, rounds: 4 },
  3: { optionsCount: 4, rounds: 5 },
  4: { optionsCount: 5, rounds: 6 },
  5: { optionsCount: 6, rounds: 7 },
};

const RELATION_CHIPS = [
  'Son',
  'Daughter',
  'Grandson',
  'Granddaughter',
  'Husband',
  'Wife',
  'Brother',
  'Sister',
  'Friend',
];

// ======================================================
// TUNE MEMORY — types, shared data & audio helpers
// ======================================================

type Tune = {
  id: string;
  emoji: string;
  label: string;
  frequency: number;
};

const TUNE_LIBRARY: Tune[] = [
  { id: 'bell', emoji: '🔔', label: 'Bell', frequency: 523 },
  { id: 'trumpet', emoji: '🎺', label: 'Trumpet', frequency: 349 },
  { id: 'drum', emoji: '🥁', label: 'Drum', frequency: 174 },
  { id: 'sax', emoji: '🎷', label: 'Sax', frequency: 440 },
  { id: 'guitar', emoji: '🎸', label: 'Guitar', frequency: 293 },
  { id: 'piano', emoji: '🎹', label: 'Piano', frequency: 392 },
];

type TuneLevel = 1 | 2 | 3 | 4 | 5;

const TUNE_LEVELS: Record<TuneLevel, { tuneCount: number }> = {
  1: { tuneCount: 2 },
  2: { tuneCount: 3 },
  3: { tuneCount: 4 },
  4: { tuneCount: 5 },
  5: { tuneCount: 6 },
};

const TONE_DURATION_MS = 700;

// Minimal base64 encoder so we don't depend on Node's Buffer in React Native.
function bytesToBase64(bytes: Uint8Array): string {
  const CHARS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    result += CHARS[b1 >> 2];
    result += CHARS[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? CHARS[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < bytes.length ? CHARS[b3 & 63] : '=';
  }

  return result;
}

// Generates a short single-tone WAV file (8-bit PCM, mono) as a base64
// string, so each "tune" can be created on the fly without bundling any
// audio assets.
function generateToneWavBase64(
  frequency: number,
  durationMs: number
): string {
  const sampleRate = 8000;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const blockAlign = 1; // 1 channel, 8-bit
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new Uint8Array(44 + dataSize);

  function writeString(offset: number, text: string) {
    for (let i = 0; i < text.length; i++) {
      buffer[offset + i] = text.charCodeAt(i);
    }
  }

  function writeUint32(offset: number, value: number) {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
    buffer[offset + 2] = (value >> 16) & 0xff;
    buffer[offset + 3] = (value >> 24) & 0xff;
  }

  function writeUint16(offset: number, value: number) {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
  }

  writeString(0, 'RIFF');
  writeUint32(4, 36 + dataSize);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, 1); // PCM
  writeUint16(22, 1); // channels
  writeUint32(24, sampleRate);
  writeUint32(28, byteRate);
  writeUint16(32, blockAlign);
  writeUint16(34, 8); // bits per sample
  writeString(36, 'data');
  writeUint32(40, dataSize);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Short fade in/out to avoid clicks at the start/end of the tone.
    const fade = Math.min(1, i / 200, (numSamples - i) / 200);
    const sample = Math.sin(2 * Math.PI * frequency * t) * fade;
    buffer[44 + i] = Math.round((sample * 0.5 + 0.5) * 255);
  }

  return bytesToBase64(buffer);
}

const toneFileCache: Record<string, string> = {};

// On web, use a data URI directly with the browser's Audio API.
// On Android/iOS, keep using expo-file-system + expo-audio.
async function getToneFileUri(tune: Tune): Promise<string> {
  const base64 = generateToneWavBase64(tune.frequency, TONE_DURATION_MS);

  if (Platform.OS === 'web') {
    return `data:audio/wav;base64,${base64}`;
  }

  if (toneFileCache[tune.id]) {
    return toneFileCache[tune.id];
  }

  const fileUri = `${FileSystem.cacheDirectory}tune-${tune.id}.wav`;
  const info = await FileSystem.getInfoAsync(fileUri);

  if (!info.exists) {
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  toneFileCache[tune.id] = fileUri;
  return fileUri;
}

let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) {
    return;
  }
  await setAudioModeAsync({ playsInSilentMode: true });
  audioModeReady = true;
}

async function playTune(tune: Tune) {
  const uri = await getToneFileUri(tune);

  // Web: use the browser's native Audio API.
  if (Platform.OS === 'web') {
    const WebAudio = (globalThis as any).Audio;

    if (!WebAudio) {
      console.log('Browser audio is not available.');
      return;
    }

    const audio = new WebAudio(uri);

    try {
      await audio.play();
    } catch (error) {
      console.log('Web audio playback error:', error);
    }

    return;
  }

  // Android / iOS: use expo-audio.
  await ensureAudioMode();
  const player = createAudioPlayer({ uri });
  player.play();

  setTimeout(() => {
    try {
      player.remove();
    } catch {
      // Already removed — safe to ignore.
    }
  }, TONE_DURATION_MS + 300);
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

const GAMES: {
  key: Screen;
  emoji: string;
  title: string;
  description: string;
  color: string;
}[] = [
  {
    key: 'memory',
    emoji: '🧠',
    title: 'Memory',
    description: 'Remember objects and answer questions',
    color: '#8B5CF6',
  },
  {
    key: 'attention',
    emoji: '👀',
    title: 'Attention',
    description: 'Test your focus and concentration',
    color: '#F59E0B',
  },
  {
    key: 'pattern',
    emoji: '🔷',
    title: 'Pattern',
    description: 'Find the missing pattern',
    color: '#0EA5E9',
  },
  {
    key: 'routine',
    emoji: '🏠',
    title: 'Daily Routine',
    description: 'Remember everyday activities',
    color: '#EC4899',
  },
  {
    key: 'family',
    emoji: '👪',
    title: 'Family Faces',
    description: 'Recognize photos of loved ones',
    color: '#22C55E',
  },
  {
    key: 'tunes',
    emoji: '🎵',
    title: 'Tune Memory',
    description: 'Listen and recall the sounds',
    color: '#2563EB',
  },
];

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>('home');

  // Lifted up (rather than kept inside FamilyGame) so uploaded photos
  // survive navigating back to the home screen and into the game again.
  // They still reset if the app is fully closed — add AsyncStorage if you
  // want them to persist across app restarts.
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // =========================
  // HOME SCREEN
  // =========================

  if (screen === 'home') {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.container}>
          <Text style={styles.title}>
            Cognitive Care 🧠
          </Text>

          <Text style={styles.greeting}>
            Good Morning! 👋
          </Text>

          <Text style={styles.subtitle}>
            Choose an activity to exercise your mind.
          </Text>

          <View style={styles.gamesContainer}>
            {GAMES.map((game) => (
              <Pressable
                key={game.key}
                style={({ pressed }) => [
                  styles.gameButton,
                  pressed && styles.gameButtonPressed,
                ]}
                onPress={() => setScreen(game.key)}
              >
                <View
                  style={[
                    styles.gameIconCircle,
                    { backgroundColor: game.color },
                  ]}
                >
                  <Text style={styles.gameEmoji}>{game.emoji}</Text>
                </View>

                <View style={styles.gameTextContainer}>
                  <Text style={styles.gameTitle}>{game.title}</Text>
                  <Text style={styles.gameDescription}>
                    {game.description}
                  </Text>
                </View>

                <Text style={styles.gameChevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  // =========================
  // MEMORY
  // =========================

  if (screen === 'memory') {
    return (
      <MemoryGame
        onBack={() => setScreen('home')}
      />
    );
  }

  // =========================
  // ATTENTION
  // =========================

  if (screen === 'attention') {
    return (
      <AttentionGame
        onBack={() => setScreen('home')}
      />
    );
  }

  // =========================
  // PATTERN
  // =========================

  if (screen === 'pattern') {
    return (
      <PatternGame
        onBack={() => setScreen('home')}
      />
    );
  }

  // =========================
  // ROUTINE
  // =========================

  if (screen === 'routine') {
    return (
      <RoutineGame
        onBack={() => setScreen('home')}
      />
    );
  }

  // =========================
  // FAMILY FACES
  // =========================

  if (screen === 'family') {
    return (
      <FamilyGame
        onBack={() => setScreen('home')}
        members={familyMembers}
        setMembers={setFamilyMembers}
      />
    );
  }

  // =========================
  // TUNE MEMORY
  // =========================

  return (
    <TuneGame
      onBack={() => setScreen('home')}
    />
  );
}


// ======================================================
// MEMORY GAME
// ======================================================

function MemoryGame({
  onBack,
}: {
  onBack: () => void;
}) {
  const [level, setLevel] =
    useState<MemoryLevel>(2);

  const [phase, setPhase] = useState<
    'ready' | 'memorize' | 'answer' | 'result'
  >('ready');

  const [selected, setSelected] =
    useState<string[]>([]);

  const [score, setScore] = useState(0);

  const [mistakes, setMistakes] =
    useState(0);

  const [timeLeft, setTimeLeft] =
    useState(MEMORY_LEVELS[level].memorizeTime);

  const [roundObjects, setRoundObjects] =
    useState<string[]>([]);

  const [startTime, setStartTime] =
    useState<number | null>(null);

  const [reactionTime, setReactionTime] =
    useState<number>(0);

  // Create a new random round
  function createRound(selectedLevel: MemoryLevel) {
    const settings =
      MEMORY_LEVELS[selectedLevel];

    const shuffled = [...MEMORY_OBJECTS].sort(
      () => Math.random() - 0.5
    );

    const selectedObjects = shuffled.slice(
      0,
      settings.objectCount
    );

    setRoundObjects(selectedObjects);
    setTimeLeft(settings.memorizeTime);
    setPhase('ready');
    setSelected([]);
    setScore(0);
    setMistakes(0);
    setReactionTime(0);
    setStartTime(null);
  }

  // Called when the person presses "Start" — this is what actually
  // begins the memorize countdown, so the timer never starts on its own.
  function startMemorizing() {
    setPhase('memorize');
  }

  // Start initial round
  useEffect(() => {
    createRound(level);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'memorize') {
      return;
    }

    if (timeLeft <= 0) {
      setPhase('answer');
      setStartTime(Date.now());
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(
        (currentTime) => currentTime - 1
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  function handleLevelChange(
    newLevel: MemoryLevel
  ) {
    setLevel(newLevel);
    createRound(newLevel);
  }

  function handleObjectPress(object: string) {
    if (selected.includes(object)) {
      return;
    }

    const answerTime =
      startTime === null
        ? 0
        : (Date.now() - startTime) / 1000;

    setReactionTime(answerTime);

    const isCorrect =
      roundObjects.includes(object);

    if (isCorrect) {
      setScore(
        (currentScore) => currentScore + 1
      );
    } else {
      setMistakes(
        (currentMistakes) =>
          currentMistakes + 1
      );
    }

    const updatedSelection = [
      ...selected,
      object,
    ];

    setSelected(updatedSelection);

    if (
      updatedSelection.length ===
      MEMORY_LEVELS[level].objectCount
    ) {
      setPhase('result');
    }
  }

  function restartGame() {
    createRound(level);
  }

  // -------------------------
  // READY (manual timer start)
  // -------------------------

  if (phase === 'ready') {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.title}>
          🧠 Memory Game
        </Text>

        <Text style={styles.levelText}>
          Level {level}
        </Text>

        <Text style={styles.subtitle}>
          Take your time. Press Start when{'\n'}
          you're ready to memorize!
        </Text>

        <View style={styles.objectsContainer}>
          {roundObjects.map((object) => (
            <Text
              key={object}
              style={styles.object}
            >
              {object}
            </Text>
          ))}
        </View>

        <Pressable
          style={styles.startGameButton}
          onPress={startMemorizing}
        >
          <Text style={styles.startGameButtonText}>
            ▶ Start ({MEMORY_LEVELS[level].memorizeTime}s)
          </Text>
        </Pressable>

        <Text style={styles.smallText}>
          Difficulty
        </Text>

        <View style={styles.levelButtons}>
          {[1, 2, 3, 4, 5].map(
            (item) => {
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.levelButton,
                    level === item &&
                      styles.activeLevelButton,
                  ]}
                  onPress={() =>
                    handleLevelChange(
                      item as MemoryLevel
                    )
                  }
                >
                  <Text
                    style={
                      styles.levelButtonText
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>
      </View>
    );
  }

  // -------------------------
  // MEMORIZE (timer running)
  // -------------------------

  if (phase === 'memorize') {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.title}>
          🧠 Memory Game
        </Text>

        <Text style={styles.levelText}>
          Level {level}
        </Text>

        <Text style={styles.subtitle}>
          Remember these objects!
        </Text>

        <Text style={styles.timer}>
          Time left: {timeLeft}s
        </Text>

        <View style={styles.objectsContainer}>
          {roundObjects.map((object) => (
            <Text
              key={object}
              style={styles.object}
            >
              {object}
            </Text>
          ))}
        </View>

        <Text style={styles.smallText}>
          Difficulty
        </Text>

        <View style={styles.levelButtons}>
          {[1, 2, 3, 4, 5].map(
            (item) => {
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.levelButton,
                    level === item &&
                      styles.activeLevelButton,
                  ]}
                  onPress={() =>
                    handleLevelChange(
                      item as MemoryLevel
                    )
                  }
                >
                  <Text
                    style={
                      styles.levelButtonText
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>
      </View>
    );
  }

  // -------------------------
  // ANSWER
  // -------------------------

  if (phase === 'answer') {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.title}>
          What do you remember?
        </Text>

        <Text style={styles.subtitle}>
          Select {MEMORY_LEVELS[level].objectCount}{' '}
          objects that you saw.
        </Text>

        <View
          style={styles.optionsContainer}
        >
          {MEMORY_OBJECTS.map(
            (object) => {
              const isSelected =
                selected.includes(object);

              return (
                <Pressable
                  key={object}
                  onPress={() =>
                    handleObjectPress(object)
                  }
                  style={[
                    styles.optionButton,
                    isSelected &&
                      styles.selectedButton,
                  ]}
                >
                  <Text
                    style={styles.optionText}
                  >
                    {object}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        <Text style={styles.progress}>
          Selected: {selected.length}/
          {MEMORY_LEVELS[level].objectCount}
        </Text>
      </View>
    );
  }

  // -------------------------
  // RESULT
  // -------------------------

  const totalObjects =
    MEMORY_LEVELS[level].objectCount;

  const accuracy = Math.round(
    (score / totalObjects) * 100
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {accuracy >= 80
          ? '🎉 Excellent!'
          : accuracy >= 50
          ? '👍 Good Try!'
          : '💪 Keep Practicing!'}
      </Text>

      <Text style={styles.result}>
        Level: {level}
      </Text>

      <Text style={styles.result}>
        Score: {score}/{totalObjects}
      </Text>

      <Text style={styles.result}>
        Accuracy: {accuracy}%
      </Text>

      <Text style={styles.result}>
        Mistakes: {mistakes}
      </Text>

      <Text style={styles.result}>
        Reaction Time:{' '}
        {reactionTime.toFixed(2)}s
      </Text>

      <Pressable
        style={styles.playAgainButton}
        onPress={restartGame}
      >
        <Text style={styles.playAgainText}>
          Play Again
        </Text>
      </Pressable>

      <Pressable
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backText}>
          ← Back to Games
        </Text>
      </Pressable>
    </View>
  );
}
function AttentionGame({
  onBack,
}: {
  onBack: () => void;
}) {
  type AttentionLevel = 1 | 2 | 3 | 4 | 5;

  const LEVELS: Record<
    AttentionLevel,
    {
      objectCount: number;
      targetCount: number;
      displayTime: number;
    }
  > = {
    1: {
      objectCount: 6,
      targetCount: 2,
      displayTime: 5,
    },
    2: {
      objectCount: 8,
      targetCount: 3,
      displayTime: 4,
    },
    3: {
      objectCount: 12,
      targetCount: 4,
      displayTime: 4,
    },
    4: {
      objectCount: 16,
      targetCount: 5,
      displayTime: 3,
    },
    5: {
      objectCount: 20,
      targetCount: 6,
      displayTime: 2,
    },
  };

  const FRUITS = [
    '🍎',
    '🍊',
    '🍌',
    '🍇',
    '🍓',
    '🍉',
    '🥝',
    '🍍',
    '🥭',
    '🍑',
    '🍒',
    '🍐',
  ];

  const [level, setLevel] =
    useState<AttentionLevel>(2);

  const [phase, setPhase] = useState<
    'ready' | 'observe' | 'question' | 'result'
  >('ready');

  const [items, setItems] = useState<string[]>([]);

  const [targetObject, setTargetObject] =
    useState('🍎');

  const [correctAnswer, setCorrectAnswer] =
    useState(3);

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  const [score, setScore] = useState(0);

  const [reactionTime, setReactionTime] =
    useState(0);

  const [startTime, setStartTime] =
    useState<number | null>(null);

  const [timeLeft, setTimeLeft] =
    useState(LEVELS[level].displayTime);

  function createRound(
    selectedLevel: AttentionLevel
  ) {
    const settings = LEVELS[selectedLevel];

    const randomTarget =
      FRUITS[
        Math.floor(
          Math.random() * FRUITS.length
        )
      ];

    const otherObjects =
      FRUITS.filter(
        (fruit) => fruit !== randomTarget
      );

    const generatedItems: string[] = [];

    // Add the required number of target objects
    for (
      let i = 0;
      i < settings.targetCount;
      i++
    ) {
      generatedItems.push(randomTarget);
    }

    // Add distractors
    while (
      generatedItems.length <
      settings.objectCount
    ) {
      const randomDistractor =
        otherObjects[
          Math.floor(
            Math.random() *
              otherObjects.length
          )
        ];

      generatedItems.push(
        randomDistractor
      );
    }

    // Shuffle objects
    generatedItems.sort(
      () => Math.random() - 0.5
    );

    setItems(generatedItems);
    setTargetObject(randomTarget);
    setCorrectAnswer(
      settings.targetCount
    );
    setTimeLeft(
      settings.displayTime
    );
    setSelectedAnswer(null);
    setReactionTime(0);
    setStartTime(null);
    setPhase('ready');
  }

  // Called when the person presses "Start" — this is what actually
  // begins the observe countdown, so the timer never starts on its own.
  function startObserving() {
    setPhase('observe');
  }

  // Create the first round
  useEffect(() => {
    createRound(level);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'observe') {
      return;
    }

    if (timeLeft <= 0) {
      setPhase('question');
      setStartTime(Date.now());
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(
        (current) => current - 1
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  function changeLevel(
    newLevel: AttentionLevel
  ) {
    setLevel(newLevel);
    createRound(newLevel);
  }

  function handleAnswer(answer: number) {
    if (selectedAnswer !== null) {
      return;
    }

    const answerTime =
      startTime === null
        ? 0
        : (Date.now() - startTime) / 1000;

    setReactionTime(answerTime);
    setSelectedAnswer(answer);

    if (answer === correctAnswer) {
      setScore(1);
    } else {
      setScore(0);
    }

    setPhase('result');
  }

  function restartGame() {
    setScore(0);
    createRound(level);
  }

  // ==========================================
  // READY (manual timer start)
  // ==========================================

  if (phase === 'ready') {
    return (
      <View style={styles.container}>

        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.title}>
          👀 Attention Game
        </Text>

        <Text style={styles.levelText}>
          Level {level}
        </Text>

        <Text style={styles.subtitle}>
          Press Start, then count the {targetObject}
        </Text>

        <View style={styles.attentionGrid}>
          {items.map((item, index) => (
            <Text
              key={`${item}-${index}`}
              style={styles.attentionObject}
            >
              {item}
            </Text>
          ))}
        </View>

        <Pressable
          style={styles.startGameButton}
          onPress={startObserving}
        >
          <Text style={styles.startGameButtonText}>
            ▶ Start ({LEVELS[level].displayTime}s)
          </Text>
        </Pressable>

        <Text style={styles.smallText}>
          Difficulty
        </Text>

        <View style={styles.levelButtons}>
          {[1, 2, 3, 4, 5].map(
            (item) => (
              <Pressable
                key={item}
                style={[
                  styles.levelButton,
                  level === item &&
                    styles.activeLevelButton,
                ]}
                onPress={() =>
                  changeLevel(
                    item as AttentionLevel
                  )
                }
              >
                <Text
                  style={
                    styles.levelButtonText
                  }
                >
                  {item}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>
    );
  }

  // ==========================================
  // OBSERVE PHASE (timer running)
  // ==========================================

  if (phase === 'observe') {
    return (
      <View style={styles.container}>

        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.title}>
          👀 Attention Game
        </Text>

        <Text style={styles.levelText}>
          Level {level}
        </Text>

        <Text style={styles.subtitle}>
          Count the {targetObject}
        </Text>

        <Text style={styles.timer}>
          Time left: {timeLeft}s
        </Text>

        <View style={styles.attentionGrid}>
          {items.map((item, index) => (
            <Text
              key={`${item}-${index}`}
              style={styles.attentionObject}
            >
              {item}
            </Text>
          ))}
        </View>

        <Text style={styles.smallText}>
          Difficulty
        </Text>

        <View style={styles.levelButtons}>
          {[1, 2, 3, 4, 5].map(
            (item) => (
              <Pressable
                key={item}
                style={[
                  styles.levelButton,
                  level === item &&
                    styles.activeLevelButton,
                ]}
                onPress={() =>
                  changeLevel(
                    item as AttentionLevel
                  )
                }
              >
                <Text
                  style={
                    styles.levelButtonText
                  }
                >
                  {item}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>
    );
  }

  // ==========================================
  // QUESTION PHASE
  // ==========================================

  if (phase === 'question') {
    const answerOptions = [
      Math.max(1, correctAnswer - 1),
      correctAnswer,
      correctAnswer + 1,
      correctAnswer + 2,
    ];

    return (
      <View style={styles.container}>

        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.title}>
          How many {targetObject} did you see?
        </Text>

        <Text style={styles.subtitle}>
          Choose one answer.
        </Text>

        <View style={styles.answerGrid}>
          {answerOptions.map(
            (answer, index) => (
              <Pressable
                key={`${answer}-${index}`}
                style={styles.answerButton}
                onPress={() =>
                  handleAnswer(answer)
                }
              >
                <Text style={styles.answerText}>
                  {answer}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>
    );
  }

  // ==========================================
  // RESULT PHASE
  // ==========================================

  const accuracy =
    score === 1 ? 100 : 0;

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        {score === 1
          ? '🎉 Excellent!'
          : '👍 Good Try!'}
      </Text>

      <Text style={styles.result}>
        Level: {level}
      </Text>

      <Text style={styles.result}>
        Score: {score}/1
      </Text>

      <Text style={styles.result}>
        Accuracy: {accuracy}%
      </Text>

      <Text style={styles.result}>
        Reaction Time:{' '}
        {reactionTime.toFixed(2)}s
      </Text>

      <Pressable
        style={styles.playAgainButton}
        onPress={restartGame}
      >
        <Text style={styles.playAgainText}>
          Play Again
        </Text>
      </Pressable>

      <Pressable
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backText}>
          ← Back to Games
        </Text>
      </Pressable>

    </View>
  );
}
function PatternGame({
  onBack,
}: {
  onBack: () => void;
}) {
  type PatternLevel = 1 | 2 | 3 | 4 | 5;

  const LEVELS: Record<
    PatternLevel,
    {
      questions: {
        sequence: string[];
        options: string[];
        answer: string;
      }[];
    }
  > = {
    // ==========================================
    // LEVEL 1 - SIMPLE ALTERNATING PATTERNS
    // ==========================================
    1: {
      questions: [
        {
          sequence: ['🔴', '🔵', '🔴', '🔵', '?'],
          options: ['🔴', '🔵', '🟢'],
          answer: '🔴',
        },
        {
          sequence: ['⭐', '🌙', '⭐', '🌙', '?'],
          options: ['⭐', '🌙', '☀️'],
          answer: '⭐',
        },
        {
          sequence: ['🍎', '🍌', '🍎', '🍌', '?'],
          options: ['🍎', '🍊', '🍇'],
          answer: '🍎',
        },
        {
          sequence: ['🔺', '⚪', '🔺', '⚪', '?'],
          options: ['🔺', '⚪', '🟦'],
          answer: '🔺',
        },
        {
          sequence: ['🟢', '🟡', '🟢', '🟡', '?'],
          options: ['🟢', '🔵', '🟡'],
          answer: '🟢',
        },
      ],
    },

    // ==========================================
    // LEVEL 2 - THREE-ITEM PATTERNS
    // ==========================================
    2: {
      questions: [
        {
          sequence: ['🔴', '🔵', '🟢', '🔴', '🔵', '?'],
          options: ['🔴', '🔵', '🟢'],
          answer: '🟢',
        },
        {
          sequence: ['⭐', '🌙', '❤️', '⭐', '🌙', '?'],
          options: ['⭐', '🌙', '❤️'],
          answer: '❤️',
        },
        {
          sequence: ['🍎', '🍌', '🍊', '🍎', '🍌', '?'],
          options: ['🍎', '🍊', '🍇'],
          answer: '🍊',
        },
        {
          sequence: ['🔵', '🟡', '🔺', '🔵', '🟡', '?'],
          options: ['🔺', '⚪', '🔵'],
          answer: '🔺',
        },
        {
          sequence: ['☀️', '🌙', '⭐', '☀️', '🌙', '?'],
          options: ['☀️', '⭐', '🌧️'],
          answer: '⭐',
        },
      ],
    },

    // ==========================================
    // LEVEL 3 - REPEATED GROUPS
    // ==========================================
    3: {
      questions: [
        {
          sequence: ['🔴', '🔴', '🔵', '🔴', '🔴', '?'],
          options: ['🔴', '🔵', '🟢'],
          answer: '🔵',
        },
        {
          sequence: ['🟡', '🟡', '🟢', '🟡', '🟡', '?'],
          options: ['🔵', '🟢', '🟡'],
          answer: '🟢',
        },
        {
          sequence: ['🐱', '🐶', '🐶', '🐱', '🐶', '?'],
          options: ['🐱', '🐶', '🐰'],
          answer: '🐶',
        },
        {
          sequence: ['⭐', '⭐', '🌙', '⭐', '⭐', '?'],
          options: ['☀️', '⭐', '🌙'],
          answer: '🌙',
        },
        {
          sequence: ['🍎', '🍎', '🍌', '🍎', '🍎', '?'],
          options: ['🍎', '🍊', '🍌'],
          answer: '🍌',
        },
      ],
    },

    // ==========================================
    // LEVEL 4 - AABB / AABC PATTERNS
    // ==========================================
    4: {
      questions: [
        {
          sequence: [
            '🔴',
            '🔵',
            '🔵',
            '🔴',
            '🔵',
            '🔵',
            '?',
          ],
          options: ['🔴', '🔵', '🟢'],
          answer: '🔴',
        },
        {
          sequence: [
            '⭐',
            '🌙',
            '🌙',
            '⭐',
            '🌙',
            '🌙',
            '?',
          ],
          options: ['⭐', '🌙', '☀️'],
          answer: '⭐',
        },
        {
          sequence: [
            '🍎',
            '🍌',
            '🍌',
            '🍊',
            '🍎',
            '🍌',
            '🍌',
            '?',
          ],
          options: ['🍊', '🍎', '🍌'],
          answer: '🍊',
        },
        {
          sequence: [
            '🔵',
            '🔺',
            '🔺',
            '⚪',
            '🔵',
            '🔺',
            '🔺',
            '?',
          ],
          options: ['⚪', '🔵', '🔺'],
          answer: '⚪',
        },
        {
          sequence: [
            '❤️',
            '⭐',
            '⭐',
            '🌙',
            '❤️',
            '⭐',
            '⭐',
            '?',
          ],
          options: ['⭐', '🌙', '❤️'],
          answer: '🌙',
        },
      ],
    },

    // ==========================================
    // LEVEL 5 - MORE COMPLEX PATTERNS
    // ==========================================
    5: {
      questions: [
        {
          sequence: [
            '🔴',
            '🔵',
            '🟢',
            '🔵',
            '🔴',
            '🔵',
            '?',
          ],
          options: ['🟢', '🔴', '🔵'],
          answer: '🟢',
        },
        {
          sequence: [
            '⭐',
            '🌙',
            '❤️',
            '🌙',
            '⭐',
            '🌙',
            '?',
          ],
          options: ['⭐', '❤️', '🌙'],
          answer: '❤️',
        },
        {
          sequence: [
            '🍎',
            '🍌',
            '🍊',
            '🍌',
            '🍎',
            '🍌',
            '?',
          ],
          options: ['🍊', '🍎', '🍌'],
          answer: '🍊',
        },
        {
          sequence: [
            '🔵',
            '⬜',
            '🔺',
            '⬜',
            '🔵',
            '⬜',
            '?',
          ],
          options: ['🔺', '🔵', '⬜'],
          answer: '🔺',
        },
        {
          sequence: [
            '☀️',
            '☁️',
            '🌧️',
            '☁️',
            '☀️',
            '☁️',
            '?',
          ],
          options: ['🌧️', '☀️', '☁️'],
          answer: '🌧️',
        },
      ],
    },
  };

  // Returns this level's questions in a random order, and with each
  // question's answer options also shuffled, so the sequence and the
  // position of the correct answer are different every time you play.
  function buildShuffledQuestions(selectedLevel: PatternLevel) {
    return shuffleArray(LEVELS[selectedLevel].questions).map(
      (question) => ({
        ...question,
        options: shuffleArray(question.options),
      })
    );
  }

  const [level, setLevel] =
    useState<PatternLevel>(1);

  const [questionIndex, setQuestionIndex] =
    useState(0);

  const [score, setScore] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [finished, setFinished] =
    useState(false);

  const [currentQuestions, setCurrentQuestions] = useState(() =>
    buildShuffledQuestions(1)
  );

  const currentQuestion =
    currentQuestions[questionIndex];

  function changeLevel(
    newLevel: PatternLevel
  ) {
    setLevel(newLevel);
    setCurrentQuestions(buildShuffledQuestions(newLevel));
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setFinished(false);
  }

  function handleAnswer(answer: string) {
    if (selectedAnswer !== null) {
      return;
    }

    setSelectedAnswer(answer);

    const isCorrect =
      answer === currentQuestion.answer;

    if (isCorrect) {
      setScore(
        (currentScore) => currentScore + 1
      );
    }

    setTimeout(() => {
      if (
        questionIndex ===
        currentQuestions.length - 1
      ) {
        setFinished(true);
      } else {
        setQuestionIndex(
          (currentIndex) => currentIndex + 1
        );

        setSelectedAnswer(null);
      }
    }, 700);
  }

  function restartGame() {
    setCurrentQuestions(buildShuffledQuestions(level));
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setFinished(false);
  }

  // ==========================================
  // RESULT SCREEN
  // ==========================================

  if (finished) {
    const accuracy = Math.round(
      (score / currentQuestions.length) * 100
    );

    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {accuracy >= 80
            ? '🎉 Excellent!'
            : accuracy >= 50
            ? '👍 Good Try!'
            : '💪 Keep Practicing!'}
        </Text>

        <Text style={styles.levelText}>
          Level {level}
        </Text>

        <Text style={styles.result}>
          Score: {score}/{currentQuestions.length}
        </Text>

        <Text style={styles.result}>
          Accuracy: {accuracy}%
        </Text>

        <Pressable
          style={styles.playAgainButton}
          onPress={restartGame}
        >
          <Text style={styles.playAgainText}>
            Play Again
          </Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            ← Back to Games
          </Text>
        </Pressable>
      </View>
    );
  }

  // ==========================================
  // GAME SCREEN
  // ==========================================

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backText}>
          ← Back
        </Text>
      </Pressable>

      <Text style={styles.title}>
        🔷 Pattern Game
      </Text>

      <Text style={styles.levelText}>
        Level {level}
      </Text>

      <Text style={styles.subtitle}>
        Find what comes next.
      </Text>

      <Text style={styles.questionNumber}>
        Question {questionIndex + 1} of{' '}
        {currentQuestions.length}
      </Text>

      <View style={styles.patternContainer}>
        {currentQuestion.sequence.map(
          (item, index) => (
            <Text
              key={`${item}-${index}`}
              style={styles.patternItem}
            >
              {item}
            </Text>
          )
        )}
      </View>

      <Text style={styles.patternQuestion}>
        What should replace the ?
      </Text>

      <View style={styles.patternOptions}>
        {currentQuestion.options.map(
          (option) => (
            <Pressable
              key={option}
              style={[
                styles.patternOption,
                selectedAnswer === option &&
                  styles.selectedPatternOption,
              ]}
              onPress={() =>
                handleAnswer(option)
              }
            >
              <Text
                style={styles.patternOptionText}
              >
                {option}
              </Text>
            </Pressable>
          )
        )}
      </View>

      <Text style={styles.smallText}>
        Difficulty
      </Text>

      <View style={styles.levelButtons}>
        {[1, 2, 3, 4, 5].map(
          (item) => (
            <Pressable
              key={item}
              style={[
                styles.levelButton,
                level === item &&
                  styles.activeLevelButton,
              ]}
              onPress={() =>
                changeLevel(
                  item as PatternLevel
                )
              }
            >
              <Text
                style={styles.levelButtonText}
              >
                {item}
              </Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}
function RoutineGame({
  onBack,
}: {
  onBack: () => void;
}) {
  type RoutineItem = {
    time: string;
    activity: string;
    icon: string;
  };

  type Question = {
    question: string;
    options: string[];
    answer: string;
  };

  const LEVELS = {
    1: { count: 3, memoryTime: 8, questions: 3 },
    2: { count: 4, memoryTime: 7, questions: 3 },
    3: { count: 5, memoryTime: 6, questions: 4 },
    4: { count: 6, memoryTime: 5, questions: 4 },
    5: { count: 7, memoryTime: 4, questions: 5 },
  };

  const ALL_ROUTINES: RoutineItem[] = [
    { time: '7:00 AM', activity: 'Wake up', icon: '🌅' },
    { time: '8:00 AM', activity: 'Eat breakfast', icon: '🍳' },
    { time: '9:00 AM', activity: 'Take medicine', icon: '💊' },
    { time: '11:00 AM', activity: 'Go for a walk', icon: '🚶' },
    { time: '1:00 PM', activity: 'Eat lunch', icon: '🍛' },
    { time: '5:00 PM', activity: 'Exercise', icon: '🏃' },
    { time: '8:00 PM', activity: 'Eat dinner', icon: '🍽️' },
  ];

  const [level, setLevel] = useState(1);
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [phase, setPhase] = useState<'memory' | 'questions' | 'result'>(
    'memory'
  );

  const [countdown, setCountdown] = useState(8);

  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [reactionTime, setReactionTime] = useState(0);

  const shuffle = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const createQuestions = (items: RoutineItem[], numberOfQuestions: number) => {
    const generated: Question[] = [];

    // 1. Time questions
    items.forEach((item) => {
      const wrongTimes = shuffle(
        items
          .filter((x) => x.time !== item.time)
          .map((x) => x.time)
      ).slice(0, 3);

      generated.push({
        question: `What time did you ${item.activity.toLowerCase()}?`,
        options: shuffle([item.time, ...wrongTimes]),
        answer: item.time,
      });
    });

    // 2. Activity-at-time questions
    items.forEach((item) => {
      const wrongActivities = shuffle(
        items
          .filter((x) => x.activity !== item.activity)
          .map((x) => x.activity)
      ).slice(0, 3);

      generated.push({
        question: `What did you do at ${item.time}?`,
        options: shuffle([item.activity, ...wrongActivities]),
        answer: item.activity,
      });
    });

    // 3. Before / after questions
    for (let i = 0; i < items.length; i++) {
      if (i < items.length - 1) {
        const current = items[i];
        const next = items[i + 1];

        generated.push({
          question: `What did you do after ${current.activity.toLowerCase()}?`,
          options: shuffle([
            next.activity,
            ...shuffle(
              items
                .filter(
                  (x) =>
                    x.activity !== next.activity &&
                    x.activity !== current.activity
                )
                .map((x) => x.activity)
            ).slice(0, 3),
          ]),
          answer: next.activity,
        });
      }

      if (i > 0) {
        const current = items[i];
        const previous = items[i - 1];

        generated.push({
          question: `What did you do before ${current.activity.toLowerCase()}?`,
          options: shuffle([
            previous.activity,
            ...shuffle(
              items
                .filter(
                  (x) =>
                    x.activity !== previous.activity &&
                    x.activity !== current.activity
                )
                .map((x) => x.activity)
            ).slice(0, 3),
          ]),
          answer: previous.activity,
        });
      }
    }

    // 4. First activity
    generated.push({
      question: 'What was the first activity of the day?',
      options: shuffle([
        items[0].activity,
        ...shuffle(items.slice(1).map((x) => x.activity)).slice(0, 3),
      ]),
      answer: items[0].activity,
    });

    // 5. Last activity
    generated.push({
      question: 'What was the last activity of the day?',
      options: shuffle([
        items[items.length - 1].activity,
        ...shuffle(items.slice(0, -1).map((x) => x.activity)).slice(0, 3),
      ]),
      answer: items[items.length - 1].activity,
    });

    return shuffle(generated).slice(0, numberOfQuestions);
  };

  const createRound = (selectedLevel: number) => {
    const settings = LEVELS[selectedLevel as keyof typeof LEVELS];

    const selectedRoutine = ALL_ROUTINES.slice(0, settings.count);

    const newQuestions = createQuestions(
      selectedRoutine,
      settings.questions
    );

    setLevel(selectedLevel);
    setRoutine(selectedRoutine);
    setQuestions(newQuestions);

    setQuestionIndex(0);
    setScore(0);
    setMistakes(0);
    setReactionTime(0);

    setCountdown(settings.memoryTime);
    setPhase('memory');
  };

  useEffect(() => {
    createRound(1);
  }, []);

  useEffect(() => {
    if (phase !== 'memory') return;

    if (countdown <= 0) {
      setPhase('questions');
      setQuestionStartTime(Date.now());
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, phase]);

  const handleAnswer = (selectedAnswer: string) => {
    const currentQuestion = questions[questionIndex];

    const responseTime = Date.now() - questionStartTime;
    setReactionTime(responseTime);

    const isCorrect = selectedAnswer === currentQuestion.answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else {
      setMistakes((prev) => prev + 1);
    }

    if (questionIndex + 1 >= questions.length) {
      setTimeout(() => {
        setPhase('result');
      }, 250);

      return;
    }

    setTimeout(() => {
      setQuestionIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
    }, 250);
  };

  // -------------------------
  // RESULT SCREEN
  // -------------------------

  if (phase === 'result') {
    const accuracy =
      questions.length > 0
        ? Math.round((score / questions.length) * 100)
        : 0;

    return (
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          backgroundColor: '#F4F7FB',
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 42,
              marginBottom: 10,
            }}
          >
            🎉
          </Text>

          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#172033',
              marginBottom: 8,
            }}
          >
            Great Job!
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: '#667085',
              marginBottom: 25,
            }}
          >
            Daily Routine — Level {level}
          </Text>

          <View
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 22,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 28 }}>⭐</Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: '#172033',
                  }}
                >
                  {score}
                </Text>
                <Text style={{ color: '#667085' }}>Score</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 28 }}>🎯</Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: '#172033',
                  }}
                >
                  {accuracy}%
                </Text>
                <Text style={{ color: '#667085' }}>Accuracy</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 28 }}>❌</Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: '#172033',
                  }}
                >
                  {mistakes}
                </Text>
                <Text style={{ color: '#667085' }}>Mistakes</Text>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              backgroundColor: '#EAF2FF',
              borderRadius: 16,
              padding: 18,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '700',
                color: '#2457A6',
              }}
            >
              🧠 Your routine memory was {accuracy >= 80 ? 'strong' : 'improving'}!
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => createRound(level)}
            style={{
              width: '100%',
              backgroundColor: '#2563EB',
              padding: 17,
              borderRadius: 14,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 17,
                fontWeight: '800',
              }}
            >
              🔄 Play Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBack}
            style={{
              width: '100%',
              backgroundColor: '#E5E7EB',
              padding: 17,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#172033',
                fontSize: 17,
                fontWeight: '700',
              }}
            >
              ← Back to Games
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // -------------------------
  // MEMORY / ROUTINE SCREEN
  // -------------------------

  if (phase === 'memory') {
    return (
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          backgroundColor: '#F4F7FB',
          flexGrow: 1,
        }}
      >
        <TouchableOpacity onPress={onBack} style={{ marginBottom: 10 }}>
          <Text style={{ color: '#2563EB', fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: '#172033',
            marginBottom: 5,
          }}
        >
          🕐 Daily Routine
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: '#667085',
            marginBottom: 15,
          }}
        >
          Remember today's activities and their times.
        </Text>

        {/* LEVEL SELECTOR */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 15 }}
        >
          {[1, 2, 3, 4, 5].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => createRound(item)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor:
                  level === item ? '#2563EB' : '#E5E7EB',
              }}
            >
              <Text
                style={{
                  fontWeight: '800',
                  color: level === item ? 'white' : '#344054',
                }}
              >
                Level {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TIMER */}

        <View
          style={{
            backgroundColor: '#2563EB',
            borderRadius: 18,
            padding: 18,
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            Remember this routine
          </Text>

          <Text
            style={{
              color: 'white',
              fontSize: 40,
              fontWeight: '900',
              marginTop: 3,
            }}
          >
            {countdown}s
          </Text>
        </View>

        {/* ROUTINE TIMELINE */}

        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: '#172033',
              marginBottom: 15,
            }}
          >
            📅 Today's Routine
          </Text>

          {routine.map((item, index) => (
            <View
              key={item.time}
              style={{
                flexDirection: 'row',
                minHeight: 65,
              }}
            >
              {/* TIME */}

              <View
                style={{
                  width: 75,
                  alignItems: 'flex-end',
                  paddingRight: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#667085',
                  }}
                >
                  {item.time}
                </Text>
              </View>

              {/* TIMELINE */}

              <View
                style={{
                  width: 30,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: '#2563EB',
                    marginTop: 2,
                  }}
                />

                {index < routine.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      backgroundColor: '#BFDBFE',
                      marginTop: 3,
                    }}
                  />
                )}
              </View>

              {/* ACTIVITY */}

              <View
                style={{
                  flex: 1,
                  paddingLeft: 10,
                  paddingBottom: 15,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#172033',
                  }}
                >
                  {item.icon} {item.activity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text
          style={{
            textAlign: 'center',
            color: '#667085',
            fontSize: 14,
          }}
        >
          Remember carefully — questions are coming next!
        </Text>
      </ScrollView>
    );
  }

  // -------------------------
  // QUESTION SCREEN
  // -------------------------

  const currentQuestion = questions[questionIndex];

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        backgroundColor: '#F4F7FB',
        flexGrow: 1,
      }}
    >
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 10 }}>
        <Text style={{ color: '#2563EB', fontWeight: '700' }}>← Back</Text>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 28,
          fontWeight: '800',
          color: '#172033',
          marginBottom: 5,
        }}
      >
        🧠 Routine Recall
      </Text>

      <Text
        style={{
          fontSize: 15,
          color: '#667085',
          marginBottom: 15,
        }}
      >
        Level {level}
      </Text>

      {/* PROGRESS */}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 8,
            backgroundColor: '#D9E2F2',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${
                ((questionIndex + 1) / questions.length) * 100
              }%`,
              height: 8,
              backgroundColor: '#2563EB',
              borderRadius: 10,
            }}
          />
        </View>

        <Text
          style={{
            marginLeft: 10,
            fontWeight: '700',
            color: '#667085',
          }}
        >
          {questionIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* QUESTION CARD */}

      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 22,
          padding: 24,
          marginBottom: 18,
          shadowColor: '#000',
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: '#667085',
            marginBottom: 12,
          }}
        >
          Question {questionIndex + 1}
        </Text>

        <Text
          style={{
            fontSize: 22,
            lineHeight: 30,
            fontWeight: '800',
            color: '#172033',
          }}
        >
          {currentQuestion.question}
        </Text>
      </View>

      {/* ANSWERS */}

      {currentQuestion.options.map((option, index) => (
        <TouchableOpacity
          key={option}
          onPress={() => handleAnswer(option)}
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#D9E2F2',
            borderRadius: 15,
            padding: 18,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#EAF2FF',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <Text
              style={{
                fontWeight: '800',
                color: '#2563EB',
              }}
            >
              {String.fromCharCode(65 + index)}
            </Text>
          </View>

          <Text
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: '600',
              color: '#172033',
            }}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}

      <Text
        style={{
          textAlign: 'center',
          color: '#98A2B3',
          marginTop: 8,
        }}
      >
        Think carefully before choosing an answer.
      </Text>
    </ScrollView>
  );
}

// ======================================================
// FAMILY FACES GAME
// ======================================================

function FamilyGame({
  onBack,
  members,
  setMembers,
}: {
  onBack: () => void;
  members: FamilyMember[];
  setMembers: (members: FamilyMember[]) => void;
}) {
  type FamilyPhase = 'setup' | 'play' | 'result';
  type Round = {
    target: FamilyMember;
    options: FamilyMember[];
  };

  const maxAvailableLevel = ([1, 2, 3, 4, 5] as FamilyLevel[])
  .filter(
    (lvl) =>
      FAMILY_LEVELS[lvl].optionsCount <=
      Math.max(members.length, 2)
  )
  .reduce(
    (max, lvl) => (lvl > max ? lvl : max),
    1 as FamilyLevel
  );

  const [phase, setPhase] = useState<FamilyPhase>('setup');
  const [level, setLevel] = useState<FamilyLevel>(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [permissionError, setPermissionError] = useState('');

  // Add-member form fields
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');

  // Play state
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [totalReactionTime, setTotalReactionTime] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);

  async function pickPhoto() {
    setPermissionError('');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setPermissionError('Photo library access is needed to add a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewPhotoUri(result.assets[0].uri);
    }
  }

  function saveNewMember() {
    if (!newPhotoUri || !newName.trim() || !newRelation.trim()) {
      return;
    }

    const member: FamilyMember = {
      id: `${Date.now()}-${Math.random()}`,
      uri: newPhotoUri,
      name: newName.trim(),
      relation: newRelation.trim(),
    };

    setMembers([...members, member]);
    setNewPhotoUri(null);
    setNewName('');
    setNewRelation('');
    setShowAddForm(false);
  }

  function removeMember(id: string) {
    setMembers(members.filter((member) => member.id !== id));
  }

  function buildRounds(selectedLevel: FamilyLevel): Round[] {
    const settings = FAMILY_LEVELS[selectedLevel];
    const optionsCount = Math.min(settings.optionsCount, members.length);
    const roundCount = Math.min(settings.rounds, members.length);

    const targets = shuffleArray(members).slice(0, roundCount);

    return targets.map((target) => {
      const distractors = shuffleArray(
        members.filter((member) => member.id !== target.id)
      ).slice(0, optionsCount - 1);

      return {
        target,
        options: shuffleArray([target, ...distractors]),
      };
    });
  }

  function startGame(selectedLevel: FamilyLevel) {
    setLevel(selectedLevel);
    setRounds(buildRounds(selectedLevel));
    setRoundIndex(0);
    setScore(0);
    setMistakes(0);
    setTotalReactionTime(0);
    setSelectedOptionId(null);
    setRoundStartTime(Date.now());
    setPhase('play');
  }

  function handleAnswer(optionId: string) {
    if (selectedOptionId !== null) {
      return;
    }

    const currentRound = rounds[roundIndex];
    const elapsed = roundStartTime ? (Date.now() - roundStartTime) / 1000 : 0;

    setSelectedOptionId(optionId);
    setTotalReactionTime((prev) => prev + elapsed);

    if (optionId === currentRound.target.id) {
      setScore((prev) => prev + 1);
    } else {
      setMistakes((prev) => prev + 1);
    }

    setTimeout(() => {
      if (roundIndex + 1 >= rounds.length) {
        setPhase('result');
      } else {
        setRoundIndex((prev) => prev + 1);
        setSelectedOptionId(null);
        setRoundStartTime(Date.now());
      }
    }, 600);
  }

  // -------------------------
  // SETUP SCREEN
  // -------------------------

  if (phase === 'setup') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>👪 Family Faces</Text>

        <Text style={styles.subtitle}>
          Add photos of loved ones, then practice recognizing who's who.
        </Text>

        {members.length === 0 && (
          <Text style={styles.emptyStateText}>
            No family members added yet. Add at least 2 to start playing.
          </Text>
        )}

        {members.map((member) => (
          <View key={member.id} style={styles.familyMemberRow}>
            <Image
              source={{ uri: member.uri }}
              style={styles.familyThumbnail}
            />

            <View style={styles.familyMemberInfo}>
              <Text style={styles.familyMemberName}>{member.name}</Text>
              <Text style={styles.familyMemberRelation}>
                {member.relation}
              </Text>
            </View>

            <Pressable
              style={styles.removeButton}
              onPress={() => removeMember(member.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        ))}

        {!showAddForm && (
          <Pressable
            style={styles.addMemberButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addMemberButtonText}>
              + Add Family Member
            </Text>
          </Pressable>
        )}

        {showAddForm && (
          <View style={styles.addFormContainer}>
            <Pressable style={styles.photoPickerButton} onPress={pickPhoto}>
              <Text style={styles.photoPickerButtonText}>
                📷 Choose Photo
              </Text>
            </Pressable>

            {!!permissionError && (
              <Text style={styles.warningText}>{permissionError}</Text>
            )}

            {newPhotoUri && (
              <Image
                source={{ uri: newPhotoUri }}
                style={styles.photoPreview}
              />
            )}

            <TextInput
              style={styles.formInput}
              placeholder="Name (e.g. Aarav)"
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Relation (e.g. Grandson)"
              value={newRelation}
              onChangeText={setNewRelation}
            />

            <View style={styles.chipsRow}>
              {RELATION_CHIPS.map((chip) => (
                <Pressable
                  key={chip}
                  style={[
                    styles.chip,
                    newRelation === chip && styles.chipSelected,
                  ]}
                  onPress={() => setNewRelation(chip)}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.formActionsRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddForm(false);
                  setNewPhotoUri(null);
                  setNewName('');
                  setNewRelation('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  (!newPhotoUri || !newName.trim() || !newRelation.trim()) &&
                    styles.disabledButton,
                ]}
                onPress={saveNewMember}
              >
                <Text style={styles.saveButtonText}>Save Member</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.smallText}>Difficulty</Text>

        <View style={styles.levelButtons}>
          {([1, 2, 3, 4, 5] as FamilyLevel[]).map((item) => {
            const isLocked = item > maxAvailableLevel && members.length > 0;

            return (
              <Pressable
                key={item}
                style={[
                  styles.levelButton,
                  level === item && styles.activeLevelButton,
                  isLocked && styles.disabledButton,
                ]}
                onPress={() => !isLocked && setLevel(item)}
              >
                <Text style={styles.levelButtonText}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.startGameButton,
            members.length < 2 && styles.disabledButton,
          ]}
          onPress={() => members.length >= 2 && startGame(level)}
        >
          <Text style={styles.startGameButtonText}>▶️ Start Game</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // -------------------------
  // PLAY SCREEN
  // -------------------------

  if (phase === 'play') {
    const currentRound = rounds[roundIndex];

    return (
      <View style={styles.container}>
        <Text style={styles.levelText}>Level {level}</Text>

        <Text style={styles.progress}>
          Round {roundIndex + 1}/{rounds.length}
        </Text>

        <Image
          source={{ uri: currentRound.target.uri }}
          style={styles.familyPhotoLarge}
        />

        <Text style={styles.subtitle}>Who is this?</Text>

        <View>
          {currentRound.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption = option.id === currentRound.target.id;
            const showFeedback = selectedOptionId !== null;

            return (
              <Pressable
                key={option.id}
                style={[
                  styles.memberOptionButton,
                  showFeedback &&
                    isCorrectOption &&
                    styles.selectedButton,
                  showFeedback &&
                    isSelected &&
                    !isCorrectOption &&
                    styles.disabledButton,
                ]}
                onPress={() => handleAnswer(option.id)}
              >
                <Text style={styles.memberOptionText}>
                  {option.name} — {option.relation}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // -------------------------
  // RESULT SCREEN
  // -------------------------

  const accuracy = Math.round((score / rounds.length) * 100);
  const avgReactionTime = totalReactionTime / rounds.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {accuracy >= 80
          ? '🎉 Excellent!'
          : accuracy >= 50
          ? '👍 Good Try!'
          : '💪 Keep Practicing!'}
      </Text>

      <Text style={styles.result}>Level: {level}</Text>
      <Text style={styles.result}>
        Score: {score}/{rounds.length}
      </Text>
      <Text style={styles.result}>Accuracy: {accuracy}%</Text>
      <Text style={styles.result}>Mistakes: {mistakes}</Text>
      <Text style={styles.result}>
        Avg Reaction Time: {avgReactionTime.toFixed(2)}s
      </Text>

      <Pressable
        style={styles.playAgainButton}
        onPress={() => startGame(level)}
      >
        <Text style={styles.playAgainText}>Play Again</Text>
      </Pressable>

      <Pressable
        style={styles.playAgainButton}
        onPress={() => setPhase('setup')}
      >
        <Text style={styles.playAgainText}>👪 Manage Family / Level</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back to Games</Text>
      </Pressable>
    </View>
  );
}


// ======================================================
// TUNE MEMORY GAME
// ======================================================

function TuneGame({ onBack }: { onBack: () => void }) {
  type TunePhase = 'listen' | 'answer' | 'result';

  const [level, setLevel] = useState<TuneLevel>(1);
  const [phase, setPhase] = useState<TunePhase>('listen');
  const [playedSequence, setPlayedSequence] = useState<Tune[]>([]);
  const [userSequence, setUserSequence] = useState<Tune[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [activeTuneId, setActiveTuneId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);

  const playRunId = useRef(0);

  function createRound(selectedLevel: TuneLevel) {
    const settings = TUNE_LEVELS[selectedLevel];
    const sequence = shuffleArray(TUNE_LIBRARY).slice(0, settings.tuneCount);

    setLevel(selectedLevel);
    setPlayedSequence(sequence);
    setUserSequence([]);
    setScore(0);
    setMistakes(0);
    setReactionTime(0);
    setHasPlayedOnce(false);
    setIsPlaying(false);
    setActiveTuneId(null);
    setAnswerStartTime(null);
    setPhase('listen');
  }

  useEffect(() => {
    createRound(1);
  }, []);

  async function playSequence() {
    const runId = ++playRunId.current;
    setIsPlaying(true);

    for (const tune of playedSequence) {
      if (playRunId.current !== runId) return;

      setActiveTuneId(tune.id);
      await playTune(tune);
      await sleep(TONE_DURATION_MS);

      if (playRunId.current !== runId) return;
      setActiveTuneId(null);
      await sleep(250);
    }

    if (playRunId.current !== runId) return;
    setIsPlaying(false);
    setHasPlayedOnce(true);
  }

  function goToAnswerPhase() {
    setAnswerStartTime(Date.now());
    setPhase('answer');
  }

  function handleTunePress(tune: Tune) {
    if (userSequence.length >= playedSequence.length) {
      return;
    }

    playTune(tune);

    const position = userSequence.length;
    const isCorrectPosition = playedSequence[position]?.id === tune.id;

    if (isCorrectPosition) {
      setScore((prev) => prev + 1);
    } else {
      setMistakes((prev) => prev + 1);
    }

    const updatedSequence = [...userSequence, tune];
    setUserSequence(updatedSequence);

    if (updatedSequence.length === playedSequence.length) {
      const elapsed = answerStartTime
        ? (Date.now() - answerStartTime) / 1000
        : 0;
      setReactionTime(elapsed);
      setTimeout(() => setPhase('result'), 400);
    }
  }

  function changeLevel(newLevel: TuneLevel) {
    playRunId.current++;
    createRound(newLevel);
  }

  function restartGame() {
    playRunId.current++;
    createRound(level);
  }

  // -------------------------
  // LISTEN PHASE
  // -------------------------

  if (phase === 'listen') {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>🎵 Tune Memory</Text>

        <Text style={styles.levelText}>Level {level}</Text>

        <Text style={styles.subtitle}>
          Listen to {playedSequence.length} sounds in order.
        </Text>

        <View style={styles.tunesGrid}>
          {playedSequence.map((tune) => (
            <Text
              key={tune.id}
              style={[
                styles.object,
                activeTuneId === tune.id && styles.activeObject,
              ]}
            >
              {tune.emoji}
            </Text>
          ))}
        </View>

        <Pressable
          style={[styles.playTunesButton, isPlaying && styles.disabledButton]}
          onPress={playSequence}
        >
          <Text style={styles.playTunesButtonText}>
            {hasPlayedOnce ? '🔁 Replay' : '▶️ Play Tunes'}
          </Text>
        </Pressable>

        {hasPlayedOnce && !isPlaying && (
          <Pressable style={styles.startGameButton} onPress={goToAnswerPhase}>
            <Text style={styles.startGameButtonText}>
              ✅ I'm Ready to Answer
            </Text>
          </Pressable>
        )}

        <Text style={styles.smallText}>Difficulty</Text>

        <View style={styles.levelButtons}>
          {([1, 2, 3, 4, 5] as TuneLevel[]).map((item) => (
            <Pressable
              key={item}
              style={[
                styles.levelButton,
                level === item && styles.activeLevelButton,
              ]}
              onPress={() => changeLevel(item)}
            >
              <Text style={styles.levelButtonText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // -------------------------
  // ANSWER PHASE
  // -------------------------

  if (phase === 'answer') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>What did you hear?</Text>

        <Text style={styles.subtitle}>
          Tap the sounds in the order you heard them. Tap a sound again to
          hear a preview.
        </Text>

        <View style={styles.optionsContainer}>
          {TUNE_LIBRARY.map((tune) => (
            <Pressable
              key={tune.id}
              onPress={() => handleTunePress(tune)}
              style={styles.optionButton}
            >
              <Text style={styles.optionText}>{tune.emoji}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.selectedTunesRow}>
          {userSequence.map((tune, index) => (
            <Text key={`${tune.id}-${index}`} style={styles.selectedTuneChip}>
              {tune.emoji}
            </Text>
          ))}
        </View>

        <Text style={styles.progress}>
          Selected: {userSequence.length}/{playedSequence.length}
        </Text>
      </View>
    );
  }

  // -------------------------
  // RESULT PHASE
  // -------------------------

  const accuracy = Math.round((score / playedSequence.length) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {accuracy >= 80
          ? '🎉 Excellent!'
          : accuracy >= 50
          ? '👍 Good Try!'
          : '💪 Keep Practicing!'}
      </Text>

      <Text style={styles.result}>Level: {level}</Text>
      <Text style={styles.result}>
        Score: {score}/{playedSequence.length}
      </Text>
      <Text style={styles.result}>Accuracy: {accuracy}%</Text>
      <Text style={styles.result}>Mistakes: {mistakes}</Text>
      <Text style={styles.result}>
        Reaction Time: {reactionTime.toFixed(2)}s
      </Text>

      <Pressable style={styles.playAgainButton} onPress={restartGame}>
        <Text style={styles.playAgainText}>Play Again</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back to Games</Text>
      </Pressable>
    </View>
  );
}

// ======================================================
// SHARED STYLES
// ======================================================

const PALETTE = {
  background: '#F6F5FB',
  card: '#FFFFFF',
  primary: '#2563EB',
  primaryLight: '#EAF2FF',
  text: '#1A1F36',
  textSecondary: '#5A6478',
  border: '#DDE3F0',
  danger: '#DC2626',
  success: '#16A34A',
  disabled: '#C6CEDD',
};

const styles = StyleSheet.create({
  // ---------- Layout ----------
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: PALETTE.background,
  },
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
    padding: 22,
  },

  // ---------- Text ----------
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: PALETTE.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.text,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 18,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 25,
  },
  smallText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 12,
    marginBottom: 10,
  },
  levelText: {
    fontSize: 19,
    fontWeight: '800',
    color: PALETTE.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  timer: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.primary,
    textAlign: 'center',
    marginBottom: 14,
  },
  progress: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  result: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: PALETTE.danger,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
  },

  // ---------- Home screen ----------
  gamesContainer: {
    width: '100%',
    gap: 16,
    marginTop: 22,
  },
  gameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.card,
    borderRadius: 22,
    padding: 18,
    gap: 16,
    minHeight: 96,
    shadowColor: '#1A1F36',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  gameButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  gameIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameEmoji: {
    fontSize: 34,
  },
  gameTextContainer: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.text,
    marginBottom: 3,
  },
  gameDescription: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    lineHeight: 19,
  },
  gameChevron: {
    fontSize: 30,
    color: PALETTE.disabled,
    fontWeight: '700',
  },

  // ---------- Nav / buttons ----------
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: PALETTE.primaryLight,
    borderRadius: 14,
  },
  backText: {
    color: PALETTE.primary,
    fontWeight: '800',
    fontSize: 17,
  },
  playAgainButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: 'center',
    marginTop: 22,
    shadowColor: PALETTE.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  playAgainText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 19,
  },
  startGameButton: {
    backgroundColor: PALETTE.success,
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: PALETTE.success,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  startGameButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 19,
  },
  disabledButton: {
    backgroundColor: PALETTE.disabled,
    opacity: 0.6,
  },

  // ---------- Level selector (shared across games) ----------
  levelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  levelButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PALETTE.card,
    borderWidth: 2,
    borderColor: PALETTE.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeLevelButton: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
    transform: [{ scale: 1.08 }],
  },
  levelButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.text,
  },

  // ---------- Memory game ----------
  objectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 18,
  },
  object: {
    fontSize: 46,
  },
  activeObject: {
    fontSize: 52,
    transform: [{ scale: 1.15 }],
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 14,
  },
  optionButton: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: PALETTE.card,
    borderWidth: 2,
    borderColor: PALETTE.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: PALETTE.primaryLight,
    borderColor: PALETTE.primary,
    borderWidth: 3,
  },
  optionText: {
    fontSize: 34,
  },

  // ---------- Attention game ----------
  attentionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 18,
  },
  attentionObject: {
    fontSize: 34,
    margin: 3,
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
  },
  answerButton: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: PALETTE.primaryLight,
    borderWidth: 2,
    borderColor: PALETTE.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerText: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.primary,
  },

  // ---------- Pattern game ----------
  patternContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 18,
  },
  patternItem: {
    fontSize: 40,
  },
  patternQuestion: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.text,
    textAlign: 'center',
    marginBottom: 14,
  },
  patternOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  patternOption: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: PALETTE.card,
    borderWidth: 2,
    borderColor: PALETTE.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPatternOption: {
    backgroundColor: PALETTE.primaryLight,
    borderColor: PALETTE.primary,
    borderWidth: 3,
  },
  patternOptionText: {
    fontSize: 36,
  },

  // ---------- Family Faces game ----------
  familyMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  familyThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  familyMemberInfo: {
    flex: 1,
  },
  familyMemberName: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
  },
  familyMemberRelation: {
    fontSize: 14,
    color: PALETTE.textSecondary,
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    color: PALETTE.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  addMemberButton: {
    borderWidth: 2,
    borderColor: PALETTE.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  addMemberButtonText: {
    color: PALETTE.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  addFormContainer: {
    backgroundColor: PALETTE.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  photoPickerButton: {
    backgroundColor: PALETTE.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  photoPickerButtonText: {
    color: PALETTE.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    marginBottom: 12,
  },
  formInput: {
    borderWidth: 2,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 16,
    color: PALETTE.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: PALETTE.background,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
  },
  chipSelected: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.text,
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: PALETTE.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: PALETTE.text,
    fontWeight: '700',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  familyPhotoLarge: {
    width: 230,
    height: 230,
    borderRadius: 22,
    alignSelf: 'center',
    marginVertical: 18,
  },
  memberOptionButton: {
    backgroundColor: PALETTE.card,
    borderWidth: 2,
    borderColor: PALETTE.border,
    borderRadius: 16,
    paddingVertical: 19,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  memberOptionText: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
    textAlign: 'center',
  },

  // ---------- Tune Memory game ----------
  tunesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    marginVertical: 12,
  },
  playTunesButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: 'center',
    marginTop: 12,
  },
  playTunesButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 19,
  },
  selectedTunesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  selectedTuneChip: {
    fontSize: 30,
  },
});
