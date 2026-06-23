import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoviesListScreen } from '../screens/movies/MoviesListScreen';
import { MovieDetailScreen } from '../screens/movies/MovieDetailScreen';
import { colors } from '../theme';
import type { MoviesStackParamList } from './types';

const Stack = createNativeStackNavigator<MoviesStackParamList>();

export function MoviesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="MoviesList"
        component={MoviesListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MovieDetail"
        component={MovieDetailScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
