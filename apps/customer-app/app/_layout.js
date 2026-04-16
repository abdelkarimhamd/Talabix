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
          headerTintColor: '#fff8ef',
          contentStyle: {
            backgroundColor: '#f6efe6',
          },
        }}
      />
    </AppProviders>
  );
}
