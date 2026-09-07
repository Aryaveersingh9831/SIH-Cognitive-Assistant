// LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, spacing, radius, type, touchTarget } from '../theme';
import { loginUser, saveAuthToken } from '../api/auth';

type Role = 'patient' | 'caregiver';

// Swap this out for your real navigation type once react-navigation is wired up.
type Props = {
  onLoginSuccess: (role: Role) => void;
  onGoToRegister: () => void;
};

export default function LoginScreen({ onLoginSuccess, onGoToRegister }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Enter your username and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginUser(username, password);
      await saveAuthToken(result.token);
      onLoginSuccess(result.role);
    } catch (e: any) {
      setError(e.message || 'Could not log in. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={type.heading}>Welcome back</Text>
        <Text style={[type.bodyMuted, styles.subtitle]}>
          Let's continue where you left off.
        </Text>

        <View style={styles.roleRow}>
          <RoleOption
            label="Patient"
            selected={role === 'patient'}
            onPress={() => setRole('patient')}
          />
          <RoleOption
            label="Caregiver"
            selected={role === 'caregiver'}
            onPress={() => setRole('caregiver')}
          />
        </View>

        <View style={styles.field}>
          <Text style={type.label}>Phone number or Patient ID</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="Enter phone number or Patient ID"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={type.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? 'Logging in...' : 'Log in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={onGoToRegister}>
          <Text style={type.bodyMuted}>New here? </Text>
          <Text style={styles.link}>Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.roleOption, selected && styles.roleOptionSelected]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.roleOptionText,
          selected && styles.roleOptionTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: touchTarget.minHeight,
    justifyContent: 'center',
  },
  roleOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  roleOptionTextSelected: {
    color: colors.surface,
  },
  field: {
    marginBottom: spacing.lg,
  },
  input: {
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    fontSize: 17,
    color: colors.text,
    minHeight: touchTarget.minHeight,
  },
  error: {
    color: colors.error,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});