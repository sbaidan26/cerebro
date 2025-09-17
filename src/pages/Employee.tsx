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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Filter,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const [form, setForm] = useState({
    firstname: "",
    lastname: "", 
    email: "",
    position: "",
    department: "",
    phone: "",
    location: "",
    avatar: "",
    status: "active",
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("employees").select("*");
      if (error) {
        console.error("Failed to fetch employees:", error.message);
      } else {
        setEmployees(data);
      }
      setLoading(false);
    };

    fetchEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (!form.firstname || !form.lastname || !form.email) {
      alert("Names and Email are required");
      return;
    }

    const { error } = await supabase.from("employees").insert([form]);

    if (error) {
      alert("Error adding employee: " + error.message);
    } else {
      const { data } = await supabase.from("employees").select("*");
      setEmployees(data || []);
      setForm({
        firstname: "",
        lastname: "",
        email: "",
        position: "",
        department: "",
        phone: "",
        location: "",
        avatar: "",
        status: "active",
      });
      setIsOpen(false);
    }
  };

  const filteredEmployees = employees.filter((employee) =>
    [employee.firstname, employee.lastname, employee.position, employee.department]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "on-leave":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">Manage your team members and their information</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>

          <DialogContent className="space-y-4 max-w-md">
            <h2 className="text-xl font-semibold">Add New Employee</h2>
            {["firstname", "lastname", "email", "position", "department", "phone", "location", "avatar"].map((field) => (
              <div key={field}>
                <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                <Input
                  id={field}
                  value={form[field as keyof typeof form]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
          <DialogContent className="space-y-4 max-w-md">
            <h2 className="text-xl font-semibold">Edit Employee</h2>
            {["firstname", "lastname", "email", "position", "department", "phone", "location", "avatar"].map((field) => (
              <div key={field}>
                <Label htmlFor={`edit-${field}`}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                <Input
                  id={`edit-${field}`}
                  value={editingEmployee?.[field] || ""}
                  onChange={(e) =>
                    setEditingEmployee((prev: any) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingEmployee(null)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                const { id, ...rest } = editingEmployee;
                const { error } = await supabase.from("employees").update(rest).eq("id", id);
                if (error) {
                  alert("Failed to update employee: " + error.message);
                } else {
                  const { data } = await supabase.from("employees").select("*");
                  setEmployees(data || []);
                  setEditingEmployee(null);
                }
              }}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search employees..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {employee.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{employee.firstname} {employee.lastname}</h3>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingEmployee(employee)}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <Badge className={`w-fit ${getStatusColor(employee.status)}`}>
                {employee.status.replace("-", " ")}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">{employee.location}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Department</span>
                  <Badge variant="outline">{employee.department}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}