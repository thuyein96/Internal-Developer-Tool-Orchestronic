import PolicySection from "./components/policy-section"

export default async function Page() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Policies</h2>
        <p className="text-muted-foreground">
          Here&apos;s a list of your policies for provisioning infrastructure!
        </p>
      </div>

      <PolicySection />
    </div>
  )
}
