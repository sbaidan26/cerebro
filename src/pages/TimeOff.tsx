import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, Filter, AlertCircle, CheckCircle, XCircle, Heart, Stethoscope, Plane, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function TimeOff() {
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [requestType, setRequestType] = useState("");
  const [reason, setReason] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      const { data: r, error: rErr } = await supabase
        .from("time_off_requests")
        .select("*, employees(name)")
        .order("created_at", { ascending: false });
      if (rErr) console.error(rErr);
      else setRequests(r || []);

      const { data: e } = await supabase.from("employees").select("id, name");
      setEmployees(e || []);
    };
    fetchData();
  }, []);

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !requestType || !employeeId) {
      toast.error("All fields required");
      return;
    }

    const { error } = await supabase.from("time_off_requests").insert({
      employee_id: parseInt(employeeId),
      start_date: startDate,
      end_date: endDate,
      reason,
      type: requestType,
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Request submitted");
      setIsDialogOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
      setRequestType("");
      setEmployeeId("");
      const { data: updated } = await supabase
        .from("time_off_requests")
        .select("*, employees(name)")
        .order("created_at", { ascending: false });
      setRequests(updated || []);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "rejected": return "bg-destructive text-destructive-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return CheckCircle;
      case "pending": return AlertCircle;
      case "rejected": return XCircle;
      default: return Clock;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Holiday": return Plane;
      case "Sick Leave": return Heart;
      case "Medical Appointment": return Stethoscope;
      default: return User;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Holiday": return "bg-primary/10 text-primary";
      case "Sick Leave": return "bg-destructive/10 text-destructive";
      case "Medical Appointment": return "bg-accent/10 text-accent";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Off</h1>
          <p className="text-muted-foreground">Manage absences and request holidays</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Time Off</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Holiday">Holiday</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Medical Appointment">Medical Appointment</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PP") : <span>Pick date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PP") : <span>Pick date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide reason..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitRequest}>Submit</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                onClick={() => setFilter(status)}
              >
                {status === 'all' ? 'All Requests' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
            <div className="ml-auto">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {requests
          .filter(r => filter === "all" || r.status === filter)
          .map((r) => {
            const StatusIcon = getStatusIcon(r.status);
            const TypeIcon = getTypeIcon(r.type);
            return (
              <Card key={r.id} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${getTypeColor(r.type)}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{r.type}</h3>
                        <p className="text-sm text-muted-foreground">{r.employees?.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <CalendarIcon className="w-4 h-4" />
                          {r.start_date === r.end_date ? r.start_date : `${r.start_date} - ${r.end_date}`}
                        </div>
                      </div>
                      <Badge className={`flex items-center gap-1 ${getStatusColor(r.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}