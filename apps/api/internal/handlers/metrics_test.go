package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/agentos/api/internal/db"
	"github.com/agentos/api/internal/models"
)

func TestMetricsHandler_Summary(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-metrics-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	now := time.Now().UTC()
	nowISO := now.Format(time.RFC3339)
	tenMinAgo := now.Add(-10 * time.Minute).Format(time.RFC3339)
	yesterday := now.Add(-24 * time.Hour).Format(time.RFC3339)

	// Event 1: Today, 10 min ago (Active session)
	e1 := &models.Event{
		EventType:    "tool_call",
		SessionID:    "sess-active-1",
		Agent:        "agentOS-backend",
		Timestamp:    tenMinAgo,
		InputTokens:  1000,
		OutputTokens: 200,
		Model:        "claude-sonnet-4",
		CostUSD:      0.05,
		RawJSON:      `{}`,
	}
	// Event 2: Today, right now (Active session)
	e2 := &models.Event{
		EventType:    "agent_action",
		SessionID:    "sess-active-2",
		Agent:        "agentOS-frontend",
		Timestamp:    nowISO,
		InputTokens:  500,
		OutputTokens: 100,
		Model:        "claude-sonnet-4",
		CostUSD:      0.02,
		RawJSON:      `{}`,
	}
	// Event 3: Yesterday
	e3 := &models.Event{
		EventType:    "agent_action",
		SessionID:    "sess-old-3",
		Agent:        "agentOS-tester",
		Timestamp:    yesterday,
		InputTokens:  800,
		OutputTokens: 100,
		Model:        "claude-sonnet-4",
		CostUSD:      0.04,
		RawJSON:      `{}`,
	}

	if err := database.InsertEvent(e1); err != nil {
		t.Fatalf("insert e1 failed: %v", err)
	}
	if err := database.InsertEvent(e2); err != nil {
		t.Fatalf("insert e2 failed: %v", err)
	}
	if err := database.InsertEvent(e3); err != nil {
		t.Fatalf("insert e3 failed: %v", err)
	}

	h := &MetricsHandler{DB: database}
	req := httptest.NewRequest(http.MethodGet, "/api/metrics/summary", nil)
	rr := httptest.NewRecorder()

	h.Summary(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var res models.MetricsSummary
	if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	// Verify total events: 3
	if res.EventsTotal != 3 {
		t.Errorf("expected EventsTotal 3, got %d", res.EventsTotal)
	}
	// Verify active sessions (last 15m): 2 (sess-active-1 and sess-active-2)
	if res.ActiveSessions != 2 {
		t.Errorf("expected ActiveSessions 2, got %d", res.ActiveSessions)
	}
	// Verify agents seen today: 2 (backend, frontend)
	if res.AgentsSeen != 2 {
		t.Errorf("expected AgentsSeen 2, got %d", res.AgentsSeen)
	}
	// Verify tokens today: 1200 + 600 = 1800
	if res.TokensToday != 1800 {
		t.Errorf("expected TokensToday 1800, got %d", res.TokensToday)
	}
	// Verify cost today: 0.05 + 0.02 = 0.07
	if res.CostTodayUSD < 0.069 || res.CostTodayUSD > 0.071 {
		t.Errorf("expected CostTodayUSD ~0.07, got %f", res.CostTodayUSD)
	}
}

func TestMetricsHandler_Timeline(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-timeline-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	now := time.Now().UTC()
	nowISO := now.Format(time.RFC3339)
	twoHoursAgo := now.Add(-2 * time.Hour).Format(time.RFC3339)
	twoDaysAgo := now.Add(-48 * time.Hour).Format(time.RFC3339)

	// Event 1: Today, now
	database.InsertEvent(&models.Event{
		EventType:       "agent_action",
		SessionID:       "sess-1",
		Timestamp:       nowISO,
		InputTokens:     2000,
		OutputTokens:    500,
		CacheReadTokens: 1000,
		CostUSD:         0.015,
		RawJSON:         `{}`,
	})
	// Event 2: Today, 2 hours ago
	database.InsertEvent(&models.Event{
		EventType:       "tool_call",
		SessionID:       "sess-1",
		Timestamp:       twoHoursAgo,
		InputTokens:     1000,
		OutputTokens:    200,
		CacheReadTokens: 500,
		CostUSD:         0.008,
		RawJSON:         `{}`,
	})
	// Event 3: 2 days ago
	database.InsertEvent(&models.Event{
		EventType:       "agent_action",
		SessionID:       "sess-2",
		Timestamp:       twoDaysAgo,
		InputTokens:     3000,
		OutputTokens:    800,
		CacheReadTokens: 2000,
		CostUSD:         0.025,
		RawJSON:         `{}`,
	})

	h := &MetricsHandler{DB: database}

	// 1. Test 24h default range
	req24 := httptest.NewRequest(http.MethodGet, "/api/metrics/timeline", nil)
	rr24 := httptest.NewRecorder()
	h.Timeline(rr24, req24)

	if rr24.Code != http.StatusOK {
		t.Fatalf("24h expected status 200, got %d. Body: %s", rr24.Code, rr24.Body.String())
	}

	var buckets24 []models.TimelineBucket
	if err := json.Unmarshal(rr24.Body.Bytes(), &buckets24); err != nil {
		t.Fatalf("failed to parse 24h JSON: %v", err)
	}
	// Should contain event 1 and 2, but not event 3 (2 days ago)
	var totalIn24 int64
	for _, b := range buckets24 {
		totalIn24 += b.InputTokens
	}
	if totalIn24 != 3000 {
		t.Errorf("expected 24h total input tokens 3000, got %d", totalIn24)
	}

	// 2. Test 7d range
	req7d := httptest.NewRequest(http.MethodGet, "/api/metrics/timeline?range=7d", nil)
	rr7d := httptest.NewRecorder()
	h.Timeline(rr7d, req7d)

	if rr7d.Code != http.StatusOK {
		t.Fatalf("7d expected status 200, got %d", rr7d.Code)
	}

	var buckets7d []models.TimelineBucket
	if err := json.Unmarshal(rr7d.Body.Bytes(), &buckets7d); err != nil {
		t.Fatalf("failed to parse 7d JSON: %v", err)
	}
	var totalIn7d int64
	for _, b := range buckets7d {
		totalIn7d += b.InputTokens
	}
	// Should include all 3 events: 2000 + 1000 + 3000 = 6000
	if totalIn7d != 6000 {
		t.Errorf("expected 7d total input tokens 6000, got %d", totalIn7d)
	}

	// 3. Test 30d range
	req30d := httptest.NewRequest(http.MethodGet, "/api/metrics/timeline?range=30d", nil)
	rr30d := httptest.NewRecorder()
	h.Timeline(rr30d, req30d)

	if rr30d.Code != http.StatusOK {
		t.Fatalf("30d expected status 200, got %d", rr30d.Code)
	}

	var buckets30d []models.TimelineBucket
	if err := json.Unmarshal(rr30d.Body.Bytes(), &buckets30d); err != nil {
		t.Fatalf("failed to parse 30d JSON: %v", err)
	}
	if len(buckets30d) == 0 {
		t.Errorf("expected non-empty 30d buckets")
	}
}

func TestMetricsHandler_Breakdown(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-breakdown-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	now := time.Now().UTC()
	nowISO := now.Format(time.RFC3339)

	// Model A / Agent X: high cost ($0.70), 3000 tokens
	e1 := &models.Event{
		EventType:    "tool_call",
		SessionID:    "s1",
		Agent:        "agentOS-backend",
		Model:        "claude-3-5-sonnet",
		Timestamp:    nowISO,
		InputTokens:  2000,
		OutputTokens: 1000,
		CostUSD:      0.70,
		RawJSON:      "{}",
	}
	// Model B / Agent Y: lower cost ($0.30), 1000 tokens
	e2 := &models.Event{
		EventType:    "agent_action",
		SessionID:    "s2",
		Agent:        "agentOS-frontend",
		Model:        "claude-haiku-3",
		Timestamp:    nowISO,
		InputTokens:  800,
		OutputTokens: 200,
		CostUSD:      0.30,
		RawJSON:      "{}",
	}

	if err := database.InsertEvent(e1); err != nil {
		t.Fatalf("insert e1 failed: %v", err)
	}
	if err := database.InsertEvent(e2); err != nil {
		t.Fatalf("insert e2 failed: %v", err)
	}

	h := &MetricsHandler{DB: database}

	// 1. Test Breakdown By Model
	reqModel := httptest.NewRequest(http.MethodGet, "/api/metrics/breakdown?by=model&range=24h", nil)
	rrModel := httptest.NewRecorder()
	h.Breakdown(rrModel, reqModel)

	if rrModel.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d. Body: %s", rrModel.Code, rrModel.Body.String())
	}

	var modelItems []models.BreakdownItem
	if err := json.Unmarshal(rrModel.Body.Bytes(), &modelItems); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	if len(modelItems) != 2 {
		t.Fatalf("expected 2 model items, got %d", len(modelItems))
	}

	// Sorted by cost_usd descending: claude-3-5-sonnet first, then claude-haiku-3
	if modelItems[0].Key != "claude-3-5-sonnet" {
		t.Errorf("expected first item to be claude-3-5-sonnet, got %s", modelItems[0].Key)
	}
	if modelItems[0].CostUSD != 0.70 {
		t.Errorf("expected cost 0.70, got %.2f", modelItems[0].CostUSD)
	}
	if modelItems[0].Tokens != 3000 {
		t.Errorf("expected tokens 3000, got %d", modelItems[0].Tokens)
	}
	if modelItems[0].Pct < 69.0 || modelItems[0].Pct > 71.0 {
		t.Errorf("expected pct around 70.0, got %.1f", modelItems[0].Pct)
	}

	// 2. Test Breakdown By Agent
	reqAgent := httptest.NewRequest(http.MethodGet, "/api/metrics/breakdown?by=agent&range=24h", nil)
	rrAgent := httptest.NewRecorder()
	h.Breakdown(rrAgent, reqAgent)

	if rrAgent.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d. Body: %s", rrAgent.Code, rrAgent.Body.String())
	}

	var agentItems []models.BreakdownItem
	if err := json.Unmarshal(rrAgent.Body.Bytes(), &agentItems); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	if len(agentItems) != 2 {
		t.Fatalf("expected 2 agent items, got %d", len(agentItems))
	}
	if agentItems[0].Key != "agentOS-backend" {
		t.Errorf("expected first agent to be agentOS-backend, got %s", agentItems[0].Key)
	}

	// 3. Test Empty DB / Out-of-range returns empty slice
	reqEmpty := httptest.NewRequest(http.MethodGet, "/api/metrics/breakdown?by=model&range=7d", nil)
	rrEmpty := httptest.NewRecorder()
	emptyDBPath := filepath.Join(tmpDir, "empty.db")
	emptyDB, _ := db.Init(emptyDBPath)
	defer emptyDB.Close()
	hEmpty := &MetricsHandler{DB: emptyDB}
	hEmpty.Breakdown(rrEmpty, reqEmpty)

	if rrEmpty.Code != http.StatusOK {
		t.Fatalf("expected status 200 on empty db, got %d", rrEmpty.Code)
	}
	var emptyItems []models.BreakdownItem
	if err := json.Unmarshal(rrEmpty.Body.Bytes(), &emptyItems); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}
	if len(emptyItems) != 0 {
		t.Errorf("expected 0 items on empty db, got %d", len(emptyItems))
	}
}

