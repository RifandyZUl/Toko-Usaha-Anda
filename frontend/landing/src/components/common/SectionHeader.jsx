/**
 * Section header component untuk consistent section titles
 * @param {string} title - Section title
 * @param {string} subtitle - Section subtitle
 * @param {string} className - Additional classes
 */
function SectionHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`mb-12 md:mb-14 ${className}`}>
      <h2 className="text-heading-1 font-heading font-bold text-gray-900 mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-body-lg text-gray-600 max-w-3xl font-body font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default SectionHeader

