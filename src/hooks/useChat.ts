import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  arrayUnion,
  arrayRemove,
  getDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { ChatUser } from "@/contexts/AuthContext";

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  text: string;
  createdAt?: Timestamp;
  type?: "text" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
};

export type Room = {
  id: string;
  name: string;
  isPrivate?: boolean;
  participants?: string[];
  participantNames?: Record<string, string>;
  participantPhotos?: Record<string, string>;
  createdBy?: string;
  createdAt?: Timestamp;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
};

export function useUsers() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => d.data() as ChatUser));
    });
    return () => unsub();
  }, []);
  return users;
}

export function useRooms(uid: string | null) {
  const [rooms, setRooms] = useState<Room[]>([]);
  useEffect(() => {
    if (!uid) {
      setRooms([]);
      return;
    }
    // public rooms
    const pubQ = query(collection(db, "rooms"), where("isPrivate", "==", false));
    const privQ = query(
      collection(db, "rooms"),
      where("isPrivate", "==", true),
      where("participants", "array-contains", uid),
    );
    let pubRooms: Room[] = [];
    let privRooms: Room[] = [];
    const merge = () => {
      const map = new Map<string, Room>();
      [...pubRooms, ...privRooms].forEach((r) => map.set(r.id, r));
      setRooms(Array.from(map.values()));
    };
    const u1 = onSnapshot(pubQ, (snap) => {
      pubRooms = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Room, "id">) }));
      merge();
    });
    const u2 = onSnapshot(privQ, (snap) => {
      privRooms = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Room, "id">) }));
      merge();
    });
    return () => {
      u1();
      u2();
    };
  }, [uid]);
  return rooms;
}

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) })),
      );
    });
    return () => unsub();
  }, [roomId]);
  return messages;
}

export type TypingState = Record<string, { name: string; ts: number }>;

export function useTyping(roomId: string | null, currentUid: string | null) {
  const [typing, setTyping] = useState<TypingState>({});
  useEffect(() => {
    if (!roomId) {
      setTyping({});
      return;
    }
    const ref = doc(db, "rooms", roomId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      const t: TypingState = (data?.typing as TypingState) || {};
      const now = Date.now();
      const filtered: TypingState = {};
      for (const [uid, val] of Object.entries(t)) {
        if (uid !== currentUid && now - val.ts < 4000) filtered[uid] = val;
      }
      setTyping(filtered);
    });
    return () => unsub();
  }, [roomId, currentUid]);
  return typing;
}

export async function setTypingStatus(
  roomId: string,
  uid: string,
  name: string,
  isTyping: boolean,
) {
  const ref = doc(db, "rooms", roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const typing = { ...(data.typing || {}) };
  if (isTyping) typing[uid] = { name, ts: Date.now() };
  else delete typing[uid];
  await updateDoc(ref, { typing });
}

export async function sendMessage(
  roomId: string,
  payload: Omit<Message, "id" | "createdAt">,
) {
  await addDoc(collection(db, "rooms", roomId, "messages"), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "rooms", roomId), {
    lastMessage:
      payload.type === "image"
        ? "📷 Photo"
        : payload.type === "file"
          ? `📎 ${payload.fileName ?? "File"}`
          : payload.text,
    lastMessageAt: serverTimestamp(),
  });
}

export async function createPublicRoom(name: string, uid: string) {
  const ref = await addDoc(collection(db, "rooms"), {
    name,
    isPrivate: false,
    participants: [uid],
    createdBy: uid,
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });
  return ref.id;
}

export async function joinRoom(roomId: string, uid: string) {
  await updateDoc(doc(db, "rooms", roomId), { participants: arrayUnion(uid) });
}

export async function leaveRoom(roomId: string, uid: string) {
  await updateDoc(doc(db, "rooms", roomId), { participants: arrayRemove(uid) });
}

function dmId(a: string, b: string) {
  return [a, b].sort().join("__");
}

export async function getOrCreateDM(me: ChatUser, other: ChatUser) {
  const id = `dm_${dmId(me.uid, other.uid)}`;
  const ref = doc(db, "rooms", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: "",
      isPrivate: true,
      participants: [me.uid, other.uid],
      participantNames: {
        [me.uid]: me.displayName,
        [other.uid]: other.displayName,
      },
      participantPhotos: {
        [me.uid]: me.photoURL,
        [other.uid]: other.photoURL,
      },
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    });
  }
  return id;
}