import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import Svg, { Circle as SvgCircle, Path as SvgPath } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { api } from "@/src/api";
import { useTheme, makeStyles, radius, spacing, type ThemeColors } from "@/src/theme";
import { formatCurrency, formatCurrencyInt, formatDate, formatDateLong } from "@/src/format";
import { IconTile } from "@/src/components/ui";
import { LockToggle, useLock } from "@/src/lock";

function accountTypeLabel(t: string) {
  const m: Record<string, string> = {
    cash: "Efectivo", checking: "Corriente", savings: "Ahorro",
    credit_card: "Tarjeta", wallet: "Wallet", other: "Otra",
  };
  return m[t] || t;
}

function accountBars(accounts: any[], total: number, colors: ThemeColors) {
  const positives = accounts.filter((a) => a.current_balance > 0);
  const base = total > 0 ? total : positives.reduce((s, a) => s + a.current_balance, 0);
  const sorted = [...positives].sort((a, b) => b.current_balance - a.current_balance);
  if (sorted.length === 0) {
    return <Text style={{ color: colors.muted, fontSize: 10 }}>Sin cuentas</Text>;
  }
  return sorted.map((a) => {
    const pct = base > 0 ? Math.round((a.current_balance / base) * 100) : 0;
    return (
      <View key={a.id}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ flexShrink: 1, fontSize: 9, fontWeight: "600", color: colors.onSurface }}>
            {a.name}
          </Text>
          <Text style={{ fontSize: 9, fontWeight: "700", color: a.color, marginLeft: 4 }}>{pct}%</Text>
        </View>
        <View
          style={{
            marginTop: 2,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.surfaceTertiary,
            overflow: "hidden",
          }}
        >
          <View style={{ width: `${Math.max(4, pct)}%`, height: "100%", backgroundColor: a.color }} />
        </View>
      </View>
    );
  });
}

