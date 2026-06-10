/**
 * BTTakvim tasarım sistemi tokenları — kaynak: docs/design-system/tokens/*.css
 * Kanonik palet: Osmanlı Çini (İznik). Diğer paletler "Daha → Tema"dan seçilir.
 */

export interface Palette {
  id: string;
  name: string;
  note: string;
  swatch: [string, string, string, string];
  paper: [string, string, string, string];
  ink: [string, string, string, string];
  red: [string, string, string, string]; // red0, red1, red2, redWash
  gold: [string, string, string, string];
  blue: [string, string, string]; // blue0, blue1, blueWash
  green: [string, string, string];
  rule: [string, string, string]; // rule, ruleStrong, ruleGold
}

export const PALETTES: Palette[] = [
  {
    id: 'osmanli', name: 'Osmanlı Çini', note: 'İznik · kobalt · bole · altın',
    swatch: ['#A3271D', '#1E3F8F', '#A97E22', '#1F6F54'],
    paper: ['#FCF8EF', '#F4ECD9', '#EADFC4', '#DCCDAC'],
    ink: ['#211C12', '#433A28', '#6B5E45', '#9A8C70'],
    red: ['#A3271D', '#C0392B', '#7E1C15', '#F1D8D2'],
    gold: ['#A97E22', '#CFAA57', '#E6CE8C', '#F0E4C4'],
    blue: ['#1E3F8F', '#3159B0', '#D8DFF1'],
    green: ['#1F6F54', '#2F8C6C', '#D5E6DE'],
    rule: ['rgba(33,28,18,0.14)', 'rgba(33,28,18,0.30)', 'rgba(169,126,34,0.48)'],
  },
  {
    id: 'hunkar', name: 'Hünkâr Sarayı', note: 'Kızıl · zümrüt · saray altını',
    swatch: ['#8E1F2B', '#1C5A43', '#A07623', '#173A4A'],
    paper: ['#F7F0DF', '#EFE5CD', '#E4D6B8', '#D5C3A0'],
    ink: ['#1E1810', '#3D3422', '#665741', '#94835F'],
    red: ['#8E1F2B', '#A82F3A', '#6E1620', '#EFD3D5'],
    gold: ['#A07623', '#C6A04F', '#DEC183', '#EEE0BC'],
    blue: ['#173A4A', '#27566A', '#D3E0E4'],
    green: ['#1C5A43', '#2C7659', '#D2E4DA'],
    rule: ['rgba(30,24,16,0.15)', 'rgba(30,24,16,0.32)', 'rgba(160,118,35,0.48)'],
  },
  {
    id: 'klasik', name: 'Klasik Maarif', note: 'Krem · kırmızı · pirinç',
    swatch: ['#9E1B1E', '#F7F1E2', '#A2762B', '#1C4A66'],
    paper: ['#FCFAF3', '#F7F1E2', '#EFE6D1', '#E4D6BB'],
    ink: ['#221B13', '#463A2B', '#6E5E4A', '#9B8B75'],
    red: ['#9E1B1E', '#BE2B26', '#7C1417', '#F3DAD5'],
    gold: ['#A2762B', '#C9A458', '#E0C684', '#EFE3C1'],
    blue: ['#1C4A66', '#2C6B90', '#DBE6EE'],
    green: ['#2E5C44', '#3C7857', '#DCE8DE'],
    rule: ['rgba(34,27,19,0.14)', 'rgba(34,27,19,0.30)', 'rgba(162,118,43,0.40)'],
  },
  {
    id: 'gul', name: 'Gül Bahçesi', note: 'Pudra · gül kurusu · sage',
    swatch: ['#9B2D45', '#F8E9E6', '#B08A3C', '#5B3A6E'],
    paper: ['#FDF6F4', '#F8E9E6', '#F0D9D6', '#E6C6C3'],
    ink: ['#2A1A1C', '#4E3033', '#79555A', '#A98890'],
    red: ['#9B2D45', '#B83E59', '#7A2236', '#F3D9DF'],
    gold: ['#B08A3C', '#D0AE66', '#E6CF96', '#F0E6CC'],
    blue: ['#5B3A6E', '#7A5490', '#E7DCEE'],
    green: ['#4F6B4A', '#6A8463', '#DEE7DA'],
    rule: ['rgba(42,26,28,0.13)', 'rgba(42,26,28,0.28)', 'rgba(176,138,60,0.40)'],
  },
  {
    id: 'ege', name: 'Ege Sahili', note: 'Fildişi · turkuaz · mercan',
    swatch: ['#0E7C86', '#EAF1F0', '#C58133', '#143A5E'],
    paper: ['#FBFCFB', '#EAF1F0', '#DBE7E6', '#C6D8D7'],
    ink: ['#14272B', '#2C474C', '#557076', '#88A3A7'],
    red: ['#0E7C86', '#16969F', '#0A5E66', '#D2EBED'],
    gold: ['#C58133', '#E0A85C', '#F0C98C', '#F3E6CF'],
    blue: ['#143A5E', '#245A85', '#D6E4EF'],
    green: ['#4A6B3F', '#648659', '#DCE6D6'],
    rule: ['rgba(20,39,43,0.13)', 'rgba(20,39,43,0.28)', 'rgba(197,129,51,0.38)'],
  },
  {
    id: 'zeytin', name: 'Zeytin & Bakır', note: 'Taş · terrakota · zeytin',
    swatch: ['#B0532A', '#F0E9D9', '#9C7A2E', '#2A5550'],
    paper: ['#FBF8F1', '#F0E9D9', '#E6DCC6', '#D8CBAE'],
    ink: ['#241F15', '#463F2C', '#6E6448', '#9C9070'],
    red: ['#B0532A', '#C9683C', '#8C3E1E', '#F1DBCC'],
    gold: ['#9C7A2E', '#C2A05A', '#DCC288', '#ECE2C4'],
    blue: ['#2A5550', '#3E726C', '#DCE7E4'],
    green: ['#3E5A2E', '#59763F', '#DEE6D2'],
    rule: ['rgba(36,31,21,0.14)', 'rgba(36,31,21,0.30)', 'rgba(156,122,46,0.40)'],
  },
  {
    id: 'lacivert', name: 'Lacivert Mührü', note: 'İndigo vurgu · editoryal',
    swatch: ['#2A3D7A', '#F1EEE4', '#A07C2E', '#334155'],
    paper: ['#FCFBF7', '#F1EEE4', '#E7E2D3', '#D8D1BC'],
    ink: ['#1A1E2A', '#333A4E', '#5C6478', '#8E96AA'],
    red: ['#2A3D7A', '#3A4F94', '#1E2C5C', '#DCE0F0'],
    gold: ['#A07C2E', '#C7A45C', '#E0C98C', '#EEE5C8'],
    blue: ['#334155', '#475569', '#DEE3EA'],
    green: ['#2E5C54', '#427268', '#DBE7E3'],
    rule: ['rgba(26,30,42,0.13)', 'rgba(26,30,42,0.28)', 'rgba(160,124,46,0.40)'],
  },
  {
    id: 'antrasit', name: 'Antrasit', note: 'Modern · sıcak gri · tek vurgu',
    swatch: ['#C0392B', '#F2F1ED', '#8C7A4A', '#2C3E50'],
    paper: ['#FCFCFB', '#F2F1ED', '#E7E6E1', '#D6D5CE'],
    ink: ['#1C1C1A', '#3A3A37', '#62625E', '#93938E'],
    red: ['#C0392B', '#D6493B', '#94281D', '#F3DAD6'],
    gold: ['#8C7A4A', '#B3A375', '#D2C6A0', '#EAE5D4'],
    blue: ['#2C3E50', '#41566B', '#DEE3E8'],
    green: ['#3E6B50', '#588568', '#DCE8DF'],
    rule: ['rgba(28,28,26,0.12)', 'rgba(28,28,26,0.26)', 'rgba(140,122,74,0.38)'],
  },
];

