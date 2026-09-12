import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/src/theme";
import { IconTile } from "@/src/components/ui";

type Item = { icon: string; label: string; route: string; color: string };

const MONEY: Item[] = [
  { icon: "card-outline", label: "Cuentas", route: "/accounts", color: colors.accountsBlue },
  { icon: "pricetags-outline", label: "Categorías", route: "/categories", color: colors.brandSecondary },
  { icon: "pie-chart-outline", label: "Presupuestos", route: "/budgets", color: colors.expenseRed },
  { icon: "flag-outline", label: "Metas de ahorro", route: "/goals", color: colors.savingsTurquoise },
  { icon: "cash-outline", label: "Deudas y préstamos", route: "/debts", color: colors.loansYellow },
];

const APP: Item[] = [
  { icon: "stats-chart-outline", label: "Informes", route: "/(tabs)/reports", color: colors.statsPurple },
  { icon: "settings-outline", label: "Ajustes", route: "/settings", color: colors.muted },
];

function Row({ item }: { item: Item }) {
  const router = useRouter();
  return (
    <Pressable
      testID={`more-${item.label}`}
      onPress={() => router.push(item.route as any)}
      style={styles.row}
    >
      <IconTile icon={item.icon} tint={item.color} size={40} />
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

export default function More() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 140, paddingHorizontal: spacing.lg }}
    >
      <Text style={styles.title}>Más</Text>
      <Text style={styles.section}>Dinero</Text>
      <View style={styles.card}>
        {MONEY.map((it, i) => (
          <View key={it.label}>
            <Row item={it} />
            {i < MONEY.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <Text style={styles.section}>Aplicación</Text>
      <View style={styles.card}>
        {APP.map((it, i) => (
          <View key={it.label}>
            <Row item={it} />
            {i < APP.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.onSurface, marginBottom: 8 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: 12,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.onSurface },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 62 },
});
