package agentconfig

import (
	"os"
	"path/filepath"
	"testing"
)

func TestAgentConfigParser(t *testing.T) {
	testDir := filepath.Join("testdata", "agents")

	t.Run("parses valid agent from directory", func(t *testing.T) {
		configs, err := ParseAgentDir(testDir)
		if err != nil {
			t.Fatalf("unexpected error parsing agent dir: %v", err)
		}

		if len(configs) == 0 {
			t.Fatalf("expected at least 1 agent, got 0")
		}

		agent := configs[0]
		if agent.Name != "test-agent" {
			t.Errorf("expected name 'test-agent', got '%s'", agent.Name)
		}
		if agent.Description != "Specialized testing agent for unit verification." {
			t.Errorf("expected description 'Specialized testing agent for unit verification.', got '%s'", agent.Description)
		}
		expectedTools := []string{"Read", "Write", "Bash"}
		if len(agent.Tools) != len(expectedTools) {
			t.Fatalf("expected %d tools, got %d", len(expectedTools), len(agent.Tools))
		}
		for i, tool := range expectedTools {
			if agent.Tools[i] != tool {
				t.Errorf("tool[%d]: expected '%s', got '%s'", i, tool, agent.Tools[i])
			}
		}
		if agent.UpdatedAt.IsZero() {
			t.Errorf("expected non-zero UpdatedAt")
		}
	})

	t.Run("returns empty slice when directory does not exist", func(t *testing.T) {
		missingDir := filepath.Join("testdata", "non-existent-directory")
		configs, err := ParseAgentDir(missingDir)
		if err != nil {
			t.Fatalf("expected nil error for missing directory, got: %v", err)
		}
		if configs == nil || len(configs) != 0 {
			t.Fatalf("expected empty slice, got %+v", configs)
		}
	})

	t.Run("parses tools as array in frontmatter", func(t *testing.T) {
		tempDir := t.TempDir()
		content := `---
name: array-agent
description: Agent with YAML array tools
tools:
  - Search
  - Execute
---
Body text here.`
		filePath := filepath.Join(tempDir, "array-agent.md")
		if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write temp file: %v", err)
		}

		cfg, err := ParseAgentFile(filePath)
		if err != nil {
			t.Fatalf("failed to parse agent file: %v", err)
		}

		if cfg.Name != "array-agent" {
			t.Errorf("expected name 'array-agent', got '%s'", cfg.Name)
		}
		if len(cfg.Tools) != 2 || cfg.Tools[0] != "Search" || cfg.Tools[1] != "Execute" {
			t.Errorf("unexpected tools: %+v", cfg.Tools)
		}
	})

	t.Run("parses real workspace agents if present", func(t *testing.T) {
		workspaceAgentsDir := filepath.Join("..", "..", "..", ".claude", "agents")
		if info, err := os.Stat(workspaceAgentsDir); err == nil && info.IsDir() {
			configs, err := ParseAgentDir(workspaceAgentsDir)
			if err != nil {
				t.Fatalf("failed to parse workspace agents: %v", err)
			}
			if len(configs) < 5 {
				t.Errorf("expected at least 5 workspace agents, got %d", len(configs))
			}
		}
	})
}

