import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProgressBar from "@/components/ui/ProgressBar";

describe("ProgressBar", () => {
  it("renders with correct width percentage", () => {
    const { container } = render(<ProgressBar value={50} max={100} />);
    const bar = container.querySelector("[style]")!;
    expect(bar).toHaveStyle({ width: "50%" });
  });

  it("shows teal color when under 80%", () => {
    const { container } = render(<ProgressBar value={60} max={100} />);
    const bar = container.querySelector("[style]")!;
    expect(bar).toHaveClass("bg-primary-500");
  });

  it("shows amber color when between 80-99%", () => {
    const { container } = render(<ProgressBar value={85} max={100} />);
    const bar = container.querySelector("[style]")!;
    expect(bar).toHaveClass("bg-amber-500");
  });

  it("shows red color when exceeding max", () => {
    const { container } = render(<ProgressBar value={120} max={100} />);
    const bar = container.querySelector("[style]")!;
    expect(bar).toHaveClass("bg-red-500");
  });

  it("caps width at 100%", () => {
    const { container } = render(<ProgressBar value={150} max={100} />);
    const bar = container.querySelector("[style]")!;
    expect(bar).toHaveStyle({ width: "100%" });
  });
});
