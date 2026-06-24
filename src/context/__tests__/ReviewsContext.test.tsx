import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthContext';
import { ReviewsProvider, useReviews } from '../ReviewsContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ReviewsProvider>{children}</ReviewsProvider>
  </AuthProvider>
);

// Mount both contexts and sign a user in, since reviews require a logged-in user.
async function mountWithUser() {
  const utils = renderHook(() => ({ auth: useAuth(), reviews: useReviews() }), {
    wrapper,
  });
  await waitFor(() =>
    expect(utils.result.current.auth.initializing).toBe(false),
  );
  await act(async () => {
    await utils.result.current.auth.signup('Ali', 'ali@example.com', 'secret');
  });
  return utils;
}

const toyStory = {
  movieId: 'tt1',
  movieTitle: 'Toy Story',
  rating: 5,
  text: 'Great',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ReviewsContext', () => {
  it('saves a review for a movie', async () => {
    const { result } = await mountWithUser();
    await act(async () => {
      await result.current.reviews.saveReview(toyStory);
    });

    const reviews = result.current.reviews.getMovieReviews('tt1');
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({
      rating: 5,
      text: 'Great',
      userName: 'Ali',
    });
  });

  it('updates the existing review instead of creating a duplicate', async () => {
    const { result } = await mountWithUser();
    await act(async () => {
      await result.current.reviews.saveReview(toyStory);
    });
    await act(async () => {
      await result.current.reviews.saveReview({
        ...toyStory,
        rating: 3,
        text: 'Changed my mind',
      });
    });

    expect(result.current.reviews.getMovieReviews('tt1')).toHaveLength(1);
    expect(result.current.reviews.getMyReview('tt1')?.rating).toBe(3);
  });

  it('removes a review', async () => {
    const { result } = await mountWithUser();
    await act(async () => {
      await result.current.reviews.saveReview(toyStory);
    });
    const id = result.current.reviews.getMyReview('tt1')!.id;

    await act(async () => {
      await result.current.reviews.removeReview(id);
    });

    expect(result.current.reviews.getMovieReviews('tt1')).toHaveLength(0);
  });
});
