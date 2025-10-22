"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpId, setOtpId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        return
      }

      if (data.requiresMFA) {
        setOtpId(data.otpId)
      } else {
        // Check user roles and redirect accordingly
        const userRoles = data.user?.roles || []
        if (userRoles.includes("super_admin")) {
          router.push("/admin/dashboard")
        } else if (userRoles.includes("customer")) {
          router.push("/customer/dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpId, code: otpCode, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "OTP verification failed")
        return
      }

      // Check user roles and redirect accordingly
      const response2 = await fetch("/api/auth/verify-session")
      if (response2.ok) {
        const sessionData = await response2.json()
        const userRoles = sessionData.roles || []
        if (userRoles.includes("super_admin")) {
          router.push("/admin/dashboard")
        } else if (userRoles.includes("customer")) {
          router.push("/customer/dashboard")
        } else {
          router.push("/dashboard")
        }
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An error occurred during OTP verification")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">🍜</span>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                XianFeast
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg font-medium">
                The Immortal Dining Experience
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {!otpId ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="dancangwe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 px-4 text-gray-900 bg-white/70 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 text-gray-900 bg-white/70 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in to XianFeast"
                  )}
                </Button>
                
                <div className="text-center pt-4 space-y-2">
                  <p className="text-sm text-gray-500">
                    Welcome back! Ready to create culinary magic? ✨
                  </p>
                  <p className="text-xs text-gray-400">
                    Are you a customer?{" "}
                    <a href="/customer/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                      Sign in here
                    </a>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="text-center mb-6">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🔐</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Two-Factor Authentication</h3>
                  <p className="text-gray-600 mt-2">Enter the verification code sent to your email</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 font-semibold text-sm">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    required
                    className="text-center text-2xl tracking-widest h-12 bg-white/70 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                  <p className="text-sm text-gray-500 text-center">
                    Code sent to <span className="font-semibold text-indigo-600">{email}</span>
                  </p>
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => {
                    setOtpId(null)
                    setOtpCode("")
                    setError("")
                  }}
                >
                  ← Back to login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by modern technology • Built with ❤️ for food lovers
          </p>
        </div>
      </div>
    </div>
  )
}
