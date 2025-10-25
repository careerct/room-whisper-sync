import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

interface PrivateMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender: {
    username: string;
  };
  recipient: {
    username: string;
  };
}

interface PrivateMessagesProps {
  recipientId: string;
  recipientUsername: string;
  onClose: () => void;
}

export const PrivateMessages = ({
  recipientId,
  recipientUsername,
  onClose,
}: PrivateMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("private_messages")
        .select(`
          *,
          sender:profiles!private_messages_sender_id_fkey(username),
          recipient:profiles!private_messages_recipient_id_fkey(username)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .or(`sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load private messages:", error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`private:${user.id}:${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from("private_messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: newMessage,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
    } else {
      setNewMessage("");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-card border border-border rounded-lg shadow-dark flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-white text-sm">
              {recipientUsername[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{recipientUsername}</p>
            <p className="text-xs text-muted-foreground">Private Message</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((msg) => {
            const isSent = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isSent
                      ? "bg-chat-active text-white"
                      : "bg-chat-bubble"
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-input border-border"
          />
          <Button type="submit" size="icon" className="gradient-primary">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
