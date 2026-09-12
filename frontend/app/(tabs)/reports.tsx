import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PieChart, BarChart } from "react-native-gifted-charts";
import { api } from "@/src/api";
import { colors, radius, spacing } from "@/src/theme";
import { formatCurrency } from "@/src/format";
import { Chip } from "@/src/components/ui";

const RANGES = [
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
  { id: "3m", label: "3m", days: 90 },
  { id: "6m", label: "6m", days: 180 },
  { id: "1y", label: "1a", days: 365 },
  { id: "all", label: "Todo", days: 99999 },
];

export default function Reports() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState("30d");

  const txQ = useQuery({ queryKey: ["transactions"], queryFn: api.listTransactions });
  const catQ = useQuery({ queryKey: ["categories"], queryFn: api.listCategories });

  const days = RANGES.find((r) => r.id === range)!.days;
  const now = Date.now();
  const cutoff = now - days * 86400000;
  const cats: any[] = catQ.data || [];
  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));

  const filtered = (txQ.data || []).filter((t: any) => new Date(t.date).getTime() >= cutoff);
  const totalIncome = filtered.filter((t: any) => t.type === "income").reduce((a: number, t: any) => a + t.amount, 0);
  const totalExpense = filtered.filter((t: any) => t.type === "expense" || t.type === "debt_payment").reduce((a: number, t: any) => a + t.amount, 0);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((t: any) => {
      if (t.type === "expense" && t.category_id) {
        map[t.category_id] = (map[t.category_id] || 0) + t.amount;
      }
    });
    return Object.entries(map)
      .map(([id, amt]) => ({ id, amount: amt, cat: catById[id] }))
      .filter((x) => x.cat)
      .sort((a, b) => b.amount - a.amount);
  }, [filtered, catById]);

  const pieData = byCategory.slice(0, 6).map((x) => ({
    value: x.amount,
    color: x.cat.color,
    text: "",
  }));

  const barData = [
    { value: totalIncome, label: "Ingresos", frontColor: colors.incomeGreen, topLabelComponent: () => null },
    { value: totalExpense, label: "Gastos", frontColor: colors.expenseRed, topLabelComponent: () => null },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 140 }}
    >
      <Text style={styles.title}>Informes</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {RANGES.map((r) => (
          <Chip key={r.id} label={r.label} active={range === r.id} onPress={() => setRange(r.id)} testID={`range-${r.id}`} />
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingresos vs Gastos</Text>
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <BarChart
            data={barData}
            barWidth={54}
            spacing={40}
            hideRules
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.onSurface, fontSize: 12 }}
            noOfSections={4}
            height={180}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Ingresos</Text>
            <Text style={{ color: colors.incomeGreen, fontSize: 18, fontWeight: "800" }}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Gastos</Text>
            <Text style={{ color: colors.expenseRed, fontSize: 18, fontWeight: "800" }}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gastos por categoría</Text>
        {pieData.length > 0 ? (
          <>
            <View style={{ alignItems: "center", marginTop: 12 }}>
              <PieChart
                data={pieData}
                radius={90}
                innerRadius={55}
                donut
                centerLabelComponent={() => (
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>Total</Text>
                    <Text style={{ color: colors.onSurface, fontWeight: "800" }}>
                      {formatCurrency(totalExpense)}
                    </Text>
                  </View>
                )}
              />
            </View>
            <View style={{ marginTop: 16 }}>
              {byCategory.slice(0, 6).map((x) => (
                <View key={x.id} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: x.cat.color }]} />
                  <Text style={{ flex: 1, color: colors.onSurface, fontWeight: "600" }}>{x.cat.name}</Text>
                  <Text style={{ color: colors.muted, fontWeight: "700" }}>{formatCurrency(x.amount)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={{ color: colors.muted, textAlign: "center", padding: 20 }}>
            Sin datos para este período
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.onSurface, paddingHorizontal: spacing.lg },
  chipRow: { paddingHorizontal: spacing.lg, gap: 8, marginTop: 12, height: 56, alignItems: "center" },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: colors.onSurface },
  legendRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
});
