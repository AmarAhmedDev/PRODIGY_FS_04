import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { AuthCard } from "@/components/chat/AuthCard";
import { ChatApp } from "@/components/chat/ChatApp";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-gradient">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <ChatApp /> : <AuthCard />;
}
