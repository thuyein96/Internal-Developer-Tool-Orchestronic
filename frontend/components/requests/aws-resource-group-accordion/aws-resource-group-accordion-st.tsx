import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useEffect, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import z from "zod"
import { awsRequestFormSchema } from "../form-schema/aws"

interface ResourceGroupAccordionProps {
  form: UseFormReturn<z.infer<typeof awsRequestFormSchema>>
  storageCount: number
}

export function AwsResourceGroupAccordionST({
  form,
  storageCount,
}: Readonly<ResourceGroupAccordionProps>) {
  const lastStorageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (lastStorageRef.current) {
      lastStorageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [storageCount])

  return (
    <div className="grid gap-6">
      {storageCount > 0 && (
        <Accordion type="single" collapsible>
          {Array.from({ length: storageCount }).map((_, i) => (
            <AccordionItem
              key={i}
              value={`storage-${i}`}
              ref={i === Math.floor(storageCount / 3) ? lastStorageRef : null}
            >
              <AccordionTrigger className="cursor-pointer">
                Storage #{i + 1}
              </AccordionTrigger>
              <AccordionContent forceMount>
                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <div>
                      <CardTitle>Storage #{i + 1}</CardTitle>
                      <CardDescription>
                        Configure storage settings
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name={`resources.resourceConfig.sts.${i}.bucketName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bucket name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., mystorage123"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
