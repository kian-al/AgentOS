import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CommandList } from "../CommandList"
import { CommandConfig } from "@/lib/api"
import * as commandsHook from "@/hooks/useCommands"

vi.mock("@/hooks/useCommands")

const mockCommands: CommandConfig[] = [
  {
    name: "sprint",
    title: "/sprint — Load and Execute a Sprint Story",
    description: "Read sprint file and invoke agent loop.",
    file_path: ".claude/commands/sprint.md",
    body: "# /sprint — Load and Execute a Sprint Story\n\nFull body content",
    updated_at: "2026-11-04T22:45:00Z",
  },
  {
    name: "beacon-check",
    title: "/beacon-check — Verify Telemetry Pipeline",
    description: "Check beacon status and runtime logs.",
    file_path: ".claude/commands/beacon-check.md",
    body: "# /beacon-check — Verify Telemetry Pipeline\n\nPipeline steps",
    updated_at: "2026-11-04T22:45:00Z",
  },
]

describe("CommandList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders command rows with name, title, description", () => {
    vi.mocked(commandsHook.useCommands).mockReturnValue({
      commands: mockCommands,
      data: mockCommands,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CommandList />)

    expect(screen.getByText("/sprint")).toBeInTheDocument()
    expect(
      screen.getByText("/sprint — Load and Execute a Sprint Story")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Read sprint file and invoke agent loop.")
    ).toBeInTheDocument()

    expect(screen.getByText("/beacon-check")).toBeInTheDocument()
    expect(
      screen.getByText("/beacon-check — Verify Telemetry Pipeline")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Check beacon status and runtime logs.")
    ).toBeInTheDocument()
  })

  it("row has correct aria-label", () => {
    vi.mocked(commandsHook.useCommands).mockReturnValue({
      commands: mockCommands,
      data: mockCommands,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CommandList />)

    const sprintRow = screen.getByLabelText("Open command /sprint")
    expect(sprintRow).toBeInTheDocument()
    expect(sprintRow).toHaveAttribute("tabIndex", "0")

    const beaconRow = screen.getByLabelText("Open command /beacon-check")
    expect(beaconRow).toBeInTheDocument()
    expect(beaconRow).toHaveAttribute("tabIndex", "0")
  })

  it("click opens detail sheet callback", async () => {
    const user = userEvent.setup()
    const handleCommandClick = vi.fn()

    vi.mocked(commandsHook.useCommands).mockReturnValue({
      commands: mockCommands,
      data: mockCommands,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CommandList onCommandClick={handleCommandClick} />)

    const sprintRow = screen.getByLabelText("Open command /sprint")
    await user.click(sprintRow)

    expect(handleCommandClick).toHaveBeenCalledWith(mockCommands[0])
    expect(screen.getByLabelText("Close command detail")).toBeInTheDocument()
  })

  it("Enter opens detail sheet callback", async () => {
    const user = userEvent.setup()
    const handleCommandClick = vi.fn()

    vi.mocked(commandsHook.useCommands).mockReturnValue({
      commands: mockCommands,
      data: mockCommands,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CommandList onCommandClick={handleCommandClick} />)

    const sprintRow = screen.getByLabelText("Open command /sprint")
    sprintRow.focus()
    await user.keyboard("{Enter}")

    expect(handleCommandClick).toHaveBeenCalledWith(mockCommands[0])
    expect(screen.getByLabelText("Close command detail")).toBeInTheDocument()
  })

  it("Space opens detail sheet callback", async () => {
    const user = userEvent.setup()
    const handleCommandClick = vi.fn()

    vi.mocked(commandsHook.useCommands).mockReturnValue({
      commands: mockCommands,
      data: mockCommands,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CommandList onCommandClick={handleCommandClick} />)

    const beaconRow = screen.getByLabelText("Open command /beacon-check")
    beaconRow.focus()
    await user.keyboard(" ")

    expect(handleCommandClick).toHaveBeenCalledWith(mockCommands[1])
    expect(screen.getByLabelText("Close command detail")).toBeInTheDocument()
  })

  it("renders Skeleton while loading", () => {
    vi.mocked(commandsHook.useCommands).mockReturnValue({
      commands: [],
      data: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<CommandList />)

    expect(screen.getByLabelText("Loading slash commands")).toBeInTheDocument()
  })

  it("renders EmptyState when no commands", () => {
    vi.mocked(commandsHook.useCommands).mockReturnValue({
      commands: [],
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CommandList />)

    expect(screen.getByText("No Commands Configured")).toBeInTheDocument()
    expect(
      screen.getByText(/No slash command markdown files found in \.claude\/commands\/\*\.md/i)
    ).toBeInTheDocument()
  })
})

