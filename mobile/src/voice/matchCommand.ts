// src/voice/matchCommand.ts
import i18n, { SupportedLanguage } from '../i18n/i18n';

/**
 * Fixed, closed set of voice commands. Do NOT expand this to open-ended
 * NLU — the product requirement is a small, elder-friendly, reliable
 * command set only.
 */
export type CommandId = 'READ_REMINDERS' | 'MARK_DONE' | 'REPEAT';

export const COMMAND_IDS: CommandId[] = ['READ_REMINDERS', 'MARK_DONE', 'REPEAT'];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?।]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Matches a raw speech transcript against the current language's fixed
 * command phrases (loaded from i18n resources). Returns the matched
 * CommandId, or null if nothing matched.
 */
export function matchCommand(
  transcript: string,
  language: SupportedLanguage
): CommandId | null {
  const normalizedTranscript = normalize(transcript);
  if (!normalizedTranscript) return null;

  const commands = i18n.getResource(language, 'translation', 'voice.commands') as
    | Record<CommandId, string[]>
    | undefined;
  if (!commands) return null;

  for (const commandId of COMMAND_IDS) {
    const phrases = commands[commandId] ?? [];
    for (const phrase of phrases) {
      const normalizedPhrase = normalize(phrase);
      if (
        normalizedTranscript === normalizedPhrase ||
        normalizedTranscript.includes(normalizedPhrase)
      ) {
        return commandId;
      }
    }
  }
  return null;
}
