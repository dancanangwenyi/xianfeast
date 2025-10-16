import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-balance">XianFeast</h1>
          <p className="text-xl text-muted-foreground text-balance">
            The Immortal Dining - A modern meal ordering platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">For Customers</h3>
            <p className="text-sm text-muted-foreground mb-4">Browse menus, schedule orders, and track deliveries</p>
            <Button asChild className="w-full">
              <Link href="/orders/new">Place Order</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">For Merchants</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage products, fulfill orders, and grow your business
            </p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/products">Manage Products</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">For Admins</h3>
            <p className="text-sm text-muted-foreground mb-4">Oversee operations, manage teams, and view analytics</p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/orders">View Orders</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">Powered by Google Sheets & Drive</p>
        </div>
      </div>
    </div>
  )
}
