// MoneyFlow design tokens.
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

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

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };
export const colors = light;

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}
setColorScheme?.(themes.dark ? null : defaultScheme);

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
