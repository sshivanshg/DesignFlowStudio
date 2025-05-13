import { useEffect } from "react";
import { X, Bell, MessageSquare, Calendar } from "lucide-react";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// In a real application, these would come from an API
const notifications = [
  {
    id: 1,
    type: "proposal",
    title: "New proposal approval",
    message: "Priya Sharma approved your design proposal.",
    time: "30 minutes ago",
    icon: <Bell className="text-primary-600" />,
    iconBg: "bg-primary-100"
  },
  {
    id: 2,
    type: "message",
    title: "Client message",
    message: "Rahul Mehta left a comment on the Luxury Villa project.",
    time: "2 hours ago",
    icon: <MessageSquare className="text-red-600" />,
    iconBg: "bg-red-100"
  },
  {
    id: 3,
    type: "reminder",
    title: "Reminder: Client meeting",
    message: "Meeting with Priya Sharma at 2:00 PM today.",
    time: "1 hour ago",
    icon: <Calendar className="text-yellow-600" />,
    iconBg: "bg-yellow-100"
  }
];

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  // Close on ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white w-full max-w-sm h-full overflow-y-auto animate-in slide-in-from-right">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div key={notification.id} className="py-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className={`h-8 w-8 rounded-full ${notification.iconBg} flex items-center justify-center`}>
                    {notification.icon}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                  <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
