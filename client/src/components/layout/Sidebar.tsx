import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calculator, 
  Palette, 
  UserCircle, 
  Settings, 
  LogOut,
  ClipboardList,
  LineChart
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export default function Sidebar() {
  const [location] = useLocation();
  const { isOpen, close } = useSidebar();
  const { user, logout } = useAuth();
  
  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          // Don't auto-close on desktop
          return;
        }
        close();
      };
      
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isOpen, close]);
  
  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/crm",
      label: "CRM",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/proposals",
      label: "Proposals",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      href: "/estimates",
      label: "Estimates",
      icon: <Calculator className="h-5 w-5" />,
    },
    {
      href: "/moodboard",
      label: "Moodboard",
      icon: <Palette className="h-5 w-5" />,
    },
    {
      href: "/project-tracker",
      label: "Project Tracker",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      href: "/project-logs",
      label: "Project Logs",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      href: "/clients",
      label: "Clients",
      icon: <UserCircle className="h-5 w-5" />,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.clear();
      logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  
  const sidebarClasses = isOpen
    ? "fixed inset-y-0 left-0 z-40 w-64 transform translate-x-0 transition duration-200 ease-in-out bg-white border-r border-gray-200 shadow-sm lg:static lg:inset-0"
    : "fixed inset-y-0 left-0 z-40 w-64 transform -translate-x-full lg:translate-x-0 transition duration-200 ease-in-out bg-white border-r border-gray-200 shadow-sm lg:static lg:inset-0";
  
  const getNavItemClasses = (href: string) => {
    const isActive = location === href;
    
    return isActive
      ? "flex items-center px-2 py-2 text-sm font-medium text-white rounded-md bg-primary group"
      : "flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 group";
  };
  
  const getIconClasses = (href: string) => {
    const isActive = location === href;
    
    return isActive
      ? "mr-3 text-white"
      : "mr-3 text-gray-500 group-hover:text-primary";
  };
  
  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Logo and Brand */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <Logo />
          <button
            onClick={close}
            className="lg:hidden text-gray-500 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={getNavItemClasses(item.href)}
            >
              <span className={getIconClasses(item.href)}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Profile Section */}
        {user && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar || ""} alt={user.fullName} />
                <AvatarFallback className="bg-primary text-white">
                  {user.fullName?.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">{user.fullName}</p>
                <p className="text-xs font-medium text-gray-500">{user.role}</p>
              </div>
              <div className="ml-auto">
                <button 
                  onClick={handleLogout}
                  type="button" 
                  className="flex text-gray-500 focus:outline-none"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
