/**
 * Clipboard utility with graceful legacy browser fallback
 */

/**
 * Copies text to clipboard safely across modern and legacy browsers
 * @param {string} text - Content to copy
 * @returns {Promise<boolean>} - Resolves to true if successfully copied, false otherwise
 */
export async function copyToClipboard(text) {
  if (text === null || text === undefined) return false
  const stringValue = String(text)

  // 1. Try modern navigator.clipboard API if available and running in secure context
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(stringValue)
      return true
    } catch (err) {
      // Gracefully fall through to legacy textarea fallback
      console.warn('navigator.clipboard.writeText failed, attempting legacy fallback:', err)
    }
  }

  // 2. Legacy fallback using invisible textarea + document.execCommand('copy')
  try {
    if (typeof document === 'undefined') return false

    const textArea = document.createElement('textarea')
    textArea.value = stringValue

    // Ensure element is offscreen and invisible to avoid layout shift
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    textArea.style.width = '2em'
    textArea.style.height = '2em'
    textArea.style.padding = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'
    textArea.setAttribute('readonly', '')

    document.body.appendChild(textArea)

    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, stringValue.length) // Support iOS devices

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    return Boolean(successful)
  } catch (fallbackErr) {
    console.warn('Graceful fallback: Clipboard copy failed on this browser:', fallbackErr)
    return false
  }
}

/**
 * Copies text and provides visual feedback to a target button element
 * @param {string} text - Content to copy
 * @param {string} elementId - ID of button element to show feedback
 * @param {string} defaultText - Original button text
 * @param {string} successText - Temporary text on success
 */
export async function handleCopyFeedback(
  text,
  elementId,
  defaultText = 'Salin',
  successText = 'Tersalin!'
) {
  const isCopied = await copyToClipboard(text)
  if (!isCopied) return

  const element = document.getElementById(elementId)
  if (element) {
    element.innerText = successText
    setTimeout(() => {
      const el = document.getElementById(elementId)
      if (el) el.innerText = defaultText
    }, 2000)
  }
}
