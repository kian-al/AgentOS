import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Skeleton } from "../Skeleton"

describe("Skeleton Component", () => {
  it("renders text skeleton by default with aria-hidden on pulse element", () => {
    render(<Skeleton />)
    const element = screen.getByTestId("skeleton-text")
    expect(element).toBeInTheDocument()
    expect(element).toHaveAttribute("aria-hidden", "true")
  })

  it("renders card variant correctly", () => {
    render(<Skeleton variant="card" />)
    const card = screen.getByTestId("skeleton-card")
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute("aria-hidden", "true")
  })

  it("renders row variant correctly", () => {
    render(<Skeleton variant="row" />)
    const row = screen.getByTestId("skeleton-row")
    expect(row).toBeInTheDocument()
    expect(row).toHaveAttribute("aria-hidden", "true")
  })

  it("renders chart variant correctly", () => {
    render(<Skeleton variant="chart" />)
    const chart = screen.getByTestId("skeleton-chart")
    expect(chart).toBeInTheDocument()
    expect(chart).toHaveAttribute("aria-hidden", "true")
  })

  it("renders multiple skeletons when count is provided", () => {
    render(<Skeleton variant="row" count={3} />)
    const rows = screen.getAllByTestId("skeleton-row")
    expect(rows).toHaveLength(3)
  })
})

