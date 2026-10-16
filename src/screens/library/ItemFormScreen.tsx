import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sourcesFor } from '../../api/lookup';
import { DateField } from '../../components/DateField';
import { KindPicker } from '../../components/KindPicker';
import { LookupInline } from '../../components/LookupInline';
import { MoodPicker } from '../../components/MoodPicker';
import { StatusPicker } from '../../components/StatusPicker';
import { TagInput } from '../../components/TagInput';
import { ScoreInput } from '../../components/ScoreInput';
import { Button } from '../../components/ui/Button';
import { KeyboardScrollView } from '../../components/ui/KeyboardScrollView';
import { TextField } from '../../components/ui/TextField';
import { useLanguage } from '../../context/LanguageContext';
import { useLibrary } from '../../context/LibraryContext';
import { KIND_ICON, creatorKey, repeatKey } from '../../lib/labels';
import { newItemId } from '../../lib/libraryStore';
import { startOfDay } from '../../lib/summary';
import { uniqueTags } from '../../lib/tags';
import { radius, spacing, typography, type ThemeColors } from '../../theme';
import {
  isReadKind,
  type ItemKind,
  type ItemStatus,
  type LibraryItem,
  type Mood,
} from '../../types/library';
import type { LookupResult } from '../../types/lookup';
import type { EntryStackParamList } from '../../navigation/types';
import { useThemedStyles, useTheme } from '../../context/ThemeContext';

type Props = NativeStackScreenProps<EntryStackParamList, 'ItemForm'>;

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
  moods: Mood[];
  startedAt?: number;
  finishedAt?: number;
  /** Rewatch or reread dates, each with a key that stays put on removal. */
  repeats: { key: string; at: number }[];
  /** Minutes for a film or series. */
  runtime: string;
  /** Page count for a book. */
  pages: string;
}

const digits = (v: string, max: number) =>
  v.replace(/[^0-9]/g, '').slice(0, max);

const toCount = (v: string): number | undefined => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
};

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
    moods: item?.moods ?? [],
    startedAt: item?.startedAt,
    finishedAt: item?.finishedAt,
    repeats: (item?.repeats ?? []).map((at) => ({ key: newItemId(), at })),
    runtime: item?.runtime ? String(item.runtime) : '',
    pages: item?.pages ? String(item.pages) : '',
  };
}

export function ItemFormScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
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

  // Picking "done" proposes today as the finish date; the field below lets
  // the user move it back when they are catching up on old reads or watches.
  const setStatus = (status: ItemStatus) =>
    setDraft((d) => ({
      ...d,
      status,
      finishedAt:
        status === 'done'
          ? (d.finishedAt ?? startOfDay(new Date()))
          : undefined,
    }));

  // A cleared date takes its rewatch or reread off the list.
  const setRepeat = (key: string, at: number | undefined) =>
    setDraft((d) => ({
      ...d,
      repeats:
        at === undefined
          ? d.repeats.filter((r) => r.key !== key)
          : d.repeats.map((r) => (r.key === key ? { ...r, at } : r)),
    }));

  const addRepeat = () =>
    setDraft((d) => ({
      ...d,
      repeats: [...d.repeats, { key: newItemId(), at: startOfDay(new Date()) }],
    }));

  const isBook = isReadKind(draft.kind);
  const canLookup = sourcesFor(draft.kind).length > 0;

  const applyLookup = (result: LookupResult) => {
    setDraft((d) => ({
      ...d,
      title: result.title,
      year: result.year ? String(result.year) : d.year,
      creator: result.creator ?? d.creator,
      poster: result.poster ?? d.poster,
      description: result.description ?? d.description,
      tags: uniqueTags([
        ...d.tags,
        ...(result.tags ?? []).map((g) => g.toLowerCase()),
      ]),
      runtime: result.runtime ? String(result.runtime) : d.runtime,
      pages: result.pages ? String(result.pages) : d.pages,
    }));
    setPosterFailed(false);
    setLookupOpen(false);
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setError(t('errTitleRequired'));
      return;
    }
    const startedAt = draft.status === 'want' ? undefined : draft.startedAt;
    const finishedAt = draft.status === 'done' ? draft.finishedAt : undefined;
    if (startedAt && finishedAt && finishedAt < startedAt) {
      setError(t('errDatesOrder'));
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
      moods: draft.moods,
      startedAt,
      finishedAt,
      repeats:
        draft.status === 'done' ? draft.repeats.map((r) => r.at) : undefined,
      // Only the length that fits the kind is kept.
      runtime: isBook ? undefined : toCount(draft.runtime),
      pages: isBook ? toCount(draft.pages) : undefined,
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
    <View style={styles.flex}>
      <KeyboardScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <Field label={t('kind')}>
          <KindPicker
            value={draft.kind}
            onChange={(kind) => set('kind', kind)}
          />
        </Field>

        {canLookup && lookupOpen && (
          <LookupInline
            kind={draft.kind}
            onPick={applyLookup}
            onClose={() => setLookupOpen(false)}
          />
        )}
        {canLookup && !lookupOpen && (
          <Button
            label={t('lookupButton')}
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

        <TextField
          label={t(creatorKey(draft.kind))}
          value={draft.creator}
          onChangeText={(v) => set('creator', v)}
          placeholder={t('creatorHint')}
          autoCapitalize="words"
        />

        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label={t('year')}
              value={draft.year}
              onChangeText={(v) => set('year', digits(v, 4))}
              placeholder={t('yearHint')}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.flex}>
            {isBook ? (
              <TextField
                label={t('pagesLabel')}
                value={draft.pages}
                onChangeText={(v) => set('pages', digits(v, 5))}
                placeholder={t('pagesHint')}
                keyboardType="number-pad"
              />
            ) : (
              <TextField
                label={t('runtimeLabel')}
                value={draft.runtime}
                onChangeText={(v) => set('runtime', digits(v, 6))}
                placeholder={t(
                  draft.kind === 'series' ? 'runtimeHintSeries' : 'runtimeHint',
                )}
                keyboardType="number-pad"
              />
            )}
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
            onChange={setStatus}
          />
        </Field>

        {draft.status !== 'want' && (
          <DateField
            label={t('startedDate')}
            value={draft.startedAt}
            onChange={(v) => set('startedAt', v)}
          />
        )}

        {draft.status === 'done' && (
          <>
            <DateField
              label={t('finishedDate')}
              value={draft.finishedAt}
              onChange={(v) => set('finishedAt', v)}
            />
            {draft.repeats.map((r, i) => (
              <DateField
                key={r.key}
                label={t(repeatKey(draft.kind, 'N'), { n: i + 1 })}
                value={r.at}
                onChange={(v) => setRepeat(r.key, v)}
              />
            ))}
            <Button
              label={t(repeatKey(draft.kind, 'Log'))}
              variant="outline"
              onPress={addRepeat}
              icon={<Ionicons name="repeat" size={18} color={colors.primary} />}
            />
          </>
        )}

        <Field label={t('yourRating')}>
          <ScoreInput value={draft.rating} onChange={(v) => set('rating', v)} />
        </Field>

        <Field label={t('moods')}>
          <MoodPicker value={draft.moods} onChange={(v) => set('moods', v)} />
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
      </KeyboardScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: spacing.lg, gap: spacing.lg },
    field: { gap: spacing.xs },
    fieldLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    row: { flexDirection: 'row', gap: spacing.md },
    posterRow: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'flex-end',
    },
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
