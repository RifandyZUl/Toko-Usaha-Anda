/**
 * Reusable Filter Select Component
 * Standardized select dropdown for filtering
 */

/**
 * Filter Select Component
 * @param {Object} props
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
export default function FilterSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih filter...',
  className = '',
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`input ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

