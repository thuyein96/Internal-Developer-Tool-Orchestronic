import CloudProvidersSettings from "./cloud-providers-settings"
import Link from "next/link"

export default function SettingsSection() {
  return (
    <>
      <CloudProvidersSettings />
      <Link
        className="text-sm font-medium hover:underline"
        href="/settings/user-previleges"
      >
        User Privileges
      </Link>
    </>
  )
}
