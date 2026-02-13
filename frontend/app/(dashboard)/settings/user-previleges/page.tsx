import UserPrivilegesContent from "./components/user-privileges-content"

export default function Page() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Privileges</h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions for your team members.
          </p>
        </div>
      </div>
      <UserPrivilegesContent />
    </div>
  )
}
