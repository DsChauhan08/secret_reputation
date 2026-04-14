import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "./theme";
import { SoftButton } from "./components";

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Keep UI fail-closed and user-recoverable.
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.caption}>Please restart this screen.</Text>
        <SoftButton title="Try Again" onPress={() => this.setState({ hasError: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.h2,
    textAlign: "center",
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
});
