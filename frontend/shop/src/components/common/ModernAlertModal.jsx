import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useAlertStore } from '../../stores/alertStore'

export default function ModernAlertModal() {
  const {
    isOpen,
    title,
    message,
    type,
    confirmText,
    cancelText,
    isConfirm,
    isDestructive,
    showIcon,
    handleConfirm,
    handleCancel,
    toast,
    hideToast,
  } = useAlertStore()

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50 shrink-0">
            <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
          </div>
        )
      case 'error':
        return (
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center ring-8 ring-rose-50 shrink-0">
            <XCircle className="w-6 h-6" strokeWidth={2.5} />
          </div>
        )
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center ring-8 ring-amber-50 shrink-0">
            <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
          </div>
        )
      case 'info':
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ring-8 ring-blue-50 shrink-0">
            <Info className="w-6 h-6" strokeWidth={2.5} />
          </div>
        )
    }
  }

  const getToastIcon = (tType) => {
    switch (tType) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />
    }
  }

  return (
    <>
      {/* Floating Modern Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-xl shadow-xl text-sm font-sans text-gray-800">
            <div className="flex items-center gap-2.5 min-w-0">
              {getToastIcon(toast.type)}
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              onClick={hideToast}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modern Pop up Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5 animate-in zoom-in-95 duration-200 font-sans"
            role="dialog"
            aria-modal="true"
          >
            {/* Header: Icon & Close (close button floats top-right when the icon is hidden) */}
            <div className={showIcon ? 'flex items-start justify-between' : 'absolute top-4 right-4'}>
              {showIcon && getIcon()}
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className={`text-lg font-bold text-gray-900 tracking-tight ${showIcon ? '' : 'pr-8'}`}>
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {isConfirm && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  {cancelText || 'Batal'}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                  isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                    : 'bg-gray-900 hover:bg-black text-white'
                }`}
              >
                {confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
