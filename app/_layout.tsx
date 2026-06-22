import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { View, Text } from 'react-native';
import * as Font from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { initDatabase } from '../src/db/database';
import { seedSampleData } from '../src/db/seedData';

async function initializeApp(db: any) {
  await initDatabase(db);
  await seedSampleData(db);
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await Font.loadAsync(MaterialIcons.font);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <SQLiteProvider
      databaseName="vocab.db"
      onInit={initializeApp}
      useSuspense
    >
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="study"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="book/index"
          options={{
            title: '词书',
            headerBackTitle: '返回',
          }}
        />
        <Stack.Screen
          name="book/[id]"
          options={{
            title: '词书详情',
            headerBackTitle: '返回',
          }}
        />
      </Stack>
    </SQLiteProvider>
  );
}
