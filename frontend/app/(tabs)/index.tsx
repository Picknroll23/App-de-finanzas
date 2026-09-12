import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { api } from "@/src/api";
import { colors, radius, spacing } from "@/src/theme";
import { formatCurrency, formatDate, formatDateLong } from "@/src/format";
import { IconTile } from "@/src/components/ui";

function accountTypeLabel(t: string) {
  const m: Record<string, string> = {
    cash: "Efectivo", checking: "Corriente", savings: "Ahorro",
    credit_card: "Tarjeta", wallet: "Wallet", other: "Otra",
  };
  return m[t] || t;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);

  const summaryQ = useQuery({ queryKey: ["summary"], queryFn: api.summary });
  const userQ = useQuery({ queryKey: ["user"], queryFn: api.getUser });
  const txQ = useQuery({ queryKey: ["transactions"], queryFn: api.listTransactions });
  const catQ = useQuery({ queryKey: ["categories"], queryFn: api.listCategories });
  const accQ = useQuery({ queryKey: ["accounts"], queryFn: api.listAccounts });

  const summary = summaryQ.data;
  const user = userQ.data;
  const recent = (txQ.data || []).slice(0, 6);
  const cats: any[] = catQ.data || [];
  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
  const accounts: any[] = accQ.data || [];

  const money = (n: number) => (hidden ? "••••" : formatCurrency(n));

  return (
    <ScrollView
      testID="home-scroll"
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      refreshControl={
        <RefreshControl
          refreshing={summaryQ.isFetching}
          onRefresh={() => {
            summaryQ.refetch();
            txQ.refetch();
          }}
          tintColor={colors.brandPrimary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hola, {user?.name || "Usuario"} 👋</Text>
          <Text style={styles.sub}>Gestionemos tus finanzas</Text>
        </View>
        <Pressable testID="notifications-btn" style={styles.roundIcon}>
          <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={{ color: colors.onBrandPrimary, fontWeight: "700" }}>
            {(user?.name || "U").slice(0, 1)}
          </Text>
        </View>
      </View>

      {/* Mis cuentas */}
      <View style={{ paddingTop: spacing.lg }}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Mis cuentas</Text>
          <Pressable testID="toggle-hide-btn" onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
          </Pressable>
        </View>
        <Text style={styles.totalLine} testID="total-balance">
          Saldo total: <Text style={{ color: colors.onSurface, fontWeight: "800" }}>{money(summary?.total_balance || 0)}</Text>
        </Text>
        <View style={styles.walletGrid}>
          {accounts.map((a, idx) => {
            const isThird = (idx + 1) % 3 === 0;
            return (
              <Pressable
                key={a.id}
                testID={`wallet-${a.id}`}
                onPress={() => router.push(`/accounts/new?id=${a.id}`)}
                style={[styles.walletCard, { backgroundColor: a.color }, isThird && styles.walletCardLast]}
              >
                <Ionicons name={a.icon as any} size={18} color="#fff" />
                <Text style={styles.walletName} numberOfLines={1}>{a.name}</Text>
                <Text style={styles.walletBalance} numberOfLines={1} adjustsFontSizeToFit>
                  {money(a.current_balance)}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            testID="wallet-add"
            onPress={() => router.push("/accounts/new")}
            style={[styles.walletAddCard, (accounts.length + 1) % 3 === 0 && styles.walletCardLast]}
          >
            <Ionicons name="add" size={22} color={colors.brandPrimary} />
            <Text style={styles.walletAddText}>Agregar{"\n"}cuenta</Text>
          </Pressable>
        </View>
      </View>

      {/* Income / Expense */}
      <View style={styles.miniRow}>
        <View style={[styles.miniCard, { marginRight: 8 }]}>
          <IconTile icon="trending-up-outline" tint={colors.incomeGreen} />
          <Text style={styles.miniLabel}>Ingresos</Text>
          <Text style={[styles.miniAmount, { color: colors.incomeGreen }]}>
            +{money(summary?.month_income || 0)}
          </Text>
          <Text style={styles.miniSub}>Este mes</Text>
        </View>
        <View style={[styles.miniCard, { marginLeft: 8 }]}>
          <IconTile icon="trending-down-outline" tint={colors.expenseRed} />
          <Text style={styles.miniLabel}>Gastos</Text>
          <Text style={[styles.miniAmount, { color: colors.expenseRed }]}>
            -{money(summary?.month_expense || 0)}
          </Text>
          <Text style={styles.miniSub}>Este mes</Text>
        </View>
      </View>

      {/* Debts card */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <Pressable testID="debts-card" onPress={() => router.push("/debts")} style={styles.debtCard}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.debtTitle}>Deudas</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </View>
          <View style={{ flexDirection: "row", marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.debtLabel}>Debo</Text>
              <Text style={[styles.debtValue, { color: colors.expenseRed }]}>
                {money(summary?.debts?.i_owe || 0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.debtLabel}>Me deben</Text>
              <Text style={[styles.debtValue, { color: colors.incomeGreen }]}>
                {money(summary?.debts?.they_owe || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={styles.debtLabel}>Pagado este mes</Text>
              <Text style={[styles.debtValue, { color: colors.statsPurple, fontSize: 16 }]}>
                {money(summary?.debts?.paid_this_month || 0)}
              </Text>
            </View>
            {summary?.debts?.next_payment && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.debtLabel}>Próximo pago</Text>
                <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: 14 }}>
                  {formatDateLong(summary.debts.next_payment.date)}
                </Text>
                <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>
                  {money(summary.debts.next_payment.amount)}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {/* Recent transactions */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
          <Text style={styles.sectionTitle}>Transacciones recientes</Text>
          <Pressable testID="see-all-tx" onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Ver todo</Text>
          </Pressable>
        </View>
        <View style={styles.txList}>
          {recent.length === 0 && (
            <Text style={{ color: colors.muted, textAlign: "center", padding: spacing.lg }}>
              Aún no hay movimientos
            </Text>
          )}
          {recent.map((t) => {
            const cat = catById[t.category_id];
            const isIncome = t.type === "income" || t.type === "loan_received";
            const sign = isIncome ? "+" : "-";
            const color = isIncome ? colors.incomeGreen : colors.expenseRed;
            const iconName = cat?.icon || (isIncome ? "trending-up-outline" : "trending-down-outline");
            const tint = cat?.color || (isIncome ? colors.incomeGreen : colors.expenseRed);
            return (
              <View key={t.id} style={styles.txRow}>
                <IconTile icon={iconName} tint={tint} size={42} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txName}>{t.name}</Text>
                  <Text style={styles.txSub}>
                    {cat?.name || t.type} · {formatDate(t.date)}
                  </Text>
                </View>
                <Text style={{ color, fontWeight: "700", fontSize: 15 }}>
                  {sign}{formatCurrency(t.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  hello: { fontSize: 20, fontWeight: "800", color: colors.onSurface },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  roundIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center",
  },
  balanceCard: {
    borderRadius: radius.cardLg,
    padding: 22,
    minHeight: 170,
  },
  balanceLabel: { color: "#ffffffcc", fontSize: 13, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  balanceAmount: { color: "#fff", fontSize: 38, fontWeight: "800", marginTop: 10 },
  balanceSub: { color: "#ffffffcc", fontSize: 13, marginTop: 2 },
  balanceBtn: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#ffffff33",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  totalLine: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
    paddingHorizontal: spacing.lg,
  },
  walletGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  walletCard: {
    flexBasis: "31%",
    flexGrow: 0,
    flexShrink: 0,
    marginRight: "3.5%",
    marginBottom: 10,
    minHeight: 84,
    borderRadius: radius.md,
    padding: 10,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  walletCardLast: {
    marginRight: 0,
  },
  walletName: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 4 },
  walletBalance: { color: "#fff", fontSize: 13, fontWeight: "800", marginTop: 2 },
  walletAddCard: {
    flexBasis: "31%",
    flexGrow: 0,
    flexShrink: 0,
    marginRight: "3.5%",
    marginBottom: 10,
    minHeight: 84,
    borderRadius: radius.md,
    padding: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  walletAddText: {
    color: colors.brandPrimary,
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 14,
  },
  miniRow: { flexDirection: "row", paddingHorizontal: spacing.lg, marginTop: spacing.md },
  miniCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniLabel: { fontSize: 12, color: colors.muted, marginTop: 10, fontWeight: "600" },
  miniAmount: { fontSize: 20, fontWeight: "800", marginTop: 2 },
  miniSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  debtCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debtTitle: { fontSize: 17, fontWeight: "800", color: colors.onSurface },
  debtLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  debtValue: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.onSurface },
  txList: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  txName: { color: colors.onSurface, fontWeight: "700", fontSize: 14 },
  txSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
