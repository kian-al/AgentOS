import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CommandRunner } from "../CommandRunner"
import * as api from "@/lib/api"
import * as socketHook from "@/hooks/useBeaconSocket"

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return {
    ...actual,
    runCommand: vi.fn(),
  }
})

vi.mock("@/hooks/useBeaconSocket")

const mockCommand = {
  name: "sprint",
  title: "/sprint — Load and Execute a Sprint Story",
}

describe("CommandRunner Component", () => {
  let mockSocketReturn: {
    events: api.BeaconEvent[]
    lastEvent: socketHook.SocketMessage | null
    isConnected: boolean
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSocketReturn = {
      events: [],
      lastEvent: null,
      isConnected: true,
    }
    vi.mocked(socketHook.useBeaconSocket).mockImplementation(() => mockSocketReturn)
  })

  it("renders args input and Run button", () => {
    render(<CommandRunner command={mockCommand} />)

    expect(screen.getByLabelText("Command arguments")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("e.g. 1 4")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Run command /sprint" })).toBeInTheDocument()
    expect(screen.getByRole("log", { name: "Command execution output" })).toBeInTheDocument()
  })

  it("calls runCommand with name and entered args on submit", async () => {
    const user = userEvent.setup()
    vi.mocked(api.runCommand).mockResolvedValue({ status: "running", command: "/sprint" })

    render(<CommandRunner command={mockCommand} />)

    const input = screen.getByLabelText("Command arguments")
    await user.type(input, "4 2")

    const runBtn = screen.getByRole("button", { name: "Run command /sprint" })
    await user.click(runBtn)

    expect(api.runCommand).toHaveBeenCalledWith("sprint", "4 2")
  })

  it("renders 'Command running…' indicator when execution is in-flight", async () => {
    const user = userEvent.setup()
    let resolveRun: (val: api.RunCommandResponse) => void = () => {}
    const runPromise = new Promise<api.RunCommandResponse>((res) => {
      resolveRun = res
    })
    vi.mocked(api.runCommand).mockReturnValue(runPromise)

    render(<CommandRunner command={mockCommand} />)

    const runBtn = screen.getByRole("button", { name: "Run command /sprint" })
    await user.click(runBtn)

    expect(screen.getByTestId("command-running-indicator")).toBeInTheDocument()
    expect(screen.getByText(/Command running…/i)).toBeInTheDocument()

    // Resolve run
    await act(async () => {
      resolveRun({ status: "running", command: "/sprint" })
    })
  })

  it("renders live output lines from WebSocket command_output events", () => {
    const { rerender } = render(<CommandRunner command={mockCommand} />)

    // Receive first line
    mockSocketReturn = {
      ...mockSocketReturn,
      lastEvent: {
        type: "command_output",
        command: "/sprint",
        line: "Reading sprints/sprint-4.md...",
        ts: "2026-11-08T15:30:00Z",
      },
    }
    vi.mocked(socketHook.useBeaconSocket).mockReturnValue(mockSocketReturn)
    rerender(<CommandRunner command={mockCommand} />)

    expect(screen.getByText("Reading sprints/sprint-4.md...")).toBeInTheDocument()

    // Receive second line
    mockSocketReturn = {
      ...mockSocketReturn,
      lastEvent: {
        type: "command_output",
        command: "/sprint",
        line: "Executing Story 4.2...",
        ts: "2026-11-08T15:30:01Z",
      },
    }
    vi.mocked(socketHook.useBeaconSocket).mockReturnValue(mockSocketReturn)
    rerender(<CommandRunner command={mockCommand} />)

    const terminal = screen.getByRole("log", { name: "Command execution output" })
    expect(terminal.textContent).toContain("Reading sprints/sprint-4.md...")
    expect(terminal.textContent).toContain("Executing Story 4.2...")
  })

  it("renders exit code badge (chart-cache/green for 0, chart-error/red for non-zero)", () => {
    const { rerender } = render(<CommandRunner command={mockCommand} />)

    // Successful exit code 0
    mockSocketReturn = {
      ...mockSocketReturn,
      lastEvent: {
        type: "command_done",
        command: "/sprint",
        exit_code: 0,
      },
    }
    vi.mocked(socketHook.useBeaconSocket).mockReturnValue(mockSocketReturn)
    rerender(<CommandRunner command={mockCommand} />)

    const successBadge = screen.getByTestId("exit-code-badge")
    expect(successBadge).toBeInTheDocument()
    expect(successBadge).toHaveTextContent("Exit: 0")
    expect(successBadge).toHaveClass("bg-chart-cache/20")
    expect(successBadge).toHaveClass("text-chart-cache")

    // Error exit code 1
    mockSocketReturn = {
      ...mockSocketReturn,
      lastEvent: {
        type: "command_done",
        command: "/sprint",
        exit_code: 1,
      },
    }
    vi.mocked(socketHook.useBeaconSocket).mockReturnValue(mockSocketReturn)
    rerender(<CommandRunner command={mockCommand} />)

    const errorBadge = screen.getByTestId("exit-code-badge")
    expect(errorBadge).toBeInTheDocument()
    expect(errorBadge).toHaveTextContent("Exit: 1")
    expect(errorBadge).toHaveClass("bg-chart-error/20")
    expect(errorBadge).toHaveClass("text-chart-error")
  })

  it("clears output and exit status when Clear button is clicked", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<CommandRunner command={mockCommand} />)

    // Receive output and exit code
    mockSocketReturn = {
      ...mockSocketReturn,
      lastEvent: {
        type: "command_output",
        command: "/sprint",
        line: "Step completed.",
        ts: "2026-11-08T15:30:00Z",
      },
    }
    vi.mocked(socketHook.useBeaconSocket).mockReturnValue(mockSocketReturn)
    rerender(<CommandRunner command={mockCommand} />)

    expect(screen.getByText("Step completed.")).toBeInTheDocument()

    // Click clear
    const clearBtn = screen.getByRole("button", { name: "Clear output terminal" })
    await user.click(clearBtn)

    expect(screen.queryByText("Step completed.")).not.toBeInTheDocument()
    expect(screen.queryByTestId("exit-code-badge")).not.toBeInTheDocument()
    expect(screen.getByText(/No output yet/i)).toBeInTheDocument()
  })

  it("displays error alert when runCommand fails (e.g. 409 Conflict)", async () => {
    const user = userEvent.setup()
    vi.mocked(api.runCommand).mockRejectedValue(new Error("Another command is currently running"))

    render(<CommandRunner command={mockCommand} />)

    const runBtn = screen.getByRole("button", { name: "Run command /sprint" })
    await user.click(runBtn)

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
    expect(screen.getByText("Another command is currently running")).toBeInTheDocument()
  })
})

