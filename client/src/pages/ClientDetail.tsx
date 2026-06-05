import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Building2, Calendar, Eye, Lightbulb } from "lucide-react";
import { Link, useParams } from "wouter";

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const clientId = parseInt(params.id ?? "0");

  const { data: client, isLoading } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  );

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Clientes", href: "/clients" }, { label: "..." }]}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Clientes", href: "/clients" }, { label: "No encontrado" }]}>
        <div className="p-6 max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">Cliente no encontrado.</p>
          <Link href="/clients">
            <Button className="mt-4">Volver a clientes</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Clientes", href: "/clients" },
        { label: client.name },
      ]}
    >
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            {client.industry && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 size={14} /> {client.industry}
              </span>
            )}
            {client.timeHorizon && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar size={14} /> {client.timeHorizon}
              </span>
            )}
          </div>
          {client.description && (
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{client.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={`/clients/${clientId}/insights`}>
            <a className="block">
              <Card className="border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group h-full">
                <CardContent className="pt-6 flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Lightbulb size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Insights de Sesiones
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Carga documentos y texto de las sesiones de planeación estratégica.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-primary mt-auto">
                    Gestionar insights <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>

          <Link href={`/clients/${clientId}/vision`}>
            <a className="block">
              <Card className="border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group h-full">
                <CardContent className="pt-6 flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Eye size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Declaración de Visión
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Genera, refina y exporta la declaración de visión estratégica con IA.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-primary mt-auto">
                    Generar visión <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
