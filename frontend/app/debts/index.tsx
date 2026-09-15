import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/api";
import { colors, radius, spacing } from "@/src/theme";
import { formatCurrencyInt } from "@/src/format";
import { ProgressRing } from "@/src/components/ProgressRing";
import { Chip, IconTile } from "@/src/components/ui";
import { LockToggle, useLock } from "@/src/lock";

const TABS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "paid", label: "Pagados" },
  { id: "i_owe", label: "Yo debo" },
  { id: "they_owe", label: "Me deben" },
];

export default function Debts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { guard } = useLock();
  const [tab, setTab] = useState("all");
  const q = useQuery({ queryKey: ["debts"], queryFn: api.listDebts });
  const debts: any[] = q.data || [];

  const summary = useMemo(() => {
    const total = debts.length;
    const remaining = debts.reduce((s, d) => s + d.remaining_amount, 0);
    const original = debts.reduce((s, d) => s + d.original_amount, 0);
    const paid = debts.reduce((s, d) => s + d.total_paid, 0);
    return { total, remaining, original, paid };
  }, [debts]);

  const filtered = useMemo(() => {
    if (tab === "all") return debts;
    if (tab === "active") return debts.filter((d) => d.status === "active");
    if (tab === "paid") return debts.filter((d) => d.status === "paid");
    return debts.filter((d) => d.direction === tab);
  }, [debts, tab]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140 }}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.title}>Deudas y préstamos</Text>
          <LockToggle testID="lock-debts" compact />
          <Pressable testID="add-debt" onPress={() => router.push("/debts/new")} style={[styles.backBtn, { backgroundColor: colors.brandPrimary }]}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Summary */}
        <View style={[styles.summary, { marginHorizontal: spacing.lg }]}>
          <View style={styles.sumRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sumLabel}>Total deudas</Text>
              <Text style={styles.sumVal}>{summary.total}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sumLabel}>Pendiente</Text>
              <Text style={[styles.sumVal, { color: colors.expenseRed }]}>{formatCurrencyInt(summary.remaining)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.sumRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sumLabel}>Total original</Text>
              <Text style={styles.sumVal}>{formatCurrencyInt(summary.original)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sumLabel}>Pagado</Text>
              <Text style={[styles.sumVal, { color: colors.statsPurple }]}>{formatCurrencyInt(summary.paid)}</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {TABS.map((t) => (
            <Chip key={t.id} label={t.label} active={tab === t.id} onPress={() => setTab(t.id)} testID={`tab-${t.id}`} />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.lg, gap: 12 }}>
          {filtered.map((d) => {
            const p = d.original_amount > 0 ? d.total_paid / d.original_amount : 0;
            const pctInt = Math.round(p * 100);
            const isPaid = d.status === "paid";
            return (
              <Pressable
                key={d.id}
                testID={`debt-${d.id}`}
                onPress={guard(() => router.push(`/debts/${d.id}`))}
                style={[styles.card, { backgroundColor: d.color + "0D", borderColor: d.color + "22" }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconTile icon={d.icon} tint={d.color} size={44} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.debtName}>{d.name}</Text>
                    <View style={styles.subRow}>
                      <View style={[styles.statusPill, { backgroundColor: (isPaid ? colors.incomeGreen : d.color) + "22" }]}>
                        <View style={[styles.statusDot, { backgroundColor: isPaid ? colors.incomeGreen : d.color }]} />
                        <Text style={{ color: isPaid ? colors.incomeGreen : d.color, fontSize: 11, fontWeight: "600" }}>
                          {isPaid ? "Pagada" : "Activa"}
                        </Text>
                      </View>
                      <Text style={styles.debtSub} numberOfLines={1}>
                        {d.direction === "i_owe" ? "Yo debo" : "Me deben"}{d.person ? ` · ${d.person}` : ""}
                      </Text>
                    </View>
                  </View>
                  <ProgressRing size={54} stroke={6} progress={p} color={d.color} trackColor={d.color + "22"}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurface, letterSpacing: -0.3 }}>
                      {pctInt}%
                    </Text>
                  </ProgressRing>
                </View>

                <View style={styles.amountsRow}>
                  <View style={styles.amountCol}>
                    <View style={styles.amountHead}>
                      <View style={[styles.amountIcon, { backgroundColor: colors.expenseRed + "1F" }]}>
                        <Ionicons name="document-text-outline" size={11} color={colors.expenseRed} />
                      </View>
                      <Text style={styles.amountLabel}>Pendiente</Text>
                    </View>
                    <Text style={[styles.amountValue, { color: colors.expenseRed }]}>
                      {formatCurrencyInt(d.remaining_amount)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <View style={styles.amountHead}>
                      <View style={[styles.amountIcon, { backgroundColor: colors.statsPurple + "1F" }]}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.statsPurple} />
                      </View>
                      <Text style={styles.amountLabel}>Pagado</Text>
                    </View>
                    <Text style={[styles.amountValue, { color: colors.statsPurple }]}>
                      {formatCurrencyInt(d.total_paid)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <View style={styles.amountHead}>
                      <View style={[styles.amountIcon, { backgroundColor: colors.accountsBlue + "1F" }]}>
                        <Ionicons name="stats-chart" size={11} color={colors.accountsBlue} />
                      </View>
                      <Text style={styles.amountLabel}>Total</Text>
                    </View>
                    <Text style={[styles.amountValue, { color: colors.onSurface }]}>
                      {formatCurrencyInt(d.original_amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.trackRow}>
                  <View style={[styles.track, { backgroundColor: d.color + "1F" }]}>
                    <LinearGradient
                      colors={[d.color + "AA", d.color]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.trackFill, { width: `${Math.max(2, pctInt)}%` }]}
                    />
                  </View>
                  <Text style={styles.trackPct}>{pctInt}%</Text>
                </View>
              </Pressable>
            );
          })}
          {filtered.length === 0 && (
            <View style={{ alignItems: "center", padding: 40 }}>
              <Ionicons name="cash-outline" size={48} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 10 }}>Sin deudas en esta vista</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  title: { flex: 1, fontSize: 20, fontWeight: "700", color: colors.onSurface, letterSpacing: -0.3 },
  summary: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sumRow: { flexDirection: "row" },
  sumLabel: { color: colors.muted, fontSize: 12, fontWeight: "400" },
  sumVal: { fontSize: 20, fontWeight: "600", color: colors.onSurface, marginTop: 4, letterSpacing: -0.3 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  chipRow: { paddingHorizontal: spacing.lg, gap: 8, height: 56, alignItems: "center" },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  debtName: { fontSize: 15, fontWeight: "700", color: colors.onSurface, letterSpacing: -0.2 },
  debtSub: { fontSize: 11, color: colors.muted, fontWeight: "400", flexShrink: 1 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  amountsRow: { flexDirection: "row", marginTop: 16 },
  amountCol: { flex: 1 },
  amountHead: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  amountIcon: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  amountLabel: { fontSize: 11, color: colors.muted, fontWeight: "400" },
  amountValue: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },
  trackRow: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 10 },
  track: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: 6,
  },
  trackPct: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: -0.2,
    minWidth: 34,
    textAlign: "right",
  },
});
