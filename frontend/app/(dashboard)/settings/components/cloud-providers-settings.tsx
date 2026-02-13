import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@radix-ui/react-separator"
import AzureDrawer from "./azure-drawer"
import AwsDrawer from "./aws-drawer"

export default function CloudProvidersSettings() {
  return (
    <Accordion type="single" collapsible className="w-1/2">
      <AccordionItem value="cloud-providers">
        <AccordionTrigger className="cursor-pointer">
          Cloud Credentials
        </AccordionTrigger>
        <AccordionContent className="pl-4 space-y-4">
          <AzureDrawer />
          <AwsDrawer />
        </AccordionContent>
      </AccordionItem>
      <Separator />
    </Accordion>
  )
}
