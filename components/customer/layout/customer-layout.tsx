"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Home, 
  Store, 
  ShoppingCart, 
  Clock, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useSession } from "@/hooks/useSessionManager"
import { SessionAwareLayout } from "@/components/layout/SessionAwareLayout"
import { CartProvider, useCart } from "@/hooks/useCart"
import { CartSidebar } from "@/components/customer/cart-sidebar"
import { SkipLink, HighContrast } from "@/components/ui/accessibility"

interface CustomerLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/customer/dashboard", icon: Home },
  { name: "Browse Stalls", href: "/customer/stalls", icon: Store },
  { name: "My Cart", href: "/customer/cart", icon: ShoppingCart },
  { name: "My Orders", href: "/customer/orders", icon: Clock },
  { name: "Profile", href: "/customer/profile", icon: User },
  { name: "Settings", href: "/customer/settings", icon: Settings },
]

function CustomerLayoutInner({ children }: CustomerLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { session, logout } = useSession()
  const { getTotalItems } = useCart()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState(0)
  
  const cartItemCount = getTotalItems()

  const handleLogout = async () => {
    await logout()
    router.push("/customer/login")
  }

  const fallbackComponent = (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">🍜</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
        <p className="text-gray-600 mb-4">Please log in to access the customer dashboard.</p>
        <Button onClick={() => router.push("/customer/login")}>
          Go to Login
        </Button>
      </div>
    </div>
  )

  return (
    <SessionAwareLayout 
      requiredRoles={["customer"]} 
      fallback={fallbackComponent}
    >
      <HighContrast>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#navigation">Skip to navigation</SkipLink>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-r border-white/20 dark:border-gray-700/50 shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-white/20 dark:border-gray-700/50">
              <Link href="/customer/dashboard" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <span className="text-lg font-bold text-white">🍜</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    XianFeast
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer Portal</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav id="navigation" className="flex-1 px-4 py-6 space-y-2" role="navigation" aria-label="Main navigation">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                      ${isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-gray-100'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? '' : 'group-hover:scale-110'} transition-transform duration-200`} />
                    <span>{item.name}</span>
                    {item.name === "My Cart" && cartItemCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User info and logout */}
            <div className="p-4 border-t border-white/20 dark:border-gray-700/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {session.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top header */}
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="hidden sm:block">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {navigation.find(item => item.href === pathname)?.name || "Dashboard"}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Cart Sidebar */}
                <CartSidebar>
                  <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                </CartSidebar>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                      {notifications}
                    </span>
                  )}
                </Button>

                {/* Theme switcher */}
                <ThemeSwitcher />

                {/* User menu for mobile */}
                <div className="sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main id="main-content" className="flex-1" role="main">
            {children}
          </main>
        </div>
      </div>
      </HighContrast>
    </SessionAwareLayout>
  )
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <CartProvider>
      <CustomerLayoutInner>{children}</CustomerLayoutInner>
    </CartProvider>
  )
}