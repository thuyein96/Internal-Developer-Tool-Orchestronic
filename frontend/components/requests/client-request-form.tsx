"use client"

import Collaborators from "@/components/requests/collaborators"
import AzureResourceGroup from "@/components/requests/azure-resource-group"
import { CloudProvider, cloudProviders, regions } from "@/types/resource"
import { Textarea } from "@/components/ui/textarea"
import { RepoNameInput } from "@/components/requests/repo-name-input"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import z from "zod"
import { FieldValues, useForm, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/app/state/store"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createRequestAws, createRequestAzure } from "@/app/api/requests/api"
import { useMutation, useQuery } from "@tanstack/react-query"
import { User } from "@/types/api"
import AlertError from "../ui/alert-error"
import { azureRequestFormSchema } from "./form-schema/azure"
import AwsResourceGroup from "./aws-resource-group"
import { awsRequestFormSchema } from "./form-schema/aws"
import PopupSpinner from "../ui/popup-spinner"
import { setRepoName } from "./state/repo-slice"
import { fetcher } from "@/lib/fetcher"
import { extractGitlabUsername, getGitLabUrl } from "@/app/api/user/api"

interface ClientRequestFormProps {
  // suggestedName: string
  session?: User
}

export default function ClientRequestForm({
  // suggestedName,
}: Readonly<ClientRequestFormProps>) {
  const repoName = useSelector((state: RootState) => state.repoName.value)
  const dispatch = useDispatch()
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState<{
    show: boolean
    provider: CloudProvider | null
  }>({ show: false, provider: null })
  const [error, setError] = useState<string | null>(null)
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>(
    CloudProvider.AZURE
  )

  const azureMutation = useMutation({
    mutationFn: (values: z.infer<typeof azureRequestFormSchema>) => {
      return createRequestAzure(values)
    },
    onSuccess: () => {
      setShowSuccess({ show: true, provider: CloudProvider.AZURE })
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const awsMutation = useMutation({
    mutationFn: (values: z.infer<typeof awsRequestFormSchema>) => {
      return createRequestAws(values)
    },
    onSuccess: () => {
      setShowSuccess({ show: true, provider: CloudProvider.AWS })
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const azureRequestForm = useForm<z.infer<typeof azureRequestFormSchema>>({
    resolver: zodResolver(azureRequestFormSchema),
    defaultValues: {
      repository: {
        description: "",
      },
      resources: {
        cloudProvider: cloudProviders.find(
          (cp) => cp.value === CloudProvider.AZURE
        )?.value as CloudProvider,
        region: regions[CloudProvider.AZURE][0].value,
      },
    },
    mode: "onChange",
  })

  const awsRequestForm = useForm<z.infer<typeof awsRequestFormSchema>>({
    resolver: zodResolver(awsRequestFormSchema),
    defaultValues: {
      repository: {
        description: "",
      },
      resources: {
        cloudProvider: cloudProviders.find(
          (cp) => cp.value === CloudProvider.AWS
        )?.value as CloudProvider,
        region: regions[CloudProvider.AWS][0].value,
      },
    },
    mode: "onChange",
  })

  const { data: gitlabUrl } = useQuery({
    queryKey: ["gitlab-url"],
    queryFn: getGitLabUrl,
  })

  const gitlabUsername = extractGitlabUsername(gitlabUrl || "")

  useEffect(() => {
    if (repoName) {
      azureRequestForm.setValue("resources.name", `rg-${repoName}`)
      azureRequestForm.setValue("repository.name", repoName)
      awsRequestForm.setValue("resources.name", `rg-${repoName}`)
      awsRequestForm.setValue("repository.name", repoName)
    }
  }, [repoName, azureRequestForm, awsRequestForm])

  useEffect(() => {
    awsRequestForm.reset()
    azureRequestForm.reset()
    awsRequestForm.clearErrors()
    azureRequestForm.clearErrors()
    dispatch(setRepoName(""))
  }, [cloudProvider])

  async function onSubmitAzure(values: z.infer<typeof azureRequestFormSchema>) {
    azureMutation.mutate(values)
  }

  async function onSubmitAws(values: z.infer<typeof awsRequestFormSchema>) {
    awsMutation.mutate(values)
  }

  const handleSuccessClose = () => {
    setShowSuccess({ show: false, provider: null })
    if (showSuccess.provider === CloudProvider.AWS)
      router.push(`/requests/${awsMutation.data?.displayCode}`)
    if (showSuccess.provider === CloudProvider.AZURE)
      router.push(`/requests/${azureMutation.data?.displayCode}`)
  }

  const { data: dbPolicy } = useQuery({
    queryKey: ["dbPolicy"],
    queryFn: async () => {
      return fetcher(
        `${process.env.NEXT_PUBLIC_API_URL}/${cloudProvider.toLowerCase()}/policy/database`
      )
    },
  })

  return (
    <>
      {(awsMutation.isPending || azureMutation.isPending) && (
        <PopupSpinner
          open={awsMutation.isPending || azureMutation.isPending}
          title="Submitting your request..."
        />
      )}
      {error && (
        <AlertError
          title="Error creating request"
          description="There was an error creating your request."
          content={error}
        />
      )}

      <AlertDialogError form={azureRequestForm} />
      <AlertDialogError form={awsRequestForm} />
      <AlertDialogSuccess
        isOpen={showSuccess.show}
        onClose={handleSuccessClose}
      />

      {cloudProvider === CloudProvider.AZURE && (
        <Form {...azureRequestForm}>
          <form
            onSubmit={azureRequestForm.handleSubmit(onSubmitAzure)}
            className="space-y-8"
          >
            <RepoNameInput
              // ownerName={session?.name ?? "Your Account"}
              ownerName={gitlabUsername ?? "Your Account"}
              form={azureRequestForm}
            />
            <Collaborators form={azureRequestForm} />
            <AzureResourceGroup
              form={azureRequestForm}
              cloudProvider={cloudProvider}
              setCloudProvider={setCloudProvider}
              dbPolicy={dbPolicy}
            />
            <FormField
              control={azureRequestForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide any additional context or details for your request"
                      className="h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={azureMutation.isPending}>
                {azureMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {cloudProvider === CloudProvider.AWS && (
        <Form {...awsRequestForm}>
          <form
            onSubmit={awsRequestForm.handleSubmit(onSubmitAws)}
            className="space-y-8"
          >
            <RepoNameInput
              // ownerName={session?.name ?? "Your Account"}
              ownerName={gitlabUsername ?? "Your Account"}
              form={awsRequestForm}
            />
            <Collaborators form={awsRequestForm} />
            <AwsResourceGroup
              form={awsRequestForm}
              cloudProvider={cloudProvider}
              setCloudProvider={setCloudProvider}
              dbPolicy={dbPolicy}
            />
            <FormField
              control={awsRequestForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide any additional context or details for your request"
                      className="h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={awsMutation.isPending}>
                {awsMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </>
  )
}

function AlertDialogError<T extends FieldValues>({
  form,
}: {
  form: UseFormReturn<T>
}) {
  const [hasErrors, setHasErrors] = useState<boolean>(false)

  useEffect(() => {
    const resourcesError = form.formState.errors.resources
    let hasResourceConfigError = false
    if (
      resourcesError &&
      typeof resourcesError === "object" &&
      "resourceConfig" in resourcesError &&
      resourcesError.resourceConfig &&
      typeof resourcesError.resourceConfig === "object" &&
      "message" in resourcesError.resourceConfig
    ) {
      hasResourceConfigError =
        resourcesError.resourceConfig.message === "Required" ||
        resourcesError.resourceConfig.message ===
          "At least one resource (VM, Database, or Storage) is required"
    }
    setHasErrors(hasResourceConfigError)
  }, [form.formState.errors])

  return (
    <AlertDialog open={hasErrors}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Form Validation Errors</AlertDialogTitle>
          <AlertDialogDescription>
            Please fix the following errors before submitting:
          </AlertDialogDescription>
          <ul className="mt-2 list-disc list-inside">
            <li className="text-red-600">
              At least one resource (VM, Database, or Storage) is required
            </li>
          </ul>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setHasErrors(false)}>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AlertDialogSuccess({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Request Created Successfully!</AlertDialogTitle>
          <AlertDialogDescription>
            Your request has been submitted successfully. You will be redirected
            to the requests page to view your submission.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            Go to Requests
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
