import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIME_HORIZONS = [
  "2 años (2026-2027)",
  "3 años (2026-2028)",
  "5 años (2026-2030)",
  "10 años (2026-2035)",
  "15 años (2026-2040)",
  "20 años (2026-2045)",
  "Personalizado",
];

const INDUSTRIES = [
  "Manufactura",
  "Servicios Financieros",
  "Salud y Bienestar",
  "Educación",
  "Tecnología",
  "Retail y Comercio",
  "Construcción e Infraestructura",
  "Energía y Recursos Naturales",
  "Gobierno y Sector Público",
  "Logística y Transporte",
  "Alimentos y Bebidas",
  "Turismo y Hospitalidad",
  "Telecomunicaciones",
  "Consultoría y Servicios Profesionales",
  "ONG y Tercer Sector",
  "Otro",
];

interface ClientFormData {
  name: string;
  industry: string;
  timeHorizon: string;
  description: string;
}

const emptyForm: ClientFormData = {
  name: "",
  industry: "",
  timeHorizon: "",
  description: "",
};

function statusClass(status: string) {
  if (status === "completed") return "status-badge-completed";
  if (status === "archived") return "status-badge-archived";
  return "status-badge-active";
}

function statusLabel(status: string) {
  if (status === "completed") return "Completado";
  if (status === "archived") return "Archivado";
  return "Activo";
}

export default function Clients() {
  const utils = trpc.useUtils();
  const { data: clients = [], isLoading } = trpc.clients.list.useQuery();
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setShowForm(false);
      setForm(emptyForm);
      toast.success("Cliente creado exitosamente");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setEditingId(null);
      setForm(emptyForm);
      toast.success("Cliente actualizado");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDeleteId(null);
      toast.success("Cliente eliminado");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(client: (typeof clients)[0]) {
    setForm({
      name: client.name,
      industry: client.industry ?? "",
      timeHorizon: client.timeHorizon ?? "",
      description: client.description ?? "",
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("El nombre del cliente es requerido");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Clientes" }]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado{clients.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            Nuevo Cliente
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o industria..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
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
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Users size={28} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {search ? "Sin resultados" : "Sin clientes aún"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search
                    ? "Intenta con otro término de búsqueda"
                    : "Crea tu primer cliente para comenzar"}
                </p>
              </div>
              {!search && (
                <Button onClick={openCreate}>
                  <Plus size={16} className="mr-2" />
                  Crear primer cliente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <Card
                key={client.id}
                className="border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-foreground line-clamp-2 flex-1">
                      {client.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={statusClass(client.status)}>
                        {statusLabel(client.status)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(client)}>
                            <Edit size={14} className="mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(client.id)}
                          >
                            <Trash2 size={14} className="mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.industry && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 size={14} className="flex-shrink-0" />
                      <span className="truncate">{client.industry}</span>
                    </div>
                  )}
                  {client.timeHorizon && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} className="flex-shrink-0" />
                      <span className="truncate">{client.timeHorizon}</span>
                    </div>
                  )}
                  {client.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {client.description}
                    </p>
                  )}
                  <div className="pt-3 border-t border-border flex gap-2">
                    <Link href={`/clients/${client.id}/insights`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                        <Clock size={13} />
                        Insights
                      </Button>
                    </Link>
                    <Link href={`/clients/${client.id}/vision`} className="flex-1">
                      <Button size="sm" className="w-full text-xs gap-1.5">
                        <ArrowRight size={13} />
                        Visión
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setForm(emptyForm); setEditingId(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del cliente *</Label>
              <Input
                id="name"
                placeholder="Ej. Grupo Industrial Monterrey"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industria</Label>
              <Select
                value={form.industry}
                onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Selecciona una industria" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horizon">Horizonte de tiempo</Label>
              <Select
                value={form.timeHorizon}
                onValueChange={(v) => setForm((f) => ({ ...f, timeHorizon: v }))}
              >
                <SelectTrigger id="horizon">
                  <SelectValue placeholder="Selecciona el horizonte" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_HORIZONS.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción del proyecto</Label>
              <Textarea
                id="description"
                placeholder="Contexto general del cliente, sector, tamaño, retos principales..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el cliente y todos sus datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
