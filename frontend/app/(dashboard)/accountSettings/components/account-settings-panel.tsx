"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, Pencil, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getGitLabUrl, updateGitLabUrl } from "@/app/api/user/api"

export default function AccountSettingsPanel() {
  const [storedUrl, setStoredUrl] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [touched, setTouched] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const result = await getGitLabUrl()
        if (result) {
          setStoredUrl(result)
          setUrl(result)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const isValidGitLabUrl = (value: string) => {
    const regex = /^https?:\/\/[A-Za-z0-9.-]+(?::\d+)?\/[A-Za-z0-9._-]+\/?$/
    return regex.test(value)
  }

  const isValid = isValidGitLabUrl(url)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!touched) setTouched(true)
    setUrl(e.target.value)
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await updateGitLabUrl(url)
    setSaving(false)
    setSuccess(true)
    setStoredUrl(result.gitlabUrl ?? "")
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="w-full max-w-xl space-y-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-10 bg-muted rounded" />
      </div>
    )
  }

  if (storedUrl && !editing) {
    return (
      <div className="w-full max-w-xl space-y-6">
        <h3 className="text-lg font-semibold">GitLab Account</h3>

        <div className="p-4 border rounded-lg flex justify-between items-center">
          <p className="font-medium">{storedUrl}</p>

          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil size={16} className="mr-2" />
            Edit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl space-y-8">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">GitLab Account</h3>
        <p className="text-sm text-muted-foreground">
          Connect your GitLab profile to manage CI/CD, pipelines and
          deployments.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="gitlabUrl">GitLab Profile URL</Label>

        <Input
          id="gitlabUrl"
          placeholder="http://52.229.218.173:8000/username"
          value={url}
          onChange={handleChange}
          className={cn(
            "transition-all",
            touched && !isValid && "border-red-500 focus-visible:ring-red-500"
          )}
        />

        {touched && !isValid && url.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle size={15} />
            Please enter a valid GitLab profile URL.
          </p>
        )}

        {success && (
          <p className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 size={15} />
            GitLab URL saved!
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>

        <Button disabled={!isValid || saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
