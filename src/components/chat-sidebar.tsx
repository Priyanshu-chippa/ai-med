
"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { UserCircle, MessageSquareText, History, X, LogOut, PlusCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext" // Import useAuth
import { useToast } from "@/hooks/use-toast"

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  onNewChat?: () => void // Optional: Callback for new chat
}

export function ChatSidebar({ isOpen, onClose, onNewChat }: ChatSidebarProps) {
  const { user, signOut, isLoading } = useAuth(); // Get user and signOut from context
  const { toast } = useToast();

  // Placeholder data - will be replaced by Supabase data later
  const recentChats = [
    { id: "1", title: "Symptom Check: Headache" },
    { id: "2", title: "Question about medication" },
    { id: "3", title: "Follow-up on skin rash" },
  ]
  const olderChats = [
    { id: "4", title: "Initial consultation" },
    { id: "5", title: "Blood test results discussion" },
  ]

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Logged out successfully." });
      onClose(); // Close sidebar on logout
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    }
  };

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    }
    onClose(); // Close sidebar after starting new chat
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col bg-card">
        <SheetHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-lg font-semibold">Profile & Chats</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          {/* Profile Section */}
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.user_metadata?.avatar_url || "https://placehold.co/100x100.png"} alt="User Avatar" data-ai-hint="person portrait" />
                <AvatarFallback>
                  <UserCircle className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                {user ? (
                  <>
                    <p className="font-medium text-card-foreground truncate">{user.user_metadata?.full_name || user.email}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </>
                ) : isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading user...</p>
                ) : (
                  <p className="font-medium text-card-foreground">Guest User</p>
                )}
              </div>
            </div>
            {user && (
              <Button variant="outline" className="w-full mb-2" onClick={() => alert("Profile page coming soon!")}>View Profile</Button>
            )}
             {onNewChat && (
              <Button variant="default" className="w-full mb-2 bg-primary text-primary-foreground" onClick={handleNewChatClick}>
                <PlusCircle className="mr-2 h-4 w-4" /> New Chat
              </Button>
            )}
          </div>

          <Separator className="my-2" />

          {/* Recent Chats Section - Placeholder */}
          <div className="p-4">
            <div className="flex items-center mb-3 text-muted-foreground">
              <MessageSquareText className="h-5 w-5 mr-2" />
              <h3 className="text-sm font-medium">Recent Chats</h3>
            </div>
            <ul className="space-y-2">
              {recentChats.map((chat) => (
                <li key={chat.id}>
                  <Button variant="ghost" className="w-full justify-start text-card-foreground hover:bg-accent hover:text-accent-foreground">
                    {chat.title}
                  </Button>
                </li>
              ))}
            </ul>
             <p className="text-xs text-muted-foreground mt-2">Chat history coming soon!</p>
          </div>

          <Separator className="my-2" />

          {/* Older Chats Section - Placeholder */}
          <div className="p-4">
            <div className="flex items-center mb-3 text-muted-foreground">
              <History className="h-5 w-5 mr-2" />
              <h3 className="text-sm font-medium ">Older Chats</h3>
            </div>
            <ul className="space-y-2">
              {olderChats.map((chat) => (
                <li key={chat.id}>
                  <Button variant="ghost" className="w-full justify-start text-card-foreground hover:bg-accent hover:text-accent-foreground">
                    {chat.title}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
        {user && (
          <div className="p-4 border-t">
              <Button variant="destructive" className="w-full" onClick={handleSignOut} disabled={isLoading}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
