import {
  Amiri_700Bold,
} from '@expo-google-fonts/amiri';
import {
  Bitter_700Bold,
  Bitter_800ExtraBold,
  Bitter_900Black,
} from '@expo-google-fonts/bitter';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_700Bold_Italic,
} from '@expo-google-fonts/lora';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  CalendarDots,
  ChatsCircle,
  Compass,
  DotsThreeCircle,
  Mosque,
} from 'phosphor-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { AppStateProvider } from '@/lib/app-state';
import {
  buildColors,
  DEFAULT_PREFS,
  fonts,
  PALETTES,
  ThemeContext,
  ThemePrefs,
} from '@/lib/theme';

// react-native-svg'nin web'deki dokunma uyarıları (yalnızca dev) — işlevi etkilemiyor.
LogBox.ignoreLogs([
  /Unknown event handler property/,
  /TouchableMixin is deprecated/,
]);

const PREFS_KEY = 'bttakvim:theme-prefs';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Bitter_700Bold,
    Bitter_800ExtraBold,
    Bitter_900Black,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_700Bold_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    Amiri_700Bold,
  });

  const [prefs, setPrefsState] = useState<ThemePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) {
        try {
          setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  const themeValue = useMemo(() => {
    const palette = PALETTES.find((p) => p.id === prefs.paletteId) ?? PALETTES[0];
    return {
      colors: buildColors(palette),
      palette,
      prefs,
      setPrefs: (p: Partial<ThemePrefs>) => {
        setPrefsState((prev) => {
          const next = { ...prev, ...p };
          AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
          return next;
        });
      },
    };
  }, [prefs]);

  const c = themeValue.colors;

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4ECD9' }}>
        <ActivityIndicator color="#A3271D" size="large" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      <AppStateProvider>
        <StatusBar style="dark" />
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: c.surfaceApp },
            tabBarStyle: {
              backgroundColor: c.surfaceCard,
              borderTopColor: c.rule,
              borderTopWidth: 1,
            },
            tabBarActiveTintColor: c.red0,
            tabBarInactiveTintColor: c.ink3,
            tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: 10.5 },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Takvim',
              tabBarIcon: ({ color, focused }) => (
                <CalendarDots size={23} color={String(color)} weight={focused ? 'fill' : 'regular'} />
              ),
            }}
          />
          <Tabs.Screen
            name="blog"
            options={{
              title: 'Keşfet',
              tabBarIcon: ({ color, focused }) => (
                <Compass size={23} color={String(color)} weight={focused ? 'fill' : 'regular'} />
              ),
            }}
          />
          <Tabs.Screen
            name="forum"
            options={{
              title: 'Forum',
              tabBarIcon: ({ color, focused }) => (
                <ChatsCircle size={23} color={String(color)} weight={focused ? 'fill' : 'regular'} />
              ),
            }}
          />
          <Tabs.Screen
            name="vakitler"
            options={{
              title: 'Vakitler',
              tabBarIcon: ({ color, focused }) => (
                <Mosque size={23} color={String(color)} weight={focused ? 'fill' : 'regular'} />
              ),
            }}
          />
          <Tabs.Screen
            name="daha"
            options={{
              title: 'Daha',
              tabBarIcon: ({ color, focused }) => (
                <DotsThreeCircle size={23} color={String(color)} weight={focused ? 'fill' : 'regular'} />
              ),
            }}
          />
        </Tabs>
      </AppStateProvider>
    </ThemeContext.Provider>
  );
}
