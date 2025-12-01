import {
  Home,
  Wrench,
  Zap,
  Wallet,
  CheckCircle,
  Truck,
  MessageCircle,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Share2,
  AtSign,
  ChevronUp,
  Menu,
  X,
  Building2,
  Package,
  Users,
  Award,
  Target,
  Search,
  Heart,
  ShoppingCart,
  Headphones,
  Tag,
  DollarSign,
  BarChart3,
} from 'lucide-react'

/**
 * Icon component untuk mapping icon names ke Lucide React icons
 */
const iconMap = {
  Home,
  Wrench,
  Zap,
  Wallet,
  CheckCircle,
  Truck,
  MessageCircle,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Share2,
  AtSign,
  Facebook: Share2,
  Instagram: AtSign,
  ChevronUp,
  Menu,
  X,
  Building2,
  Package,
  Users,
  Award,
  Target,
  Search,
  Heart,
  ShoppingCart,
  Headphones,
  Tag,
  DollarSign,
  BarChart3,
}

function Icon({ name, className = '', size = 24, ...props }) {
  const IconComponent = iconMap[name]

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return <IconComponent className={className} size={size} {...props} />
}

export default Icon

