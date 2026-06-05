import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Lightbulb,
  Plus,
  Users,
} from "lucide-react";
import { Link } from "wouter";

function statusLabel(status: string) {
  if (status === "completed") return "Completado";
  if (status === "archived") return "Archivado";
  return "Activo";
}

function statusClass(status: string) {
  if (status === "completed") return "status-badge-completed";
  if (status === "archived") return "status-badge-archived";
  return "status-badge-active";
}

export default function Dashboard() {
  const { data: clients = [], isLoading } = trpc.clients.list.useQuery();

  const activeClients = clients.filter((c) => c.status === "active");
  const completedClients = clients.filter((c) => c.status === "completed");

  return (
    <AppLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestión de proyectos de planeación estratégica
            </p>
          </div>
          <Link href="/clients">
            <Button className="gap-2">
              <Plus size={16} />
              Nuevo Cliente
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                  <p className="text-sm text-muted-foreground">Total clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Clock size={22} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeClients.length}</p>
                  <p className="text-sm text-muted-foreground">Proyectos activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedClients.length}</p>
                  <p className="text-sm text-muted-foreground">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
            <Link href="/clients">
              <a className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </a>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Users size={28} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sin clientes aún</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crea tu primer cliente para comenzar a generar declaraciones de visión
                  </p>
                </div>
                <Link href="/clients">
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Crear primer cliente
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.slice(0, 6).map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <a className="block group">
                    <Card className="border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {client.name}
                          </CardTitle>
                          <span className={cn("flex-shrink-0", statusClass(client.status))}>
                            {statusLabel(client.status)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {client.industry && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText size={14} />
                            <span className="truncate">{client.industry}</span>
                          </div>
                        )}
                        {client.timeHorizon && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock size={14} />
                            <span>{client.timeHorizon}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-2 border-t border-border">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Lightbulb size={13} />
                            <span>Insights</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                            <Eye size={13} />
                            <span>Ver proyecto</span>
                            <ArrowRight
                              size={12}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick guide — only when no clients */}
        {clients.length === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lightbulb size={18} className="text-primary" />
                ¿Cómo funciona?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    step: "1",
                    title: "Crea un cliente",
                    desc: "Registra el cliente con su industria y horizonte de tiempo.",
                  },
                  {
                    step: "2",
                    title: "Carga insights",
                    desc: "Sube documentos o texto de las sesiones de planeación.",
                  },
                  {
                    step: "3",
                    title: "Genera la Visión",
                    desc: "La IA redacta una declaración de visión personalizada lista para plenaria.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
