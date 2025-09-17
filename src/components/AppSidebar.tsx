import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Plane, 
  Settings 
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Stagiaires", url: "/interns", icon: Settings },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Timesheet", url: "/timesheet", icon: Clock },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Time Off", url: "/time-off", icon: Plane },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (isActiveRoute: boolean) =>
    isActiveRoute 
      ? "bg-primary text-primary-foreground font-medium shadow-soft" 
      : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">

            {!isCollapsed && (
              <div>
                <img src="https://formacomm.ch/wp-content/uploads/2017/01/cropped-formacomm-e1751665150874.png" />
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-3">
            {!isCollapsed && "MAIN MENU"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${getNavClass(isActive(item.url))}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}