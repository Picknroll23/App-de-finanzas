import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { LogBox, StatusBar, Text as RNText } from "react-native";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { colors } from "@/src/theme";
import { LockProvider } from "@/src/lock";

LogBox.ignoreAllLogs(true);

// Prewarm the icon fonts so bundled routes have icons on first render.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import "@react-native-vector-icons/ionicons";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Apply the app font as the default for every <Text> in the tree, once.
const AnyText: any = RNText;
if (!AnyText.__moneyflowFontPatched) {
  AnyText.__moneyflowFontPatched = true;
  const prev = AnyText.render;
  AnyText.defaultProps = AnyText.defaultProps || {};
  AnyText.defaultProps.style = [
    { fontFamily: "SpaceGrotesk" },
    AnyText.defaultProps.style,
  ];
  // Keep render for future-proofing (some libs replace defaultProps).
  if (prev && !AnyText.__origRender) AnyText.__origRender = prev;
}

export default function RootLayout() {
  const [loaded] = Font.useFonts({
    SpaceGrotesk: require("../assets/fonts/SpaceGrotesk-Variable.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

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
                    animation: "slide_from_right",
                    animationDuration: 200,
                    animationTypeForReplace: "push",
                    gestureEnabled: true,
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
