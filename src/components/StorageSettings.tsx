import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useStorage, type StorageMode } from '../context/StorageContext';
import { useThemedStyles, useTheme } from '../context/ThemeContext';
import { isValidServerUrl, normaliseServerUrl } from '../lib/backend';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

const MODES: StorageMode[] = ['device', 'server'];

/**
 * The Storage setting: keep accounts and the library on this device, or on a
 * PocketBase server. Edits are a draft until "Switch storage" is pressed.
 * A signed-in user is warned and signed out first, because accounts and
 * entries stay in the store they were made in.
 */
export function StorageSettings() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { settings, backend, setSettings, testConnection } = useStorage();

  const [mode, setMode] = useState<StorageMode>(settings.mode);
  const [url, setUrl] = useState(settings.serverUrl);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'ok' | 'fail' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Start over from the saved choice whenever it changes.
  useEffect(() => {
    setMode(settings.mode);
    setUrl(settings.serverUrl);
    setConfirming(false);
  }, [settings]);

  const cleanUrl = normaliseServerUrl(url);
  const urlOk = isValidServerUrl(cleanUrl);
  const dirty =
    mode !== settings.mode ||
    (mode === 'server' && cleanUrl !== settings.serverUrl);
  const canSwitch = dirty && (mode === 'device' || urlOk);

  const onTest = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      setCheckResult((await testConnection(cleanUrl)) ? 'ok' : 'fail');
    } finally {
      setChecking(false);
    }
  };

  const onSwitch = async () => {
    if (user && !confirming) {
      setConfirming(true);
      return;
    }
    setSwitching(true);
    try {
      // Sign out of the old store first; the new one restores its own session.
      if (user) await logout();
      await setSettings({ mode, serverUrl: cleanUrl });
    } finally {
      setSwitching(false);
      setConfirming(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Ionicons
          name={
            backend.serverUrl ? 'cloud-done-outline' : 'phone-portrait-outline'
          }
          size={18}
          color={colors.textSecondary}
        />
        <Text style={styles.statusText}>
          {backend.serverUrl
            ? t('storageCloud', { url: backend.serverUrl })
            : t('storageLocal')}
        </Text>
      </View>

      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              setMode(m);
              setConfirming(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
            style={[styles.option, mode === m && styles.optionActive]}
          >
            <Ionicons
              name={m === 'server' ? 'cloud-outline' : 'phone-portrait-outline'}
              size={18}
              color={mode === m ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[styles.optionText, mode === m && styles.optionTextActive]}
            >
              {t(m === 'server' ? 'storageServer' : 'storageDevice')}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'server' && (
        <View style={styles.serverBlock}>
          <TextField
            label={t('serverAddress')}
            value={url}
            onChangeText={(next) => {
              setUrl(next);
              setCheckResult(null);
              setConfirming(false);
            }}
            placeholder="http://192.168.1.20:8090"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            error={url.trim() && !urlOk ? t('errServerUrl') : null}
          />
          <View style={styles.testRow}>
            <Button
              label={t('testConnection')}
              variant="outline"
              onPress={onTest}
              loading={checking}
              disabled={!urlOk}
              style={styles.smallBtn}
            />
            {checkResult && (
              <View style={styles.testResult}>
                <Ionicons
                  name={
                    checkResult === 'ok' ? 'checkmark-circle' : 'alert-circle'
                  }
                  size={16}
                  color={checkResult === 'ok' ? colors.success : colors.error}
                />
                <Text
                  style={[
                    styles.testText,
                    checkResult === 'fail' && styles.testTextFail,
                  ]}
                >
                  {t(
                    checkResult === 'ok' ? 'connectionOk' : 'connectionFailed',
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <Text style={styles.note}>{t('storageNote')}</Text>

      {dirty && confirming && (
        <View style={styles.warning}>
          <View style={styles.warningHeader}>
            <Ionicons name="alert-circle" size={18} color={colors.primary} />
            <Text style={styles.warningTitle}>{t('storageSwitchTitle')}</Text>
          </View>
          <Text style={styles.warningBody}>{t('storageSwitchBody')}</Text>
          <View style={styles.warningActions}>
            <Button
              label={t('cancel')}
              variant="ghost"
              onPress={() => setConfirming(false)}
              style={styles.smallBtn}
            />
            <Button
              label={t('storageSwitchConfirm')}
              onPress={onSwitch}
              loading={switching}
              style={styles.smallBtn}
            />
          </View>
        </View>
      )}

      {dirty && !confirming && (
        <Button
          label={t('storageApply')}
          onPress={onSwitch}
          loading={switching}
          disabled={!canSwitch}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.sm },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    statusText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    modeRow: { flexDirection: 'row', gap: spacing.md },
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
    serverBlock: { gap: spacing.sm },
    testRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    smallBtn: { flex: 1, height: 42 },
    testResult: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    testText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    testTextFail: { color: colors.error },
    note: {
      ...typography.caption,
      color: colors.textMuted,
      marginLeft: spacing.xs,
      lineHeight: 18,
    },
    warning: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
      padding: spacing.md,
      gap: spacing.sm,
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    warningTitle: { ...typography.bodyStrong, color: colors.text, flex: 1 },
    warningBody: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    warningActions: { flexDirection: 'row', gap: spacing.sm },
  });
