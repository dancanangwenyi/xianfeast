"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  Users, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  FileText,
  Shield,
  Bot,
  LayoutDashboard,
  CheckCircle,
  Webhook
} from "lucide-react"

const navigation = [
  {
    name: "Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Businesses",
    href: "/admin/dashboard/businesses",
    icon: Building2,
  },
  {
    name: "Users",
    href: "/admin/dashboard/users",
    icon: Users,
  },
  {
    name: "Orders",
    href: "/admin/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    name: "Analytics",
    href: "/admin/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Approvals",
    href: "/admin/dashboard/approvals",
    icon: CheckCircle,
  },
  {
    name: "AI Features",
    href: "/admin/dashboard/ai",
    icon: Bot,
  },
  {
    name: "System Logs",
    href: "/admin/dashboard/logs",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/admin/dashboard/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Administration
            </h2>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      isActive 
                        ? "bg-accent text-accent-foreground" 
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
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