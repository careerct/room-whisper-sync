import { useState, useEffect, useRef } from "react";
import { MessageSquare, Users, Plus, Send, LogOut, Hash, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useChatRoom, Room } from "@/hooks/useChatRoom";
import { FileUpload } from "@/components/chat/FileUpload";
import { MessageReactions } from "@/components/chat/MessageReactions";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Chat = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    members,
    typingUsers,
    loading,
    sendMessage,
    addReaction,
    removeReaction,
    updateTypingIndicator,
    joinRoom,
  } = useChatRoom(selectedRoomId);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("name");

      if (error) {
        console.error("Failed to load rooms:", error);
      } else {
        setRooms(data || []);
      }
    };

    fetchRooms();

    // Subscribe to room changes
    const channel = supabase
      .channel("rooms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join room when selected
  useEffect(() => {
    if (selectedRoomId && user) {
      joinRoom(selectedRoomId);
    }
  }, [selectedRoomId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !uploadedFile) || !selectedRoomId) return;

    await sendMessage(
      message || "(sent a file)",
      uploadedFile?.url,
      uploadedFile?.name
    );
    
    setMessage("");
    setUploadedFile(null);
  };

  const handleTyping = () => {
    updateTypingIndicator();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Typing indicator will naturally expire after 5 seconds
    }, 3000);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toast.error("Room name is required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          name: newRoomName.trim(),
          description: newRoomDescription.trim() || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Room created successfully!");
      setCreateRoomOpen(false);
      setNewRoomName("");
      setNewRoomDescription("");
      setSelectedRoomId(data.id);
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create room");
    }
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentProfile = user ? { username: user.email?.split("@")[0] || "User" } : null;

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-chat-sidebar px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-purple">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Chat Server</h1>
            <p className="text-xs text-muted-foreground">@{currentProfile?.username}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Rooms Sidebar */}
        <aside className="w-64 bg-chat-sidebar border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <h2 className="font-semibold">Rooms</h2>
            <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                  <DialogDescription>
                    Create a new chat room for conversations
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Enter room name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomDescription">Description (Optional)</Label>
                    <Textarea
                      id="roomDescription"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      placeholder="Enter room description"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">Create Room</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    selectedRoomId === room.id
                      ? "bg-chat-active text-white"
                      : "hover:bg-chat-hover text-muted-foreground"
                  }`}
                >
                  <Hash className="w-5 h-5 shrink-0" />
                  <span className="font-medium truncate">{room.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-chat-main min-w-0">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="h-14 border-b border-border px-6 flex items-center shrink-0">
                <Hash className="w-5 h-5 text-muted-foreground mr-2" />
                <div>
                  <h3 className="font-semibold">{selectedRoom.name}</h3>
                  {selectedRoom.description && (
                    <p className="text-xs text-muted-foreground">{selectedRoom.description}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-6 py-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.user_id === user.id;
                      return (
                        <div key={msg.id} className="flex gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-primary text-white">
                              {msg.profiles.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-semibold text-sm">{msg.profiles.username}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm break-words">{msg.content}</p>
                            
                            {msg.file_url && (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-2 px-3 py-2 bg-chat-bubble rounded-lg text-sm hover:bg-chat-hover transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                {msg.file_name}
                              </a>
                            )}

                            <MessageReactions
                              reactions={msg.message_reactions || []}
                              onAddReaction={(emoji) => addReaction(msg.id, emoji)}
                              onRemoveReaction={(emoji) => removeReaction(msg.id, emoji)}
                            />
                          </div>
                        </div>
                      );
                    })}
                    
                    {typingUsers.length > 0 && (
                      <div className="flex gap-3 text-sm text-muted-foreground italic">
                        <div className="w-10" />
                        <span>
                          {typingUsers.map(u => u.profiles.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                        </span>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border shrink-0">
                {uploadedFile && (
                  <div className="mb-2 px-3 py-2 bg-chat-bubble rounded-lg text-sm flex items-center justify-between">
                    <span className="truncate">{uploadedFile.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUploadedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <FileUpload onFileUploaded={(url, name) => setUploadedFile({ url, name })} />
                  <Input
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder={`Message #${selectedRoom.name}`}
                    className="flex-1 bg-input border-border"
                  />
                  <Button type="submit" className="gradient-primary shadow-purple">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Chat Server</h2>
              <p className="text-muted-foreground mb-6">
                Select a room from the sidebar to start chatting
              </p>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
              </div>
              <p className="text-sm text-primary mt-4 font-medium">Join the conversation</p>
            </div>
          )}
        </main>

        {/* Members Sidebar */}
        <aside className="w-64 bg-chat-sidebar border-l border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center gap-2 shrink-0">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Members</h2>
            {selectedRoom && (
              <span className="text-xs text-muted-foreground">({members.length})</span>
            )}
          </div>
          {selectedRoom ? (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-chat-hover transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-foreground text-xs">
                          {member.profiles.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-chat-sidebar ${
                          member.profiles.status === "online" ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium truncate">{member.profiles.username}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Select a room to view members
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Chat;
