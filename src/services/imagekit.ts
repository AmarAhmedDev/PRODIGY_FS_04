import { getImageKitAuth } from "@/server/imagekit.functions";
import { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT } from "./firebase";

export type UploadedFile = {
  url: string;
  thumbnailUrl?: string;
  name: string;
  size: number;
  fileType: string;
  fileId: string;
};

export async function uploadToImageKit(file: File, folder = "/chat"): Promise<UploadedFile> {
  const { token, expire, signature } = await getImageKitAuth();
  const form = new FormData();
  form.append("file", file);
  form.append("fileName", file.name);
  form.append("publicKey", IMAGEKIT_PUBLIC_KEY);
  form.append("signature", signature);
  form.append("expire", String(expire));
  form.append("token", token);
  form.append("folder", folder);
  form.append("useUniqueFileName", "true");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImageKit upload failed: ${text}`);
  }
  const data = await res.json();
  return {
    url: data.url,
    thumbnailUrl: data.thumbnailUrl,
    name: data.name,
    size: data.size,
    fileType: data.fileType ?? file.type,
    fileId: data.fileId,
  };
}

export { IMAGEKIT_URL_ENDPOINT };