"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { BeaconEvent, CommandOutputMessage, CommandDoneMessage, WS_URL } from "@/lib/api"

export type SocketMessage = BeaconEvent | CommandOutputMessage | CommandDoneMessage

export function useBeaconSocket(url = WS_URL) {
  const [events, setEvents] = useState<BeaconEvent[]>([])
  const [lastEvent, setLastEvent] = useState<SocketMessage | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        console.log("[BeaconWS] Connected to AgentOS telemetry socket at", url)
      }

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as SocketMessage
          console.log("[BeaconWS] Received event:", parsed)
          setLastEvent(parsed)
          if ("event_type" in parsed) {
            setEvents((prev) => [parsed as BeaconEvent, ...prev.slice(0, 99)])
          }
        } catch {
          console.warn("[BeaconWS] Unparseable message:", event.data)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        console.log("[BeaconWS] Connection closed, retrying in 3s...")
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = (err) => {
        console.error("[BeaconWS] Error:", err)
        ws.close()
      }
    } catch (err) {
      console.error("[BeaconWS] Socket creation error:", err)
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (socketRef.current) socketRef.current.close()
    }
  }, [connect])

  return { events, lastEvent, isConnected }
}
