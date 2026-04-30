import { useState } from "react";
import { format } from "date-fns";
import { FileText, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/hooks/useChat";
import type { ChatUser } from "@/contexts/AuthContext";
import { UserProfileDialog } from "./UserProfileDialog";
import { cn } from "@/lib/utils";

type Props = {
  message: Message;
  isMe: boolean;
  showAvatar: boolean;
  showName: boolean;
  users: ChatUser[];
};

export function MessageBubble({ message, isMe, showAvatar, showName, users }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);

  const time = message.createdAt?.toDate
    ? format(message.createdAt.toDate(), "HH:mm")
    : "";

  const senderUser = users.find((u) => u.uid === message.senderId) ?? null;

  return (
    <>
      <div
        className={cn(
          "animate-msg-in flex w-full items-end gap-2 px-1",
          isMe ? "justify-end" : "justify-start",
        )}
      >
        {!isMe && (
          <div className="w-7 shrink-0">
            {showAvatar && (
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                <Avatar className="h-7 w-7 ring-1 ring-border/50">
                  <AvatarImage src={message.senderPhoto} className="object-cover" />
                  <AvatarFallback className="text-[10px]">
                    {message.senderName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex max-w-[80%] flex-col gap-0.5",
            isMe ? "items-end" : "items-start",
          )}
        >
          {showName && !isMe && (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="px-2 text-[11px] font-semibold text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              {message.senderName}
            </button>
          )}

          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 shadow-soft",
              isMe
                ? "bg-bubble-me rounded-br-md"
                : "bg-bubble-them rounded-bl-md",
            )}
          >
            {(() => {
              // Determine if it's an image based on explicit type or file extension/fileType
              const isImage = 
                message.type === "image" || 
                message.fileType === "image" || 
                (message.fileName && /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileName));

              if (isImage && message.fileUrl) {
                return (
                  <a href={message.fileUrl} target="_blank" rel="noreferrer">
                    <img
                      src={message.fileUrl}
                      alt={message.fileName ?? "image"}
                      className="max-h-72 max-w-full rounded-lg object-cover"
                      loading="lazy"
                    />
                  </a>
                );
              }

              if (message.type === "file" && message.fileUrl) {
                return (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-2 transition",
                      isMe ? "bg-white/15 hover:bg-white/25" : "bg-background/50 hover:bg-background/80",
                    )}
                  >
                    <FileText className="h-5 w-5 shrink-0" />
                    <span className="truncate text-sm">{message.fileName}</span>
                    <Download className="h-4 w-4 shrink-0 opacity-70" />
                  </a>
                );
              }

              return null;
            })()}
            {message.text && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.text}
              </p>
            )}
          </div>

          {time && (
            <span className={cn(
              "text-[10px] text-muted-foreground/60",
              isMe ? "pr-1" : "pl-1",
            )}>{time}</span>
          )}
        </div>
      </div>

      {/* Profile dialog for sender */}
      <UserProfileDialog
        user={senderUser}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </>
  );
}