"use client"

import { useState, useEffect, ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { formatRepoName } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"
import { Label } from "@/components/ui/label"
import checkRepositoryAvailability from "@/app/api/repository/api"
import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/app/state/store"
import { setRepoName } from "./state/repo-slice"

interface RepoNameInputProps<T extends FieldValues> {
  // suggestedName: string
  ownerName: string
  form: UseFormReturn<T>
}

export function RepoNameInput<T extends FieldValues>({
  // suggestedName,
  ownerName,
  form,
}: RepoNameInputProps<T>) {
  const repoName = useSelector((state: RootState) => state.repoName.value)
  const dispatch = useDispatch()
  const debouncedRepoName = useDebounce(repoName, 500)

  const [message, setMessage] = useState<ReactNode>(null)
  const [hasTyped, setHasTyped] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["repoName", debouncedRepoName],
    queryFn: () => checkRepositoryAvailability(debouncedRepoName),
    enabled: !!debouncedRepoName,
  })

  useEffect(() => {
    if (repoName === debouncedRepoName) {
      setIsTyping(false)
    }
  }, [debouncedRepoName, repoName])

  useEffect(() => {
    if (!hasTyped) return

    if (repoName !== debouncedRepoName) return

    function checkAvailability(name: string) {
      // if (checkBlank(name)) {
      //   setMessage(
      //     <span className="text-muted-foreground text-xs">
      //       ❌ Name cannot be blank
      //     </span>
      //   )
      //   return
      // }

      // if (!validateFormat(name)) {
      //   setMessage(
      //     <>
      //       <span className="text-green-700 font-bold text-xs">
      //         ✅ Your new repository will be created as {formatRepoName(name)}.
      //       </span>
      //       <br />
      //       <span className="text-muted-foreground text-xs">
      //         The repository name can only contain ASCII letters, digits, and
      //         the characters ., -, and _.
      //       </span>
      //     </>
      //   )
      //   return
      // }

      const regex = /^[a-z0-9._-]+$/
      if (!(regex.test(name) && name.length >= 3 && name.length <= 24)) {
        setMessage(
          <>
            <span className="text-red-700 font-bold text-xs">
              ❌ {name} is not available.
            </span>
            <br />
            <span className="text-muted-foreground text-xs">
              Repository names must be 3-24 characters long and may only include
              lowercase letters, digits, and the symbols ., -, and _.
            </span>
          </>
        )
        return
      }

      if (data?.exists) {
        setMessage(
          <span className="text-red-700 text-xs font-bold">
            ❌ The repository {formatRepoName(name)} already exists on this
            account.
          </span>
        )
        return
      }

      setMessage(
        <span className="text-green-700 font-bold text-xs">
          ✅ {name} is available.
        </span>
      )
    }

    checkAvailability(debouncedRepoName)
  }, [data?.exists, debouncedRepoName, hasTyped, repoName])

  // function handleGenerate() {
  //   setHasTyped(true)
  //   dispatch(setRepoName(suggestedName))
  //   form.clearErrors("repository.name")
  // }

  if (error) {
    return (
      <p className="text-red-700 text-xs font-bold">Error: {error.message}</p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a new repository</CardTitle>
        <CardDescription>
          A repository contains all project files, including the revision
          history.
        </CardDescription>
        <Separator />
        <CardDescription>
          Required fields are marked with an asterisk (*).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex mb-3">
          <div className="h-full grid gap-4">
            <Label htmlFor="owner">Owner *</Label>
            <p className="font-medium">{ownerName}</p>
          </div>

          <div className="px-2 mt-6">
            <p className="font-semibold text-2xl">/</p>
          </div>

          <div className="h-full">
            <FormField
              control={form.control}
              name={"repository.name" as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-1">Repository name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-50"
                      value={repoName}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        setIsTyping(true)
                        setHasTyped(true)
                        dispatch(setRepoName(e.target.value))
                      }}
                    />
                  </FormControl>
                  <FormMessage>
                    {isTyping || isLoading ? (
                      <span className="text-muted-foreground text-xs">
                        Checking availability...
                      </span>
                    ) : (
                      message
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>
        </div>
        {/* <p className="text-muted-foreground text-sm">
          Great repository names are short and memorable. Need inspiration? How
          about{" "}
          <Button
            type="button"
            variant="ghost"
            onClick={handleGenerate}
            value={suggestedName}
            className="text-green-700 font-bold px-0 py-0 hover:text-green-800 hover:bg-transparent"
          >
            {suggestedName}
          </Button>{" "}
          ?
        </p> */}
        <FormField
          control={form.control}
          name={"repository.description" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="gap-1">
                Description
                <span className="text-muted-foreground text-sm">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Briefly describe your repository"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
