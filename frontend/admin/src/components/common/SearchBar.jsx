/**
 * Reusable Search Bar Component
 * Standardized search input with icon
 */

import { Search } from 'lucide-react'

/**
 * Search Bar Component
 * @param {Object} props
 * @param {string} props.value - Search value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
export default function SearchBar({ value, onChange, placeholder = 'Cari...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input pl-10"
      />
    </div>
  )
}

