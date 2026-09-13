import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { LogBox, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { colors } from "@/src/theme";
import { LockProvider } from "@/src/lock";

LogBox.ignoreAllLogs(true);

// Prewarm the icon fonts so bundled routes have icons on first render (Expo Go
// on Android sometimes ships without the fonts unless we import them here).
// This import is a no-op at runtime aside from the side effect of font registration.
import "@react-native-vector-icons/ionicons";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <LockProvider>
                <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.surface },
                  }}
                />
              </LockProvider>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
