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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Building2,
  Package,
  Users,
  Award,
  Target,
  BadgeCheck,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Search,
  Loader2,
  LogOut,
  History,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Check,
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
  LogOut,
  History,
  MessageCircle,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Share2, // Direct mapping for Share2
  AtSign, // Direct mapping for AtSign
  Shield: ShieldCheck,
  AlertTriangle: AlertCircle,
  Facebook: Share2, // Using Share2 as alternative for Facebook
  Instagram: AtSign, // Using AtSign as alternative for Instagram
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Building2,
  Package,
  Users,
  Award,
  Target,
  BadgeCheck,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Search,
  Loader2,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Check,
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

