import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { BrandHeader } from '../../components/BrandHeader';
import { AuthError, useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, typography } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingVertical: spacing.xl, gap: spacing.sm },
  title: { ...typography.h1, color: colors.text, marginTop: spacing.xl },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { gap: spacing.lg, marginTop: spacing.xl },
  error: { ...typography.caption, color: colors.error },
  footer: { marginTop: 'auto', alignItems: 'center' },
  footerText: { ...typography.caption, color: colors.textSecondary },
});
