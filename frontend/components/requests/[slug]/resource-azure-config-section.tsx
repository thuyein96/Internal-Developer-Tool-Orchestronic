import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Monitor, Database, HardDrive } from "lucide-react"
import { operatingSystems } from "../azure-resource-group-accordion/azure-resource-group-accordion-vm"
import Image from "next/image"
import { Status } from "@/types/api"
import { cn, formatMB } from "@/lib/utils"
import { Engine } from "@/types/resource"
import { AzureRequestDetail } from "@/types/request"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import SSH from "../connect/ssh"
import TextPassword from "@/components/ui/text-password"
import InputWithCopyButton from "../connect/input-with-copy-button"
import TextareaWithCopyButton from "../connect/textarea-with-copy-button"
import { databaseEngines } from "../azure-resource-group-accordion/azure-resource-group-accordion-db"
import { Spinner } from "@/components/ui/spinner"

export default function ResourceAzureConfigSection({
  data,
}: {
  data?: AzureRequestDetail
}) {
  return (
    <div className="w-full space-y-4">
      {data?.resources.resourceConfig.AzureVMInstance &&
        data.resources.resourceConfig.AzureVMInstance.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="vms" asChild className="py-0">
              <Card className="rounded-sm">
                <AccordionTrigger className="p-4 text-left items-center cursor-pointer">
                  <div className="flex gap-2 items-center">
                    <Monitor size={40} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Virtual Machines</p>
                      <p className="text-xs text-muted-foreground">
                        Request for{" "}
                        {data.resources.resourceConfig.AzureVMInstance.length}{" "}
                        Virtual machines
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-4">
                    {data.resources.resourceConfig.AzureVMInstance.map(
                      (vm, index) => {
                        const os = operatingSystems.find(
                          (item) => item.value === vm.os
                        )

                        const terraformOutput = vm?.terraformState?.resources
                          ?.find((res) => res.name === "vm")
                          ?.instances.find((inst) =>
                            inst.attributes?.name?.includes(vm.name)
                          )

                        const public_ip_address =
                          terraformOutput?.attributes.public_ip_address

                        return (
                          <div key={`vm-${index}`}>
                            {data.status === Status.Approved && (
                              <div className="flex mb-1">
                                <AlertDialog>
                                  <AlertDialogTrigger
                                    className={cn(
                                      buttonVariants({
                                        variant: "default",
                                      }),
                                      "ml-auto"
                                    )}
                                  >
                                    Connect
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Connect to {vm.name}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription
                                        className="text-black"
                                        asChild
                                      >
                                        <div id="vm">
                                          {terraformOutput || vm.pem ? (
                                            <>
                                              <SSH
                                                ip={`azureuser@${public_ip_address as string}`}
                                                pem={vm.pem}
                                                vmName={vm.name}
                                              />
                                              <InputWithCopyButton
                                                label="SSH Command"
                                                value={`ssh -i <private-key-file-path> azureuser@${public_ip_address as string}`}
                                              />
                                            </>
                                          ) : (
                                            <p className="text-sm text-muted-foreground">
                                              <Spinner className="mt-4">
                                                Provisioning in progress. Please
                                                wait...
                                              </Spinner>
                                            </p>
                                          )}
                                        </div>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogAction>
                                        Continue
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}

                            <div className="border rounded-lg p-4 bg-muted/50">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-foreground">
                                    VM Name:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {vm.name}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Size:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {vm.size.name}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    CPU Cores:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {vm.size.numberOfCores}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    RAM:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {(vm.size.memoryInMB / 1024).toFixed(1)} GB
                                    (
                                    <span className="text-xs">
                                      {vm.size.memoryInMB} MB
                                    </span>
                                    )
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Operating System:
                                  </span>
                                  {os && (
                                    <p className="flex gap-1">
                                      <Image
                                        src={os?.icon}
                                        width={16}
                                        height={16}
                                        alt={`${os?.label} Icon`}
                                      />
                                      <span className="text-muted-foreground">
                                        {os?.label}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

      {/* Databases */}
      {data?.resources.resourceConfig.AzureDatabase &&
        data.resources.resourceConfig.AzureDatabase.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="dbs" asChild className="py-0 ">
              <Card className=" rounded-sm">
                <AccordionTrigger className="p-4 text-left items-center cursor-pointer">
                  <div className="flex gap-2 items-center">
                    <Database size={40} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Databases</p>
                      <p className="text-xs text-muted-foreground">
                        Request for{" "}
                        {data.resources.resourceConfig.AzureDatabase.length}{" "}
                        Database
                        {data.resources.resourceConfig.AzureDatabase.length > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-4">
                    {data.resources.resourceConfig.AzureDatabase.map(
                      (db, index) => {
                        const mysqlInstances = db.terraformState?.resources
                          .find(
                            (res) =>
                              res.mode === "managed" && res.name === "mysql"
                          )
                          ?.instances.find(
                            (inst) =>
                              inst.attributes?.administrator_login ===
                                db.username &&
                              inst.attributes?.administrator_password ===
                                db.password
                          )

                        console.log(db.terraformState?.resources)

                        const postgresInstances = db.terraformState?.resources
                          .find(
                            (res) =>
                              res.mode === "managed" && res.name === "postgres"
                          )
                          ?.instances.find(
                            (inst) =>
                              inst.attributes?.administrator_login ===
                                db.username &&
                              inst.attributes?.administrator_password ===
                                db.password
                          )

                        console.log(db.terraformState?.resources)

                        return (
                          <div key={`db-${index}`}>
                            {data.status === Status.Approved && (
                              <div className="flex mb-1">
                                <AlertDialog>
                                  <AlertDialogTrigger
                                    className={cn(
                                      buttonVariants({
                                        variant: "default",
                                      }),
                                      "ml-auto"
                                    )}
                                  >
                                    Connect
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Connect to {db.name}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription
                                        className="text-black"
                                        asChild
                                      >
                                        <div id="db">
                                          {db.engine === Engine.MySQL &&
                                            (mysqlInstances ? (
                                              <TextareaWithCopyButton
                                                label={`MySQL Connection String`}
                                                value={`host=${mysqlInstances?.attributes.fqdn};\nport=3306;\ndbname=${mysqlInstances?.attributes?.name};\nuser=${mysqlInstances?.attributes.administrator_login};\npassword=${mysqlInstances?.attributes.administrator_password};\nssl-mode=require`}
                                              />
                                            ) : (
                                              <p className="text-sm text-muted-foreground">
                                                <Spinner>
                                                  Provisioning MySQL
                                                  instance(s)... Please wait.
                                                </Spinner>
                                              </p>
                                            ))}

                                          {db.engine === Engine.PostgreSQL &&
                                            (postgresInstances ? (
                                              <TextareaWithCopyButton
                                                label={`Postgres Connection String`}
                                                value={`host=${postgresInstances?.attributes.fqdn};\nport=5432;\ndbname=${postgresInstances?.attributes?.name};\nuser=${postgresInstances?.attributes.administrator_login};\npassword=${postgresInstances?.attributes.administrator_password}`}
                                              />
                                            ) : (
                                              <p className="text-sm text-muted-foreground">
                                                <Spinner>
                                                  Provisioning Postgres
                                                  instance(s)... Please wait.
                                                </Spinner>
                                              </p>
                                            ))}
                                        </div>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogAction>
                                        Continue
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}

                            <div className="border rounded-lg p-4 bg-muted/50">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-foreground">
                                    Name:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {db.name}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Database Engine:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {db.engine}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Username:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {db.username}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Password:
                                  </span>
                                  <div className="text-muted-foreground">
                                    <TextPassword
                                      text={db.password}
                                      copyButton={true}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Tier / Size:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {
                                      databaseEngines.find(
                                        (item) => item.SKU === db.skuName
                                      )?.userOption
                                    }
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    SKU:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {db.skuName}
                                  </p>
                                </div>
                                {db.engine === Engine.PostgreSQL && (
                                  <div>
                                    <span className="font-medium text-foreground">
                                      Storage:
                                    </span>
                                    <p className="text-muted-foreground">
                                      {formatMB(db.storageGB)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

      {/* Storage */}
      {data?.resources.resourceConfig.AzureStorage &&
        data.resources.resourceConfig.AzureStorage.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sts" asChild className="py-0 ">
              <Card className=" rounded-sm">
                <AccordionTrigger className="p-4 text-left items-center cursor-pointer">
                  <div className="flex gap-2 items-center">
                    <HardDrive size={40} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Storage</p>
                      <p className="text-xs text-muted-foreground">
                        Request for{" "}
                        {data.resources.resourceConfig.AzureStorage.length}{" "}
                        Storage instance
                        {data.resources.resourceConfig.AzureStorage.length > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-4">
                    {data.resources.resourceConfig.AzureStorage.map(
                      (storage, index) => {
                        const output = storage.terraformState?.resources
                          .find((res) => res.mode === "managed")
                          ?.instances.find((inst) =>
                            inst.attributes?.name?.includes(storage.name)
                          )

                        const blob_connection_string =
                          output?.attributes.primary_blob_connection_string

                        return (
                          <div key={`storage-${index}`}>
                            {data.status === Status.Approved && (
                              <div className="flex mb-1">
                                <AlertDialog>
                                  <AlertDialogTrigger
                                    className={cn(
                                      buttonVariants({
                                        variant: "default",
                                      }),
                                      "ml-auto"
                                    )}
                                  >
                                    Connect
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Connect to {storage.name}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription
                                        className="text-black"
                                        asChild
                                      >
                                        <div id="storage">
                                          {output ? (
                                            <TextareaWithCopyButton
                                              label="Connection String"
                                              value={
                                                blob_connection_string?.replaceAll(
                                                  ";",
                                                  ";\n"
                                                ) || "None"
                                              }
                                            />
                                          ) : (
                                            <p className="text-sm text-muted-foreground">
                                              <Spinner className="mt-4">
                                                Provisioning in progress. Please
                                                wait...
                                              </Spinner>
                                            </p>
                                          )}
                                        </div>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogAction>
                                        Continue
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}

                            <div className="border rounded-lg p-4 bg-muted/50">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-foreground">
                                    Name:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {storage.name}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Access Tier:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {storage.accessTier}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    SKU:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {storage.sku}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Kind:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {storage.kind}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}
    </div>
  )
}
