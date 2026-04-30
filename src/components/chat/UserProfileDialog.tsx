import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Mail, Clock, CircleDot } from "lucide-react";
import type { ChatUser } from "@/contexts/AuthContext";

type Props = {
  user: ChatUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserProfileDialog({ user, open, onOpenChange }: Props) {
  if (!user) return null;

  const lastSeenText = user.lastSeen
    ? formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })
    : "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="sr-only">User Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Large avatar */}
          <div className="relative">
            <Avatar className="h-28 w-28 ring-4 ring-primary/20 shadow-glow">
              <AvatarImage src={user.photoURL} className="object-cover" />
              <AvatarFallback className="text-3xl font-bold">
                {user.displayName?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <span
              className={cn(
                "absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-background",
                user.online ? "bg-online" : "bg-muted-foreground/40",
              )}
            />
          </div>

          {/* Name */}
          <div className="text-center">
            <h3 className="text-lg font-bold">{user.displayName}</h3>
            <p className={cn(
              "text-xs font-medium mt-0.5",
              user.online ? "text-online" : "text-muted-foreground"
            )}>
              {user.online ? "Online" : "Offline"}
            </p>
          </div>

          {/* Info rows */}
          <div className="w-full space-y-3 rounded-xl bg-muted/50 p-4">
            {user.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate text-foreground">{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <CircleDot className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-foreground">
                {user.online ? "Currently active" : `Last seen ${lastSeenText}`}
              </span>
            </div>
            {user.lastSeen && !user.online && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs">
                  {new Date(user.lastSeen).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
