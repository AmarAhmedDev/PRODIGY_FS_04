import { useMemo, useState } from "react";
import { Hash, Lock, Plus, LogOut, Search, Sun, Moon, MessageSquare, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth, type ChatUser } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  createPublicRoom,
  getOrCreateDM,
  type Room,
} from "@/hooks/useChat";
import { cn } from "@/lib/utils";

type Props = {
  rooms: Room[];
  users: ChatUser[];
  selectedRoomId: string | null;
  onSelectRoom: (id: string) => void;
};

export function ChatSidebar({ rooms, users, selectedRoomId, onSelectRoom }: Props) {
  const { profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const publicRooms = useMemo(
    () =>
      rooms
        .filter((r) => !r.isPrivate)
        .filter((r) => r.name?.toLowerCase().includes(search.toLowerCase())),
    [rooms, search],
  );

  const dms = useMemo(
    () =>
      rooms
        .filter((r) => r.isPrivate)
        .map((r) => {
          const otherUid = r.participants?.find((p) => p !== profile?.uid);
          const name = otherUid ? r.participantNames?.[otherUid] : "Unknown";
          const photo = otherUid ? r.participantPhotos?.[otherUid] : "";
          return { ...r, otherName: name ?? "Unknown", otherPhoto: photo ?? "" };
        })
        .filter((r) =>
          r.otherName.toLowerCase().includes(search.toLowerCase()),
        ),
    [rooms, profile?.uid, search],
  );

  const otherUsers = useMemo(
    () =>
      users
        .filter((u) => u.uid !== profile?.uid)
        .filter((u) =>
          u.displayName.toLowerCase().includes(search.toLowerCase()),
        ),
    [users, profile?.uid, search],
  );

  async function handleCreate() {
    if (!newRoomName.trim() || !profile) return;
    const id = await createPublicRoom(newRoomName.trim(), profile.uid);
    setNewRoomName("");
    setCreating(false);
    onSelectRoom(id);
  }

  async function startDM(other: ChatUser) {
    if (!profile) return;
    const id = await getOrCreateDM(profile, other);
    onSelectRoom(id);
  }

  return (
    <aside className="flex h-full w-full flex-col glass shadow-soft md:w-80 md:rounded-2xl md:m-3 md:mr-1.5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 p-4">
        <Avatar className="h-10 w-10 ring-2 ring-primary/30">
          <AvatarImage src={profile?.photoURL} />
          <AvatarFallback>{profile?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{profile?.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => logout()} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats, users…"
            className="pl-9 bg-background/60"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chats" className="mt-3 flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 grid grid-cols-3">
          <TabsTrigger value="chats">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Chats
          </TabsTrigger>
          <TabsTrigger value="rooms">
            <Hash className="mr-1.5 h-3.5 w-3.5" /> Rooms
          </TabsTrigger>
          <TabsTrigger value="people">
            <Users className="mr-1.5 h-3.5 w-3.5" /> People
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {dms.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No conversations yet. Start one from "People".
            </p>
          )}
          {dms.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRoom(r.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent/60",
                selectedRoomId === r.id && "bg-accent",
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={r.otherPhoto} />
                <AvatarFallback>{r.otherName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.otherName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.lastMessage ?? "Say hello 👋"}
                </p>
              </div>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="rooms" className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Public rooms
            </span>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a room</DialogTitle>
                </DialogHeader>
                <Input
                  autoFocus
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. design-team"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {publicRooms.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No rooms yet. Create the first one!
            </p>
          )}
          {publicRooms.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRoom(r.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent/60",
                selectedRoomId === r.id && "bg-accent",
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bubble-me text-primary-foreground">
                {r.isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium"># {r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.participants?.length ?? 0} member{(r.participants?.length ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="people" className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {otherUsers.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No other users found.
            </p>
          )}
          {otherUsers.map((u) => (
            <button
              key={u.uid}
              onClick={() => startDM(u)}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent/60"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.photoURL} />
                  <AvatarFallback>{u.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                    u.online ? "bg-online" : "bg-muted-foreground/40",
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.online ? "Online" : "Offline"}
                </p>
              </div>
            </button>
          ))}
        </TabsContent>
      </Tabs>
    </aside>
  );
}