"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Settings, LogOut, User, Building2 } from "lucide-react"
import { useSession } from "@/hooks/useSessionManager"
import { useRouter } from "next/navigation"
import { ThemeSwitcher } from "@/components/theme-switcher"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Business {
  id: string
  name: string
  status: string
}

export function BusinessHeader() {
  const { session, logout } = useSession()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)

  useEffect(() => {
    fetchBusinessInfo()
  }, [session.userId])

  const fetchBusinessInfo = async () => {
    try {
      const response = await fetch('/api/businesses/my-business')
      if (response.ok) {
        const data = await response.json()
        setBusiness(data.business)
      }
    } catch (error) {
      console.error('Error fetching business info:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <Link href="/business/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">仙</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                XianFeast
              </h1>
              {business && (
                <p className="text-xs text-muted-foreground font-medium">
                  {business.name}
                </p>
              )}
            </div>
          </Link>
          <div className="hidden md:block">
            <span className="text-sm text-muted-foreground">Business Dashboard</span>
          </div>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitcher />
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full text-xs"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${session.email}`} alt="Business Owner" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-orange-500 text-white">
                    {session.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Business Owner</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.email}
                  </p>
                  {business && (
                    <p className="text-xs leading-none text-primary font-medium">
                      {business.name}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Business Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}