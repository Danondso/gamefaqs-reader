/**
 * useToast - Hook for toast notifications
 *
 * Simplifies showing toast notifications with consistent styling.
 */

import { useState, useCallback } from 'react';

interface ToastOptions {
  message: string;
  duration?: number;
  variant?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastState extends ToastOptions {
  visible: boolean;
}

export function useToast() {
  const [toastState, setToastState] = useState<ToastState>({
    visible: false,
    message: '',
  });

  const showToast = useCallback((options: ToastOptions) => {
    setToastState({
      ...options,
      visible: true,
    });
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'error', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'warning', duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'info', duration });
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  const toastProps = {
    visible: toastState.visible,
    message: toastState.message,
    duration: toastState.duration,
    variant: toastState.variant,
    action: toastState.action,
    onDismiss: hideToast,
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    toastProps,
  };
}
