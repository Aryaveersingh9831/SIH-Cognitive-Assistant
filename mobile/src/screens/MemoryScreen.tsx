import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing, radius, type } from '../theme';

type MemoryLevel = 1 | 2 | 3 | 4 | 5;

const MEMORY_OBJECTS = [
  '🍎',
  '🔑',
  '🚗',
  '🏠',
  '🌸',
  '⚽',
  '⌚',
  '🦋',
  '🌳',
  '📱',
  '🎈',
  '🧸',
  '🎁',
  '☀️',
  '🌞',
];

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

type Props = {
  onBack: () => void;
};

type Phase = 'ready' | 'memorize' | 'answer' | 'result';

export default function MemoryScreen({ onBack }: Props) {
  const [level, setLevel] = useState<MemoryLevel>(2);
  const [phase, setPhase] = useState<Phase>('ready');

  const [selected, setSelected] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const [timeLeft, setTimeLeft] = useState(
    MEMORY_LEVELS[2].memorizeTime
  );

  const [roundObjects, setRoundObjects] = useState<string[]>([]);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [reactionTime, setReactionTime] = useState(0);

  function createRound(selectedLevel: MemoryLevel) {
    const settings = MEMORY_LEVELS[selectedLevel];

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

  useEffect(() => {
    createRound(2);
  }, []);

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
      setTimeLeft((currentTime) => currentTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  function startMemorizing() {
    setPhase('memorize');
  }

  function handleLevelChange(newLevel: MemoryLevel) {
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

    const isCorrect = roundObjects.includes(object);

    if (isCorrect) {
      setScore((currentScore) => currentScore + 1);
    } else {
      setMistakes((currentMistakes) => currentMistakes + 1);
    }

    const updatedSelection = [...selected, object];

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

  const totalObjects = MEMORY_LEVELS[level].objectCount;

  const accuracy =
    totalObjects === 0
      ? 0
      : Math.round((score / totalObjects) * 100);

  // =========================
  // READY SCREEN
  // =========================

  if (phase === 'ready') {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>

          <Text style={type.heading}>
            🧠 Memory Game
          </Text>

          <Text style={styles.levelText}>
            Level {level}
          </Text>

          <Text style={[type.bodyMuted, styles.subtitle]}>
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
            style={styles.startButton}
            onPress={startMemorizing}
          >
            <Text style={styles.buttonText}>
              ▶ Start (
              {MEMORY_LEVELS[level].memorizeTime}
              s)
            </Text>
          </Pressable>

          <Text style={styles.smallText}>
            Difficulty
          </Text>

          <View style={styles.levelButtons}>
            {[1, 2, 3, 4, 5].map((item) => (
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
                  style={[
                    styles.levelButtonText,
                    level === item &&
                      styles.activeLevelButtonText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  // =========================
  // MEMORIZE SCREEN
  // =========================

  if (phase === 'memorize') {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>

          <Text style={type.heading}>
            🧠 Memory Game
          </Text>

          <Text style={styles.levelText}>
            Level {level}
          </Text>

          <Text
            style={[type.bodyMuted, styles.subtitle]}
          >
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
            {[1, 2, 3, 4, 5].map((item) => (
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
                  style={[
                    styles.levelButtonText,
                    level === item &&
                      styles.activeLevelButtonText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  // =========================
  // ANSWER SCREEN
  // =========================

  if (phase === 'answer') {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>

          <Text style={type.heading}>
            What do you remember?
          </Text>

          <Text
            style={[type.bodyMuted, styles.subtitle]}
          >
            Select {totalObjects} objects that you saw.
          </Text>

          <View style={styles.optionsContainer}>
            {MEMORY_OBJECTS.map((object) => {
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
                  <Text style={styles.optionText}>
                    {object}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.progress}>
            Selected: {selected.length}/
            {totalObjects}
          </Text>
        </View>
      </ScrollView>
    );
  }

  // =========================
  // RESULT SCREEN
  // =========================

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={type.heading}>
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
          <Text style={styles.buttonText}>
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
    </ScrollView>
  );
}

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  backText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 17,
  },

  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  levelText: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },

  timer: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 14,
  },

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

  startButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 18,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },

  smallText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 18,
    marginBottom: 10,
    textAlign: 'center',
  },

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
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeLevelButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  levelButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  activeLevelButtonText: {
    color: '#FFFFFF',
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
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedButton: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 3,
  },

  optionText: {
    fontSize: 34,
  },

  progress: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },

  result: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },

  playAgainButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
});