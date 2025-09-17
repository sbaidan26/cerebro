import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  Calendar,
  Plane,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: "Total Employees", value: "-", change: "", icon: Users, color: "text-primary" },
    { title: "Hours This Week", value: "-", change: "+0% from last week", icon: Clock, color: "text-accent" },
    { title: "Pending Requests", value: "-", change: "", icon: AlertCircle, color: "text-warning" },
    { title: "Tasks Completed", value: "89%", change: "+2.1% this week", icon: CheckCircle, color: "text-success" }
  ]);

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { count: employeeCount } = await supabase.from("employees").select("*", { count: "exact", head: true });
      const { count: pendingRequests } = await supabase
        .from("time_off_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { data: activityData } = await supabase
        .from("time_off_requests")
        .select("id, status, created_at, type, employees ( name )")
        .order("created_at", { ascending: false })
        .limit(4);

      setStats((prev) => [
        { ...prev[0], value: String(employeeCount ?? "-") },
        prev[1],
        { ...prev[2], value: String(pendingRequests ?? "-") },
        prev[3]
      ]);

      setRecentActivity(
        (activityData ?? []).map((item) => ({
          name: item.employees?.name ?? "Unknown",
          action: `submitted ${item.type?.toLowerCase()} request`,
          time: new Date(item.created_at).toLocaleString(),
          status: item.status ?? "pending"
        }))
      );
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your team.</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Quick Action
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-secondary ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      activity.status === "approved"
                        ? "default"
                        : activity.status === "pending"
                        ? "secondary"
                        : "outline"
                    }
                    className={
                      activity.status === "approved" ? "bg-success text-success-foreground" : ""
                    }
                  >
                    {activity.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}