import { Component, type ErrorInfo, type ReactNode } from "react";

import { humanizeCommerceError } from "./commerce-humanized-errors";
import { VenextRecoverableErrorState } from "./VenextRecoverableErrorState";
import type { HumanizedCommerceError } from "./commerce-humanized-errors.types";

export type CommerceErrorBoundaryProps = {
  children: ReactNode;
  locale?: string;
  module?: string;
  onRetry?: () => void;
  onBack?: () => void;
  variant?: "global" | "mobile" | "industrial";
};

type State = { error: HumanizedCommerceError | null };

class CommerceErrorBoundaryBase extends Component<CommerceErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return {
      error: humanizeCommerceError(error, {
        fallbackKey: "runtime_error",
      }),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    humanizeCommerceError(error, {
      locale: this.props.locale,
      module: this.props.module ?? this.props.variant,
      fallbackKey: "runtime_error",
    });
    void info;
  }

  handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.error) {
      return (
        <VenextRecoverableErrorState
          error={this.state.error}
          locale={this.props.locale}
          onRetry={this.handleRetry}
          onBack={this.props.onBack}
        />
      );
    }
    return this.props.children;
  }
}

export function GlobalCommerceErrorBoundary(props: Omit<CommerceErrorBoundaryProps, "variant">) {
  return <CommerceErrorBoundaryBase {...props} variant="global" />;
}

export function MobileCommerceErrorBoundary(props: Omit<CommerceErrorBoundaryProps, "variant">) {
  return <CommerceErrorBoundaryBase {...props} variant="mobile" />;
}

export function IndustrialCommerceErrorBoundary(
  props: Omit<CommerceErrorBoundaryProps, "variant">,
) {
  return <CommerceErrorBoundaryBase {...props} variant="industrial" />;
}
