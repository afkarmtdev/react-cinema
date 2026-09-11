import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthError, useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useThemedStyles, useTheme } from '../context/ThemeContext';
import type { NewAvatar } from '../lib/auth';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { Button } from './ui/Button';
import { Sheet } from './ui/Sheet';
import { TextField } from './ui/TextField';

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The name and the profile picture, in a bottom sheet. The picture comes
 * from the photo library, cropped square by the system picker; nothing is
 * saved until Save.
 */
export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  // undefined leaves the picture alone; null removes it.
  const [avatar, setAvatar] = useState<NewAvatar | null | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Start from the current profile each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setName(user?.name ?? '');
    setAvatar(undefined);
    setError(null);
    setSaving(false);
  }, [visible, user]);

  const preview =
    avatar === undefined ? user?.avatar : avatar ? avatar.uri : undefined;

  const choosePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset) return;
    setAvatar({
      uri: asset.uri,
      base64: asset.base64 ?? undefined,
      mimeType: asset.mimeType ?? undefined,
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name, avatar });
      onClose();
    } catch (err) {
      setError(t(err instanceof AuthError ? err.message : 'errProfileSave'));
      setSaving(false);
    }
  };

  const initial = (name || user?.name || '?').charAt(0).toUpperCase();

  return (
    <Sheet visible={visible} onClose={onClose} avoidKeyboard>
      <Text style={styles.title}>{t('editProfile')}</Text>

      <Text style={styles.label}>{t('profilePhoto')}</Text>
      <View style={styles.photoRow}>
        <Pressable
          onPress={choosePhoto}
          accessibilityRole="button"
          accessibilityLabel={t('choosePhoto')}
          style={styles.avatar}
        >
          {preview ? (
            <Image source={{ uri: preview }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={14} color={colors.onPrimary} />
          </View>
        </Pressable>
        <View style={styles.photoActions}>
          <Button
            label={t('choosePhoto')}
            variant="outline"
            onPress={choosePhoto}
            style={styles.photoBtn}
          />
          {!!preview && (
            <Button
              label={t('removePhoto')}
              variant="ghost"
              onPress={() => setAvatar(null)}
              style={styles.photoBtn}
            />
          )}
        </View>
      </View>

      <TextField
        label={t('name')}
        value={name}
        onChangeText={setName}
        placeholder={t('yourName')}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={save}
        error={error}
      />

      <View style={styles.actions}>
        <Button
          label={t('cancel')}
          variant="ghost"
          onPress={onClose}
          style={styles.action}
        />
        <Button
          label={t('save')}
          onPress={save}
          loading={saving}
          style={styles.action}
        />
      </View>
    </Sheet>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
      marginBottom: spacing.sm,
    },
    photoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    avatarImage: { width: 84, height: 84, borderRadius: radius.pill },
    avatarText: { fontSize: 34, fontWeight: '800', color: colors.onPrimary },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoActions: { flex: 1, gap: spacing.xs },
    photoBtn: { height: 40 },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    action: { flex: 1 },
  });
