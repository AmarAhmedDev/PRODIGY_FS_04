import { useRef, useState, useEffect } from "react";
import { Paperclip, Send, Smile, ImagePlus, Loader2 } from "lucide-react";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { sendMessage, setTypingStatus } from "@/hooks/useChat";
import { uploadToImageKit } from "@/services/imagekit";
import { toast } from "sonner";

type Props = { roomId: string };

export function MessageComposer({ roomId }: Props) {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLInputElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (profile) setTypingStatus(roomId, profile.uid, profile.displayName, false);
    };
  }, [roomId, profile]);

  function handleTyping(value: string) {
    setText(value);
    if (!profile) return;
    setTypingStatus(roomId, profile.uid, profile.displayName, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTypingStatus(roomId, profile.uid, profile.displayName, false);
    }, 2500);
  }

  async function handleSend() {
    if (!profile || !text.trim()) return;
    const value = text.trim();
    setText("");
    setTypingStatus(roomId, profile.uid, profile.displayName, false);
    try {
      await sendMessage(roomId, {
        senderId: profile.uid,
        senderName: profile.displayName,
        senderPhoto: profile.photoURL,
        text: value,
        type: "text",
      });
    } catch {
      toast.error("Failed to send message");
      setText(value);
    }
  }

  async function handleFile(file: File, kind: "image" | "file") {
    if (!profile) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File must be under 15MB");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadToImageKit(file, "/chat");
      await sendMessage(roomId, {
        senderId: profile.uid,
        senderName: profile.displayName,
        senderPhoto: profile.photoURL,
        text: "",
        type: kind,
        fileUrl: res.url,
        fileName: res.name,
        fileType: res.fileType,
      });
    } catch (e) {
      console.error(e);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border-t border-border/60 bg-card/40 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10">
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-0 p-0" align="start">
            <EmojiPicker
              theme={theme === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT}
              onEmojiClick={(e) => setText((t) => t + e.emoji)}
              width={320}
              height={380}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10"
          onClick={() => imgRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f, "image");
            e.target.value = "";
          }}
        />

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f, "file");
            e.target.value = "";
          }}
        />

        <textarea
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Type a message…"
          className="flex-1 resize-none rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm outline-none ring-primary/40 focus:ring-2 max-h-32 min-h-[44px]"
        />

        <Button
          onClick={handleSend}
          disabled={!text.trim() || uploading}
          className="shrink-0 rounded-full bg-bubble-me shadow-glow hover:opacity-90 h-10 w-10"
          size="icon"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
