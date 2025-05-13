import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// In a real application, these would come from an API
const conversations = [
  {
    id: 1,
    name: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    lastMessage: "I love the new design concepts you sent over!",
    time: "10:30 AM",
    unread: true
  },
  {
    id: 2,
    name: "Rahul Mehta",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    lastMessage: "Can we discuss the lighting options for the master bedroom?",
    time: "Yesterday",
    unread: false
  },
  {
    id: 3,
    name: "Ananya Desai",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    lastMessage: "I'm looking for something more contemporary.",
    time: "Monday",
    unread: false
  }
];

export default function MessagesModal({ isOpen, onClose }: MessagesModalProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [activeConversation, setActiveConversation] = useState<typeof conversations[0] | null>(null);
  const [message, setMessage] = useState("");
  
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
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeConversation) return;
    
    // In a real application, this would send the message to the API
    console.log("Sending message to", activeConversation.name, ":", message);
    setMessage("");
  };
  
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
      <div className="bg-white w-full max-w-md h-full overflow-hidden animate-in slide-in-from-right flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Messages</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {activeConversation ? (
          // Conversation view
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-200 flex items-center">
              <button 
                onClick={() => setActiveConversation(null)}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={activeConversation.avatar} alt={activeConversation.name} />
                <AvatarFallback>
                  {activeConversation.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <span className="ml-2 font-medium text-gray-900">{activeConversation.name}</span>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {/* This would display actual messages in a real app */}
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg py-2 px-3 max-w-xs">
                  <p className="text-sm text-gray-900">Hi! I've been looking at the design proposals you sent.</p>
                  <p className="text-xs text-gray-500 mt-1">10:24 AM</p>
                </div>
              </div>
              <div className="flex justify-end mb-4">
                <div className="bg-primary-100 rounded-lg py-2 px-3 max-w-xs">
                  <p className="text-sm text-gray-900">Great! Do you have any feedback or questions I can help with?</p>
                  <p className="text-xs text-gray-500 mt-1">10:26 AM</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg py-2 px-3 max-w-xs">
                  <p className="text-sm text-gray-900">{activeConversation.lastMessage}</p>
                  <p className="text-xs text-gray-500 mt-1">{activeConversation.time}</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 flex items-center">
              <Input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <button
                type="submit"
                className="ml-2 bg-primary text-white p-2 rounded-full hover:bg-primary-600 focus:outline-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          // Conversations list
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="px-4 pt-2">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="all">All Messages</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="flex-1 overflow-y-auto p-0 m-0">
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${conversation.unread ? 'bg-gray-50' : ''}`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="flex items-start">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.avatar} alt={conversation.name} />
                        <AvatarFallback>
                          {conversation.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${conversation.unread ? 'text-gray-900' : 'text-gray-800'}`}>{conversation.name}</p>
                          <p className="text-xs text-gray-500">{conversation.time}</p>
                        </div>
                        <p className={`text-sm ${conversation.unread ? 'text-gray-900 font-medium' : 'text-gray-600'} truncate`}>
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread && (
                          <span className="inline-block mt-1 w-2 h-2 rounded-full bg-primary"></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="unread" className="flex-1 overflow-y-auto p-0 m-0">
              <div className="divide-y divide-gray-200">
                {conversations
                  .filter(conv => conv.unread)
                  .map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer bg-gray-50"
                      onClick={() => setActiveConversation(conversation)}
                    >
                      <div className="flex items-start">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.avatar} alt={conversation.name} />
                          <AvatarFallback>
                            {conversation.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{conversation.name}</p>
                            <p className="text-xs text-gray-500">{conversation.time}</p>
                          </div>
                          <p className="text-sm text-gray-900 font-medium truncate">
                            {conversation.lastMessage}
                          </p>
                          <span className="inline-block mt-1 w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
