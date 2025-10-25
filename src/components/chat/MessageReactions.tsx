import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { MessageReaction } from "@/hooks/useChatRoom";
import { useAuth } from "@/hooks/useAuth";

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

export const MessageReactions = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
}: MessageReactionsProps) => {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        userReacted: false,
      };
    }
    acc[reaction.emoji].count++;
    if (reaction.user_id === user?.id) {
      acc[reaction.emoji].userReacted = true;
    }
    return acc;
  }, {} as Record<string, { count: number; userReacted: boolean }>);

  const handleReactionClick = (emoji: string) => {
    if (groupedReactions[emoji]?.userReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {Object.entries(groupedReactions).map(([emoji, data]) => (
        <Button
          key={emoji}
          size="sm"
          variant={data.userReacted ? "default" : "outline"}
          className="h-6 px-2 text-xs rounded-full"
          onClick={() => handleReactionClick(emoji)}
        >
          {emoji} {data.count}
        </Button>
      ))}

      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setShowPicker(!showPicker)}
        >
          <Smile className="w-4 h-4" />
        </Button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-card border border-border rounded-lg shadow-lg flex gap-1 z-10">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                onClick={() => handleReactionClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
