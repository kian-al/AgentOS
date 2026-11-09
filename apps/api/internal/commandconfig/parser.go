package commandconfig

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// CommandConfig represents the metadata of a Claude Code slash command.
type CommandConfig struct {
	Name        string    `json:"name"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	FilePath    string    `json:"file_path"`
	Body        string    `json:"body"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type rawFrontmatter struct {
	Name        string `yaml:"name"`
	Title       string `yaml:"title"`
	Description string `yaml:"description"`
}

// ParseCommandFile parses a single markdown command definition file.
func ParseCommandFile(path string) (*CommandConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read command file %s: %w", path, err)
	}

	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("stat command file %s: %w", path, err)
	}

	// 1. Command name derived from filename without extension
	base := filepath.Base(path)
	name := strings.TrimSuffix(base, filepath.Ext(base))

	content := string(data)
	content = strings.ReplaceAll(content, "\r\n", "\n")

	var frontmatter rawFrontmatter
	body := content

	// 2. Optional YAML frontmatter block
	if strings.HasPrefix(content, "---\n") {
		rest := content[4:]
		endIdx := strings.Index(rest, "\n---\n")
		if endIdx != -1 {
			fmBytes := []byte(rest[:endIdx])
			_ = yaml.Unmarshal(fmBytes, &frontmatter)
			body = rest[endIdx+5:]
		} else if strings.HasSuffix(rest, "\n---") {
			endIdx = len(rest) - 4
			fmBytes := []byte(rest[:endIdx])
			_ = yaml.Unmarshal(fmBytes, &frontmatter)
			body = ""
		}
	}

	// 3. Extract first H1 heading for title (fallback to frontmatter title, then command name)
	title := ""
	var firstParagraphLines []string
	inParagraph := false

	scanner := bufio.NewScanner(strings.NewReader(body))
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		// Check for first H1 heading (# Heading)
		if title == "" && strings.HasPrefix(trimmed, "# ") {
			title = strings.TrimSpace(trimmed[2:])
			continue
		}

		// First non-heading paragraph extraction
		if len(firstParagraphLines) == 0 && !inParagraph {
			if trimmed == "" || strings.HasPrefix(trimmed, "#") {
				continue
			}
			// Found the start of the first non-heading paragraph
			inParagraph = true
			firstParagraphLines = append(firstParagraphLines, trimmed)
		} else if inParagraph {
			if trimmed == "" || strings.HasPrefix(trimmed, "#") {
				// End of first paragraph
				inParagraph = false
				break
			}
			firstParagraphLines = append(firstParagraphLines, trimmed)
		}
	}

	if title == "" {
		if strings.TrimSpace(frontmatter.Title) != "" {
			title = strings.TrimSpace(frontmatter.Title)
		} else if strings.TrimSpace(frontmatter.Name) != "" {
			title = strings.TrimSpace(frontmatter.Name)
		} else {
			title = name
		}
	}

	description := strings.TrimSpace(strings.Join(firstParagraphLines, " "))
	if description == "" && strings.TrimSpace(frontmatter.Description) != "" {
		description = strings.TrimSpace(frontmatter.Description)
	}

	return &CommandConfig{
		Name:        name,
		Title:       title,
		Description: description,
		FilePath:    filepath.ToSlash(path),
		Body:        strings.TrimSpace(body),
		UpdatedAt:   info.ModTime().UTC(),
	}, nil
}

// ParseCommandDir scans the commands directory and parses all markdown files.
// If dirPath does not exist, an empty slice and nil error are returned.
func ParseCommandDir(dirPath string) ([]CommandConfig, error) {
	info, err := os.Stat(dirPath)
	if os.IsNotExist(err) || (err == nil && !info.IsDir()) {
		return []CommandConfig{}, nil
	}
	if err != nil {
		return []CommandConfig{}, nil
	}

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("read commands dir %s: %w", dirPath, err)
	}

	var commands []CommandConfig
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if !strings.HasSuffix(strings.ToLower(entry.Name()), ".md") {
			continue
		}

		fullPath := filepath.Join(dirPath, entry.Name())
		cfg, err := ParseCommandFile(fullPath)
		if err != nil {
			// Skip invalid files without terminating the scan
			continue
		}
		commands = append(commands, *cfg)
	}

	// Sort alphabetically by command name
	sort.Slice(commands, func(i, j int) bool {
		return strings.ToLower(commands[i].Name) < strings.ToLower(commands[j].Name)
	})

	if commands == nil {
		commands = []CommandConfig{}
	}

	return commands, nil
}

