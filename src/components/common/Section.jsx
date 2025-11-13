import { forwardRef } from 'react'

/**
 * Section wrapper component dengan consistent styling
 * @param {string} id - Section ID
 * @param {string} className - Additional classes
 * @param {boolean} alternate - Alternate background color
 * @param {ReactNode} children - Section content
 */
const Section = forwardRef(({ id, className = '', alternate = false, children }, ref) => {
  const bgClass = alternate ? 'bg-gray-50' : 'bg-white'
  
  return (
    <section ref={ref} id={id} className={`section-padding ${bgClass} ${className}`}>
      <div className="container-custom">{children}</div>
    </section>
  )
})

Section.displayName = 'Section'

export default Section

