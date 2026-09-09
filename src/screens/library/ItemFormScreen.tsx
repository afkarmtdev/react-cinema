import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isOmdbConfigured } from '../../api/movies';
import { KindPicker } from '../../components/KindPicker';
import { OmdbLookupSheet } from '../../components/OmdbLookupSheet';
import { StatusPicker } from '../../components/StatusPicker';
import { TagInput } from '../../components/TagInput';
import { ScoreInput } from '../../components/ScoreInput';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useLanguage } from '../../context/LanguageContext';
import { useLibrary } from '../../context/LibraryContext';
import { KIND_ICON, creatorKey } from '../../lib/labels';
import { uniqueTags } from '../../lib/tags';
import { colors, radius, spacing, typography } from '../../theme';
import {
  isReadKind,
  type ItemKind,
  type ItemStatus,
  type LibraryItem,
} from '../../types/library';
import type { Movie } from '../../types/movie';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'ItemForm'>;

interface Draft {
  kind: ItemKind;
  title: string;
  year: string;
  creator: string;
  poster: string;
  description: string;
  tags: string[];
  status: ItemStatus;
  rating: number;
  review: string;
}

function draftFrom(item: LibraryItem | undefined, kind?: ItemKind): Draft {
  return {
    kind: item?.kind ?? kind ?? 'film',
    title: item?.title ?? '',
    year: item?.year ? String(item.year) : '',
    creator: item?.creator ?? '',
    poster: item?.poster ?? '',
    description: item?.description ?? '',
    tags: item?.tags ?? [],
    status: item?.status ?? 'want',
    rating: item?.rating ?? 0,
    review: item?.review ?? '',
  };
}

export function ItemFormScreen({ navigation, route }: Props) {
  const { itemId, kind: initialKind } = route.params ?? {};
  const { getItem, allTags, addItem, updateItem, removeItem } = useLibrary();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const existing = itemId ? getItem(itemId) : undefined;

  const [draft, setDraft] = useState<Draft>(() =>
    draftFrom(existing, initialKind),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const canLookup = !isReadKind(draft.kind) && isOmdbConfigured();

  const applyMovie = (movie: Movie) => {
    setDraft((d) => ({
      ...d,
      title: movie.title,
      year: movie.year ? String(movie.year) : d.year,
      creator: movie.director ?? d.creator,
      poster: movie.poster ?? d.poster,
      description: movie.plot ?? d.description,
      tags: uniqueTags([
        ...d.tags,
        ...(movie.genre ?? []).map((g) => g.toLowerCase()),
      ]),
    }));
    setPosterFailed(false);
    setLookupOpen(false);
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setError(t('errTitleRequired'));
      return;
    }
    setError(null);
    setSaving(true);
    const year = parseInt(draft.year, 10);
    const input = {
      kind: draft.kind,
      title: draft.title,
      year: Number.isNaN(year) ? undefined : year,
      creator: draft.creator,
      poster: draft.poster,
      description: draft.description,
      tags: draft.tags,
      status: draft.status,
      rating: draft.rating || undefined,
      review: draft.review,
    };
    try {
      if (existing) {
        await updateItem(existing.id, input);
        navigation.goBack();
      } else {
        const item = await addItem(input);
        navigation.replace('ItemDetail', {
          itemId: item.id,
          title: item.title,
        });
      }
    } catch {
      setError(t('errSaveGeneric'));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    await removeItem(existing.id);
    navigation.popToTop();
  };

  const showPoster = !!draft.poster.trim() && !posterFailed;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Field label={t('kind')}>
          <KindPicker
            value={draft.kind}
            onChange={(kind) => set('kind', kind)}
          />
        </Field>

        {canLookup && (
          <Button
            label={t('lookupOmdb')}
            variant="outline"
            onPress={() => setLookupOpen(true)}
            icon={
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.primary}
              />
            }
          />
        )}

        <TextField
          label={t('title')}
          value={draft.title}
          onChangeText={(v) => set('title', v)}
          placeholder={t('titleHint')}
          autoCapitalize="words"
        />

        <View style={styles.row}>
          <View style={styles.rowWide}>
            <TextField
              label={t(creatorKey(draft.kind))}
              value={draft.creator}
              onChangeText={(v) => set('creator', v)}
              placeholder={t('creatorHint')}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.rowNarrow}>
            <TextField
              label={t('year')}
              value={draft.year}
              onChangeText={(v) =>
                set('year', v.replace(/[^0-9]/g, '').slice(0, 4))
              }
              placeholder={t('yearHint')}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.posterRow}>
          <View style={styles.posterPreview}>
            {showPoster ? (
              <Image
                source={{ uri: draft.poster.trim() }}
                style={styles.posterImage}
                onError={() => setPosterFailed(true)}
              />
            ) : (
              <Ionicons
                name={KIND_ICON[draft.kind]}
                size={28}
                color={colors.textMuted}
              />
            )}
          </View>
          <View style={styles.flex}>
            <TextField
              label={t('posterUrl')}
              value={draft.poster}
              onChangeText={(v) => {
                set('poster', v);
                setPosterFailed(false);
              }}
              placeholder={t('posterHint')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              error={posterFailed ? t('posterPreviewFailed') : null}
            />
          </View>
        </View>

        <TextField
          label={t('description')}
          value={draft.description}
          onChangeText={(v) => set('description', v)}
          placeholder={t('descriptionHint')}
          multiline
        />

        <Field label={t('tags')}>
          <TagInput
            value={draft.tags}
            onChange={(tags) => set('tags', tags)}
            suggestions={allTags}
          />
        </Field>

        <Field label={t('status')}>
          <StatusPicker
            kind={draft.kind}
            value={draft.status}
            onChange={(status) => set('status', status)}
          />
        </Field>

        <Field label={t('yourRating')}>
          <ScoreInput value={draft.rating} onChange={(v) => set('rating', v)} />
        </Field>

        <TextField
          label={t('notes')}
          value={draft.review}
          onChangeText={(v) => set('review', v)}
          placeholder={t('notesHint')}
          multiline
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={existing ? t('saveChanges') : t('save')}
          onPress={save}
          loading={saving}
        />

        {existing &&
          (confirmDelete ? (
            <View style={styles.deleteRow}>
              <Button
                label={t('cancel')}
                variant="ghost"
                onPress={() => setConfirmDelete(false)}
                style={styles.flex}
              />
              <Button
                label={t('deleteConfirm')}
                variant="outline"
                onPress={remove}
                style={styles.deleteBtn}
              />
            </View>
          ) : (
            <Button
              label={t('delete')}
              variant="ghost"
              onPress={() => setConfirmDelete(true)}
              icon={
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              }
            />
          ))}
      </ScrollView>

      <OmdbLookupSheet
        visible={lookupOpen}
        kind={draft.kind}
        onPick={applyMovie}
        onClose={() => setLookupOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  field: { gap: spacing.xs },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  rowWide: { flex: 2 },
  rowNarrow: { flex: 1 },
  posterRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' },
  posterPreview: {
    width: 64,
    aspectRatio: 2 / 3,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  posterImage: { width: '100%', height: '100%' },
  error: { ...typography.caption, color: colors.error },
  deleteRow: { flexDirection: 'row', gap: spacing.md },
  deleteBtn: { flex: 1, borderColor: colors.error },
});
