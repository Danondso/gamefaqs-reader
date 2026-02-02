/**
 * useConfirmDialog - Hook for confirmation dialogs
 *
 * Simplifies showing confirmation dialogs with consistent styling.
 */

import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

interface ConfirmDialogState extends ConfirmOptions {
  visible: boolean;
  onConfirm?: () => void;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    visible: false,
    title: '',
    message: '',
  });

  const showConfirm = useCallback(
    (options: ConfirmOptions, onConfirm: () => void) => {
      setDialogState({
        ...options,
        visible: true,
        onConfirm,
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    }
    setDialogState((prev) => ({ ...prev, visible: false }));
  }, [dialogState.onConfirm]);

  const handleCancel = useCallback(() => {
    setDialogState((prev) => ({ ...prev, visible: false }));
  }, []);

  const dialogProps = {
    visible: dialogState.visible,
    title: dialogState.title,
    message: dialogState.message,
    onDismiss: handleCancel,
    actions: [
      {
        label: dialogState.cancelText || 'Cancel',
        onPress: handleCancel,
        variant: 'secondary' as const,
      },
      {
        label: dialogState.confirmText || 'Confirm',
        onPress: handleConfirm,
        variant: (dialogState.variant || 'primary') as 'primary' | 'danger',
      },
    ],
  };

  return {
    showConfirm,
    dialogProps,
  };
}
