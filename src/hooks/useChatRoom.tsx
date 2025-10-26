import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Room {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  message_reactions: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
  message_id: string;
}

export interface RoomMember {
  id: string;
  user_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
    status: string;
  };
}

export interface TypingUser {
  user_id: string;
  profiles: {
    username: string;
  };
}

export const useChatRoom = (roomId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch messages
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles(username, avatar_url),
          message_reactions(*)
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to load messages");
        console.error(error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [roomId]);

  // Fetch room members
  useEffect(() => {
    if (!roomId) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("room_members")
        .select("*, profiles(*)")
        .eq("room_id", roomId);

      if (error) {
        console.error("Failed to load members:", error);
      } else {
        setMembers(data || []);
      }
    };

    fetchMembers();
  }, [roomId]);

  // Fetch typing indicators
  useEffect(() => {
    if (!roomId) {
      setTypingUsers([]);
      return;
    }

    const fetchTypingUsers = async () => {
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      
      const { data, error } = await supabase
        .from("typing_indicators")
        .select("user_id, profiles(username)")
        .eq("room_id", roomId)
        .gt("last_typed_at", fiveSecondsAgo)
        .neq("user_id", user?.id);

      if (!error && data) {
        setTypingUsers(data as TypingUser[]);
      }
    };

    fetchTypingUsers();
    const interval = setInterval(fetchTypingUsers, 2000);

    return () => clearInterval(interval);
  }, [roomId, user?.id]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!roomId) return;

    const messagesChannel = supabase
      .channel(`messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch the new message with profile data
            const { data } = await supabase
              .from("messages")
              .select("*, profiles(username, avatar_url), message_reactions(*)")
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setMessages((prev) => [...prev, data]);
            }
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            const { data } = await supabase
              .from("messages")
              .select("*, profiles(username, avatar_url), message_reactions(*)")
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setMessages((prev) =>
                prev.map((msg) => (msg.id === data.id ? data : msg))
              );
            }
          }
        }
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel(`reactions:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async () => {
          // Refetch all messages to get updated reactions
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(username, avatar_url), message_reactions(*)")
            .eq("room_id", roomId)
            .order("created_at", { ascending: true });

          if (data) {
            setMessages(data);
          }
        }
      )
      .subscribe();

    const membersChannel = supabase
      .channel(`members:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const { data } = await supabase
            .from("room_members")
            .select("*, profiles(*)")
            .eq("room_id", roomId);

          if (data) {
            setMembers(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [roomId]);

  const sendMessage = async (content: string, fileUrl?: string, fileName?: string) => {
    if (!roomId || !user) return;

    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      user_id: user.id,
      content,
      file_url: fileUrl || null,
      file_name: fileName || null,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const { error } = await supabase.from("message_reactions").insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    });

    if (error && !error.message.includes("duplicate")) {
      toast.error("Failed to add reaction");
      console.error(error);
    }
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);

    if (error) {
      toast.error("Failed to remove reaction");
      console.error(error);
    }
  };

  const updateTypingIndicator = async () => {
    if (!roomId || !user) return;

    await supabase.from("typing_indicators").upsert(
      {
        room_id: roomId,
        user_id: user.id,
        last_typed_at: new Date().toISOString(),
      },
      { onConflict: "room_id,user_id" }
    );
  };

  const joinRoom = async (roomIdToJoin: string) => {
    if (!user) return;

    const { error } = await supabase.from("room_members").insert({
      room_id: roomIdToJoin,
      user_id: user.id,
    });

    if (error && !error.message.includes("duplicate")) {
      toast.error("Failed to join room");
      console.error(error);
    }
  };

  return {
    messages,
    members,
    typingUsers,
    loading,
    sendMessage,
    addReaction,
    removeReaction,
    updateTypingIndicator,
    joinRoom,
  };
};
