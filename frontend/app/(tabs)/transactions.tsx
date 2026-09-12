import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TextInput, StyleSheet, FlatList, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api } from "@/src/api";
import { colors, radius, spacing } from "@/src/theme";
import { formatCurrency, formatDate } from "@/src/format";
import { IconTile, Chip } from "@/src/components/ui";

const TYPE_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "income", label: "Ingresos" },
  { id: "expense", label: "Gastos" },
  { id: "transfer", label: "Transferencias" },
  { id: "debt_payment", label: "Pagos deuda" },
];

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const txQ = useQuery({ queryKey: ["transactions"], queryFn: api.listTransactions });
  const catQ = useQuery({ queryKey: ["categories"], queryFn: api.listCategories });
  const accQ = useQuery({ queryKey: ["accounts"], queryFn: api.listAccounts });

  const cats: any[] = catQ.data || [];
  const accs: any[] = accQ.data || [];
  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
  const accById = Object.fromEntries(accs.map((a) => [a.id, a]));

  const data = useMemo(() => {
    let items: any[] = txQ.data || [];
    if (filter !== "all") items = items.filter((t) => t.type === filter);
    if (q.trim()) items = items.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
    return items;
  }, [txQ.data, filter, q]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Movimientos</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            testID="search-input"
            value={q}
            onChangeText={setQ}
            placeholder="Buscar movimiento…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}
          style={{ marginTop: spacing.md }}
        >
          {TYPE_FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onPress={() => setFilter(f.id)}
              testID={`chip-${f.id}`}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: spacing.xxl }}>
            <Ionicons name="documents-outline" size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 10 }}>Sin movimientos</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = catById[item.category_id];
          const acc = accById[item.account_id];
          const isIncome = item.type === "income" || item.type === "loan_received";
          const isTransfer = item.type === "transfer";
          const sign = isTransfer ? "" : isIncome ? "+" : "-";
          const color = isTransfer ? colors.accountsBlue : isIncome ? colors.incomeGreen : colors.expenseRed;
          const iconName =
            cat?.icon ||
            (isTransfer ? "swap-horizontal-outline" : isIncome ? "trending-up-outline" : "trending-down-outline");
          const tint = cat?.color || color;
          return (
            <Pressable
              testID={`tx-${item.id}`}
              onPress={() => router.push(`/transactions/new?id=${item.id}`)}
              style={styles.row}
            >
              <IconTile icon={iconName} tint={tint} size={44} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>
                  {cat?.name || item.type} {acc ? `· ${acc.name}` : ""} · {formatDate(item.date)}
                </Text>
              </View>
              <Text style={{ color, fontWeight: "800", fontSize: 15 }}>
                {sign}{formatCurrency(item.amount)}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.onSurface, marginBottom: 12 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: colors.onSurface, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  name: { fontWeight: "700", color: colors.onSurface, fontSize: 14 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
