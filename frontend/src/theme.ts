// MoneyFlow design tokens. Supports light / dark / system mode.
//
// The theme is resolved SYNCHRONOUSLY at module load so every `StyleSheet.create`
// that reads `colors.xxx` at the top of a file gets the correct palette without
// having to refactor screens. When the user changes the theme in Settings we
// persist the preference and reload the JS bundle so all styles rebuild.
import { useMemo } from "react";
import { Appearance, Platform, StyleSheet, useColorScheme } from "react-native";
import { storage } from "@/src/utils/storage";

export type ColorScheme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

const light = {
  // Surfaces
  surface: "#FFF8F2",
  onSurface: "#27221F",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#27221F",
  surfaceTertiary: "#F2EBE5",
  onSurfaceTertiary: "#27221F",
  surfaceInverse: "#27221F",
  onSurfaceInverse: "#FFF8F2",
  muted: "#8E8883",

  // Brand
  brand: "#FF654A",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF654A",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF8A3D",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFD3C9",
  onBrandTertiary: "#FF654A",

  // Status
  success: "#2FA47C",
  onSuccess: "#FFFFFF",
  warning: "#F5B83B",
  onWarning: "#FFFFFF",
  error: "#D95345",
  onError: "#FFFFFF",
  info: "#4C83EA",
  onInfo: "#FFFFFF",

  // Lines
  border: "#E8DFD8",
  borderStrong: "#D1C6BE",
  divider: "#E8DFD8",

  // Module accents
  accountsBlue: "#4C83EA",
  statsPurple: "#8F5BE8",
  savingsTurquoise: "#29C4A9",
  loansYellow: "#F5B83B",
  incomeGreen: "#2FA47C",
  expenseRed: "#D95345",
};

const dark: typeof light = {
  // Surfaces — warm near-black background, slightly lighter cards
  surface: "#141210",
  onSurface: "#F5F1EC",
  surfaceSecondary: "#1E1B18",
  onSurfaceSecondary: "#F5F1EC",
  surfaceTertiary: "#2A2622",
  onSurfaceTertiary: "#F5F1EC",
  surfaceInverse: "#F5F1EC",
  onSurfaceInverse: "#141210",
  muted: "#9E9791",

  // Brand — slightly brighter coral for contrast on dark
  brand: "#FF7A63",
  onBrand: "#1A1512",
  brandPrimary: "#FF7A63",
  onBrandPrimary: "#1A1512",
  brandSecondary: "#FF9C5A",
  onBrandSecondary: "#1A1512",
  brandTertiary: "#3E2620",
  onBrandTertiary: "#FF9E8A",

  // Status — same hues, brightened for dark bg
  success: "#37C08D",
  onSuccess: "#0F1613",
  warning: "#F5B83B",
  onWarning: "#1A1512",
  error: "#EB6D5F",
  onError: "#1A1512",
  info: "#6D9BFF",
  onInfo: "#0E1424",

  // Lines
  border: "#2C2723",
  borderStrong: "#3B3630",
  divider: "#2A2622",

  // Module accents — same hues, adjusted for legibility on dark
  accountsBlue: "#6D9BFF",
  statsPurple: "#A57DFF",
  savingsTurquoise: "#3ED4B9",
  loansYellow: "#F5C556",
  incomeGreen: "#37C08D",
  expenseRed: "#EB6D5F",
};

export type ThemeColors = typeof light;
export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

// --- Synchronous initial-scheme resolution ---
const THEME_KEY = "theme-mode";

function readModeSync(): ThemeMode {
  try {
    if (Platform.OS === "web" && typeof (globalThis as any).localStorage !== "undefined") {
      const v = (globalThis as any).localStorage.getItem(THEME_KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
    }
  } catch {}
  return "system";
}

function resolveScheme(mode: ThemeMode): ColorScheme {
  if (mode === "light" || mode === "dark") return mode;
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

const initialMode = readModeSync();
const initialScheme = resolveScheme(initialMode);

// Mutable singleton: styles read these keys once at StyleSheet.create time so
// we replace the object contents (not the reference) with the chosen palette.
const _colors: ThemeColors = { ...(initialScheme === "dark" ? dark : light) };
export const colors: ThemeColors = _colors;
export const defaultScheme: ColorScheme = initialScheme;

export function getCurrentScheme(): ColorScheme {
  return initialScheme;
}

export function getCurrentMode(): ThemeMode {
  return initialMode;
}

/**
 * Persist the user's theme choice and reload the JS bundle so every
 * `StyleSheet.create` re-runs with the new palette. No screen refactor needed.
 */
export async function setThemeMode(mode: ThemeMode) {
  try {
    await storage.setItem(THEME_KEY, mode);
    if (Platform.OS === "web") {
      try {
        if (typeof (globalThis as any).localStorage !== "undefined") {
          (globalThis as any).localStorage.setItem(THEME_KEY, mode);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).location?.reload?.();
      } catch {}
    } else {
      Appearance.setColorScheme?.(mode === "system" ? null : mode);
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const expo = require("expo");
        if (typeof expo.reloadAppAsync === "function") {
          await expo.reloadAppAsync();
        }
      } catch {}
    }
  } catch (e) {
    console.warn("setThemeMode error", e);
  }
}

/**
 * Called from _layout on startup — if the async-persisted mode differs from
 * the mode we synchronously resolved at boot (e.g. cold start on native where
 * we could only read Appearance), reload once so styles rebuild correctly.
 */
export async function reconcileThemeOnBoot() {
  try {
    const saved = await storage.getItem<string>(THEME_KEY, "");
    if (!saved || saved === initialMode) return;
    const desired = resolveScheme(saved as ThemeMode);
    if (desired === initialScheme) return; // No visual change needed.
    if (Platform.OS === "web") {
      try {
        if (typeof (globalThis as any).localStorage !== "undefined") {
          (globalThis as any).localStorage.setItem(THEME_KEY, saved);
        }
        (globalThis as any).location?.reload?.();
      } catch {}
    } else {
      Appearance.setColorScheme?.(saved === "system" ? null : (saved as ColorScheme));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const expo = require("expo");
      if (typeof expo.reloadAppAsync === "function") await expo.reloadAppAsync();
    }
  } catch {}
}

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 8, md: 16, lg: 24, cardLg: 28, pill: 999 };
