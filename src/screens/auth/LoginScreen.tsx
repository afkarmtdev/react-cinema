import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { BrandHeader } from '../../components/BrandHeader';
import { StorageSettings } from '../../components/StorageSettings';
import { AuthError, useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { spacing, typography, type ThemeColors } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useThemedStyles, useTheme } from '../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Storage picker, so a fresh install can point at a server before signing in.
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // On success the root navigator swaps to the main tabs automatically.
    } catch (e) {
      setError(e instanceof AuthError ? t(e.message) : t('errLoginGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <BrandHeader />
          <Text style={styles.title}>{t('welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>

          <View style={styles.form}>
            <TextField
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextField
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('yourPassword')}
              secure
              autoComplete="password"
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Button
              label={t('login')}
              onPress={onSubmit}
              loading={submitting}
            />
          </View>

          <View style={styles.advanced}>
            <Pressable
              onPress={() => setAdvancedOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityState={{ expanded: advancedOpen }}
              style={styles.advancedToggle}
              hitSlop={8}
            >
              <Ionicons
                name={advancedOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.advancedText}>{t('advanced')}</Text>
            </Pressable>
            {advancedOpen && (
              <View style={styles.advancedBody}>
                <Text style={styles.fieldLabel}>{t('storage')}</Text>
                <StorageSettings />
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('noAccount')}</Text>
            <Button
              label={t('goToSignup')}
              variant="ghost"
              onPress={() => navigation.navigate('Signup')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { flexGrow: 1, paddingVertical: spacing.xl, gap: spacing.sm },
    title: { ...typography.h1, color: colors.text, marginTop: spacing.xl },
    subtitle: { ...typography.body, color: colors.textSecondary },
    form: { gap: spacing.lg, marginTop: spacing.xl },
    error: { ...typography.caption, color: colors.error },
    advanced: { marginTop: spacing.xl, gap: spacing.md },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    advancedText: { ...typography.caption, color: colors.textSecondary },
    advancedBody: { gap: spacing.sm },
    fieldLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    footer: { marginTop: 'auto', alignItems: 'center' },
    footerText: { ...typography.caption, color: colors.textSecondary },
  });
