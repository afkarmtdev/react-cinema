import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MoviesStackParamList = {
  MoviesList: undefined;
  MovieDetail: { movieId: number; title: string; poster?: string };
};

export type TabParamList = {
  MoviesTab: NavigatorScreenParams<MoviesStackParamList>;
  ReviewsTab: undefined;
  ProfileTab: undefined;
};
