"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Building2,
  Store,
  Users,
  ShoppingCart,
  CheckCircle,
  BarChart3,
  Brain,
  FileText,
  Settings,
  Search,
  Bell,
  LogOut,
  User,
  Shield,
  Menu,
  X,
} from "lucide-react"
import { motion } from "framer-motion"
import { ThemeSwitcher } from "@/components/theme-switcher"

const navigation = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Businesses", href: "/admin/dashboard/businesses", icon: Building2 },
  { name: "Stalls", href: "/admin/dashboard/stalls", icon: Store },
  { name: "Users", href: "/admin/dashboard/users", icon: Users },
  { name: "Orders", href: "/admin/dashboard/orders", icon: ShoppingCart },
  { name: "Approvals", href: "/admin/dashboard/approvals", icon: CheckCircle },
  { name: "Analytics", href: "/admin/dashboard/analytics", icon: BarChart3 },
  { name: "AI Insights", href: "/admin/dashboard/ai", icon: Brain },
  { name: "System Logs", href: "/admin/dashboard/logs", icon: FileText },
  { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl border-r border-slate-200 dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">🍜</span>
                    </div>
                    <span className="font-bold text-lg bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                      XianFeast
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="flex-1 space-y-1 px-4 pb-4">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </motion.div>
          </div>
        )}

        <div className="flex h-screen">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
            <div className="flex flex-col flex-grow bg-white border-r border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
              {/* Header */}
              <div className="flex items-center space-x-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-lg">🍜</span>
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    XianFeast
                  </h1>
                  <p className="text-xs text-slate-600 font-medium dark:text-slate-400">Super Admin</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-1">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 px-3 dark:text-slate-400">
                  Navigation
                </div>
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-gradient-to-br from-red-600 to-orange-600 text-white text-xs">
                      SA
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate dark:text-slate-100">Super Admin</p>
                    <p className="text-xs text-slate-600 truncate dark:text-slate-400">dancangwe@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex flex-col flex-1 lg:pl-64">
            {/* Top bar */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm dark:bg-slate-800/95 dark:border-slate-700">
              <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center lg:hidden shadow-sm">
                      <span className="text-white font-bold text-sm">🍜</span>
                    </div>
                    <div className="lg:hidden">
                      <h1 className="font-bold text-lg bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                        XianFeast
                      </h1>
                      <p className="text-xs text-slate-600 font-medium dark:text-slate-400">Super Admin</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="hidden md:block">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                      <Input
                        placeholder="Search businesses, users, orders..."
                        className="pl-10 w-64 bg-slate-50 border-slate-200 focus:bg-white focus:border-red-300 focus:ring-red-200 text-slate-900 placeholder:text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:focus:bg-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Notifications */}
                  <Button variant="ghost" size="sm" className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700">
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-600 text-white">
                      3
                    </Badge>
                  </Button>

                  {/* Theme Switcher */}
                  <ThemeSwitcher />

                  {/* Quick Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100">
                        Quick Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 shadow-lg dark:bg-slate-800 dark:border-slate-700">
                      <DropdownMenuLabel className="text-slate-900 dark:text-slate-100">Quick Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                      <DropdownMenuItem className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100">
                        <Building2 className="mr-2 h-4 w-4" />
                        Invite Business Owner
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100">
                        <Users className="mr-2 h-4 w-4" />
                        Add New User
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                      <DropdownMenuItem className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100">
                        <FileText className="mr-2 h-4 w-4" />
                        View Documentation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Profile */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback className="bg-gradient-to-br from-red-600 to-orange-600 text-white text-xs">
                            SA
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border-slate-200 shadow-lg dark:bg-slate-800 dark:border-slate-700" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal text-slate-900 dark:text-slate-100">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Super Admin</p>
                          <p className="text-xs leading-none text-slate-600 dark:text-slate-400">
                            dancangwe@gmail.com
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                      <DropdownMenuItem className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100">
                        <User className="mr-2 h-4 w-4" />
                        <span>Account</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Security</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                      <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    )
}
