import { useEffect, useMemo, useRef } from "react";
import { Hash, LogOut as LeaveIcon, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth, type ChatUser } from "@/contexts/AuthContext";
import {
  useMessages,
  useTyping,
  type Room,
  leaveRoom,
  joinRoom,
} from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { TypingIndicator } from "./TypingIndicator";
import { formatDistanceToNow } from "date-fns";

type Props = {
  room: Room | null;
  users: ChatUser[];
};

export function ChatWindow({ room, users }: Props) {
  const { profile } = useAuth();
  const messages = useMessages(room?.id ?? null);
  const typing = useTyping(room?.id ?? null, profile?.uid ?? null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, room?.id]);

  const otherUser = useMemo(() => {
    if (!room?.isPrivate || !profile) return null;
    const otherUid = room.participants?.find((p) => p !== profile.uid);
    return otherUid ? users.find((u) => u.uid === otherUid) ?? null : null;
  }, [room, profile, users]);

  if (!room || !profile) {
    return (
      <section className="flex h-full flex-1 items-center justify-center md:m-3 md:ml-1.5 md:rounded-2xl glass shadow-soft">
        <div className="px-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bubble-me text-primary-foreground shadow-glow">
            <Hash className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold">Welcome to Pulse Chat</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Pick a chat from the sidebar, join a room, or start a direct message
            with someone from "People".
          </p>
        </div>
      </section>
    );
  }

  const isParticipant = room.participants?.includes(profile.uid);

  const headerTitle = room.isPrivate
    ? otherUser?.displayName ?? "Conversation"
    : `# ${room.name}`;
  const headerSub = room.isPrivate
    ? otherUser?.online
      ? "Online"
      : otherUser?.lastSeen
        ? `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}`
        : "Offline"
    : `${room.participants?.length ?? 0} member${(room.participants?.length ?? 0) === 1 ? "" : "s"}`;

  return (
    <section className="flex h-full flex-1 flex-col glass shadow-soft md:m-3 md:ml-1.5 md:rounded-2xl overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        {room.isPrivate ? (
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.photoURL} />
              <AvatarFallback>{otherUser?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {otherUser?.online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-online" />
            )}
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bubble-me text-primary-foreground">
            <Hash className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{headerTitle}</h2>
          <p className="truncate text-xs text-muted-foreground">{headerSub}</p>
        </div>
        {!room.isPrivate && (
          <>
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Users className="h-3.5 w-3.5" />
              {room.participants?.length ?? 0}
            </div>
            {isParticipant ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => leaveRoom(room.id, profile.uid)}
              >
                <LeaveIcon className="mr-1.5 h-3.5 w-3.5" /> Leave
              </Button>
            ) : (
              <Button size="sm" onClick={() => joinRoom(room.id, profile.uid)}>
                Join
              </Button>
            )}
          </>
        )}
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin bg-app-gradient px-3 py-4 sm:px-6"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {room.isPrivate ? "No messages yet — say hello 👋" : <>This is the start of <span className="font-semibold"># {room.name}</span></>}
            </p>
          </div>
        )}
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const isMe = m.senderId === profile.uid;
            const showName = !isMe && (!prev || prev.senderId !== m.senderId);
            const showAvatar = !isMe && (!next || next.senderId !== m.senderId);
            return (
              <MessageBubble
                key={m.id}
                message={m}
                isMe={isMe}
                showAvatar={showAvatar}
                showName={showName}
              />
            );
          })}
        </div>
      </div>

      <TypingIndicator names={Object.values(typing).map((t) => t.name)} />

      {(isParticipant || !room.isPrivate) ? (
        <MessageComposer roomId={room.id} />
      ) : (
        <div className="border-t border-border/60 p-4 text-center text-sm text-muted-foreground">
          Join this room to start chatting.
        </div>
      )}
    </section>
  );
}
