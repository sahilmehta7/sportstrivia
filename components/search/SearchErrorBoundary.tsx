"use client";

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

interface SearchErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SearchErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component specifically for search functionality
 * Catches errors in search components and displays user-friendly error messages
 */
export class SearchErrorBoundary extends Component<
  SearchErrorBoundaryProps,
  SearchErrorBoundaryState
> {
  constructor(props: SearchErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): SearchErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error("Search error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="space-y-4">
          <ErrorMessage
            title="Search Error"
            message={
              this.state.error?.message ||
              "Something went wrong with the search. Please try again."
            }
          />
          <button
            onClick={this.handleReset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

