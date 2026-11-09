// Package handlers — WebSocket upgrade endpoint.
package handlers

import (
	"net/http"

	"github.com/agentos/api/internal/ws"
)

// WSHandler wraps the WebSocket hub as an HTTP handler.
type WSHandler struct {
	Hub *ws.Hub
}

// ServeHTTP upgrades the connection and delegates to the hub.
func (h *WSHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.Hub.ServeWS(w, r)
}

