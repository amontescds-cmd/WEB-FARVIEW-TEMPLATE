import AppLayout from "@/components/AppLayout";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  History,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";

export default function VisionPage() {
  const params = useParams<{ id: string }>();
  const clientId = parseInt(params.id ?? "0");
  const utils = trpc.useUtils();

  const { data: client } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  );
  const { data: insights = [] } = trpc.insights.list.useQuery(
    { clientId },
    { enabled: !!clientId }
  );
  const { data: versions = [], isLoading: versionsLoading } =
    trpc.vision.listVersions.useQuery({ clientId }, { enabled: !!clientId });

  const generateMutation = trpc.vision.generate.useMutation({
    onSuccess: () => {
      utils.vision.listVersions.invalidate({ clientId });
      setRefinementInstructions("");
      toast.success("¡Visión generada exitosamente!");
    },
    onError: (e) => toast.error(e.message),
  });

  const setFinalMutation = trpc.vision.setFinal.useMutation({
    onSuccess: () => {
      utils.vision.listVersions.invalidate({ clientId });
      toast.success("Versión marcada como final");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateNotesMutation = trpc.vision.updateNotes.useMutation({
    onSuccess: () => {
      utils.vision.listVersions.invalidate({ clientId });
      setEditingNotesId(null);
      toast.success("Notas guardadas");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.vision.delete.useMutation({
    onSuccess: () => {
      utils.vision.listVersions.invalidate({ clientId });
      setDeleteId(null);
      toast.success("Versión eliminada");
    },
    onError: (e) => toast.error(e.message),
  });

  const exportMutation = trpc.vision.exportDocx.useMutation({
    onSuccess: (data) => {
      // Trigger download via anchor
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Documento descargado");
    },
    onError: (e) => toast.error(e.message),
  });

  const [refinementInstructions, setRefinementInstructions] = useState("");
  const [showRefinement, setShowRefinement] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const finalVersion = versions.find((v) => v.isFinal === 1);
  const latestVersion = versions[0];

  function handleGenerate() {
    generateMutation.mutate({
      clientId,
      refinementInstructions: refinementInstructions || undefined,
    });
  }

  function openNotes(version: (typeof versions)[0]) {
    setEditingNotesId(version.id);
    setNotesText(version.notes ?? "");
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Clientes", href: "/clients" },
        { label: client?.name ?? "...", href: `/clients/${clientId}` },
        { label: "Visión Estratégica" },
      ]}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Declaración de Visión</h1>
            {client && (
              <p className="text-muted-foreground text-sm mt-1">
                {client.name}
                {client.timeHorizon && ` · ${client.timeHorizon}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {insights.length} insight{insights.length !== 1 ? "s" : ""} disponible{insights.length !== 1 ? "s" : ""}
            </span>
            {insights.length === 0 && (
              <Link href={`/clients/${clientId}/insights`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Lightbulb size={14} />
                  Agregar insights
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* No insights warning */}
        {insights.length === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              <Lightbulb size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Sin insights cargados</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Para generar una visión personalizada, primero carga los insights de las sesiones de planeación.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final version highlight */}
        {finalVersion && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-primary fill-primary" />
                  <CardTitle className="text-base text-primary">Versión Final</CardTitle>
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    v{finalVersion.versionNumber}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => exportMutation.mutate({ versionId: finalVersion.id, clientId })}
                  disabled={exportMutation.isPending}
                >
                  {exportMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Exportar Word
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <blockquote className="vision-card text-base leading-relaxed text-foreground font-medium italic">
                {finalVersion.content}
              </blockquote>
            </CardContent>
          </Card>
        )}

        {/* Generate section */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Generar Declaración de Visión con IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La IA analizará los {insights.length} insight{insights.length !== 1 ? "s" : ""} cargados y generará una declaración de visión personalizada con tono y redacción de consultor experto.
            </p>

            <div>
              <button
                className="flex items-center gap-2 text-sm text-primary hover:underline"
                onClick={() => setShowRefinement(!showRefinement)}
              >
                {showRefinement ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {versions.length > 0
                  ? "Instrucciones de refinamiento (opcional)"
                  : "Instrucciones adicionales (opcional)"}
              </button>

              {showRefinement && (
                <div className="mt-3 space-y-1.5">
                  <Textarea
                    placeholder={
                      versions.length > 0
                        ? "Ej. Hazla más aspiracional, enfócate en la transformación digital, usa un tono más humano, acórtala a 2 oraciones..."
                        : "Ej. Enfócate en sostenibilidad, incluye el concepto de innovación, el cliente quiere proyectarse como líder regional..."
                    }
                    rows={3}
                    value={refinementInstructions}
                    onChange={(e) => setRefinementInstructions(e.target.value)}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || insights.length === 0}
              className="gap-2 w-full sm:w-auto"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generando visión...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {versions.length > 0 ? "Regenerar Visión" : "Generar Visión"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Version history */}
        {versions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Historial de Versiones ({versions.length})
              </h2>
            </div>

            <div className="space-y-3">
              {versions.map((version, index) => {
                const isExpanded = expandedId === version.id;
                const isFinal = version.isFinal === 1;
                const isLatest = index === 0;

                return (
                  <Card
                    key={version.id}
                    className={cn(
                      "border-border transition-all",
                      isFinal && "border-primary/30 bg-primary/5"
                    )}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            Versión {version.versionNumber}
                          </span>
                          {isFinal && (
                            <Badge className="text-xs bg-primary text-primary-foreground gap-1">
                              <Star size={10} className="fill-current" /> Final
                            </Badge>
                          )}
                          {isLatest && !isFinal && (
                            <Badge variant="outline" className="text-xs">
                              Más reciente
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(version.createdAt).toLocaleDateString("es-MX", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!isFinal && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                              onClick={() =>
                                setFinalMutation.mutate({ clientId, versionId: version.id })
                              }
                              disabled={setFinalMutation.isPending}
                            >
                              <CheckCircle2 size={13} />
                              Marcar final
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                            onClick={() =>
                              exportMutation.mutate({ versionId: version.id, clientId })
                            }
                            disabled={exportMutation.isPending}
                          >
                            <Download size={13} />
                            Word
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(version.id)}
                          >
                            <Trash2 size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : version.id)
                            }
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Preview (always visible, truncated) */}
                    <CardContent className="pt-0 px-4 pb-3">
                      <p
                        className={cn(
                          "text-sm text-foreground leading-relaxed",
                          !isExpanded && "line-clamp-2"
                        )}
                      >
                        {version.content}
                      </p>

                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          <Separator />
                          {/* Full content */}
                          <blockquote className="vision-card text-sm leading-relaxed text-foreground italic">
                            {version.content}
                          </blockquote>

                          {/* Refinement instructions used */}
                          {version.refinementInstructions && (
                            <div className="bg-muted/50 rounded-md p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                                <RefreshCw size={12} /> Instrucciones de refinamiento usadas:
                              </p>
                              <p className="text-xs text-foreground">
                                {version.refinementInstructions}
                              </p>
                            </div>
                          )}

                          {/* Notes */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <FileText size={12} /> Notas del consultor:
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-primary"
                                onClick={() => openNotes(version)}
                              >
                                {version.notes ? "Editar" : "Agregar nota"}
                              </Button>
                            </div>
                            {version.notes ? (
                              <p className="text-xs text-foreground bg-muted/50 rounded-md p-3">
                                {version.notes}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                Sin notas para esta versión.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!versionsLoading && versions.length === 0 && insights.length > 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Eye size={28} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Sin versiones generadas</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Tienes {insights.length} insight{insights.length !== 1 ? "s" : ""} listos. Haz clic en "Generar Visión" para crear la primera declaración.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes Dialog */}
      <Dialog
        open={editingNotesId !== null}
        onOpenChange={(o) => { if (!o) setEditingNotesId(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notas del Consultor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Observaciones sobre esta versión</Label>
            <Textarea
              placeholder="Ej. El equipo prefirió esta versión pero pidió ajustar el horizonte temporal..."
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNotesId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                editingNotesId &&
                updateNotesMutation.mutate({ id: editingNotesId, notes: notesText })
              }
              disabled={updateNotesMutation.isPending}
            >
              {updateNotesMutation.isPending ? "Guardando..." : "Guardar notas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta versión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta versión de la declaración de visión será eliminada permanentemente.
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
