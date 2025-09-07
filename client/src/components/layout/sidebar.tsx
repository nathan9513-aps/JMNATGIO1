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
    <div className="sidebar fixed md:static inset-y-0 left-0 z-50 w-56 bg-card border-r border-border shadow-lg backdrop-blur-sm">
      {/* Logo and Title */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/5">
        <div className="flex items-center space-x-2 fade-in">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center shadow-lg">
            <Clock className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Jira Tracker
            </h1>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-2 h-2 text-primary/70" />
              <p className="text-xs text-muted-foreground font-medium">v1.1.0</p>
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
        <div className="space-y-3">
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
          
          {/* Copyright and Build Info */}
          <div className="pt-2 border-t border-border/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground/80 font-medium">
                © 2025 NatCios Software
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Build 1.14621.0_zinc_prerelease
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