func TestMetricsHandler_Heatmap(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-heatmap-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	now := time.Now().UTC()
	todayISO := now.Format(time.RFC3339)
	yesterdayISO := now.Add(-24 * time.Hour).Format(time.RFC3339)
	day100AgoISO := now.Add(-100 * 24 * time.Hour).Format(time.RFC3339)

	// Event 1: Today (1000 in, 500 out = 1500 tokens)
	e1 := &models.Event{
		EventType:    "tool_call",
		SessionID:    "h1",
		Agent:        "agentOS-backend",
		Timestamp:    todayISO,
		InputTokens:  1000,
		OutputTokens: 500,
		RawJSON:      "{}",
	}
	// Event 2: Today (additional 500 in = 500 tokens, total today = 2000)
	e2 := &models.Event{
		EventType:    "agent_action",
		SessionID:    "h2",
		Agent:        "agentOS-backend",
		Timestamp:    todayISO,
		InputTokens:  500,
		OutputTokens: 0,
		RawJSON:      "{}",
	}
	// Event 3: Yesterday (800 in, 200 out = 1000 tokens)
	e3 := &models.Event{
		EventType:    "tool_call",
		SessionID:    "h3",
		Agent:        "agentOS-frontend",
		Timestamp:    yesterdayISO,
		InputTokens:  800,
		OutputTokens: 200,
		RawJSON:      "{}",
	}
	// Event 4: 100 days ago (4000 in = 4000 tokens) -> inside 180d, outside 90d
	e4 := &models.Event{
		EventType:    "tool_call",
		SessionID:    "h4",
		Agent:        "agentOS-tester",
		Timestamp:    day100AgoISO,
		InputTokens:  3000,
		OutputTokens: 1000,
		RawJSON:      "{}",
	}

	for _, e := range []*models.Event{e1, e2, e3, e4} {
		if err := database.InsertEvent(e); err != nil {
			t.Fatalf("insert failed: %v", err)
		}
	}

	h := &MetricsHandler{DB: database}

	// 1. Test 90d range (should include yesterday and today: 2 days)
	req90d := httptest.NewRequest(http.MethodGet, "/api/metrics/heatmap?range=90d", nil)
	rr90d := httptest.NewRecorder()
	h.Heatmap(rr90d, req90d)

	if rr90d.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d. Body: %s", rr90d.Code, rr90d.Body.String())
	}

	var days90d []models.HeatmapDay
	if err := json.Unmarshal(rr90d.Body.Bytes(), &days90d); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	if len(days90d) != 2 {
		t.Fatalf("expected 2 days in 90d heatmap, got %d: %+v", len(days90d), days90d)
	}

	// Verify order: yesterday first, then today
	yesterdayDate := now.Add(-24 * time.Hour).Format("2006-01-02")
	todayDate := now.Format("2006-01-02")

	if days90d[0].Day != yesterdayDate {
		t.Errorf("expected day 0 to be %s, got %s", yesterdayDate, days90d[0].Day)
	}
	if days90d[0].Tokens != 1000 {
		t.Errorf("expected yesterday tokens 1000, got %d", days90d[0].Tokens)
	}

	if days90d[1].Day != todayDate {
		t.Errorf("expected day 1 to be %s, got %s", todayDate, days90d[1].Day)
	}
	if days90d[1].Tokens != 2000 {
		t.Errorf("expected today tokens 2000, got %d", days90d[1].Tokens)
	}

	// 2. Test 180d range (should include all 3 days: 100 days ago, yesterday, today)
	req180d := httptest.NewRequest(http.MethodGet, "/api/metrics/heatmap?range=180d", nil)
	rr180d := httptest.NewRecorder()
	h.Heatmap(rr180d, req180d)

	if rr180d.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr180d.Code)
	}

	var days180d []models.HeatmapDay
	if err := json.Unmarshal(rr180d.Body.Bytes(), &days180d); err != nil {
		t.Fatalf("failed to unmarshal 180d JSON: %v", err)
	}

	if len(days180d) != 3 {
		t.Fatalf("expected 3 days in 180d heatmap, got %d", len(days180d))
	}

	// 3. Test empty database returns empty array
	emptyDBPath := filepath.Join(tmpDir, "empty.db")
	emptyDB, _ := db.Init(emptyDBPath)
	defer emptyDB.Close()
	hEmpty := &MetricsHandler{DB: emptyDB}

	reqEmpty := httptest.NewRequest(http.MethodGet, "/api/metrics/heatmap?range=90d", nil)
	rrEmpty := httptest.NewRecorder()
	hEmpty.Heatmap(rrEmpty, reqEmpty)

	if rrEmpty.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rrEmpty.Code)
	}

	var emptyDays []models.HeatmapDay
	if err := json.Unmarshal(rrEmpty.Body.Bytes(), &emptyDays); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}
	if len(emptyDays) != 0 {
		t.Errorf("expected 0 days on empty db, got %d", len(emptyDays))
	}
}

