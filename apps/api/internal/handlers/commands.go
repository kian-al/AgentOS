package handlers

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	chi "github.com/go-chi/chi/v5"

	"github.com/agentos/api/internal/commandconfig"
)

// WebSocketBroadcaster defines the interface required to broadcast WebSocket messages.
type WebSocketBroadcaster interface {
	Broadcast(data []byte)
}

// CommandRunnerFunc defines a pluggable execution function for running commands.
type CommandRunnerFunc func(ctx context.Context, bin string, args []string, onLine func(string)) (int, error)

// CommandOutputMessage represents an emitted stdout/stderr line over WebSocket.
type CommandOutputMessage struct {
	Type    string `json:"type"`
	Command string `json:"command"`
	Line    string `json:"line"`
	TS      string `json:"ts"`
}

// CommandDoneMessage represents a command completion notification over WebSocket.
type CommandDoneMessage struct {
	Type     string `json:"type"`
	Command  string `json:"command"`
	ExitCode int    `json:"exit_code"`
}

// CommandsHandler manages HTTP operations on Claude Code slash commands.
type CommandsHandler struct {
	CommandsDir string
	Hub         WebSocketBroadcaster
	Runner      CommandRunnerFunc
	cacheTTL    time.Duration
	cacheMu     sync.RWMutex
	cachedList  []commandconfig.CommandConfig
	lastScanned time.Time

	runMu      sync.Mutex
	isRunning  bool
	runningCmd string
}

// NewCommandsHandler creates a new CommandsHandler targeting the specified directory and optional WebSocket hub.
func NewCommandsHandler(commandsDir string, hub ...WebSocketBroadcaster) *CommandsHandler {
	var h WebSocketBroadcaster
	if len(hub) > 0 {
		h = hub[0]
	}
	return &CommandsHandler{
		CommandsDir: commandsDir,
		Hub:         h,
		cacheTTL:    30 * time.Second,
	}
}

// ListCommands handles GET /api/commands.
// Returns an array of CommandConfig parsed from .claude/commands/*.md.
// Accepts optional ?refresh=true query parameter to bypass cache.
func (h *CommandsHandler) ListCommands(w http.ResponseWriter, r *http.Request) {
	// Validate query parameters allowlist (SEC-02 parameter allowlist)
	query := r.URL.Query()
	for param := range query {
		if param != "refresh" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "unrecognized query parameter: " + param})
			return
		}
	}

	refreshVal := query.Get("refresh")
	if refreshVal != "" && refreshVal != "true" && refreshVal != "false" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid refresh parameter; must be 'true' or 'false'"})
		return
	}

	forceRefresh := refreshVal == "true"

	h.cacheMu.RLock()
	isCacheValid := !forceRefresh && h.cachedList != nil && time.Since(h.lastScanned) < h.cacheTTL
	cached := h.cachedList
	h.cacheMu.RUnlock()

	if isCacheValid {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(cached)
		return
	}

	h.cacheMu.Lock()
	defer h.cacheMu.Unlock()

	// Double check after write lock
	if !forceRefresh && h.cachedList != nil && time.Since(h.lastScanned) < h.cacheTTL {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(h.cachedList)
		return
	}

	commands, err := commandconfig.ParseCommandDir(h.CommandsDir)
	if err != nil {
		http.Error(w, `{"error":"failed to parse command configs"}`, http.StatusInternalServerError)
		return
	}

	if commands == nil {
		commands = []commandconfig.CommandConfig{}
	}

	h.cachedList = commands
	h.lastScanned = time.Now()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(commands)
}

