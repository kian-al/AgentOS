package commandconfig

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCommandParser(t *testing.T) {
	t.Run("parses testdata fixture correctly", func(t *testing.T) {
		fixturePath := filepath.Join("..", "..", "testdata", "commands", "test-command.md")
		cfg, err := ParseCommandFile(fixturePath)
		if err != nil {
			t.Fatalf("failed to parse fixture: %v", err)
		}

		if cfg.Name != "test-command" {
			t.Errorf("expected name 'test-command', got '%s'", cfg.Name)
		}
		expectedTitle := "/test-command — Execute Test Operation"
		if cfg.Title != expectedTitle {
			t.Errorf("expected title '%s', got '%s'", expectedTitle, cfg.Title)
		}
		expectedDesc := "This is a test command description explaining the operation of the test command."
		if cfg.Description != expectedDesc {
			t.Errorf("expected description '%s', got '%s'", expectedDesc, cfg.Description)
		}
		if len(cfg.Body) == 0 {
			t.Errorf("expected non-empty body")
		}
	})

	t.Run("parses H1 as title and first paragraph as description", func(t *testing.T) {
		tempDir := t.TempDir()
		content := `# /my-cmd — Deploy Production

Deploy the current release to production clusters safely.

## Options
--force
`
		cmdFile := filepath.Join(tempDir, "my-cmd.md")
		if err := os.WriteFile(cmdFile, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write test file: %v", err)
		}

		cfg, err := ParseCommandFile(cmdFile)
		if err != nil {
			t.Fatalf("failed to parse command file: %v", err)
		}

		if cfg.Name != "my-cmd" {
			t.Errorf("expected name 'my-cmd', got '%s'", cfg.Name)
		}
		if cfg.Title != "/my-cmd — Deploy Production" {
			t.Errorf("expected title '/my-cmd — Deploy Production', got '%s'", cfg.Title)
		}
		if cfg.Description != "Deploy the current release to production clusters safely." {
			t.Errorf("unexpected description: '%s'", cfg.Description)
		}
	})

	t.Run("falls back to command name when H1 is missing", func(t *testing.T) {
		tempDir := t.TempDir()
		content := `## Usage
Run without H1.

Some description paragraph.
`
		cmdFile := filepath.Join(tempDir, "plain-cmd.md")
		if err := os.WriteFile(cmdFile, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write test file: %v", err)
		}

		cfg, err := ParseCommandFile(cmdFile)
		if err != nil {
			t.Fatalf("failed to parse: %v", err)
		}

		if cfg.Title != "plain-cmd" {
			t.Errorf("expected fallback title 'plain-cmd', got '%s'", cfg.Title)
		}
		if cfg.Description != "Run without H1." {
			t.Errorf("expected first paragraph 'Run without H1.', got '%s'", cfg.Description)
		}
	})

	t.Run("returns empty slice for missing directory", func(t *testing.T) {
		missingDir := filepath.Join(t.TempDir(), "non-existent-directory")
		commands, err := ParseCommandDir(missingDir)
		if err != nil {
			t.Fatalf("expected nil error for missing directory, got: %v", err)
		}
		if len(commands) != 0 {
			t.Errorf("expected 0 commands, got %d", len(commands))
		}
	})
}