func TestMetricsHandler_Models(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-models-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	now := time.Now().UTC()
	todayISO := now.Format(time.RFC3339)
	twoDaysAgoISO := now.Add(-48 * time.Hour).Format(time.RFC3339)

	// Model 1: claude-opus-4 (expensive, 100k tokens, $3.00 -> $30.0 / 1M)
	e1 := &models.Event{
		EventType:    "agent_action",
		SessionID:    "s1",
		Model:        "claude-opus-4",
		Timestamp:    todayISO,
		InputTokens:  60000,
		OutputTokens: 40000,
		CostUSD:      3.00,
		RawJSON:      "{}",
	}
	// Model 2: claude-sonnet-4 (200k tokens, $0.60 -> $3.0 / 1M)
	e2 := &models.Event{
		EventType:    "tool_call",
		SessionID:    "s2",
		Model:        "claude-sonnet-4",
		Timestamp:    todayISO,
		InputTokens:  150000,
		OutputTokens: 50000,
		CostUSD:      0.60,
		RawJSON:      "{}",
	}
	// Model 2 second event (claude-sonnet-4, 50k tokens, $0.15)
	e3 := &models.Event{
		EventType:    "tool_call",
		SessionID:    "s3",
		Model:        "claude-sonnet-4",
		Timestamp:    todayISO,
		InputTokens:  40000,
		OutputTokens: 10000,
		CostUSD:      0.15,
		RawJSON:      "{}",
	}
	// Model 3: claude-haiku-3 (2 days ago, outside 24h, inside 7d)
	e4 := &models.Event{
		EventType:    "agent_action",
		SessionID:    "s4",
		Model:        "claude-haiku-3",
		Timestamp:    twoDaysAgoISO,
		InputTokens:  100000,
		OutputTokens: 0,
		CostUSD:      0.05,
		RawJSON:      "{}",
	}

	for _, e := range []*models.Event{e1, e2, e3, e4} {
		if err := database.InsertEvent(e); err != nil {
			t.Fatalf("insert failed: %v", err)
		}
	}

	h := &MetricsHandler{DB: database}

	// 1. Test 24h range: expects claude-opus-4 ($3.00) and claude-sonnet-4 ($0.75, 2 events, 250k tokens)
	req24h := httptest.NewRequest(http.MethodGet, "/api/metrics/models?range=24h", nil)
	rr24h := httptest.NewRecorder()
	h.Models(rr24h, req24h)

	if rr24h.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d. Body: %s", rr24h.Code, rr24h.Body.String())
	}

	var stats24h []models.ModelStat
	if err := json.Unmarshal(rr24h.Body.Bytes(), &stats24h); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	if len(stats24h) != 2 {
		t.Fatalf("expected 2 models in 24h, got %d", len(stats24h))
	}

	// Sorted by cost descending: opus ($3.00) first, sonnet ($0.75) second
	if stats24h[0].Model != "claude-opus-4" {
		t.Errorf("expected first model to be claude-opus-4, got %s", stats24h[0].Model)
	}
	if stats24h[0].CostUSD != 3.00 {
		t.Errorf("expected opus cost 3.00, got %.2f", stats24h[0].CostUSD)
	}
	if stats24h[0].Tokens != 100000 {
		t.Errorf("expected opus tokens 100000, got %d", stats24h[0].Tokens)
	}
	if stats24h[0].CostPerMillion != 30.00 {
		t.Errorf("expected opus cost_per_million 30.00, got %.2f", stats24h[0].CostPerMillion)
	}

	if stats24h[1].Model != "claude-sonnet-4" {
		t.Errorf("expected second model to be claude-sonnet-4, got %s", stats24h[1].Model)
	}
	if stats24h[1].Events != 2 {
		t.Errorf("expected sonnet events 2, got %d", stats24h[1].Events)
	}
	if stats24h[1].Tokens != 250000 {
		t.Errorf("expected sonnet tokens 250000, got %d", stats24h[1].Tokens)
	}
	if stats24h[1].CostUSD != 0.75 {
		t.Errorf("expected sonnet cost 0.75, got %.2f", stats24h[1].CostUSD)
	}
	if stats24h[1].CostPerMillion != 3.00 {
		t.Errorf("expected sonnet cost_per_million 3.00, got %.2f", stats24h[1].CostPerMillion)
	}

	// 2. Test 7d range: includes all 3 models
	req7d := httptest.NewRequest(http.MethodGet, "/api/metrics/models?range=7d", nil)
	rr7d := httptest.NewRecorder()
	h.Models(rr7d, req7d)

	if rr7d.Code != http.StatusOK {
		t.Fatalf("expected status 200 for 7d, got %d", rr7d.Code)
	}

	var stats7d []models.ModelStat
	if err := json.Unmarshal(rr7d.Body.Bytes(), &stats7d); err != nil {
		t.Fatalf("failed to unmarshal 7d JSON: %v", err)
	}
	if len(stats7d) != 3 {
		t.Fatalf("expected 3 models in 7d, got %d", len(stats7d))
	}

	// 3. Test Empty DB returns empty slice
	emptyDBPath := filepath.Join(tmpDir, "empty.db")
	emptyDB, _ := db.Init(emptyDBPath)
	defer emptyDB.Close()
	hEmpty := &MetricsHandler{DB: emptyDB}

	reqEmpty := httptest.NewRequest(http.MethodGet, "/api/metrics/models?range=24h", nil)
	rrEmpty := httptest.NewRecorder()
	hEmpty.Models(rrEmpty, reqEmpty)

	if rrEmpty.Code != http.StatusOK {
		t.Fatalf("expected status 200 on empty db, got %d", rrEmpty.Code)
	}
	var emptyStats []models.ModelStat
	if err := json.Unmarshal(rrEmpty.Body.Bytes(), &emptyStats); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}
	if len(emptyStats) != 0 {
		t.Errorf("expected 0 models on empty db, got %d", len(emptyStats))
	}
}

