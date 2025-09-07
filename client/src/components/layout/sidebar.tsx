import { Link, useLocation } from "wouter";
import { Clock, BarChart3, Building, Settings, Home, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Time Tracking", href: "/time-tracking", icon: Play },
  { name: "Client Management", href: "/clients", icon: Building },
  { name: "Project Mapping", href: "/projects", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="sidebar fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-lg backdrop-blur-sm">
      {/* Logo and Title */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/5">
        <div className="flex items-center space-x-3 fade-in">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
            <Clock className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Jira Time Tracker
            </h1>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-primary/70" />
              <p className="text-sm text-muted-foreground font-medium">v2.1.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === '/dashboard' && location === '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
              data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Jira Cloud</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600">Connected</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">FileMaker DB</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
