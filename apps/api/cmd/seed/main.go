// Command seed populates agentOS.db with realistic synthetic telemetry events.
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	"github.com/agentos/api/internal/beacon"
	"github.com/agentos/api/internal/db"
	"github.com/agentos/api/internal/models"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./agentOS.db"
	}

	testdataFile := filepath.Join(".", "internal", "beacon", "testdata", "sample.jsonl")
	// If run from cmd/seed or root, handle relative path
	if _, err := os.Stat("internal"); os.IsNotExist(err) {
		testdataFile = filepath.Join("..", "..", "internal", "beacon", "testdata", "sample.jsonl")
	}

	// 1. Ensure testdata directory exists
	if err := os.MkdirAll(filepath.Dir(testdataFile), 0755); err != nil {
		log.Fatalf("failed to create testdata dir: %v", err)
	}

	// 2. Generate 200 synthetic events if sample.jsonl does not exist or has < 200 lines
	ensureSampleData(testdataFile)

	// 3. Connect to SQLite DB
	database, err := db.Init(dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	// 4. Read sample.jsonl and insert events into DB
	f, err := os.Open(testdataFile)
	if err != nil {
		log.Fatalf("failed to open sample.jsonl: %v", err)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	count := 0
	for scanner.Scan() {
		line := scanner.Bytes()
		rawJSON := string(line)
		raw, err := beacon.ParseLine(line)
		if err != nil {
			continue
		}
		evt := beacon.NormalizeEvent(raw, rawJSON)
		if err := database.InsertEvent(evt); err != nil {
			log.Printf("Insert error: %v", err)
			continue
		}
		count++
	}

	log.Printf("✅ Successfully seeded %d events from %s into %s", count, testdataFile, dbPath)
}

func ensureSampleData(path string) {
	if fi, err := os.Stat(path); err == nil && fi.Size() > 1000 {
		return // Already exists
	}

	modelsList := []string{"claude-sonnet-4", "claude-opus-4", "claude-haiku-3"}
	agentsList := []string{
		"agentOS-backend",
		"agentOS-frontend",
		"agentOS-tester",
		"agentOS-architect",
		"agentOS-beacon",
	}
	toolsList := []string{"Bash", "Read", "Write", "Edit", "Glob"}
	eventTypes := []string{"agent_action", "tool_call", "user_prompt", "session_start"}

	f, err := os.Create(path)
	if err != nil {
		log.Fatalf("failed to create sample.jsonl: %v", err)
	}
	defer f.Close()

	now := time.Now().UTC()
	rng := rand.New(rand.NewSource(42))

	// Generate 200 events spanning 7 days up to right now
	for i := 1; i <= 200; i++ {
		// Distribute across 7 days: some right now (today), some yesterday, some earlier
		hoursAgo := rng.Float64() * 7 * 24
		if i > 170 {
			// Ensure last 30 events are within the last 2 hours (today)
			hoursAgo = rng.Float64() * 2
		} else if i > 140 {
			// Ensure 30 events are yesterday
			hoursAgo = 24 + rng.Float64()*12
		}
		evtTime := now.Add(-time.Duration(hoursAgo * float64(time.Hour)))

		sessionNum := (i % 8) + 1
		sessionID := fmt.Sprintf("seed-session-%03d", sessionNum)
		agent := agentsList[rng.Intn(len(agentsList))]
		model := modelsList[rng.Intn(len(modelsList))]
		eventType := eventTypes[rng.Intn(len(eventTypes))]

		inTokens := 500 + rng.Intn(4000)
		outTokens := 100 + rng.Intn(1200)
		cacheRead := 0
		if rng.Float64() > 0.5 {
			cacheRead = 1000 + rng.Intn(5000)
		}

		// Cost estimation based on tokens
		rate := 0.000003 // default sonnet
		if model == "claude-opus-4" {
			rate = 0.000015
		} else if model == "claude-haiku-3" {
			rate = 0.0000008
		}
		costUSD := (float64(inTokens)*rate + float64(outTokens)*rate*5)

		var toolInfo *models.ToolInfo
		if eventType == "tool_call" || rng.Float64() > 0.4 {
			toolName := toolsList[rng.Intn(len(toolsList))]
			toolInfo = &models.ToolInfo{
				Name:  toolName,
				Input: map[string]string{"command": "inspect"},
			}
		}

		evt := models.RawEvent{
			EventType: eventType,
			SessionID: sessionID,
			Agent:     agent,
			Timestamp: evtTime.Format(time.RFC3339),
			TokenUsage: models.TokenUsage{
				Input:     inTokens,
				Output:    outTokens,
				CacheRead: cacheRead,
			},
			Model:   model,
			CostUSD: float64(int(costUSD*10000)) / 10000,
			Tool:    toolInfo,
		}

		b, _ := json.Marshal(evt)
		f.Write(b)
		f.WriteString("\n")
	}

	log.Printf("Generated 200 synthetic events into %s", path)
}

