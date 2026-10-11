import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ItemKind } from '../types/library';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

/**
 * The entry screens. Every tab's stack carries them, so an entry opens in
 * the tab it was tapped in and going back returns there.
 */
export type EntryStackParamList = {
  ItemDetail: { itemId: string; title: string };
  /** Without an itemId the form adds a new entry (of the given kind). */
  ItemForm: { itemId?: string; kind?: ItemKind };
};

export type LibraryStackParamList = {
  Library: undefined;
} & EntryStackParamList;
export type DiaryStackParamList = { Diary: undefined } & EntryStackParamList;
export type ProfileStackParamList = {
  Profile: undefined;
} & EntryStackParamList;

export type TabParamList = {
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  DiaryTab: NavigatorScreenParams<DiaryStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
