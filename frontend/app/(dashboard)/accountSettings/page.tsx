import AccountSettingsPanel from "./components/account-settings-panel";

export default async function Page() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
            Manage your account settings and set e.g. your profile
        </p>
      </div>
      <AccountSettingsPanel/>
    </div>
  )
}
