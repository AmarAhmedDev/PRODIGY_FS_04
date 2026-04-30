import { useState } from "react";
import { ChatSidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { useAuth } from "@/contexts/AuthContext";
import { useRooms, useUsers } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatApp() {
  const { profile } = useAuth();
  const users = useUsers();
  const rooms = useRooms(profile?.uid ?? null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === selectedRoomId) ?? null;

  return (
    <div className="flex h-screen w-full bg-app-gradient">
      <div
        className={cn(
          "flex w-full md:w-80 md:shrink-0",
          selectedRoomId ? "hidden md:flex" : "flex",
        )}
      >
        <ChatSidebar
          rooms={rooms}
          users={users}
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
        />
      </div>
      <div
        className={cn(
          "flex-1",
          selectedRoomId ? "flex" : "hidden md:flex",
        )}
      >
        <div className="flex w-full flex-col">
          {selectedRoomId && (
            <div className="px-3 pt-3 md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRoomId(null)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
            </div>
          )}
          <div className="flex-1">
            <ChatWindow room={room} users={users} />
          </div>
        </div>
      </div>
    </div>
  );
}