// RunCommand handles POST /api/commands/{name}/run.
// Initiates local execution of a Claude Code slash command and streams stdout/stderr over WebSocket.
// Enforces single-concurrency guard (returns 409 Conflict if already running).
func (h *CommandsHandler) RunCommand(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	if name == "" {
		name = r.URL.Query().Get("name")
	}

	// 1. Validate :name parameter using safe regex
	if err := ValidateCommandName(name); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// 2. Validate command file existence
	cmdPath := filepath.Join(h.CommandsDir, name+".md")
	if _, err := os.Stat(cmdPath); os.IsNotExist(err) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "command not found"})
		return
	}

	// 3. Parse optional request body for args
	var reqBody struct {
		Args string `json:"args"`
	}
	if r.Body != nil && r.ContentLength > 0 {
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body: " + err.Error()})
			return
		}
	}

	// 4. Concurrency guard — single execution lock
	h.runMu.Lock()
	if h.isRunning {
		h.runMu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "another command is currently running"})
		return
	}
	h.isRunning = true
	h.runningCmd = name
	h.runMu.Unlock()

	// 5. Respond 200 OK immediately that execution has started
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "running",
		"command": "/" + name,
	})

	// 6. Spawn subprocess execution in background goroutine
	go func() {
		defer func() {
			h.runMu.Lock()
			h.isRunning = false
			h.runningCmd = ""
			h.runMu.Unlock()
		}()

		h.executeCommand(name, reqBody.Args)
	}()
}

// executeCommand runs the command subprocess and streams output to the WebSocket hub.
func (h *CommandsHandler) executeCommand(name string, args string) {
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
	defer cancel()

	cmdLabel := "/" + name

	broadcast := func(msg any) {
		if h.Hub == nil {
			return
		}
		data, err := json.Marshal(msg)
		if err == nil {
			h.Hub.Broadcast(data)
		}
	}

	onLine := func(line string) {
		broadcast(CommandOutputMessage{
			Type:    "command_output",
			Command: cmdLabel,
			Line:    line,
			TS:      time.Now().UTC().Format(time.RFC3339Nano),
		})
	}

	broadcastDone := func(exitCode int) {
		broadcast(CommandDoneMessage{
			Type:     "command_done",
			Command:  cmdLabel,
			ExitCode: exitCode,
		})
	}

	bin := os.Getenv("AGENTOS_CLAUDE_BIN")
	if bin == "" {
		bin = "claude"
	}

	cmdArgs := []string{cmdLabel}
	if trimmed := strings.TrimSpace(args); trimmed != "" {
		cmdArgs = append(cmdArgs, strings.Fields(trimmed)...)
	}

	// Custom runner (used for testing or mock execution)
	if h.Runner != nil {
		exitCode, err := h.Runner(ctx, bin, cmdArgs, onLine)
		if err != nil && exitCode == 0 {
			exitCode = 1
		}
		broadcastDone(exitCode)
		return
	}

	// Default subprocess runner
	if _, err := exec.LookPath(bin); err != nil {
		onLine(fmt.Sprintf("error: executable '%s' not found in PATH", bin))
		broadcastDone(127)
		return
	}

	cmd := exec.CommandContext(ctx, bin, cmdArgs...)
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		onLine("error: failed to open stdout pipe: " + err.Error())
		broadcastDone(1)
		return
	}

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		onLine("error: failed to open stderr pipe: " + err.Error())
		broadcastDone(1)
		return
	}

	if err := cmd.Start(); err != nil {
		onLine("error: failed to start process: " + err.Error())
		broadcastDone(1)
		return
	}

	var wg sync.WaitGroup
	wg.Add(2)

	scanPipe := func(r io.Reader) {
		defer wg.Done()
		reader := bufio.NewReader(r)
		for {
			line, err := reader.ReadString('\n')
			if len(line) > 0 {
				line = strings.TrimRight(line, "\r\n")
				onLine(line)
			}
			if err != nil {
				break
			}
		}
	}

	go scanPipe(stdoutPipe)
	go scanPipe(stderrPipe)

	wg.Wait()
	waitErr := cmd.Wait()

	exitCode := 0
	if waitErr != nil {
		if exitErr, ok := waitErr.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			exitCode = 1
		}
	}

	if ctx.Err() == context.DeadlineExceeded {
		onLine("error: command timed out after 300s")
		exitCode = 124
	}

	broadcastDone(exitCode)
}
