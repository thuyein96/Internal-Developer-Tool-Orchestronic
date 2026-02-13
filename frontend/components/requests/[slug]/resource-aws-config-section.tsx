import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Monitor, Database, HardDrive } from "lucide-react"
import Image from "next/image"
import { Status } from "@/types/api"
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
import { AwsRequestDetail } from "@/types/request"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import TextPassword from "@/components/ui/text-password"
import SSH from "../connect/ssh"
import InputWithCopyButton from "../connect/input-with-copy-button"
import { operatingSystems } from "../aws-resource-group-accordion/aws-resource-group-accordion-vm"
import { Spinner } from "@/components/ui/spinner"
import TextareaWithCopyButton from "../connect/textarea-with-copy-button"
import { Engine } from "@/types/resource"

export default function ResourceAwsConfigSection({
  data,
}: {
  data?: AwsRequestDetail
}) {
  return (
    <div className="w-full space-y-4">
      {data?.resources.resourceConfig.AwsVMInstance &&
        data.resources.resourceConfig.AwsVMInstance.length > 0 && (
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
                        {data.resources.resourceConfig.AwsVMInstance.length}{" "}
                        Virtual machines
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-4">
                    {data.resources.resourceConfig.AwsVMInstance.map(
                      (vm, index) => {
                        const os = operatingSystems.find(
                          (item) => item.value === vm.os
                        )

                        const terraformOutput = vm?.terraformState?.resources
                          ?.find((res) => res.name === "vm")
                          ?.instances.find(
                            (inst) =>
                              inst.attributes?.tags.Name === vm.instanceName
                          )

                        const public_ip_address =
                          terraformOutput?.attributes.public_ip

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
                                        Connect to {vm.instanceName}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription
                                        className="text-black"
                                        asChild
                                      >
                                        <div id="vm">
                                          {terraformOutput || vm.pem ? (
                                            <>
                                              <SSH
                                                ip={`root@${public_ip_address as string}`}
                                                pem={vm.pem}
                                                vmName={vm.instanceName}
                                              />
                                              <InputWithCopyButton
                                                label="SSH Command"
                                                value={`ssh -i <private-key-file-path> root@${public_ip_address as string}`}
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
                                    {vm.instanceName}
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
                                <div>
                                  <span className="font-medium text-foreground">
                                    CPU Cores:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {vm.AwsInstanceType.numberOfCores}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    RAM:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {(
                                      vm.AwsInstanceType.memoryInMB / 1024
                                    ).toFixed(1)}{" "}
                                    GB (
                                    <span className="text-xs">
                                      {vm.AwsInstanceType.memoryInMB} MB
                                    </span>
                                    )
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Key Pair:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {vm.keyName}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Security Group:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {vm.sgName}
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

      {/* Databases */}
      {data?.resources.resourceConfig.AwsDatabase &&
        data.resources.resourceConfig.AwsDatabase.length > 0 && (
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
                        {data.resources.resourceConfig.AwsDatabase.length}{" "}
                        Database
                        {data.resources.resourceConfig.AwsDatabase.length > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-4">
                    {data.resources.resourceConfig.AwsDatabase.map(
                      (db, index) => {
                        const mysqlInstances = db.terraformState?.resources
                          .find((res) => res.mode === "managed")
                          ?.instances.find(
                            (inst) =>
                              inst.attributes?.db_name === db.dbName &&
                              inst.attributes?.engine === "mysql"
                          )

                        const postgresInstances = db.terraformState?.resources
                          .find((res) => res.mode === "managed")
                          ?.instances.find(
                            (inst) =>
                              inst.attributes?.db_name === db.dbName &&
                              inst.attributes?.engine === "postgres"
                          )

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
                                        Connect to {db.dbName}
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
                                                value={`host=${mysqlInstances?.attributes.endpoint};\nport=3306;\ndbname=${mysqlInstances?.attributes?.db_name};\nuser=${mysqlInstances?.attributes?.username};\npassword=${mysqlInstances?.attributes?.password};`}
                                              />
                                            ) : (
                                              <p className="text-sm text-muted-foreground">
                                                <Spinner className="mt-4">
                                                  Provisioning MySQL
                                                  instance(s)... Please wait.
                                                </Spinner>
                                              </p>
                                            ))}

                                          {db.engine === Engine.PostgreSQL &&
                                            (postgresInstances ? (
                                              <TextareaWithCopyButton
                                                label={`Postgres Connection String`}
                                                value={`host=${postgresInstances?.attributes.endpoint};\nport=5432;\ndbname=${postgresInstances?.attributes?.db_name};\nuser=${postgresInstances?.attributes?.username};\npassword=${postgresInstances?.attributes?.password};`}
                                              />
                                            ) : (
                                              <p className="text-sm text-muted-foreground">
                                                <Spinner className="mt-4">
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
                                    {db.dbName}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Database Engine:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {db.dbInstanceClass.engine}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Username:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {db.dbUsername}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Password:
                                  </span>
                                  <div className="text-muted-foreground">
                                    <TextPassword
                                      text={db.dbPassword}
                                      copyButton={true}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    Instance Class:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {db.dbInstanceClass.DBInstanceClass} (
                                    {(
                                      db.dbInstanceClass.MaxStorageSize / 1024
                                    ).toFixed(1)}{" "}
                                    GB)
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

      {/* Storage */}
      {data?.resources.resourceConfig.AwsStorage &&
        data.resources.resourceConfig.AwsStorage.length > 0 && (
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
                        {data.resources.resourceConfig.AwsStorage.length}{" "}
                        Storage instance
                        {data.resources.resourceConfig.AwsStorage.length > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-4">
                    {data.resources.resourceConfig.AwsStorage.map(
                      (storage, index) => {
                        const output = storage.terraformState?.resources
                          .find((res) => res.mode === "managed")
                          ?.instances.find((inst) =>
                            inst.attributes?.bucket?.includes(
                              storage.bucketName
                            )
                          )

                        const region = output?.attributes.region
                        const arn = output?.attributes.arn
                        const bucket = output?.attributes.bucket

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
                                        Connect to {storage.bucketName}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription
                                        className="text-black"
                                        asChild
                                      >
                                        <div id="storage">
                                          {output ? (
                                            <TextareaWithCopyButton
                                              label="Connection String"
                                              value={`Bucket: ${bucket}\nRegion: ${region}\nARN: ${arn}`}
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
                                    Bucket Name:
                                  </span>
                                  <p className="text-muted-foreground">
                                    {storage.bucketName}
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
