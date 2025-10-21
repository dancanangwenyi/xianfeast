"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function CustomerMagicLinkContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setError("No token provided")
      setVerifying(false)
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/auth/customer/verify-magic?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid or expired magic link")
        return
      }

      setUser(data.user)
    } catch (err) {
      setError("Failed to verify magic link")
    } finally {
      setVerifying(false)
    }
  }

  const validatePassword = (pwd: string) => {
    const errors: string[] = []
    
    if (pwd.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("Password must contain at least one number")
    }
    
    return errors
  }

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd)
    setPasswordErrors(validatePassword(pwd))
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    const errors = validatePassword(password)
    if (errors.length > 0) {
      setError("Password does not meet requirements")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/customer/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to set password")
        return
      }

      // Redirect to customer dashboard
      router.push("/customer/dashboard")
    } catch (err) {
      setError("An error occurred while setting password")
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Magic Link</h2>
            <p className="text-gray-600">Please wait while we verify your link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-2xl font-bold text-white">❌</span>
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Link Invalid</CardTitle>
            <CardDescription className="text-gray-600">
              This magic link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 text-center space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
            <div className="space-y-3">
              <Link href="/customer/signup">
                <Button className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold">
                  Create New Account
                </Button>
              </Link>
              <Link href="/customer/login">
                <Button variant="outline" className="w-full h-12">
                  Sign In Instead
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">🔐</span>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Set Your Password
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg font-medium">
                Complete your XianFeast account setup
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {user && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Welcome, {user.name}!</strong><br />
                  Setting up account for: <span className="font-semibold">{user.email}</span>
                </p>
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  className="h-12 px-4 text-gray-900 bg-white/70 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                />
                {passwordErrors.length > 0 && (
                  <div className="text-xs text-red-600 space-y-1">
                    {passwordErrors.map((error, index) => (
                      <p key={index}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-sm">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 px-4 text-gray-900 bg-white/70 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Password Requirements:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className={password.length >= 8 ? "text-green-600" : ""}>
                    • At least 8 characters long
                  </li>
                  <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                    • One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>
                    • One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                    • One number
                  </li>
                </ul>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                disabled={loading || passwordErrors.length > 0 || password !== confirmPassword}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Setting up account...</span>
                  </div>
                ) : (
                  "Complete Setup & Sign In"
                )}
              </Button>
              
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  By completing setup, you agree to our{" "}
                  <Link href="/terms" className="text-indigo-600 hover:text-indigo-700">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Almost there! Set your password to start exploring amazing meals 🍜✨
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CustomerMagicLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading</h2>
            <p className="text-gray-600">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <CustomerMagicLinkContent />
    </Suspense>
  )
}