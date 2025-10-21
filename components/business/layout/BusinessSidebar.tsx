"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard,
  Store,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  FileText,
  Calendar,
  CreditCard,
  Bell
} from "lucide-react"

const navigation = [
  {
    name: "Overview",
    href: "/business/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Stalls",
    href: "/business/dashboard/stalls",
    icon: Store,
  },
  {
    name: "Products",
    href: "/business/dashboard/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/business/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    name: "Team",
    href: "/business/dashboard/team",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/business/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Calendar",
    href: "/business/dashboard/calendar",
    icon: Calendar,
  },
  {
    name: "Billing",
    href: "/business/dashboard/billing",
    icon: CreditCard,
  },
  {
    name: "Reports",
    href: "/business/dashboard/reports",
    icon: FileText,
  },
  {
    name: "Notifications",
    href: "/business/dashboard/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    href: "/business/dashboard/settings",
    icon: Settings,
  },
]

export function BusinessSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-card/30 backdrop-blur-sm border-border/50">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              Business Management
            </h2>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/business/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground",
                      isActive 
                        ? "bg-gradient-to-r from-primary/10 to-orange-500/10 text-primary border-l-4 border-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-4 w-4",
                      isActive ? "text-primary" : ""
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}