export interface ThemeColors {
  paper0: string; paper1: string; paper2: string; paper3: string;
  ink0: string; ink1: string; ink2: string; ink3: string;
  red0: string; red1: string; red2: string; redWash: string;
  gold0: string; gold1: string; gold2: string; goldWash: string;
  blue0: string; blue1: string; blueWash: string;
  green0: string; green1: string; greenWash: string;
  rule: string; ruleStrong: string; ruleGold: string;
  // semantik
  surfaceApp: string; surfaceCard: string; surfaceSunken: string; surfaceInk: string;
  textOnDark: string; textOnRed: string;
}

export function buildColors(p: Palette): ThemeColors {
  return {
    paper0: p.paper[0], paper1: p.paper[1], paper2: p.paper[2], paper3: p.paper[3],
    ink0: p.ink[0], ink1: p.ink[1], ink2: p.ink[2], ink3: p.ink[3],
    red0: p.red[0], red1: p.red[1], red2: p.red[2], redWash: p.red[3],
    gold0: p.gold[0], gold1: p.gold[1], gold2: p.gold[2], goldWash: p.gold[3],
    blue0: p.blue[0], blue1: p.blue[1], blueWash: p.blue[2],
    green0: p.green[0], green1: p.green[1], greenWash: p.green[2],
    rule: p.rule[0], ruleStrong: p.rule[1], ruleGold: p.rule[2],
    surfaceApp: p.paper[1], surfaceCard: p.paper[0], surfaceSunken: p.paper[2], surfaceInk: p.ink[0],
    textOnDark: p.paper[0], textOnRed: '#FBEDE9',
  };
}

/** Tipografi — Bitter (rakam/display), Lora (gövde), Hanken Grotesk (UI), Amiri (Osmanlı başlık) */
export const fonts = {
  display: 'Bitter_700Bold',
  displayX: 'Bitter_800ExtraBold',
  displayBlack: 'Bitter_900Black',
  serif: 'Lora_400Regular',
  serifItalic: 'Lora_400Regular_Italic',
  serifMedium: 'Lora_500Medium',
  serifSemi: 'Lora_600SemiBold',
  serifBold: 'Lora_700Bold',
  serifBoldItalic: 'Lora_700Bold_Italic',
  sans: 'HankenGrotesk_400Regular',
  sansMedium: 'HankenGrotesk_500Medium',
  sansSemi: 'HankenGrotesk_600SemiBold',
  sansBold: 'HankenGrotesk_700Bold',
  ottoman: 'Amiri_700Bold',
};

export const radius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

import React, { createContext, useContext } from 'react';

export interface ThemePrefs {
  paletteId: string;
  frame: 'sade' | 'cizgi' | 'altin';
  dome: boolean;
  medallion: boolean;
}

export const DEFAULT_PREFS: ThemePrefs = {
  paletteId: 'osmanli',
  frame: 'altin',
  dome: false,
  medallion: false,
};

export interface ThemeValue {
  colors: ThemeColors;
  palette: Palette;
  prefs: ThemePrefs;
  setPrefs: (p: Partial<ThemePrefs>) => void;
}

export const ThemeContext = createContext<ThemeValue>({
  colors: buildColors(PALETTES[0]),
  palette: PALETTES[0],
  prefs: DEFAULT_PREFS,
  setPrefs: () => {},
});

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
