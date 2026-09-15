import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/api";
import { colors, radius, spacing } from "@/src/theme";
import { formatCurrencyInt } from "@/src/format";
import { ProgressBar } from "@/src/components/ProgressBar";
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
            const isPaid = d.status === "paid";
            return (
              <Pressable
                key={d.id}
                testID={`debt-${d.id}`}
                onPress={guard(() => router.push(`/debts/${d.id}`))}
                style={styles.card}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconTile icon={d.icon} tint={d.color} size={44} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.debtName}>{d.name}</Text>
                    <Text style={styles.debtSub}>
                      {d.direction === "i_owe" ? "Yo debo" : "Me deben"} · {d.person || ""}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isPaid ? colors.incomeGreen + "22" : colors.brandPrimary + "22" }]}>
                    <Text style={{ color: isPaid ? colors.incomeGreen : colors.brandPrimary, fontSize: 11, fontWeight: "700" }}>
                      {isPaid ? "PAGADA" : "ACTIVO"}
                    </Text>
                  </View>
                </View>
                <View style={styles.amountsRow}>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>Pendiente</Text>
                    <Text style={[styles.amountValue, { color: colors.expenseRed }]}>
                      {formatCurrencyInt(d.remaining_amount)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>Pagado</Text>
                    <Text style={[styles.amountValue, { color: colors.statsPurple }]}>
                      {formatCurrencyInt(d.total_paid)}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>Total</Text>
                    <Text style={[styles.amountValue, { color: colors.onSurface }]}>
                      {formatCurrencyInt(d.original_amount)}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: 12 }}>
                  <ProgressBar progress={p} color={d.color} height={8} />
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6, fontWeight: "500" }}>
                    {Math.round(p * 100)}% pagado
                  </Text>
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
  debtName: { fontSize: 16, fontWeight: "600", color: colors.onSurface, letterSpacing: -0.2 },
  debtSub: { fontSize: 12, color: colors.muted, marginTop: 3, fontWeight: "400" },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  amountsRow: { flexDirection: "row", marginTop: 16 },
  amountCol: { flex: 1 },
  amountLabel: { fontSize: 12, color: colors.muted, fontWeight: "400", marginBottom: 4 },
  amountValue: { fontSize: 17, fontWeight: "600", letterSpacing: -0.3 },
});
