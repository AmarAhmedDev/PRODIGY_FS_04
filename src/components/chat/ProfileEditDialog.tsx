import { useState, useRef, useCallback } from "react";
import { Camera, Loader2, Save, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Resize an image file to a max dimension and return a compressed data URL.
 * This avoids needing external hosting — the base64 is stored in Firestore.
 */
function resizeImage(file: File, maxSize = 200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      } else {
        if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      // Draw circular clip for clean avatar
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

export function ProfileEditDialog({ open, onOpenChange }: Props) {
  const { profile, updateUserProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [photoURL, setPhotoURL] = useState(profile?.photoURL ?? "");
  const [previewURL, setPreviewURL] = useState(profile?.photoURL ?? "");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Reset state when dialog opens
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen && profile) {
      setName(profile.displayName);
      setPhotoURL(profile.photoURL);
      setPreviewURL(profile.photoURL);
    }
    onOpenChange(newOpen);
  }, [profile, onOpenChange]);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setProcessing(true);
    try {
      // Resize and compress to base64 data URL (small enough for Firestore)
      const dataUrl = await resizeImage(file, 200, 0.75);
      setPreviewURL(dataUrl);
      setPhotoURL(dataUrl);
      toast.success("Image ready! Click Save to apply.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to process image");
    } finally {
      setProcessing(false);
      e.target.value = "";
    }
  }

  function generateRandomAvatar() {
    const seed = `${profile?.uid}-${Date.now()}`;
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    setPhotoURL(url);
    setPreviewURL(url);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const updates: { displayName?: string; photoURL?: string } = {};
      if (name.trim() !== profile?.displayName) updates.displayName = name.trim();
      if (photoURL !== profile?.photoURL) updates.photoURL = photoURL;
      if (Object.keys(updates).length > 0) {
        await updateUserProfile(updates);
        toast.success("Profile updated!");
      } else {
        toast("No changes to save");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Avatar with change overlay */}
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={previewURL} className="object-cover" />
              <AvatarFallback className="text-2xl">
                {name?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {processing ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* Generate random avatar button */}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={generateRandomAvatar}
            className="text-xs text-muted-foreground"
          >
            🎲 Generate random avatar
          </Button>

          {/* Name input */}
          <div className="w-full space-y-1.5">
            <Label htmlFor="edit-name">Display Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Email (read-only) */}
          <div className="w-full space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled className="opacity-60" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || processing}>
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
