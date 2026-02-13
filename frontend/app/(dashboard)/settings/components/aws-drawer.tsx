"use client"

import {
  getCloudConfig,
  updateCloudConfig,
  createCloudConfig,
} from "@/app/api/cloud/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import z from "zod"

export const awsFormSchema = z.object({
  clientId: z.string().nonempty({ message: "Client ID is required" }),
  clientSecret: z.string().nonempty({ message: "Client Secret is required" }),
  subscriptionId: z
    .string()
    .nonempty({ message: "Subscription ID is required" }),
  cloudProvider: z.string().nonempty({ message: "Cloud Provider is required" }),
})

export default function AwsDrawer() {
  const [showPasswords, setShowPasswords] = useState({
    clientId: false,
    clientSecret: false,
    subscriptionId: false,
  })

  const [alerts, setAlerts] = useState({
    showSuccessAlert: false,
    showErrorAlert: false,
    alertTitle: "",
    alertDescription: "",
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["cloudConfig", "AWS"],
    queryFn: () => getCloudConfig("AWS"),
  })

  const form = useForm<z.infer<typeof awsFormSchema>>({
    resolver: zodResolver(awsFormSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      subscriptionId: "",
      cloudProvider: "AWS",
    },
  })

  useEffect(() => {
    if (data) {
      form.reset({
        clientId: data.clientId || "",
        clientSecret: data.clientSecret || "",
        subscriptionId: data.subscriptionId || "",
        cloudProvider: "AWS",
      })
    }
  }, [data, form])

  function onSubmit(values: z.infer<typeof awsFormSchema>) {
    // If data exists, update (PATCH), otherwise create (POST)
    if (form.formState.isDirty) {
      if (data && data.id) {
        updateConfigMutation.mutate({ values, id: data.id })
      } else {
        createConfigMutation.mutate(values)
      }
    }
  }

  const updateConfigMutation = useMutation({
    mutationFn: ({
      values,
      id,
    }: {
      values: z.infer<typeof awsFormSchema>
      id: string
    }) => updateCloudConfig(values, id),
    onSuccess: () => {
      setAlerts({
        showSuccessAlert: true,
        showErrorAlert: false,
        alertTitle: "Configuration Updated",
        alertDescription:
          "Your AWS cloud configuration has been successfully updated.",
      })
    },
    onError: (error) => {
      setAlerts({
        showSuccessAlert: false,
        showErrorAlert: true,
        alertTitle: "Update Failed",
        alertDescription: `Failed to update AWS configuration: ${error.message}`,
      })
    },
  })

  const createConfigMutation = useMutation({
    mutationFn: (values: z.infer<typeof awsFormSchema>) =>
      createCloudConfig(values),
    onSuccess: () => {
      setAlerts({
        showSuccessAlert: true,
        showErrorAlert: false,
        alertTitle: "Configuration Created",
        alertDescription:
          "Your AWS cloud configuration has been successfully created.",
      })
    },
    onError: (error) => {
      setAlerts({
        showSuccessAlert: false,
        showErrorAlert: true,
        alertTitle: "Creation Failed",
        alertDescription: `Failed to create AWS configuration: ${error.message}`,
      })
    },
  })

  return (
    <Drawer direction="right">
      <DrawerTrigger className="flex items-center justify-center gap-2 hover:underline cursor-pointer">
        <Image
          src="/icon/aws.svg"
          alt="AWS Cloud Provider Icon"
          width={24}
          height={24}
        />
        AWS
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Configure AWS</DrawerTitle>
          <DrawerDescription>
            Set up your AWS cloud provider configuration.
          </DrawerDescription>
        </DrawerHeader>
        {error ? (
          <div>Error loading Azure config</div>
        ) : isLoading ? (
          <div>Loading...</div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full p-4 pb-0"
            >
              <div className="space-y-4 flex-1">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter Client ID"
                            type={showPasswords.clientId ? "text" : "password"}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                clientId: !prev.clientId,
                              }))
                            }
                          >
                            {showPasswords.clientId ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subscriptionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter Subscription ID"
                            type={
                              showPasswords.subscriptionId ? "text" : "password"
                            }
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                subscriptionId: !prev.subscriptionId,
                              }))
                            }
                          >
                            {showPasswords.subscriptionId ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter Client Secret"
                            type={
                              showPasswords.clientSecret ? "text" : "password"
                            }
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                clientSecret: !prev.clientSecret,
                              }))
                            }
                          >
                            {showPasswords.clientSecret ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end mb-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!form.formState.isDirty}
                >
                  {data ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DrawerContent>

      {/* Success Alert Dialog */}
      <AlertDialog
        open={alerts.showSuccessAlert}
        onOpenChange={(open) =>
          setAlerts((prev) => ({ ...prev, showSuccessAlert: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alerts.alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {alerts.alertDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Alert Dialog */}
      <AlertDialog
        open={alerts.showErrorAlert}
        onOpenChange={(open) =>
          setAlerts((prev) => ({ ...prev, showErrorAlert: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alerts.alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {alerts.alertDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  )
}
