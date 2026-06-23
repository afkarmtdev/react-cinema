import React from 'react';

type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>;

/**
 * Nests a list of context providers so the app root stays flat instead of a
 * deep pyramid. The first provider in the array is the outermost; order still
 * matters (e.g. Auth must come before Reviews, which reads the auth state).
 */
export function MultiProvider({
  providers,
  children,
}: {
  providers: ProviderComponent[];
  children: React.ReactNode;
}) {
  return (
    <>
      {providers.reduceRight(
        (acc, Provider) => (
          <Provider>{acc}</Provider>
        ),
        children,
      )}
    </>
  );
}
