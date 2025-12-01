/**
 * Card component dengan hover effects dan design modern
 * @param {string} className - Additional classes
 * @param {ReactNode} children - Card content
 * @param {Object} props - Other div props
 */
function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card