export default function Home() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { guard } = useLock();
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
  const debtMoney = (n: number) => (hidden ? "••••" : formatCurrencyInt(n));

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
                onPress={guard(() => router.push(`/accounts/new?id=${a.id}`))}
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

      {/* Income / Expense / Accounts distribution */}
      <View style={styles.miniRow}>
        <View style={styles.miniLeft}>
          <View style={[styles.miniCard, styles.miniHalfLeft, styles.cardIncome]}>
            <View style={[styles.miniPill, { backgroundColor: colors.incomeGreen }]}>
              <Ionicons name="arrow-up" size={14} color="#fff" />
            </View>
            <Text style={styles.miniLabel}>Ingresos</Text>
            <Text
              style={[styles.miniAmount, { color: colors.incomeGreen }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              +{money(summary?.month_income || 0)}
            </Text>
            <Text style={styles.miniSub}>Este mes</Text>
          </View>
          <View style={[styles.miniCard, styles.miniHalfRight, styles.cardExpense]}>
            <View style={[styles.miniPill, { backgroundColor: colors.expenseRed }]}>
              <Ionicons name="arrow-down" size={14} color="#fff" />
            </View>
            <Text style={styles.miniLabel}>Gastos</Text>
            <Text
              style={[styles.miniAmount, { color: colors.expenseRed }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              -{money(summary?.month_expense || 0)}
            </Text>
            <Text style={styles.miniSub}>Este mes</Text>
          </View>
        </View>
        <View style={[styles.miniCard, styles.miniAccounts]}>
          <ScrollView
            testID="cuentas-scroll"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {accountBars(accounts, summary?.total_balance || 0, colors)}
          </ScrollView>
        </View>
      </View>

      {/* Debts card */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <Pressable testID="debts-card" onPress={() => router.push("/debts")} style={styles.debtCard}>
          {/* soft abstract background */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%" viewBox="0 0 320 240" preserveAspectRatio="none">
              <SvgCircle cx="24" cy="200" r="42" fill={colors.brandSecondary} opacity="0.06" />
              <SvgCircle cx="290" cy="30" r="26" fill={colors.statsPurple} opacity="0.05" />
              <SvgPath
                d="M0 60 Q 60 40, 120 55 T 260 45 T 340 55"
                stroke={colors.brandSecondary}
                strokeOpacity="0.12"
                strokeWidth="1"
                fill="none"
              />
              <SvgPath
                d="M20 210 Q 90 195, 160 205 T 320 200"
                stroke={colors.brandPrimary}
                strokeOpacity="0.08"
                strokeWidth="1"
                fill="none"
              />
              <SvgCircle cx="180" cy="122" r="4" fill={colors.brandPrimary} opacity="0.14" />
              <SvgCircle cx="60" cy="120" r="2.5" fill={colors.statsPurple} opacity="0.2" />
              {[0, 1, 2].map((r) =>
                [0, 1, 2].map((c) => (
                  <SvgCircle
                    key={`d-${r}-${c}`}
                    cx={295 + c * 6}
                    cy={112 + r * 6}
                    r="1.2"
                    fill={colors.muted}
                    opacity="0.35"
                  />
                )),
              )}
            </Svg>
          </View>

          {/* header */}
          <View style={styles.debtHeader}>
            <View style={styles.debtHeaderIcon}>
              <Ionicons name="wallet" size={18} color={colors.brandSecondary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.debtTitle}>Deudas</Text>
              <Text style={styles.debtHeaderSub}>Tu panorama financiero, en un vistazo.</Text>
            </View>
            <View style={styles.debtArrowBtn}>
              <Ionicons name="chevron-forward" size={14} color={colors.onSurface} />
            </View>
          </View>

          {/* first row */}
          <View style={styles.debtQuadRow}>
            <View style={styles.debtQuadLeft}>
              <View style={styles.debtQuadInner}>
                <View style={[styles.debtQuadIcon, { backgroundColor: colors.expenseRed + "1A" }]}>
                  <Ionicons name="arrow-up" size={14} color={colors.expenseRed} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.debtQuadLabel}>Debo</Text>
                  <Text style={[styles.debtQuadValue, { color: colors.expenseRed }]} numberOfLines={1} adjustsFontSizeToFit>
                    {debtMoney(summary?.debts?.i_owe || 0)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.debtVDivider} />
            <View style={styles.debtQuadRight}>
              <View style={styles.debtQuadInner}>
                <View style={[styles.debtQuadIcon, { backgroundColor: colors.incomeGreen + "1A" }]}>
                  <Ionicons name="arrow-down" size={14} color={colors.incomeGreen} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.debtQuadLabel}>Me deben</Text>
                  <Text style={[styles.debtQuadValue, { color: colors.incomeGreen }]} numberOfLines={1} adjustsFontSizeToFit>
                    {debtMoney(summary?.debts?.they_owe || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.debtHDivider} />

          {/* second row */}
          <View style={styles.debtQuadRow}>
            <View style={styles.debtQuadLeft}>
              <View style={styles.debtQuadInner}>
                <View style={[styles.debtQuadIcon, { backgroundColor: colors.statsPurple + "1A" }]}>
                  <Ionicons name="card" size={14} color={colors.statsPurple} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.debtQuadLabel}>Pagado este mes</Text>
                  <Text style={[styles.debtQuadValue, { color: colors.statsPurple }]} numberOfLines={1} adjustsFontSizeToFit>
                    {debtMoney(summary?.debts?.paid_this_month || 0)}
                  </Text>
                  <Text style={styles.debtQuadFoot}>¡Buen progreso!</Text>
                </View>
              </View>
            </View>
            <View style={styles.debtVDivider} />
            <View style={styles.debtQuadRight}>
              <View style={styles.debtQuadInner}>
                <View style={[styles.debtQuadIcon, { backgroundColor: colors.brandSecondary + "1F" }]}>
                  <Ionicons name="calendar" size={14} color={colors.brandSecondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.debtQuadLabel}>Próximo pago</Text>
                  {summary?.debts?.next_payment ? (
                    <>
                      <Text style={styles.debtQuadDate} numberOfLines={1}>
                        {formatDateLong(summary.debts.next_payment.date)}
                      </Text>
                      <Text style={[styles.debtQuadValue, { color: colors.brandSecondary, fontSize: 15 }]} numberOfLines={1} adjustsFontSizeToFit>
                        {debtMoney(summary.debts.next_payment.amount)}
                      </Text>
                      <Text style={styles.debtQuadFoot}>Mantén tus pagos al día</Text>
                    </>
                  ) : (
                    <Text style={styles.debtQuadFoot}>Sin próximos pagos</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Recent transactions */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
          <Text style={styles.sectionTitle}>Transacciones recientes</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LockToggle testID="lock-home" compact />
            <Pressable testID="see-all-tx" onPress={() => router.push("/(tabs)/transactions")}>
              <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Ver todo</Text>
            </Pressable>
          </View>
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

const useStyles = makeStyles((colors) => ({
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
  miniRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: "stretch",
  },
  miniLeft: {
    flex: 3, // ~60%
    flexDirection: "row",
    marginRight: 8,
  },
  miniHalfLeft: {
    flex: 1,
    marginRight: 4,
  },
  miniHalfRight: {
    flex: 1,
    marginLeft: 4,
  },
  miniAccounts: {
    flex: 2, // ~40%
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  miniCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 148,
  },
  cardIncome: {
    backgroundColor: colors.incomeGreen + "14",
    borderColor: colors.incomeGreen + "33",
    padding: 10,
    justifyContent: "space-between",
  },
  cardExpense: {
    backgroundColor: colors.expenseRed + "14",
    borderColor: colors.expenseRed + "33",
    padding: 10,
    justifyContent: "space-between",
  },
  miniPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  miniLabel: { fontSize: 12, color: colors.muted, marginTop: 4, fontWeight: "700" },
  miniAmount: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  miniSub: { fontSize: 9, color: colors.muted, marginTop: 2, fontWeight: "600" },
  debtCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.cardLg,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  debtHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  debtHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.brandSecondary + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  debtHeaderSub: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "400",
    marginTop: 2,
  },
  debtArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  debtTitle: { fontSize: 16, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.4 },
  debtQuadRow: {
    flexDirection: "row",
    marginTop: 11,
  },
  debtQuadLeft: { flex: 1, paddingRight: 6 },
  debtQuadRight: { flex: 1, paddingLeft: 10 },
  debtQuadInner: { flexDirection: "row", alignItems: "flex-start" },
  debtQuadIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  debtQuadLabel: { fontSize: 10, color: colors.muted, fontWeight: "500" },
  debtQuadValue: { fontSize: 18, fontWeight: "800", marginTop: 2, letterSpacing: -0.5 },
  debtQuadFoot: { fontSize: 8, color: colors.muted, marginTop: 2, fontWeight: "500" },
  debtQuadDate: { fontSize: 10, color: colors.onSurface, fontWeight: "700", marginTop: 2 },
  debtVDivider: { width: 1, backgroundColor: colors.divider, marginVertical: 4 },
  debtHDivider: { height: 1, backgroundColor: colors.divider, marginTop: 11 },
  debtLabel: { fontSize: 12, color: colors.muted, fontWeight: "400" },
  debtValue: { fontSize: 18, fontWeight: "600", marginTop: 4, letterSpacing: -0.3 },
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
}));
