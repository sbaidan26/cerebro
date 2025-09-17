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

export default function Interns() {
  const [interns, setInterns] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    lai_article: "",
    rate: 0,
  });
  const [deadlineForm, setDeadlineForm] = useState({ title: "", date: "", comment: "", assigned_to: "" });

  const fetchInterns = async () => {
    const { data, error } = await supabase
      .from("stagiaires")
      .select(`*, echeances(*, employee:employee_id(first_name, last_name))`);
    if (error) toast.error("Erreur de chargement des stagiaires");
    setInterns(data || []);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees").select("id, first_name, last_name");
    setEmployees(data || []);
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
      title: deadlineForm.title,
      deadline: deadlineForm.date,
      description: deadlineForm.comment,
      is_done: false,
    });

    if (error) return toast.error("Erreur lors de l'ajout de l'échéance");
    setDeadlineDialogOpen(null);
    setDeadlineForm({ title: "", date: "", comment: "", assigned_to: "" });
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
          <Card key={intern.id} className="shadow-soft">
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
              {intern.echeances?.map((d: any) => (
                <div key={d.id}>
                  <p>📅 {d.title} – {d.deadline}</p>
                  <p className="text-sm text-muted-foreground">{d.description} → {d.employee?.first_name} {d.employee?.last_name}</p>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setDeadlineDialogOpen(intern.id)}>➕ Ajouter échéance</Button>
              {deadlineDialogOpen === intern.id && (
                <Dialog open onOpenChange={() => setDeadlineDialogOpen(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle échéance</DialogTitle>
                      <DialogDescription>Saisissez le titre, la date et le commentaire de l'échéance.</DialogDescription>
                    </DialogHeader>
                    <Label>Titre</Label>
                    <Input value={deadlineForm.title} onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })} />
                    <Label>Date</Label>
                    <Input type="date" value={deadlineForm.date} onChange={(e) => setDeadlineForm({ ...deadlineForm, date: e.target.value })} />
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