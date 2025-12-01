import { forwardRef } from 'react'

/**
 * Button component dengan variasi styles - Hitam seperti Nike
 * @param {string} variant - Button variant (primary, secondary, outline)
 * @param {string} size - Button size (sm, md, lg)
 * @param {boolean} fullWidth - Full width button
 * @param {ReactNode} children - Button content
 * @param {Object} props - Other button props
 */
const Button = forwardRef(
  ({ variant = 'primary', size = 'md', fullWidth = false, children, className = '', ...props }, ref) => {
    const baseStyles = 'btn-base focus:ring-gray-500'
    
    const variants = {
      primary: 'bg-black text-white hover:bg-gray-900 hover:shadow-xl hover:-translate-y-0.5 hover:scale-105',
      secondary: 'bg-white text-black border-2 border-black hover:bg-black hover:text-white hover:border-black hover:shadow-lg',
      outline: 'bg-transparent text-black border-2 border-black hover:bg-black hover:text-white hover:shadow-lg',
      glass: 'bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-black',
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-body-md font-body',
      md: 'px-6 py-3 text-body-lg font-body',
      lg: 'px-8 py-4 text-body-lg font-body',
    }
    
    const widthClass = fullWidth ? 'w-full' : ''
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
