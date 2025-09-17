import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar } from "lucide-react";

export default function Timesheet() {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    employee_id: "",
    work_date: "",
    morning_start: "",
    morning_end: "",
    afternoon_start: "",
    afternoon_end: "",
    has_evening: false,
    evening_start: "",
    evening_end: "",
    notes: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      const [timesheetRes, employeeRes] = await Promise.all([
        supabase.from("timesheet").select("*"),
        supabase.from("employees").select("id, name")
      ]);

      if (employeeRes.error) console.error(employeeRes.error);
      else setEmployees(employeeRes.data || []);

      if (timesheetRes.error) console.error(timesheetRes.error);
      else setTimesheets(timesheetRes.data || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!form.employee_id || !form.work_date) {
      alert("Employee and date are required");
      return;
    }

    const { error } = await supabase.from("timesheet").insert([form]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      const { data } = await supabase.from("timesheet").select("*");
      setTimesheets(data || []);
      setIsOpen(false);
      setForm({
        employee_id: "",
        work_date: "",
        morning_start: "",
        morning_end: "",
        afternoon_start: "",
        afternoon_end: "",
        has_evening: false,
        evening_start: "",
        evening_end: "",
        notes: ""
      });
    }
  };

  if (loading) return <div className="text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Timesheet</h1>
          <p className="text-muted-foreground">Manage work schedules</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Plus className="w-4 h-4 mr-2" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="space-y-4 max-w-md">
            <h2 className="text-xl font-semibold">New Timesheet Entry</h2>
            <div>
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(val) => setForm((p) => ({ ...p, employee_id: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.work_date} onChange={(e) => setForm((p) => ({ ...p, work_date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Morning Start</Label>
                <Input type="time" value={form.morning_start} onChange={(e) => setForm((p) => ({ ...p, morning_start: e.target.value }))} />
              </div>
              <div>
                <Label>Morning End</Label>
                <Input type="time" value={form.morning_end} onChange={(e) => setForm((p) => ({ ...p, morning_end: e.target.value }))} />
              </div>
              <div>
                <Label>Afternoon Start</Label>
                <Input type="time" value={form.afternoon_start} onChange={(e) => setForm((p) => ({ ...p, afternoon_start: e.target.value }))} />
              </div>
              <div>
                <Label>Afternoon End</Label>
                <Input type="time" value={form.afternoon_end} onChange={(e) => setForm((p) => ({ ...p, afternoon_end: e.target.value }))} />
              </div>
            </div>
            <div className="pt-2">
              <Label className="flex items-center gap-2">
                <Checkbox checked={form.has_evening} onCheckedChange={(v) => setForm((p) => ({ ...p, has_evening: !!v }))} />
                Enable Evening Schedule
              </Label>
              {form.has_evening && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label>Evening Start</Label>
                    <Input type="time" value={form.evening_start} onChange={(e) => setForm((p) => ({ ...p, evening_start: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Evening End</Label>
                    <Input type="time" value={form.evening_end} onChange={(e) => setForm((p) => ({ ...p, evening_end: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timesheets.map((entry) => (
          <Card key={entry.id} className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> {entry.work_date}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div><strong>Employee ID:</strong> {entry.employee_id}</div>
              <div><strong>Morning:</strong> {entry.morning_start || "-"} – {entry.morning_end || "-"}</div>
              <div><strong>Afternoon:</strong> {entry.afternoon_start || "-"} – {entry.afternoon_end || "-"}</div>
              {entry.has_evening && (
                <div><strong>Evening:</strong> {entry.evening_start || "-"} – {entry.evening_end || "-"}</div>
              )}
              {entry.notes && <div><strong>Note:</strong> {entry.notes}</div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}