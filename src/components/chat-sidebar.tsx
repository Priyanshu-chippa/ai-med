
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
import { UserCircle, MessageSquareText, LogOut, PlusCircle, X, History } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { ConversationPreview } from "@/types"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNowStrict } from 'date-fns';

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
  conversations: ConversationPreview[]
  onLoadConversation: (conversationId: string) => void
  activeConversationId: string | null
}

export function ChatSidebar({ 
  isOpen, 
  onClose, 
  onNewChat, 
  conversations, 
  onLoadConversation,
  activeConversationId 
}: ChatSidebarProps) {
  const { user, signOut, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Logged out successfully." });
      onClose(); 
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    }
  };

  const handleNewChatClick = () => {
    onNewChat();
    onClose(); 
  }

  const handleLoadConversation = (id: string) => {
    onLoadConversation(id);
    // onClose(); // Keep sidebar open for easier navigation for now
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
                ) : authIsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading user...</p>
                ) : (
                  <p className="font-medium text-card-foreground">Guest User</p>
                )}
              </div>
            </div>
            {user && (
              <Button variant="outline" className="w-full mb-2" onClick={() => alert("Profile page coming soon!")}>View Profile</Button>
            )}
            <Button variant="default" className="w-full mb-2 bg-primary text-primary-foreground" onClick={handleNewChatClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </div>

          <Separator className="my-2" />

          <div className="p-4">
            <div className="flex items-center mb-3 text-muted-foreground">
              <History className="h-5 w-5 mr-2" />
              <h3 className="text-sm font-medium">Chat History</h3>
            </div>
            {conversations.length > 0 ? (
              <ul className="space-y-1">
                {conversations.map((chat) => (
                  <li key={chat.id}>
                    <Button 
                      variant={activeConversationId === chat.id ? "secondary" : "ghost"} 
                      className="w-full justify-start text-card-foreground hover:bg-accent hover:text-accent-foreground h-auto py-2"
                      onClick={() => handleLoadConversation(chat.id)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="truncate max-w-[200px] sm:max-w-[250px] text-sm font-normal">{chat.title}</span>
                        <div className="flex justify-between w-full mt-1">
                           <span className="text-xs text-muted-foreground">
                            {formatDistanceToNowStrict(new Date(chat.lastActivity), { addSuffix: true })}
                          </span>
                          <Badge variant="outline" className="text-xs">{chat.messageCount} msg</Badge>
                        </div>
                      </div>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 text-center">No chat history yet. Start a new conversation!</p>
            )}
          </div>
        </ScrollArea>
        {user && (
          <div className="p-4 border-t">
              <Button variant="destructive" className="w-full" onClick={handleSignOut} disabled={authIsLoading}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
