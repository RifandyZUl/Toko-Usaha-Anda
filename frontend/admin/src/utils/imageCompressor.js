/**
 * Client-Side Image Compressor Utility
 * Automatically resizes and compresses large camera images before upload
 * Prevents network bottlenecks and server payload limits without sacrificing visual quality.
 */

export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    thresholdBytes = 1.5 * 1024 * 1024, // files below 1.5MB won't be compressed unless oversized
  } = options

  // Only process valid image files
  if (!file || !file.type.startsWith('image/')) {
    return file
  }

  // If already a small SVG or GIF, don't re-compress on canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // If file is already small and within dimensions, return original
        if (file.size <= thresholdBytes && width <= maxWidth && height <= maxHeight) {
          return resolve(file)
        }

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            maxHeight = height
            height = Math.round((height * maxHeight) / width)
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        // Clean white background for transparent images converted to JPEG
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const outputType = 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file) // Fallback to original
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: outputType,
              lastModified: Date.now(),
            })

            console.log(
              `[ImageCompressor] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
            )

            resolve(compressedFile)
          },
          outputType,
          quality
        )
      }

      img.onerror = () => {
        resolve(file) // Fallback on load error
      }

      img.src = event.target.result
    }

    reader.onerror = () => {
      resolve(file)
    }

    reader.readAsDataURL(file)
  })
}
