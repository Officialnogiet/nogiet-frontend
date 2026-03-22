import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api/v1", "") ?? "http://localhost:3001";

export function useSocketUpdates() {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket.IO] connected:", socket.id);
    });

    socket.on("satellite:update", (data: { features: any[]; total: number; bbox?: string | null }) => {
      qc.setQueriesData(
        { queryKey: ["satellite-sources"] },
        (old: any) => {
          if (!old) return { success: true, message: "ok", data: { features: data.features, total: data.total } };
          return { ...old, data: { features: data.features, total: data.total, cached: false } };
        }
      );
    });

    socket.on("alert:new", () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    });

    socket.on("disconnect", () => {
      console.log("[Socket.IO] disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [qc]);

  return socketRef;
}
