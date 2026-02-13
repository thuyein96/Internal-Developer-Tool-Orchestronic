"use client"
import SettingsSection from "./components/settings-section"

export default function Page() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Here&apos;s a list of your settings for managing your account and
          preferences!
        </p>
      </div>

      <SettingsSection />
    </div>
  )
}
