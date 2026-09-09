import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ItemKind } from '../types/library';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type LibraryStackParamList = {
  Library: undefined;
  ItemDetail: { itemId: string; title: string };
  /** Without an itemId the form adds a new entry (of the given kind). */
  ItemForm: { itemId?: string; kind?: ItemKind };
};

export type TabParamList = {
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  DiaryTab: undefined;
  ProfileTab: undefined;
};
