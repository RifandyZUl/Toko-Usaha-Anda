import { useState, useCallback } from 'react'

/**
 * Custom hook untuk form handling dengan validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validate - Validation function
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state dan handlers
 */
export function useForm(initialValues = {}, validate, onSubmit) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }, [errors])

  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))

    // Validate on blur
    if (validate) {
      const validationErrors = validate(values)
      if (validationErrors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: validationErrors[name],
        }))
      }
    }
  }, [values, validate])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()

      // Validate all fields
      if (validate) {
        const validationErrors = validate(values)
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          setTouched(
            Object.keys(values).reduce((acc, key) => {
              acc[key] = true
              return acc
            }, {})
          )
          return
        }
      }

      setIsSubmitting(true)
      setErrors({})

      try {
        await onSubmit(values)
        // Reset form on success
        setValues(initialValues)
        setTouched({})
      } catch (error) {
        setErrors({
          submit: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validate, onSubmit, initialValues]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
  }
}

