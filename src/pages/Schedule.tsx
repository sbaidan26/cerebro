// src/pages/Schedule.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  format,
  isSameDay,
  parseISO,
  isBefore,
} from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

/** ---------- Types ---------- */
type EmployeeRow = {
  id?: string;
  name: string;
  department?: string | null;
  avatar?: string | null;
};

type ScheduleRow = {
  id: string;
  employee_name: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:mm:ss or HH:mm (Supabase time will stringify with seconds)
  end_time: string;
  morning: boolean;
  afternoon: boolean;
  recurring: boolean;
};

/** ---------- Helpers ---------- */
const DAYS: number = 6; // Monday..Saturday
const dayShort = (d: Date) => format(d, "EEE"); // Mon, Tue...
const fmtYMD = (d: Date) => format(d, "yyyy-MM-dd");
const trimHM = (t?: string) =>
  t ? (t.length >= 5 ? t.slice(0, 5) : t) : ""; // "09:00" from "09:00:00"

export default function Schedule() {
  /** ---------- State ---------- */
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);

  // Modal state (used for both Add and Edit)
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    employee_name: "",
    date: "",
    start_time: "",
    end_time: "",
    morning: false,
    afternoon: false,
    recurring: false,
    until_date: "",
  });

  /** ---------- Derived ---------- */
  const weekDates = useMemo(
    () => Array.from({ length: DAYS }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Map employee name -> details for quick lookup
  const employeeMap = useMemo(() => {
    const m = new Map<string, EmployeeRow>();
    employees.forEach((e) => m.set(e.name, e));
    return m;
  }, [employees]);

  /** ---------- Data Fetch ---------- */
  useEffect(() => {
    (async () => {
      // employees for select + grouping (department)
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("name, department, avatar");
      if (!empErr) setEmployees(empData || []);
    })();
  }, []);

  useEffect(() => {
    fetchWeekSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const fetchWeekSchedules = async () => {
    const from = fmtYMD(weekDates[0]);
    const to = fmtYMD(weekDates[weekDates.length - 1]);

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true });

    if (!error) setSchedules((data || []) as ScheduleRow[]);
  };

  /** ---------- Utilities ---------- */
  const getEmployeeDaySchedule = (employeeName: string, date: Date) => {
    const ymd = fmtYMD(date);
    return schedules.find(
      (s) => s.employee_name === employeeName && s.date === ymd
    );
  };

  const getShiftBadge = (s?: Pick<ScheduleRow, "morning" | "afternoon">) => {
    if (!s) return null;
    if (!s.morning && !s.afternoon)
      return <Badge variant="outline" className="text-muted-foreground">Off</Badge>;
    if (s.morning && s.afternoon)
      return <Badge className="bg-success text-success-foreground">Full Day</Badge>;
    if (s.morning)
      return <Badge className="bg-primary text-primary-foreground">Morning</Badge>;
    if (s.afternoon)
      return <Badge className="bg-accent text-accent-foreground">Afternoon</Badge>;
    return null;
  };

  /** ---------- Add / Edit / Delete ---------- */

  // Open Add modal
  const openAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({
      employee_name: "",
      date: "",
      start_time: "",
      end_time: "",
      morning: false,
      afternoon: false,
      recurring: false,
      until_date: "",
    });
    setIsOpen(true);
  };

  // Open Edit modal with prefilled values
  const openEdit = (row: ScheduleRow) => {
    setIsEditing(true);
    setEditingId(row.id);
    setForm({
      employee_name: row.employee_name,
      date: row.date,
      start_time: trimHM(row.start_time),
      end_time: trimHM(row.end_time),
      morning: row.morning,
      afternoon: row.afternoon,
      recurring: row.recurring,
      until_date: "", // Only for add-recurring; we edit a single row here
    });
    setIsOpen(true);
  };

  // Validate minimal inputs
  const validateForm = () => {
    if (!form.employee_name || !form.date || !form.start_time || !form.end_time) {
      alert("Employee, Date, Start Time, and End Time are required.");
      return false;
    }
    if (form.recurring && !form.until_date && !isEditing) {
      alert("Please provide an 'Until' date for recurring schedules.");
      return false;
    }
    return true;
  };

  // Save handler (Add or Edit)
  const handleSave = async () => {
    if (!validateForm()) return;

    if (isEditing && editingId) {
      // Update the single row
      const { error } = await supabase
        .from("schedules")
        .update({
          employee_name: form.employee_name,
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          morning: form.morning,
          afternoon: form.afternoon,
          // recurring is kept but editing doesn't bulk-propagate
          recurring: form.recurring,
        })
        .eq("id", editingId);
      if (error) {
        alert("Update failed: " + error.message);
        return;
      }
    } else {
      // Insert: single or recurring weekly until 'until_date'
      const inserts: Omit<ScheduleRow, "id">[] = [];
      if (form.recurring && form.until_date) {
        let cur = parseISO(form.date);
        const end = parseISO(form.until_date);
        // Inclusive weekly recurrence
        while (!isBefore(end, cur)) {
          inserts.push({
            employee_name: form.employee_name,
            date: fmtYMD(cur),
            start_time: form.start_time,
            end_time: form.end_time,
            morning: form.morning,
            afternoon: form.afternoon,
            recurring: true,
          });
          cur = addWeeks(cur, 1);
        }
      } else {
        inserts.push({
          employee_name: form.employee_name,
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          morning: form.morning,
          afternoon: form.afternoon,
          recurring: form.recurring,
        });
      }

      const { error } = await supabase.from("schedules").insert(inserts);
      if (error) {
        alert("Insert failed: " + error.message);
        return;
      }
    }

    setIsOpen(false);
    setIsEditing(false);
    setEditingId(null);

    await fetchWeekSchedules();
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    await fetchWeekSchedules();
  };

  /** ---------- Grouping for Daily View ---------- */
  // For a given date (YMD), group entries by department
  const groupByDepartmentForDate = (ymd: string) => {
    const result = new Map<string, ScheduleRow[]>();
    schedules.forEach((s) => {
      if (s.date !== ymd) return;
      const emp = employeeMap.get(s.employee_name);
      const dept = (emp?.department ?? "Unknown") || "Unknown";
      const arr = result.get(dept) || [];
      arr.push(s);
      result.set(dept, arr);
    });
    return result;
  };

  /** ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Header + Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Work Schedule</h1>
          <p className="text-muted-foreground">
            Plan and manage employee shifts (planning, not actuals)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggles */}
          <Button
            variant={viewMode === "weekly" ? "default" : "outline"}
            onClick={() => setViewMode("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={viewMode === "daily" ? "default" : "outline"}
            onClick={() => setViewMode("daily")}
          >
            Daily
          </Button>

          {/* Add Shift */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                {isEditing ? "Edit Shift" : "Add Shift"}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md space-y-4">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
              </DialogHeader>

              {/* Employee select */}
              <div className="space-y-1">
                <Label htmlFor="employee_name">Employee</Label>
                <select
                  id="employee_name"
                  className="w-full border rounded-md p-2 bg-background"
                  value={form.employee_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, employee_name: e.target.value }))
                  }
                >
                  <option value="">Select an employee</option>
                  {employees.map((emp) => (
                    <option key={emp.name} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>

              {/* Start/End time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, start_time: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, end_time: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="morning"
                    checked={form.morning}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, morning: Boolean(v) }))
                    }
                  />
                  <Label htmlFor="morning">Morning</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="afternoon"
                    checked={form.afternoon}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, afternoon: Boolean(v) }))
                    }
                  />
                  <Label htmlFor="afternoon">Afternoon</Label>
                </div>
              </div>

              {/* Recurring + Until (only relevant for new entries) */}
              {!isEditing && (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="recurring"
                      checked={form.recurring}
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, recurring: Boolean(v) }))
                      }
                    />
                    <Label htmlFor="recurring">Recurring weekly</Label>
                  </div>

                  {form.recurring && (
                    <div className="space-y-1">
                      <Label htmlFor="until_date">Until</Label>
                      <Input
                        id="until_date"
                        type="date"
                        value={form.until_date}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, until_date: e.target.value }))
                        }
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {isEditing ? "Update" : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {format(weekStart, "MMM dd")} – {format(addDays(weekStart, DAYS - 1), "MMM dd, yyyy")}
        </div>
        <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* VIEWS */}
      {viewMode === "weekly" ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="font-medium text-foreground">Employee</div>
                {weekDates.map((d) => (
                  <div key={d.toISOString()} className="text-center text-sm font-medium text-foreground">
                    {dayShort(d)}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-3">
                {employees.map((emp) => (
                  <div
                    key={emp.name}
                    className="grid grid-cols-8 gap-4 p-3 rounded-lg bg-card border border-border hover:bg-muted/20 transition-colors"
                  >
                    {/* Employee cell */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {(emp.avatar || emp.name)
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground text-sm">{emp.name}</div>
                        {emp.department && (
                          <div className="text-xs text-muted-foreground">{emp.department}</div>
                        )}
                      </div>
                    </div>

                    {/* Day cells */}
                    {weekDates.map((d) => {
                      const s = getEmployeeDaySchedule(emp.name, d);
                      return (
                        <div key={d.toISOString()} className="text-center text-xs">
                          {s ? (
                            <div className="space-y-1">
                              {getShiftBadge(s)}
                              <div className="text-muted-foreground">
                                {trimHM(s.start_time)} – {trimHM(s.end_time)}
                              </div>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(s)}
                                  title="Edit shift"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(s.id)}
                                  title="Delete shift"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">—</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // DAILY VIEW — grouped by department
        <div className="grid gap-6">
          {weekDates.map((d) => {
            const ymd = fmtYMD(d);
            const grouped = groupByDepartmentForDate(ymd);
            const hasAny = Array.from(grouped.values()).some((arr) => arr.length > 0);

            return (
              <Card key={d.toISOString()} className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {format(d, "EEEE — MMM dd, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasAny ? (
                    <div className="text-sm text-muted-foreground">No shifts for this day.</div>
                  ) : (
                    <div className="space-y-6">
                      {Array.from(grouped.entries()).map(([dept, arr]) => {
                        if (!arr.length) return null;
                        return (
                          <div key={dept}>
                            <h4 className="text-lg font-semibold mb-2 text-primary">{dept}</h4>
                            <div className="space-y-2">
                              {arr.map((s) => {
                                const emp = employeeMap.get(s.employee_name);
                                return (
                                  <div
                                    key={s.id}
                                    className="flex items-center gap-4 bg-muted/40 p-3 rounded-lg"
                                  >
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="bg-primary/20 text-foreground">
                                        {(emp?.avatar || s.employee_name)
                                          .split(" ")
                                          .map((x) => x[0])
                                          .join("")
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-foreground">
                                        {s.employee_name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {trimHM(s.start_time)} – {trimHM(s.end_time)}
                                      </div>
                                    </div>
                                    <Badge variant="outline">
                                      {s.morning && s.afternoon
                                        ? "Full Day"
                                        : s.morning
                                        ? "Morning"
                                        : s.afternoon
                                        ? "Afternoon"
                                        : "Off"}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(s.id)}
                                      >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
