import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/api";
import { useTheme, makeStyles } from "@/src/theme";

export default function Index() {
  const { colors } = useTheme();
  const styles = useStyles();
  // Ensure user and demo data exist on first launch
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: api.getUser,
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.listAccounts,
    enabled: !!user,
  });

  useEffect(() => {
    if (accounts && accounts.length === 0) {
      api.seed().catch(() => {});
    }
  }, [accounts]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }
  return <Redirect href="/(tabs)" />;
}

const useStyles = makeStyles((colors) => ({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
}));
