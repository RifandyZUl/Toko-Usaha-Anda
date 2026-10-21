import { useState, useCallback } from 'react'

/**
 * Custom hook untuk form handling dengan validation
 */
export function useForm(initialValues = {}, validate, onSubmit) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    e => {
      const { name, value } = e.target
      setValues(prev => ({
        ...prev,
        [name]: value,
      }))

      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: '',
        }))
      }
    },
    [errors]
  )

  const handleBlur = useCallback(
    e => {
      const { name } = e.target
      setTouched(prev => ({
        ...prev,
        [name]: true,
      }))

      if (validate) {
        const validationErrors = validate(values)
        if (validationErrors[name]) {
          setErrors(prev => ({
            ...prev,
            [name]: validationErrors[name],
          }))
        }
      }
    },
    [values, validate]
  )

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()

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

          // Smoothly scroll to the first field with validation error
          const firstErrorKey = Object.keys(validationErrors)[0]
          const errorElement = document.querySelector(`[name="${firstErrorKey}"]`)
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            errorElement.focus()
          }
          return
        }
      }

      setIsSubmitting(true)
      setErrors({})

      try {
        await onSubmit(values)
        setTouched({})
      } catch (error) {
        setErrors({
          submit: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validate, onSubmit]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
  }
}

