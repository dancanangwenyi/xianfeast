"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

export default function MagicLinkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [step, setStep] = useState<"verifying" | "password" | "mfa" | "success" | "error">("verifying")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    if (!token) {
      setStep("error")
      setError("Invalid or missing invitation link")
      return
    }

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/auth/verify-magic-link?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        setStep("error")
        setError(data.error || "Invalid invitation link")
        return
      }

      setUserInfo({
        name: data.name,
        email: data.email,
        role: data.role,
      })
      setStep("password")
    } catch (err) {
      setStep("error")
      setError("Failed to verify invitation link")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to set up password")
        return
      }

      // Send MFA code
      await fetch("/api/auth/send-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userInfo?.email }),
      })

      setStep("mfa")
    } catch (err) {
      setError("An error occurred during password setup")
    } finally {
      setLoading(false)
    }
  }

  const handleMFAVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/auth/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: otpCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid verification code")
        return
      }

      setStep("success")
      
      // Redirect to appropriate dashboard after 2 seconds
      setTimeout(() => {
        if (data.role === "super_admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/dashboard")
        }
      }, 2000)
    } catch (err) {
      setError("An error occurred during verification")
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case "verifying":
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
            <p className="text-slate-600">Verifying your invitation link...</p>
          </div>
        )

      case "password":
        return (
          <form onSubmit={handlePasswordSetup} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Welcome, {userInfo?.name}!</h2>
              <p className="text-slate-600">Set up your password to get started</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-50 text-red-700 border border-red-200">
                Role: {userInfo?.role}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up password...
                </>
              ) : (
                "Set Up Password"
              )}
            </Button>
          </form>
        )

      case "mfa":
        return (
          <form onSubmit={handleMFAVerification} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Two-Factor Authentication</h2>
              <p className="text-slate-600">Enter the verification code sent to your email</p>
              <p className="text-sm text-slate-500">{userInfo?.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Complete Setup"
              )}
            </Button>
          </form>
        )

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
            <h2 className="text-2xl font-bold text-slate-900">Setup Complete!</h2>
            <p className="text-slate-600">Welcome to XianFeast, {userInfo?.name}!</p>
            <p className="text-sm text-slate-500">Redirecting to your dashboard...</p>
          </div>
        )

      case "error":
        return (
          <div className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-600" />
            <h2 className="text-2xl font-bold text-slate-900">Invalid Invitation</h2>
            <p className="text-slate-600">{error}</p>
            <Button onClick={() => router.push("/login")} variant="outline">
              Go to Login
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
                Complete Your Setup
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
