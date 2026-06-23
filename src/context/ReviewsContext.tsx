import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { storage, StorageKeys } from '../lib/storage';
import { useAuth } from './AuthContext';

export interface Review {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  userId: string;
  userName: string;
  rating: number; // 1..5
  text: string;
  createdAt: number;
}

export interface NewReview {
  movieId: number;
  movieTitle: string;
  moviePoster?: string;
  rating: number;
  text: string;
}

interface ReviewsContextValue {
  /** Reviews authored by every user, for a given movie (newest first). */
  getMovieReviews: (movieId: number) => Review[];
  /** The current user's own review for a movie, if any. */
  getMyReview: (movieId: number) => Review | undefined;
  /** All reviews authored by the current user (newest first). */
  myReviews: Review[];
  /** Create or update the current user's review for a movie. */
  saveReview: (input: NewReview) => Promise<void>;
  removeReview: (reviewId: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextValue | undefined>(
  undefined,
);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await storage.get<Review[]>(StorageKeys.reviews);
      if (active && stored) setReviews(stored);
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (next: Review[]) => {
    setReviews(next);
    await storage.set(StorageKeys.reviews, next);
  }, []);

  const getMovieReviews = useCallback(
    (movieId: number) =>
      reviews
        .filter((r) => r.movieId === movieId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [reviews],
  );

  const getMyReview = useCallback(
    (movieId: number) =>
      reviews.find((r) => r.movieId === movieId && r.userId === user?.id),
    [reviews, user],
  );

  const myReviews = useMemo(
    () =>
      reviews
        .filter((r) => r.userId === user?.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [reviews, user],
  );

  const saveReview = useCallback(
    async (input: NewReview) => {
      if (!user) throw new Error('You must be signed in to review.');

      const existing = reviews.find(
        (r) => r.movieId === input.movieId && r.userId === user.id,
      );

      let next: Review[];
      if (existing) {
        next = reviews.map((r) =>
          r.id === existing.id ? { ...r, ...input, createdAt: Date.now() } : r,
        );
      } else {
        const review: Review = {
          id: `${Date.now()}-${user.id}`,
          userId: user.id,
          userName: user.name,
          createdAt: Date.now(),
          ...input,
        };
        next = [review, ...reviews];
      }
      await persist(next);
    },
    [reviews, user, persist],
  );

  const removeReview = useCallback(
    async (reviewId: string) => {
      await persist(reviews.filter((r) => r.id !== reviewId));
    },
    [reviews, persist],
  );

  const value = useMemo(
    () => ({
      getMovieReviews,
      getMyReview,
      myReviews,
      saveReview,
      removeReview,
    }),
    [getMovieReviews, getMyReview, myReviews, saveReview, removeReview],
  );

  return (
    <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
  );
}

export function useReviews(): ReviewsContextValue {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within a ReviewsProvider');
  return ctx;
}
