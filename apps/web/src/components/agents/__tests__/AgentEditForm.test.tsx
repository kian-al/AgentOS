import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AgentEditForm } from "../AgentEditForm"
import { AgentConfig, updateAgent } from "@/lib/api"

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    updateAgent: vi.fn(),
  }
})

const mockAgent: AgentConfig = {
  name: "agentOS-architect",
  description: "Reads sprint stories and outputs structured plans.",
  tools: ["Read", "Glob", "LS"],
  file_path: ".claude/agents/agentOS-architect.md",
  updated_at: "2026-11-04T22:45:00Z",
}

describe("AgentEditForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders pre-filled fields with existing agent values", () => {
    render(
      <AgentEditForm
        agent={mockAgent}
        onSaveSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const descTextarea = screen.getByLabelText(/description/i)
    expect(descTextarea).toBeInTheDocument()
    expect(descTextarea).toHaveValue("Reads sprint stories and outputs structured plans.")

    const toolsInput = screen.getByLabelText(/tools/i)
    expect(toolsInput).toBeInTheDocument()
    expect(toolsInput).toHaveValue("Read, Glob, LS")

    expect(screen.getByLabelText("Save agent config")).toBeEnabled()
    expect(screen.getByLabelText("Cancel editing agent config")).toBeEnabled()
  })

  it("disables Save button when description is empty", async () => {
    const user = userEvent.setup()
    render(
      <AgentEditForm
        agent={mockAgent}
        onSaveSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const descTextarea = screen.getByLabelText(/description/i)
    await user.clear(descTextarea)

    expect(descTextarea).toHaveValue("")
    expect(screen.getByText("Description must not be empty.")).toBeInTheDocument()
    expect(screen.getByLabelText("Save agent config")).toBeDisabled()
  })

  it("disables Save button when tools input is empty", async () => {
    const user = userEvent.setup()
    render(
      <AgentEditForm
        agent={mockAgent}
        onSaveSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const toolsInput = screen.getByLabelText(/tools/i)
    await user.clear(toolsInput)

    expect(toolsInput).toHaveValue("")
    expect(screen.getByText("At least one tool is required.")).toBeInTheDocument()
    expect(screen.getByLabelText("Save agent config")).toBeDisabled()
  })

  it("calls updateAgent on submit and handles success", async () => {
    const user = userEvent.setup()
    const onSaveSuccess = vi.fn()
    const updatedMock: AgentConfig = {
      ...mockAgent,
      description: "Updated planning instructions.",
      tools: ["Read", "Write", "Bash"],
      updated_at: "2026-11-08T14:40:00Z",
    }
    vi.mocked(updateAgent).mockResolvedValueOnce(updatedMock)

    render(
      <AgentEditForm
        agent={mockAgent}
        onSaveSuccess={onSaveSuccess}
        onCancel={vi.fn()}
      />
    )

    const descTextarea = screen.getByLabelText(/description/i)
    await user.clear(descTextarea)
    await user.type(descTextarea, "Updated planning instructions.")

    const toolsInput = screen.getByLabelText(/tools/i)
    await user.clear(toolsInput)
    await user.type(toolsInput, "Read, Write, Bash")

    const saveBtn = screen.getByLabelText("Save agent config")
    await user.click(saveBtn)

    await waitFor(() => {
      expect(updateAgent).toHaveBeenCalledWith("agentOS-architect", {
        description: "Updated planning instructions.",
        tools: ["Read", "Write", "Bash"],
      })
      expect(onSaveSuccess).toHaveBeenCalledWith(updatedMock)
      expect(screen.getByText("Agent saved")).toBeInTheDocument()
    })
  })

  it("renders error toast on update failure", async () => {
    const user = userEvent.setup()
    vi.mocked(updateAgent).mockRejectedValueOnce(new Error("Disk write permission denied"))

    render(
      <AgentEditForm
        agent={mockAgent}
        onSaveSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const saveBtn = screen.getByLabelText("Save agent config")
    await user.click(saveBtn)

    await waitFor(() => {
      expect(updateAgent).toHaveBeenCalled()
      expect(screen.getByText("Save failed: Disk write permission denied")).toBeInTheDocument()
    })
  })

  it("reverts fields on Cancel button click", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <AgentEditForm
        agent={mockAgent}
        onSaveSuccess={vi.fn()}
        onCancel={onCancel}
      />
    )

    const descTextarea = screen.getByLabelText(/description/i)
    await user.type(descTextarea, " Temporary edit")

    const toolsInput = screen.getByLabelText(/tools/i)
    await user.type(toolsInput, ", ExtraTool")

    const cancelBtn = screen.getByLabelText("Cancel editing agent config")
    await user.click(cancelBtn)

    expect(descTextarea).toHaveValue("Reads sprint stories and outputs structured plans.")
    expect(toolsInput).toHaveValue("Read, Glob, LS")
    expect(onCancel).toHaveBeenCalled()
  })
})

