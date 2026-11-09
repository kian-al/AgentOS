// Package beacon provides the JSONL file watcher for Agent Beacon telemetry.
package beacon

import (
	"bufio"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/agentos/api/internal/models"
)

// Watcher watches the Beacon JSONL file and emits parsed events on the Events channel.
// It uses polling + seek to tail the file, and retries gracefully if the file doesn't exist.
type Watcher struct {
	filePath string
	Events   chan *models.Event
	done     chan struct{}
	rawLines chan string
}

// NewWatcher creates a new Watcher for the given JSONL file path.
// Expands ~ to the user home directory.
func NewWatcher(filePath string) *Watcher {
	// Expand ~ to home dir
	if len(filePath) >= 2 && filePath[:2] == "~/" {
		home, err := os.UserHomeDir()
		if err == nil {
			filePath = filepath.Join(home, filePath[2:])
		}
	}
	return &Watcher{
		filePath: filePath,
		Events:   make(chan *models.Event, 256),
		done:     make(chan struct{}),
		rawLines: make(chan string, 256),
	}
}

// Start begins watching the file. This is a blocking call — run it in a goroutine.
// It polls every 500ms for new content appended to the file.
func (w *Watcher) Start(onEvent func(evt *models.Event, rawJSON string)) {
	log.Printf("[Watcher] Starting watch on: %s", w.filePath)
	var offset int64

	// Ensure parent directory exists
	if err := os.MkdirAll(filepath.Dir(w.filePath), 0755); err != nil {
		log.Printf("[Watcher] Warning: could not create log directory: %v", err)
	}

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-w.done:
			log.Println("[Watcher] Stopped.")
			return
		case <-ticker.C:
			info, err := os.Stat(w.filePath)
			if err != nil {
				// File doesn't exist yet — wait silently
				offset = 0
				continue
			}

			currentSize := info.Size()
			if currentSize < offset {
				// File was truncated/rotated — reset position
				log.Printf("[Watcher] File rotated (size %d < offset %d), resetting.", currentSize, offset)
				offset = 0
			}
			if currentSize == offset {
				// No new data
				continue
			}

			// Read new bytes from last offset
			f, err := os.Open(w.filePath)
			if err != nil {
				log.Printf("[Watcher] Open error: %v", err)
				continue
			}

			if _, err := f.Seek(offset, io.SeekStart); err != nil {
				log.Printf("[Watcher] Seek error: %v", err)
				f.Close()
				continue
			}

			scanner := bufio.NewScanner(f)
			for scanner.Scan() {
				line := scanner.Bytes()
				rawJSON := string(line)
				raw, err := ParseLine(line)
				if err != nil {
					log.Printf("[Watcher] Parse error (skipping): %v | line: %s", err, rawJSON)
					continue
				}
				evt := NormalizeEvent(raw, rawJSON)
				onEvent(evt, rawJSON)
				select {
				case w.Events <- evt:
				default:
					log.Println("[Watcher] Events channel full, dropping event")
				}
			}
			if err := scanner.Err(); err != nil {
				log.Printf("[Watcher] Scanner error: %v", err)
			}

			// Update offset to current position in file
			newOffset, _ := f.Seek(0, io.SeekCurrent)
			offset = newOffset
			f.Close()
		}
	}
}

// Stop signals the watcher to stop.
func (w *Watcher) Stop() {
	close(w.done)
}

