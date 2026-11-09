package agentconfig

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// AgentConfig represents the metadata of a Claude Code agent parsed from frontmatter.
type AgentConfig struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Tools       []string  `json:"tools"`
	FilePath    string    `json:"file_path"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type rawFrontmatter struct {
	Name        string      `yaml:"name"`
	Description string      `yaml:"description"`
	Tools       interface{} `yaml:"tools"`
}

// ParseAgentFile parses an individual agent markdown file.
func ParseAgentFile(path string) (*AgentConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read file %s: %w", path, err)
	}

	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("stat file %s: %w", path, err)
	}

	// Normalize line breaks
	content := string(data)
	content = strings.ReplaceAll(content, "\r\n", "\n")

	// Verify frontmatter markers
	if !strings.HasPrefix(content, "---\n") {
		return nil, fmt.Errorf("file %s has no opening frontmatter marker", path)
	}

	rest := content[4:]
	endIdx := strings.Index(rest, "\n---\n")
	if endIdx == -1 {
		// Could end with \n--- at EOF
		if strings.HasSuffix(rest, "\n---") {
			endIdx = len(rest) - 4
		} else {
			return nil, fmt.Errorf("file %s has no closing frontmatter marker", path)
		}
	}

	frontmatterBytes := []byte(rest[:endIdx])

	var raw rawFrontmatter
	if err := yaml.Unmarshal(frontmatterBytes, &raw); err != nil {
		return nil, fmt.Errorf("unmarshal frontmatter in %s: %w", path, err)
	}

	// Parse tools (string, list of strings, list of interfaces)
	var tools []string
	switch v := raw.Tools.(type) {
	case string:
		parts := strings.Split(v, ",")
		for _, p := range parts {
			trimmed := strings.TrimSpace(p)
			if trimmed != "" {
				tools = append(tools, trimmed)
			}
		}
	case []interface{}:
		for _, item := range v {
			if s, ok := item.(string); ok {
				trimmed := strings.TrimSpace(s)
				if trimmed != "" {
					tools = append(tools, trimmed)
				}
			}
		}
	case []string:
		for _, s := range v {
			trimmed := strings.TrimSpace(s)
			if trimmed != "" {
				tools = append(tools, trimmed)
			}
		}
	}

	if tools == nil {
		tools = []string{}
	}

	// Fallback name to filename base if unspecified
	name := strings.TrimSpace(raw.Name)
	if name == "" {
		base := filepath.Base(path)
		name = strings.TrimSuffix(base, filepath.Ext(base))
	}

	return &AgentConfig{
		Name:        name,
		Description: strings.TrimSpace(raw.Description),
		Tools:       tools,
		FilePath:    filepath.ToSlash(path),
		UpdatedAt:   info.ModTime().UTC(),
	}, nil
}

// ParseAgentDir scans all markdown files in the specified directory and returns parsed configs.
// If the directory does not exist, an empty slice and nil error are returned.
func ParseAgentDir(dirPath string) ([]AgentConfig, error) {
	info, err := os.Stat(dirPath)
	if os.IsNotExist(err) || (err == nil && !info.IsDir()) {
		return []AgentConfig{}, nil
	}
	if err != nil {
		return []AgentConfig{}, nil
	}

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("read directory %s: %w", dirPath, err)
	}

	var configs []AgentConfig
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if !strings.HasSuffix(strings.ToLower(entry.Name()), ".md") {
			continue
		}

		fullPath := filepath.Join(dirPath, entry.Name())
		cfg, err := ParseAgentFile(fullPath)
		if err != nil {
			// Skip or log invalid files without aborting the entire scan
			continue
		}
		configs = append(configs, *cfg)
	}

	// Sort alphabetically by agent name
	sort.Slice(configs, func(i, j int) bool {
		return strings.ToLower(configs[i].Name) < strings.ToLower(configs[j].Name)
	})

	if configs == nil {
		configs = []AgentConfig{}
	}

	return configs, nil
}

// GetAgentByName attempts to load an agent configuration matching the given name.
// It checks dirPath/name.md first, and falls back to scanning the directory if needed.
// Returns os.ErrNotExist if the agent is not found.
func GetAgentByName(dirPath, name string) (*AgentConfig, error) {
	directPath := filepath.Join(dirPath, name+".md")
	if info, err := os.Stat(directPath); err == nil && !info.IsDir() {
		cfg, err := ParseAgentFile(directPath)
		if err == nil {
			return cfg, nil
		}
	}

	configs, err := ParseAgentDir(dirPath)
	if err != nil {
		return nil, err
	}

	for _, cfg := range configs {
		if strings.EqualFold(cfg.Name, name) {
			return &cfg, nil
		}
	}

	return nil, os.ErrNotExist
}

// UpdateAgentFile updates only the frontmatter of an agent markdown file,
// preserving the agent name and all body content after the closing frontmatter delimiter.
// Writes back to disk atomically using a temporary file.
func UpdateAgentFile(filePath string, description string, tools []string) (*AgentConfig, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("read file %s: %w", filePath, err)
	}

	content := string(data)
	content = strings.ReplaceAll(content, "\r\n", "\n")

	if !strings.HasPrefix(content, "---\n") {
		return nil, fmt.Errorf("file %s has no opening frontmatter marker", filePath)
	}

	rest := content[4:]
	endIdx := strings.Index(rest, "\n---\n")
	var body string
	if endIdx != -1 {
		body = rest[endIdx+5:]
	} else if strings.HasSuffix(rest, "\n---") {
		endIdx = len(rest) - 4
		body = ""
	} else {
		return nil, fmt.Errorf("file %s has no closing frontmatter marker", filePath)
	}

	frontmatterBytes := []byte(rest[:endIdx])
	var raw rawFrontmatter
	if err := yaml.Unmarshal(frontmatterBytes, &raw); err != nil {
		return nil, fmt.Errorf("unmarshal existing frontmatter in %s: %w", filePath, err)
	}

	agentName := strings.TrimSpace(raw.Name)
	if agentName == "" {
		base := filepath.Base(filePath)
		agentName = strings.TrimSuffix(base, filepath.Ext(base))
	}

	type updatedFrontmatter struct {
		Name        string   `yaml:"name"`
		Description string   `yaml:"description"`
		Tools       []string `yaml:"tools"`
	}

	cleanedTools := make([]string, 0, len(tools))
	for _, t := range tools {
		trimmed := strings.TrimSpace(t)
		if trimmed != "" {
			cleanedTools = append(cleanedTools, trimmed)
		}
	}

	uf := updatedFrontmatter{
		Name:        agentName,
		Description: strings.TrimSpace(description),
		Tools:       cleanedTools,
	}

	updatedYaml, err := yaml.Marshal(uf)
	if err != nil {
		return nil, fmt.Errorf("marshal updated frontmatter: %w", err)
	}

	newContent := "---\n" + string(updatedYaml) + "---\n" + body

	// Atomic write via temp file
	tempFile := filePath + ".tmp"
	if err := os.WriteFile(tempFile, []byte(newContent), 0644); err != nil {
		return nil, fmt.Errorf("write temp file %s: %w", tempFile, err)
	}

	_ = os.Remove(filePath)
	if err := os.Rename(tempFile, filePath); err != nil {
		if writeErr := os.WriteFile(filePath, []byte(newContent), 0644); writeErr != nil {
			return nil, fmt.Errorf("atomic rename failed (%v) and fallback write failed (%w)", err, writeErr)
		}
		_ = os.Remove(tempFile)
	}

	return ParseAgentFile(filePath)
}


