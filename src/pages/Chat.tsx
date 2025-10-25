import { useState } from "react";
import { MessageSquare, Users, Plus, Send, LogOut, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  
  const rooms = [
    { id: "general", name: "general" },
    { id: "fun", name: "for fun" },
    { id: "study", name: "study group" },
  ];

  const members = [
    { id: 1, name: "dinesh", status: "online" },
    { id: 2, name: "alice", status: "online" },
    { id: 3, name: "bob", status: "away" },
  ];

  const messages = selectedRoom ? [
    { id: 1, user: "alice", content: "Hey everyone!", timestamp: "10:30 AM" },
    { id: 2, user: "dinesh", content: "Hello! How's it going?", timestamp: "10:32 AM" },
    { id: 3, user: "bob", content: "Working on the new features", timestamp: "10:35 AM" },
  ] : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedRoom) {
      // Handle message sending
      setMessage("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-chat-sidebar px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-purple">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Chat Server</h1>
            <p className="text-xs text-muted-foreground">@dinesh</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Rooms Sidebar */}
        <aside className="w-64 bg-chat-sidebar border-r border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Rooms</h2>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    selectedRoom === room.id
                      ? "bg-chat-active text-white"
                      : "hover:bg-chat-hover text-muted-foreground"
                  }`}
                >
                  <Hash className="w-5 h-5" />
                  <span className="font-medium">{room.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-chat-main">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="h-14 border-b border-border px-6 flex items-center">
                <Hash className="w-5 h-5 text-muted-foreground mr-2" />
                <h3 className="font-semibold">{rooms.find(r => r.id === selectedRoom)?.name}</h3>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">
                          {msg.user[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-sm">{msg.user}</span>
                          <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Message #${rooms.find(r => r.id === selectedRoom)?.name}`}
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
        <aside className="w-64 bg-chat-sidebar border-l border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Members</h2>
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
                          {member.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-chat-sidebar ${
                          member.status === "online" ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
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
