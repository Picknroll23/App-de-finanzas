import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/api";
import { useTheme, makeStyles, radius, spacing } from "@/src/theme";
import { IconTile } from "@/src/components/ui";

const TYPES = [
  { id: "cash", label: "Efectivo", icon: "cash-outline" },
  { id: "checking", label: "Corriente", icon: "card-outline" },
  { id: "savings", label: "Ahorro", icon: "wallet-outline" },
  { id: "credit_card", label: "Tarjeta", icon: "card-outline" },
  { id: "wallet", label: "Wallet", icon: "phone-portrait-outline" },
  { id: "other", label: "Otra", icon: "ellipsis-horizontal-outline" },
];
const COLORS = ["#4C83EA", "#2FA47C", "#FF654A", "#F5B83B", "#8F5BE8", "#29C4A9", "#D95345", "#FF8A3D"];

export default function AccountForm() {
  const { colors } = useTheme();
  const styles = useStyles();
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState("wallet-outline");

  useEffect(() => {
    if (params.id) {
      api.listAccounts().then((all) => {
        const a = all.find((x: any) => x.id === params.id);
        if (a) {
          setName(a.name);
          setType(a.type);
          setBalance(String(a.initial_balance));
          setColor(a.color);
          setIcon(a.icon);
        }
      });
    }
  }, [params.id]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Falta nombre");
      return;
    }
    const payload = {
      name,
      type,
      initial_balance: parseFloat(balance) || 0,
      color,
      icon,
      currency: "USD",
    };
    if (params.id) await api.updateAccount(params.id as string, payload);
    else await api.createAccount(payload);
    qc.invalidateQueries();
    router.back();
  };

  const remove = async () => {
    if (!params.id) return;
    await api.deleteAccount(params.id as string);
    qc.invalidateQueries();
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140, paddingHorizontal: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.lg }}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>{params.id ? "Editar" : "Nueva"} cuenta</Text>
        {params.id && (
          <Pressable onPress={remove} style={styles.backBtn}>
            <Ionicons name="trash-outline" size={22} color={colors.expenseRed} />
          </Pressable>
        )}
      </View>

      <Text style={styles.label}>Nombre</Text>
      <TextInput testID="acc-name" value={name} onChangeText={setName} placeholder="Ej. Chase Checking" placeholderTextColor={colors.muted} style={styles.input} />

      <Text style={styles.label}>Saldo inicial</Text>
      <TextInput testID="acc-balance" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} style={styles.input} />

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.grid}>
        {TYPES.map((t) => (
          <Pressable key={t.id} onPress={() => { setType(t.id); setIcon(t.icon); }} style={[styles.gridItem, type === t.id && { borderColor: color, borderWidth: 2 }]}>
            <IconTile icon={t.icon} tint={color} size={38} />
            <Text style={{ color: colors.onSurface, fontWeight: "600", marginTop: 6, fontSize: 12 }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {COLORS.map((c) => (
          <Pressable key={c} onPress={() => setColor(c)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.onSurface }} />
        ))}
      </View>

      <Pressable testID="save-account" onPress={save} style={styles.saveBtn}>
        <Text style={styles.saveText}>Guardar</Text>
      </Pressable>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  title: { flex: 1, fontSize: 20, fontWeight: "800", color: colors.onSurface },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginTop: 16, marginBottom: 8, letterSpacing: 0.5 },
  input: { fontSize: 15, color: colors.onSurface, backgroundColor: colors.surfaceSecondary, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "31%", padding: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  saveBtn: { marginTop: 28, backgroundColor: colors.brandPrimary, padding: 16, borderRadius: radius.pill, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 16 },
}));
