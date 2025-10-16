"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Permission } from "@/lib/types"

interface PermissionsMatrixProps {
  selectedPermissions: Permission[]
  onChange: (permissions: Permission[]) => void
  disabled?: boolean
}

const PERMISSION_GROUPS = {
  Business: ["business:read", "business:update", "business:disable"] as Permission[],
  Stalls: ["stall:create", "stall:update", "stall:delete"] as Permission[],
  Products: ["product:create", "product:update", "product:delete", "product:approve"] as Permission[],
  Orders: ["orders:create", "orders:view", "orders:fulfil", "orders:export"] as Permission[],
  Users: ["users:invite", "users:role:update"] as Permission[],
}

export function PermissionsMatrix({ selectedPermissions, onChange, disabled = false }: PermissionsMatrixProps) {
  const togglePermission = (permission: Permission) => {
    if (selectedPermissions.includes(permission)) {
      onChange(selectedPermissions.filter((p) => p !== permission))
    } else {
      onChange([...selectedPermissions, permission])
    }
  }

  const formatPermissionLabel = (permission: string) => {
    const parts = permission.split(":")
    return parts[parts.length - 1]
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>Select the permissions for this role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
            <div key={group} className="space-y-3">
              <h4 className="font-medium">{group}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                      disabled={disabled}
                    />
                    <Label htmlFor={permission} className="cursor-pointer text-sm">
                      {formatPermissionLabel(permission)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