func TestProjection(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "agentos-projection-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.Init(dbPath)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer database.Close()

	h := &MetricsHandler{DB: database}

	// 1. Test Empty DB returns 0s and "low" confidence
	reqEmpty := httptest.NewRequest(http.MethodGet, "/api/metrics/projection", nil)
	rrEmpty := httptest.NewRecorder()
	h.Projection(rrEmpty, reqEmpty)

	if rrEmpty.Code != http.StatusOK {
		t.Fatalf("expected status 200 on empty db, got %d", rrEmpty.Code)
	}
	var emptyProj models.ProjectionResult
	if err := json.Unmarshal(rrEmpty.Body.Bytes(), &emptyProj); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}
	if emptyProj.DataPoints != 0 {
		t.Errorf("expected 0 data points, got %d", emptyProj.DataPoints)
	}
	if emptyProj.Confidence != "low" {
		t.Errorf("expected 'low' confidence for empty db, got %s", emptyProj.Confidence)
	}
	if emptyProj.ProjectedMonthUSD != 0 {
		t.Errorf("expected 0 projected USD, got %f", emptyProj.ProjectedMonthUSD)
	}

	// 2. Direct unit test of ComputeProjection logic
	// Known dataset: 25 days with cost = 0.10 + 0.01 * i, tokens = 10000 + 1000 * i
	knownPoints := make([]models.ProjectionDailyAggregate, 25)
	for i := 0; i < 25; i++ {
		knownPoints[i] = models.ProjectionDailyAggregate{
			Date:    fmt.Sprintf("2026-10-%02d", i+1),
			CostUSD: 0.10 + 0.01*float64(i),
			Tokens:  int64(10000 + 1000*i),
		}
	}

	resHigh := ComputeProjection(knownPoints)
	if resHigh.DataPoints != 25 {
		t.Errorf("expected 25 data points, got %d", resHigh.DataPoints)
	}
	if resHigh.Confidence != "high" {
		t.Errorf("expected 'high' confidence (>20 points), got %s", resHigh.Confidence)
	}
	// Slope of 0.10 + 0.01 * i should be exactly 0.01
	if math.Abs(resHigh.TrendSlope-0.01) > 0.0001 {
		t.Errorf("expected trend slope ~0.01, got %f", resHigh.TrendSlope)
	}
	// Mean of 0.10 ... 0.34 is 0.22
	if math.Abs(resHigh.DailyAvgUSD-0.22) > 0.01 {
		t.Errorf("expected daily avg ~0.22, got %f", resHigh.DailyAvgUSD)
	}

	// Test "medium" confidence (7 to 20 points)
	resMed := ComputeProjection(knownPoints[:15])
	if resMed.Confidence != "medium" {
		t.Errorf("expected 'medium' confidence (15 points), got %s", resMed.Confidence)
	}

	// Test "low" confidence (<7 points)
	resLow := ComputeProjection(knownPoints[:5])
	if resLow.Confidence != "low" {
		t.Errorf("expected 'low' confidence (5 points), got %s", resLow.Confidence)
	}

	// 3. Integration test with seeded DB events
	now := time.Now().UTC()
	for i := 0; i < 25; i++ {
		eventTime := now.Add(-time.Duration(24-i) * 24 * time.Hour)
		cost := 0.10 + 0.01*float64(i)
		err := database.InsertEvent(&models.Event{
			ID:           int64(10000 + i),
			SessionID:    "sess_proj",
			EventType:    "tool_use",
			Agent:        "agentOS-architect",
			Model:        "claude-opus-4",
			InputTokens:  5000,
			OutputTokens: 5000,
			CostUSD:      cost,
			Timestamp:    eventTime.Format(time.RFC3339),
			CreatedAt:    eventTime.Format(time.RFC3339),
		})
		if err != nil {
			t.Fatalf("failed to insert event %d: %v", i, err)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/api/metrics/projection", nil)
	rr := httptest.NewRecorder()
	h.Projection(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var proj models.ProjectionResult
	if err := json.Unmarshal(rr.Body.Bytes(), &proj); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}
	if proj.DataPoints < 20 {
		t.Errorf("expected at least 20 daily points, got %d", proj.DataPoints)
	}
	if proj.Confidence != "high" {
		t.Errorf("expected 'high' confidence, got %s", proj.Confidence)
	}
	if proj.ProjectedMonthUSD <= 0 {
		t.Errorf("expected positive projected monthly USD, got %f", proj.ProjectedMonthUSD)
	}
}





