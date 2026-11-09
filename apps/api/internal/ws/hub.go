// Package ws provides the WebSocket hub for broadcasting Beacon events to dashboard clients.
package ws

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// upgrader configures the WebSocket upgrader with permissive origin checking for local dev.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for local-first development
		return true
	},
}

// client represents a single connected WebSocket client.
type client struct {
	conn *websocket.Conn
	send chan []byte
}

// Hub manages all active WebSocket connections and broadcasts messages to them.
type Hub struct {
	mu      sync.RWMutex
	clients map[*client]struct{}
}

// NewHub creates an initialized Hub.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[*client]struct{}),
	}
}

// Broadcast sends a JSON payload to all connected clients.
// Clients that fail to receive are removed.
func (h *Hub) Broadcast(data []byte) {
	h.mu.RLock()
	cls := make([]*client, 0, len(h.clients))
	for c := range h.clients {
		cls = append(cls, c)
	}
	h.mu.RUnlock()

	for _, c := range cls {
		select {
		case c.send <- data:
		default:
			// Client buffer full — disconnect it
			h.remove(c)
		}
	}
}

// ServeWS upgrades an HTTP connection to WebSocket and registers the client.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WS] Upgrade error: %v", err)
		return
	}

	c := &client{
		conn: conn,
		send: make(chan []byte, 256),
	}
	h.add(c)
	log.Printf("[WS] Client connected (%d total)", h.count())

	// Writer goroutine
	go func() {
		defer func() {
			h.remove(c)
			c.conn.Close()
			log.Printf("[WS] Client disconnected (%d total)", h.count())
		}()
		for msg := range c.send {
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}()

	// Reader goroutine — drain incoming messages (ping/pong/close)
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
	h.remove(c)
}

func (h *Hub) add(c *client) {
	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()
}

func (h *Hub) remove(c *client) {
	h.mu.Lock()
	if _, ok := h.clients[c]; ok {
		delete(h.clients, c)
		close(c.send)
	}
	h.mu.Unlock()
}

func (h *Hub) count() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

