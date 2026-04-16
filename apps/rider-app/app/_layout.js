import { Stack } from 'expo-router';
import { AppProviders } from '../src/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#102033',
          },
          headerTintColor: '#effff7',
          contentStyle: {
            backgroundColor: '#eff6f2',
          },
        }}
      />
    </AppProviders>
  );
}
