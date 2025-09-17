import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Calendar, 
  Plane, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter
} from "lucide-react";

const vacationRequests = [
  {
    id: 1,
    employee: "Sarah Johnson",
    avatar: "SJ",
    type: "Vacation",
    startDate: "2024-02-15",
    endDate: "2024-02-22",
    days: 8,
    reason: "Family vacation to Europe",
    status: "pending",
    requestDate: "2024-01-10"
  },
  {
    id: 2,
    employee: "Mike Chen",
    avatar: "MC",
    type: "Sick Leave",
    startDate: "2024-01-20",
    endDate: "2024-01-22",
    days: 3,
    reason: "Medical appointment and recovery",
    status: "approved",
    requestDate: "2024-01-18"
  },
  {
    id: 3,
    employee: "Emma Davis",
    avatar: "ED",
    type: "Personal",
    startDate: "2024-03-01",
    endDate: "2024-03-01",
    days: 1,
    reason: "Personal matters",
    status: "rejected",
    requestDate: "2024-01-15"
  },
  {
    id: 4,
    employee: "Alex Rodriguez",
    avatar: "AR",
    type: "Vacation",
    startDate: "2024-04-10",
    endDate: "2024-04-17",
    days: 8,
    reason: "Spring break with family",
    status: "pending",
    requestDate: "2024-01-12"
  }
];

const stats = [
  {
    title: "Pending Requests",
    value: "8",
    icon: AlertCircle,
    color: "text-warning"
  },
  {
    title: "Approved This Month",
    value: "23",
    icon: CheckCircle,
    color: "text-success"
  },
  {
    title: "Average Days/Request",
    value: "5.2",
    icon: Calendar,
    color: "text-primary"
  },
  {
    title: "Team Utilization",
    value: "87%",
    icon: Clock,
    color: "text-accent"
  }
];

export default function Vacation() {
  const [filter, setFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return AlertCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Vacation': return 'bg-primary/10 text-primary';
      case 'Sick Leave': return 'bg-destructive/10 text-destructive';
      case 'Personal': return 'bg-accent/10 text-accent';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vacation Requests</h1>
          <p className="text-muted-foreground">Manage employee time-off requests and leave policies</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-secondary ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All Requests
            </Button>
            <Button 
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
            >
              Pending
            </Button>
            <Button 
              variant={filter === "approved" ? "default" : "outline"}
              onClick={() => setFilter("approved")}
            >
              Approved
            </Button>
            <Button 
              variant={filter === "rejected" ? "default" : "outline"}
              onClick={() => setFilter("rejected")}
            >
              Rejected
            </Button>
            <div className="ml-auto">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vacation Requests */}
      <div className="space-y-4">
        {vacationRequests
          .filter(request => filter === "all" || request.status === filter)
          .map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            return (
              <Card key={request.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {request.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{request.employee}</h3>
                        <p className="text-sm text-muted-foreground">Requested on {request.requestDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <Badge className={getTypeColor(request.type)}>
                          {request.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{request.days} days</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Calendar className="w-4 h-4" />
                          {request.startDate} - {request.endDate}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{request.reason}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {request.status}
                        </Badge>
                        
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="text-success hover:bg-success hover:text-success-foreground">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
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