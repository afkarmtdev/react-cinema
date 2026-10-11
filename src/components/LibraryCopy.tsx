import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthError, useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLibrary } from '../context/LibraryContext';
import { useStorage, type StorageMode } from '../context/StorageContext';
import { useThemedStyles, useTheme } from '../context/ThemeContext';
import {
  createCopyBackend,
  isValidServerUrl,
  normaliseServerUrl,
} from '../lib/backend';
import { copyLibrary, type CopySide } from '../lib/libraryCopy';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

const TARGETS: StorageMode[] = ['server', 'device'];

type Outcome =
  | { kind: 'done'; copied: number; skipped: number }
  | { kind: 'error'; message: string };

/**
 * Copies entries between this device and a PocketBase server, either way,
 * while the app stays signed in to the side it is on. The user signs in to
 * their account on the other side here; that sign-in is not remembered.
 */
export function LibraryCopy() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const { reload } = useLibrary();
  const { settings, backend } = useStorage();

  const otherMode: StorageMode =
    backend.mode === 'server' ? 'device' : 'server';
  const [target, setTarget] = useState<StorageMode>('server');
  const [url, setUrl] = useState(settings.serverUrl);
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  if (!user) return null;

  // In device mode the other side is a server, which needs an address.
  const needsUrl = otherMode === 'server';
  const cleanUrl = normaliseServerUrl(url);
  const urlOk = !needsUrl || isValidServerUrl(cleanUrl);
  const canCopy = urlOk && !!email.trim() && !!password && !running;

  const onCopy = async () => {
    setRunning(true);
    setOutcome(null);
    try {
      const other = createCopyBackend(otherMode, cleanUrl);
      const otherUser = await other.auth.login(
        email.trim().toLowerCase(),
        password,
      );
      const here: CopySide = { library: backend.library, user };
      const there: CopySide = { library: other.library, user: otherUser };
      const intoOther = target === otherMode;
      const result = await copyLibrary(
        intoOther ? here : there,
        intoOther ? there : here,
      );
      if (result.favourites) {
        if (intoOther) {
          await other.auth.updateProfile(otherUser, {
            favourites: result.favourites,
          });
        } else {
          await updateProfile({ favourites: result.favourites });
        }
      }
      if (!intoOther) reload();
      setPassword('');
      setOutcome({
        kind: 'done',
        copied: result.copied,
        skipped: result.skipped,
      });
    } catch (error) {
      setOutcome({
        kind: 'error',
        message: t(error instanceof AuthError ? error.message : 'copyFailed'),
      });
    } finally {
      setRunning(false);
    }
  };

  const resetOutcome = () => setOutcome(null);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('copyTitle')}</Text>

      <View style={styles.targetRow}>
        {TARGETS.map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              setTarget(m);
              resetOutcome();
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: target === m }}
            style={[styles.option, target === m && styles.optionActive]}
          >
            <Ionicons
              name={
                m === 'server' ? 'cloud-upload-outline' : 'download-outline'
              }
              size={18}
              color={target === m ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.optionText,
                target === m && styles.optionTextActive,
              ]}
            >
              {t(m === 'server' ? 'copyToServer' : 'copyToDevice')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.note}>
        {t(otherMode === 'server' ? 'copySignInServer' : 'copySignInDevice')}
      </Text>

      {needsUrl && (
        <TextField
          label={t('serverAddress')}
          value={url}
          onChangeText={(next) => {
            setUrl(next);
            resetOutcome();
          }}
          placeholder="https://example.up.railway.app"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          error={url.trim() && !urlOk ? t('errServerUrl') : null}
        />
      )}
      <TextField
        label={t('email')}
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          resetOutcome();
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField
        label={t('password')}
        value={password}
        onChangeText={(next) => {
          setPassword(next);
          resetOutcome();
        }}
        secure
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.note}>{t('copyNote')}</Text>

      <Button
        label={t('copyRun')}
        variant="outline"
        onPress={onCopy}
        loading={running}
        disabled={!canCopy}
      />

      {outcome && (
        <View style={styles.result}>
          <Ionicons
            name={outcome.kind === 'done' ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={outcome.kind === 'done' ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.resultText,
              outcome.kind === 'error' && styles.resultTextFail,
            ]}
          >
            {outcome.kind === 'done'
              ? t('copyDone', {
                  copied: outcome.copied,
                  skipped: outcome.skipped,
                })
              : outcome.message}
          </Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.sm, marginTop: spacing.md },
    heading: { ...typography.bodyStrong, color: colors.text },
    targetRow: { flexDirection: 'row', gap: spacing.md },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    optionActive: { borderColor: colors.primary },
    optionText: { ...typography.bodyStrong, color: colors.textSecondary },
    optionTextActive: { color: colors.primary },
    note: {
      ...typography.caption,
      color: colors.textMuted,
      marginLeft: spacing.xs,
      lineHeight: 18,
    },
    result: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    resultText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    resultTextFail: { color: colors.error },
  });
