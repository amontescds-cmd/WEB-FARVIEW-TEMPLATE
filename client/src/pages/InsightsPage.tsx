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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Eye,
  File,
  FileText,
  Lightbulb,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractTextFromFile(file: File): Promise<string> {
  // For plain text files, read directly
  if (file.type === "text/plain") {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(file);
    });
  }
  // For other formats, return empty (server would need full parsing)
  return "";
}

export default function InsightsPage() {
  const params = useParams<{ id: string }>();
  const clientId = parseInt(params.id ?? "0");
  const utils = trpc.useUtils();

  const { data: client } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  );
  const { data: insights = [], isLoading } = trpc.insights.list.useQuery(
    { clientId },
    { enabled: !!clientId }
  );

  const addTextMutation = trpc.insights.addText.useMutation({
    onSuccess: () => {
      utils.insights.list.invalidate({ clientId });
      setShowTextForm(false);
      setTextForm({ title: "", content: "" });
      toast.success("Insight agregado");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadFileMutation = trpc.insights.uploadFile.useMutation({
    onSuccess: () => {
      utils.insights.list.invalidate({ clientId });
      setShowFileForm(false);
      setFileForm({ title: "", file: null });
      toast.success("Archivo cargado exitosamente");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.insights.delete.useMutation({
    onSuccess: () => {
      utils.insights.list.invalidate({ clientId });
      setDeleteId(null);
      toast.success("Insight eliminado");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showTextForm, setShowTextForm] = useState(false);
  const [showFileForm, setShowFileForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [textForm, setTextForm] = useState({ title: "", content: "" });
  const [fileForm, setFileForm] = useState<{ title: string; file: File | null }>({
    title: "",
    file: null,
  });
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload() {
    if (!fileForm.file) {
      toast.error("Selecciona un archivo");
      return;
    }
    if (!fileForm.title.trim()) {
      toast.error("El título es requerido");
      return;
    }
    if (fileForm.file.size > MAX_FILE_SIZE) {
      toast.error("El archivo no puede superar 10 MB");
      return;
    }

    setUploadProgress(true);
    try {
      const fileBase64 = await fileToBase64(fileForm.file);
      const extractedText = await extractTextFromFile(fileForm.file);
      await uploadFileMutation.mutateAsync({
        clientId,
        title: fileForm.title,
        fileName: fileForm.file.name,
        fileMimeType: fileForm.file.type || "application/octet-stream",
        fileBase64,
        extractedText: extractedText || undefined,
      });
    } finally {
      setUploadProgress(false);
    }
  }

  function handleTextSubmit() {
    if (!textForm.title.trim()) {
      toast.error("El título es requerido");
      return;
    }
    if (!textForm.content.trim()) {
      toast.error("El contenido es requerido");
      return;
    }
    addTextMutation.mutate({ clientId, ...textForm });
  }

  const textInsights = insights.filter((i) => i.type === "text");
  const fileInsights = insights.filter((i) => i.type === "file");

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Clientes", href: "/clients" },
        { label: client?.name ?? "...", href: `/clients/${clientId}` },
        { label: "Insights" },
      ]}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Insights de Sesiones</h1>
            {client && (
              <p className="text-muted-foreground text-sm mt-1">
                {client.name} · {insights.length} insight{insights.length !== 1 ? "s" : ""} cargado{insights.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTextForm(true)} className="gap-2">
              <FileText size={16} />
              Agregar texto
            </Button>
            <Button onClick={() => setShowFileForm(true)} className="gap-2">
              <Upload size={16} />
              Subir archivo
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
          <Lightbulb size={18} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Los insights son los insumos que la IA usará para generar la declaración de visión. Puedes cargar documentos de sesiones, notas, análisis FODA, resultados de talleres o cualquier texto relevante.
          </p>
        </div>

        {/* Insights list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Lightbulb size={28} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Sin insights aún</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Agrega texto de sesiones o sube documentos para que la IA tenga contexto al generar la visión.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTextForm(true)}>
                  <FileText size={16} className="mr-2" /> Agregar texto
                </Button>
                <Button onClick={() => setShowFileForm(true)}>
                  <Upload size={16} className="mr-2" /> Subir archivo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos ({insights.length})</TabsTrigger>
              <TabsTrigger value="text">Texto ({textInsights.length})</TabsTrigger>
              <TabsTrigger value="files">Archivos ({fileInsights.length})</TabsTrigger>
            </TabsList>

            {(["all", "text", "files"] as const).map((tab) => {
              const list =
                tab === "all" ? insights : tab === "text" ? textInsights : fileInsights;
              return (
                <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                  {list.map((insight) => (
                    <Card key={insight.id} className="border-border hover:border-primary/30 transition-colors">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.type === "file" ? "bg-blue-100" : "bg-amber-100"}`}>
                              {insight.type === "file" ? (
                                <File size={16} className="text-blue-600" />
                              ) : (
                                <FileText size={16} className="text-amber-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm font-semibold text-foreground truncate">
                                {insight.title}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {insight.type === "file" ? `Archivo: ${insight.fileName}` : "Texto libre"} ·{" "}
                                {new Date(insight.createdAt).toLocaleDateString("es-MX", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => setDeleteId(insight.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </CardHeader>
                      {insight.content && (
                        <CardContent className="pt-0 px-4 pb-3">
                          <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/50 rounded-md p-3">
                            {insight.content}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* CTA to vision */}
        {insights.length > 0 && (
          <div className="border-t border-border pt-6 flex justify-end">
            <Link href={`/clients/${clientId}/vision`}>
              <Button className="gap-2">
                <Eye size={16} />
                Generar Declaración de Visión
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Text Form Dialog */}
      <Dialog open={showTextForm} onOpenChange={(o) => { if (!o) { setShowTextForm(false); setTextForm({ title: "", content: "" }); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Insight de Texto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título del insight *</Label>
              <Input
                placeholder="Ej. Análisis FODA — Sesión 1"
                value={textForm.title}
                onChange={(e) => setTextForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contenido *</Label>
              <Textarea
                placeholder="Pega aquí el texto de la sesión, notas, análisis, reflexiones del equipo directivo..."
                rows={8}
                value={textForm.content}
                onChange={(e) => setTextForm((f) => ({ ...f, content: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                {textForm.content.length} caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTextForm(false); setTextForm({ title: "", content: "" }); }}>
              Cancelar
            </Button>
            <Button onClick={handleTextSubmit} disabled={addTextMutation.isPending}>
              {addTextMutation.isPending ? "Guardando..." : "Agregar insight"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={showFileForm} onOpenChange={(o) => { if (!o) { setShowFileForm(false); setFileForm({ title: "", file: null }); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título del documento *</Label>
              <Input
                placeholder="Ej. Resultados Taller de Visión — Feb 2025"
                value={fileForm.title}
                onChange={(e) => setFileForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Archivo *</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {fileForm.file ? (
                  <div className="flex items-center justify-center gap-3">
                    <File size={20} className="text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{fileForm.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fileForm.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-foreground font-medium">Haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOCX, TXT — máx. 10 MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.rtf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > MAX_FILE_SIZE) {
                      toast.error("El archivo no puede superar 10 MB");
                      return;
                    }
                    setFileForm((f) => ({ ...f, file }));
                    if (!fileForm.title) {
                      setFileForm((f) => ({
                        ...f,
                        file,
                        title: file.name.replace(/\.[^/.]+$/, ""),
                      }));
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
              <strong>Nota:</strong> Para archivos TXT el texto se extrae automáticamente. Para PDF y DOCX, el archivo se almacena como referencia. Puedes complementar con un insight de texto si necesitas que la IA procese el contenido específico.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowFileForm(false); setFileForm({ title: "", file: null }); }}>
              Cancelar
            </Button>
            <Button onClick={handleFileUpload} disabled={uploadProgress || uploadFileMutation.isPending}>
              {uploadProgress || uploadFileMutation.isPending ? "Subiendo..." : "Subir documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar insight?</AlertDialogTitle>
            <AlertDialogDescription>
              Este insight ya no estará disponible para la generación de visión. Esta acción no se puede deshacer.
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
