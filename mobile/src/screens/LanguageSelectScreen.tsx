// LanguageSelectScreen.tsx
// Shown once, before Login/Register — sets the language used to localize
// every screen's text, wired to i18next.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';
import i18n, { SupportedLanguage } from '../i18n/i18n';

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'as', label: 'অসমীয়া' }, // Assamese — Assam
  { code: 'bn', label: 'বাংলা' },   // Bengali — Tripura, Barak Valley (Assam)
];

type Props = {
  onContinue: (languageCode: string) => void;
};

export default function LanguageSelectScreen({ onContinue }: Props) {
  const [selected, setSelected] = useState<SupportedLanguage>('en');

  const handleSelect = (code: SupportedLanguage) => {
    setSelected(code);
    i18n.changeLanguage(code);
  };

  return (
    <View style={styles.container}>
      <Text style={type.heading}>Choose your language</Text>
      <Text style={[type.bodyMuted, styles.subtitle]}>
        You can change this anytime in Settings.
      </Text>

      <View style={styles.grid}>
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.tile, isSelected && styles.tileSelected]}
              onPress={() => handleSelect(lang.code)}
            >
              <Text
                style={[styles.tileText, isSelected && styles.tileTextSelected]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onContinue(selected)}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tile: {
    width: '47%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.minHeight + 20,
  },
  tileSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tileText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tileTextSelected: {
    color: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '600',
  },
});