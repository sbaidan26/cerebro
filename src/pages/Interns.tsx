// InternsUpdated.tsx - Supabase-aligned with Dialog accessibility fix

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type DeadlineFormState = {
  title: string;
  date: string;
  comment: string;
  assigned_to: string;
};

type EmployeeOption = {
  id: string;
  first_name: string;
  last_name: string;
};

type InternDeadline = {
  id: string;
  title: string;
  deadline: string;
  description: string;
  employee?: {
    first_name?: string;
    last_name?: string;
  };
};

type InternRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  lai_article: string;
  rate: number;
  echeances: InternDeadline[];
};

type RawEmployeeOption = Record<string, unknown>;
type RawIntern = Record<string, unknown>;
type RawDeadline = Record<string, unknown>;

const emptyDeadlineForm: DeadlineFormState = {
  title: "",
  date: "",
  comment: "",
  assigned_to: "",
};

const toStringValue = (value: unknown): string => (typeof value === "string" ? value : "");

const toStringId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const toNumberValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeEmployeeOption = (employee: RawEmployeeOption): EmployeeOption => ({
  id: toStringId(employee["id"]),
  first_name: toStringValue(employee["first_name"] ?? employee["firstname"] ?? employee["firstName"]),
  last_name: toStringValue(employee["last_name"] ?? employee["lastname"] ?? employee["lastName"]),
});

const normalizeInternDeadline = (deadline: RawDeadline): InternDeadline => {
  const employeeRaw = deadline["employee"];
  let employee: InternDeadline["employee"];

  if (employeeRaw && typeof employeeRaw === "object") {
    const record = employeeRaw as Record<string, unknown>;
    const firstName = toStringValue(record["first_name"] ?? record["firstname"] ?? record["firstName"]);
    const lastName = toStringValue(record["last_name"] ?? record["lastname"] ?? record["lastName"]);
    if (firstName || lastName) {
      employee = {
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
      };
    }
  }

  return {
    id: toStringId(deadline["id"]),
    title: toStringValue(deadline["title"]),
    deadline: toStringValue(deadline["deadline"]),
    description: toStringValue(deadline["description"]),
    employee,
  };
};

const normalizeIntern = (intern: RawIntern): InternRecord => {
  const rawDeadlines = Array.isArray(intern["echeances"])
    ? (intern["echeances"] as RawDeadline[])
    : [];

  return {
    id: toStringId(intern["id"]),
    first_name: toStringValue(intern["first_name"] ?? intern["firstname"] ?? intern["firstName"]),
    last_name: toStringValue(intern["last_name"] ?? intern["lastname"] ?? intern["lastName"]),
    email: toStringValue(intern["email"]),
    lai_article: toStringValue(intern["lai_article"]),
    rate: toNumberValue(intern["rate"]),
    echeances: rawDeadlines.map((deadline) => normalizeInternDeadline(deadline)),
  };
};

