import { format } from "date-fns";
import { FileText, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

type Props = {
  message: Message;
  isMe: boolean;
  showAvatar: boolean;
  showName: boolean;
};

export function MessageBubble({ message, isMe, showAvatar, showName }: Props) {
  const time = message.createdAt?.toDate
    ? format(message.createdAt.toDate(), "HH:mm")
    : "";

  return (
    <div
      className={cn(
        "animate-msg-in flex w-full items-end gap-2",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      {!isMe && (
        <div className="w-8 shrink-0">
          {showAvatar && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.senderPhoto} />
              <AvatarFallback>{message.senderName?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-0.5 sm:max-w-[65%]",
          isMe ? "items-end" : "items-start",
        )}
      >
        {showName && !isMe && (
          <span className="px-3 text-[11px] font-medium text-muted-foreground">
            {message.senderName}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 shadow-soft",
            isMe ? "bg-bubble-me rounded-br-sm" : "bg-bubble-them rounded-bl-sm",
          )}
        >
          {message.type === "image" && message.fileUrl && (
            <a href={message.fileUrl} target="_blank" rel="noreferrer">
              <img
                src={message.fileUrl}
                alt={message.fileName ?? "image"}
                className="max-h-72 max-w-full rounded-lg object-cover"
                loading="lazy"
              />
            </a>
          )}
          {message.type === "file" && message.fileUrl && (
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
          )}
          {message.text && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.text}
            </p>
          )}
        </div>

        {time && (
          <span className="px-2 text-[10px] text-muted-foreground">{time}</span>
        )}
      </div>
    </div>
  );
}