import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { CommandDetailSheet } from "../CommandDetailSheet"
import { CommandConfig } from "@/lib/api"

const mockCommand: CommandConfig = {
  name: "sprint",
  title: "/sprint — Load and Execute a Sprint Story",
  description: "Read sprint file and invoke agent loop.",
  file_path: ".claude/commands/sprint.md",
  body: "# /sprint — Load and Execute a Sprint Story\n\nFull command execution instructions and options.",
  updated_at: "2026-11-04T22:45:00Z",
}

describe("CommandDetailSheet Component", () => {
  it("renders command name and title", () => {
    render(
      <CommandDetailSheet
        command={mockCommand}
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText("/sprint")).toBeInTheDocument()
    expect(
      screen.getByText("/sprint — Load and Execute a Sprint Story")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Read sprint file and invoke agent loop.")
    ).toBeInTheDocument()
  })

  it("renders body content in readable pre-wrap container", () => {
    render(
      <CommandDetailSheet
        command={mockCommand}
        open={true}
        onClose={vi.fn()}
      />
    )

    const bodyPre = screen.getByLabelText("Command body content")
    expect(bodyPre).toBeInTheDocument()
    expect(
      screen.getByText(/Full command execution instructions and options\./i)
    ).toBeInTheDocument()
  })

  it("renders integrated CommandRunner with active Run button", () => {
    render(
      <CommandDetailSheet
        command={mockCommand}
        open={true}
        onClose={vi.fn()}
      />
    )

    const runBtn = screen.getByLabelText("Run command /sprint")
    expect(runBtn).toBeInTheDocument()
    expect(runBtn).toBeEnabled()
  })

  it("close button has aria-label='Close command detail' and fires onClose", async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <CommandDetailSheet
        command={mockCommand}
        open={true}
        onClose={handleClose}
      />
    )

    const closeBtn = screen.getByLabelText("Close command detail")
    expect(closeBtn).toBeInTheDocument()

    await user.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it("renders Skeleton while loading detail", () => {
    render(
      <CommandDetailSheet
        command={null}
        open={true}
        loading={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByTestId("command-detail-skeleton")).toBeInTheDocument()
  })
})
