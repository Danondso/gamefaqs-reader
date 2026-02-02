/**
 * ErrorBoundary - Catches unhandled React errors
 *
 * Classic GameFAQs-styled error boundary that displays
 * a friendly error message with retry/reset options.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    if (__DEV__) console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI with classic GameFAQs styling
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. This has been logged for debugging.
            </Text>

            {__DEV__ && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.error.stack && (
                  <Text style={styles.errorStack}>
                    {this.state.error.stack}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Try Again"
                onPress={this.resetError}
                variant="primary"
              />
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#CC0000',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 21,
  },
  errorDetails: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
    width: '100%',
    maxWidth: 500,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#CC0000',
    fontFamily: 'Courier',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Courier',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});