export default function Interns() {
  const [interns, setInterns] = useState<InternRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    lai_article: "",
    rate: 0,
  });
  const [deadlineForm, setDeadlineForm] = useState<DeadlineFormState>(emptyDeadlineForm);

  const fetchInterns = async () => {
    const { data, error } = await supabase
      .from("stagiaires")
      .select(`*, echeances(*, employee:employee_id(first_name, last_name))`);
    if (error) {
      toast.error("Erreur de chargement des stagiaires");
      return;
    }
    setInterns((data ?? []).map((intern) => normalizeIntern(intern as RawIntern)));
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("id, first_name, last_name");
    if (error) {
      console.error("Erreur de chargement des employés", error.message);
      toast.error("Erreur de chargement des employés");
      return;
    }
    setEmployees((data ?? []).map(normalizeEmployeeOption));
  };

  const handleCreate = async () => {
    const { error } = await supabase.from("stagiaires").insert({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      lai_article: form.lai_article,
      rate: form.rate,
    });
    if (error) return toast.error("Erreur lors de l'ajout du stagiaire");
    toast.success("Stagiaire ajouté");
    setDialogOpen(false);
    setForm({ first_name: "", last_name: "", email: "", lai_article: "", rate: 0 });
    fetchInterns();
  };

  const addDeadline = async (stagiaire_id: string) => {
    if (!deadlineForm.title || !deadlineForm.date)
      return toast.error("Titre et date requis");

    const { error } = await supabase.from("echeances").insert({
      mesure_id: null,
      stagiaire_id,
      employee_id: deadlineForm.assigned_to || null,
      title: deadlineForm.title,
      deadline: deadlineForm.date,
      description: deadlineForm.comment,
      is_done: false,
    });

    if (error) return toast.error("Erreur lors de l'ajout de l'échéance");
    toast.success("Échéance ajoutée");
    setDeadlineDialogOpen(null);
    setDeadlineForm(() => ({ ...emptyDeadlineForm }));
    fetchInterns();
  };

  useEffect(() => {
    fetchInterns();
    fetchEmployees();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stagiaires AI</h1>
          <p className="text-muted-foreground">Gestion des stagiaires + échéances</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nouveau stagiaire</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un stagiaire</DialogTitle>
              <DialogDescription>Saisissez les informations de base du stagiaire.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prénom</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div><Label>Nom</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
              <div className="col-span-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2">
                <Label>Article LAI</Label>
                <Select value={form.lai_article} onValueChange={(val) => setForm({ ...form, lai_article: val })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14LAI">14 LAI</SelectItem>
                    <SelectItem value="16LAI">16 LAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Taux</Label><Input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex justify-end mt-4"><Button onClick={handleCreate}>Enregistrer</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interns.map((intern) => (
          <Card
            key={intern.id || `${intern.email}-${intern.first_name}-${intern.last_name}`}
            className="shadow-soft"
          >
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>{intern.first_name} {intern.last_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{intern.email}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><b>Article :</b> {intern.lai_article}</p>
              <p><b>Taux :</b> {intern.rate}%</p>
              <p className="mt-2 font-semibold">Échéances :</p>
              {intern.echeances.map((deadline) => (
                <div key={deadline.id || `${deadline.title}-${deadline.deadline}`}>
                  <p>📅 {deadline.title || "Sans titre"} – {deadline.deadline || "Date à définir"}</p>
                  <p className="text-sm text-muted-foreground">
                    {deadline.description}
                    {deadline.employee ? (
                      <>
                        {deadline.description ? " → " : "Assigné à : "}
                        {deadline.employee.first_name ?? ""} {deadline.employee.last_name ?? ""}
                      </>
                    ) : null}
                  </p>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setDeadlineDialogOpen(intern.id)}>➕ Ajouter échéance</Button>
              {deadlineDialogOpen === intern.id && (
                <Dialog
                  open
                  onOpenChange={(open) => {
                    if (!open) {
                      setDeadlineDialogOpen(null);
                      setDeadlineForm(() => ({ ...emptyDeadlineForm }));
                    }
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle échéance</DialogTitle>
                      <DialogDescription>Saisissez le titre, la date et le commentaire de l'échéance.</DialogDescription>
                    </DialogHeader>
                    <Label>Titre</Label>
                    <Input value={deadlineForm.title} onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })} />
                    <Label>Date</Label>
                    <Input type="date" value={deadlineForm.date} onChange={(e) => setDeadlineForm({ ...deadlineForm, date: e.target.value })} />
                    <Label>Responsable</Label>
                    <Select
                      value={deadlineForm.assigned_to || undefined}
                      onValueChange={(val) => setDeadlineForm({ ...deadlineForm, assigned_to: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Non assigné</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {`${emp.first_name} ${emp.last_name}`.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label>Commentaire</Label>
                    <Textarea value={deadlineForm.comment} onChange={(e) => setDeadlineForm({ ...deadlineForm, comment: e.target.value })} />
                    <Button onClick={() => addDeadline(intern.id)}>Enregistrer</Button>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}