// Package handlers — request parameter validation and security allowlists.
package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"regexp"
)

var (
	// SessionIDRegex validates session identifiers (alphanumeric, underscores, hyphens, 4-128 chars).
	SessionIDRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]{4,128}$`)

	// AgentNameRegex validates agent name identifiers (alphanumeric, underscores, hyphens, 2-128 chars).
	AgentNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]{2,128}$`)

	// CommandNameRegex validates command name identifiers (alphanumeric, underscores, hyphens, 2-128 chars).
	CommandNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]{2,128}$`)

	// AllowedRanges specifies valid time-series and aggregate query windows.
	AllowedRanges = map[string]bool{
		"24h":  true,
		"7d":   true,
		"30d":  true,
		"90d":  true,
		"180d": true,
	}

	// AllowedBreakdowns specifies valid grouping keys for metrics breakdown.
	AllowedBreakdowns = map[string]bool{
		"model": true,
		"agent": true,
	}

	ErrInvalidSessionID = errors.New("invalid session_id: must be 4-128 alphanumeric characters, hyphens, or underscores")
	ErrInvalidAgentName   = errors.New("invalid agent name: must be 2-128 alphanumeric characters, hyphens, or underscores")
	ErrInvalidCommandName = errors.New("invalid command name: must be 2-128 alphanumeric characters, hyphens, or underscores")
	ErrInvalidRange       = errors.New("invalid range: must be one of '24h', '7d', '30d', '90d', '180d'")
	ErrInvalidBy        = errors.New("invalid by param: must be either 'model' or 'agent'")
)

// ValidateAgentName checks if the provided agent name satisfies security policy SEC-02.
func ValidateAgentName(name string) error {
	if !AgentNameRegex.MatchString(name) {
		return ErrInvalidAgentName
	}
	return nil
}

// ValidateCommandName checks if the provided command name satisfies security policy SEC-02.
func ValidateCommandName(name string) error {
	if !CommandNameRegex.MatchString(name) {
		return ErrInvalidCommandName
	}
	return nil
}


// ValidateSessionID checks if the provided session ID satisfies security policy SEC-02.
func ValidateSessionID(id string) error {
	if !SessionIDRegex.MatchString(id) {
		return ErrInvalidSessionID
	}
	return nil
}

// ValidateRange validates that the provided range exists within the allowlist.
func ValidateRange(r string, defaultRange string) (string, error) {
	if r == "" {
		return defaultRange, nil
	}
	if !AllowedRanges[r] {
		return "", fmt.Errorf("%w: received '%s'", ErrInvalidRange, r)
	}
	return r, nil
}

// ValidateBreakdownBy validates that the grouping parameter is either "model" or "agent".
func ValidateBreakdownBy(by string) (string, error) {
	if by == "" {
		return "model", nil
	}
	if !AllowedBreakdowns[by] {
		return "", fmt.Errorf("%w: received '%s'", ErrInvalidBy, by)
	}
	return by, nil
}

// ValidateParams inspects standard HTTP request query and path parameters against security allowlists.
func ValidateParams(r *http.Request) error {
	q := r.URL.Query()

	if rangeParam := q.Get("range"); rangeParam != "" {
		if _, err := ValidateRange(rangeParam, "24h"); err != nil {
			return err
		}
	}

	if byParam := q.Get("by"); byParam != "" {
		if _, err := ValidateBreakdownBy(byParam); err != nil {
			return err
		}
	}

	return nil
}

