/**
 * Custom Hook for Confirm Dialog
 * Handles confirm dialog state management
 */

import { useState, useCallback } from 'react'

/**
 * Custom hook for confirm dialog
 * @returns {Object} Dialog state and functions
 */
export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    onConfirm: null,
    isLoading: false,
  })

  /**
   * Open confirm dialog
   * @param {Object} options - Dialog options
   */
  const openDialog = useCallback(
    options => {
      setDialog({
        isOpen: true,
        title: options.title || 'Konfirmasi',
        message: options.message || 'Apakah Anda yakin?',
        confirmText: options.confirmText || 'Konfirmasi',
        cancelText: options.cancelText || 'Batal',
        onConfirm: options.onConfirm || null,
        isLoading: false,
      })
    },
    []
  )

  /**
   * Close dialog
   */
  const closeDialog = useCallback(() => {
    setDialog(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }))
  }, [])

  /**
   * Set loading state
   * @param {boolean} isLoading - Loading state
   */
  const setLoading = useCallback(isLoading => {
    setDialog(prev => ({ ...prev, isLoading }))
  }, [])

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(async () => {
    if (dialog.onConfirm) {
      setLoading(true)
      try {
        await dialog.onConfirm()
        // Only close if onConfirm doesn't handle it itself
        // (some operations might want to keep dialog open on error)
        closeDialog()
      } catch (error) {
        // Keep dialog open on error so user can retry
        setLoading(false)
        throw error
      }
    } else {
      closeDialog()
    }
  }, [dialog, closeDialog, setLoading])

  return {
    dialog,
    openDialog,
    closeDialog,
    setLoading,
    handleConfirm,
  }
}

