package db

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/agentos/api/internal/models"
)

func TestDB_Lifecycle(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-db-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	// Insert test event
	evt := &models.Event{
		EventType:       "user_prompt",
		SessionID:       "sess-001",
		Agent:           "architect",
		Timestamp:       "2026-11-05T01:00:00Z",
		InputTokens:     200,
		OutputTokens:    100,
		CacheReadTokens: 50,
		Model:           "claude-3-5-sonnet",
		CostUSD:         0.005,
		ToolName:        "",
		RawJSON:         `{"test":true}`,
	}

	if err := database.InsertEvent(evt); err != nil {
		t.Fatalf("failed to insert event: %v", err)
	}

	// Retrieve latest events
	events, err := database.LatestEvents(10)
	if err != nil {
		t.Fatalf("failed to query latest events: %v", err)
	}
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}
	if events[0].SessionID != "sess-001" {
		t.Errorf("expected session_id sess-001, got %s", events[0].SessionID)
	}
	if events[0].CostUSD != 0.005 {
		t.Errorf("expected cost 0.005, got %f", events[0].CostUSD)
	}

	// Retrieve session summaries
	summaries, err := database.SessionSummaries()
	if err != nil {
		t.Fatalf("failed to query session summaries: %v", err)
	}
	if len(summaries) != 1 {
		t.Fatalf("expected 1 summary, got %d", len(summaries))
	}
	if summaries[0].EventCount != 1 {
		t.Errorf("expected event count 1, got %d", summaries[0].EventCount)
	}
	if summaries[0].TotalCost != 0.005 {
		t.Errorf("expected total cost 0.005, got %f", summaries[0].TotalCost)
	}
}

