"use client"
import NavBar from "@/components/landing-page/nav-bar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import {
  Cloud,
  Shield,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  Server,
  Database,
  Monitor,
  Clock,
  Lock,
  Gauge,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4 mt-8">
        <NavBar />
      </div>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              🚀 Now Available
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
              Provision Cloud Resources
              <span className="text-blue-600"> Effortlessly</span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-muted-foreground">
              Governed, Secure, Automated.
            </h2>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
              Empowers developers to request infrastructure in minutes with
              enterprise-grade governance and security controls.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="lg" className="text-base px-8 py-3" asChild>
                    <Link href="/login">
                      Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Not Available</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-8 py-3"
                  >
                    Request a Demo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Not Available</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <Image
                  src="/landing-page/product-display-1.png"
                  alt="Orchestronic Platform Dashboard"
                  width={1200}
                  height={675}
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Orchestronic?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built for modern development teams who need fast, secure, and
                governed cloud resource provisioning.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>DevSecOps Ready</CardTitle>
                  <CardDescription>
                    Streamline resource requests with automation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        One-click resource requests
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Automated provisioning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Real-time status updates</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>Enterprise Compliance</CardTitle>
                  <CardDescription>
                    Built-in governance and compliance controls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Role-based access control</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Approval workflows</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Audit trails</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit">
                    <Cloud className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle>Multi-Cloud Ready</CardTitle>
                  <CardDescription>Support AWS and Azure</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Unified interface</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Cost optimization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Resource tagging</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Provision Any Resource
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From virtual machines to databases, storage, and networking -
                request everything you need.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-6 rounded-lg border bg-card">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Server className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Virtual Machines</h3>
                  <p className="text-sm text-muted-foreground">
                    Linux (Ubuntu)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-lg border bg-card">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Databases</h3>
                  <p className="text-sm text-muted-foreground">
                    SQL solutions (MySQL and PostgreSQL)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-lg border bg-card">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Monitor className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Block, file & object storage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-lg border bg-card">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Team Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Collaborative workspaces
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-lg border bg-card">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Security Groups</h3>
                  <p className="text-sm text-muted-foreground">
                    Network & firewall rules
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-lg border bg-card">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <Gauge className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Performance insights
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Cloud Operations?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of developers who are already using Orchestronic to
              streamline their cloud infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-base px-8 py-3"
                    asChild
                  >
                    <Link href="#">
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Not Available</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-8 py-3 border-white text-blue-600 hover:text-blue-800"
                  >
                    Schedule Demo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Not Available</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-muted/30 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Orchestronic</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cloud resource provisioning made simple, secure, and fast.
              </p>
              <div className="flex gap-1 items-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  24/7 Support
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Orchestronic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
