// RegisterScreen.tsx
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
import { registerUser, loginUser, Role } from '../api/auth';
import { API_BASE_URL } from '../api/config';

type Props = {
  onRegisterSuccess: (role: Role, token: string) => void;
  onGoToLogin: () => void;
};

export default function RegisterScreen({ onRegisterSuccess, onGoToLogin }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    console.log('CHECKPOINT 1: start');
    console.log('API_BASE_URL is:', API_BASE_URL);
    console.log('CHECKPOINT 2: after API_BASE_URL log');
    setError('');
    console.log('CHECKPOINT 3: after setError');
    if (!name.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    console.log('CHECKPOINT 4: after validation check');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    console.log('CHECKPOINT 5: after password match check');

    setSubmitting(true);
    console.log('CHECKPOINT 6: after setSubmitting(true)');
    try {
      console.log('CHECKPOINT 7: about to call registerUser, typeof registerUser is:', typeof registerUser);
      const result = await registerUser({
        name: name.trim(),
        phone: phone.trim(),
        password,
        role,
      });
      console.log('CHECKPOINT 8: registerUser returned', result);
      console.log('REGISTER RESULT:', result.message, result.role, result.patientId);

      // registerUser's response has no token (see RegisterResponse in
      // api/auth.ts) — only { message, role, patientId }. So a newly
      // registered patient has no JWT yet, which is exactly what left
      // authToken null going into MemoryScreen. To fix that without
      // touching the backend contract, we immediately log in with the
      // same credentials right after a successful registration, the
      // same way LoginScreen does, and hand that real token upstream.
      console.log('CHECKPOINT 9: registration succeeded, logging in to obtain a token');
      try {
        const loginResult = await loginUser(phone.trim(), password);
        console.log('CHECKPOINT 10: auto-login after register succeeded');
        onRegisterSuccess(loginResult.role, loginResult.token);
      } catch (loginError: any) {
        // Registration itself worked — the account exists — but the
        // automatic sign-in failed (e.g. backend hiccup). Don't pretend
        // this succeeded: send them to the login screen to sign in
        // manually rather than letting them into the app with no token.
        console.log('AUTO-LOGIN AFTER REGISTER ERROR:', loginError.message);
        setError(
          'Your account was created, but we could not log you in automatically. Please log in below.'
        );
        onGoToLogin();
      }
    } catch (e: any) {
      console.log('REGISTER ERROR:', e.message);
      console.log('STACK:', e.stack);
      setError('Could not create your account. Please try again.');
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
        <Text style={type.heading}>Create an account</Text>
        <Text style={[type.bodyMuted, styles.subtitle]}>
          It only takes a minute.
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
          <Text style={type.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={type.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter your phone number"
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
            placeholder="Create a password"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={type.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter your password"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? 'Creating account...' : 'Create account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={onGoToLogin}>
          <Text style={type.bodyMuted}>Already have an account? </Text>
          <Text style={styles.link}>Log in</Text>
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
    marginBottom: spacing.lg,
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
