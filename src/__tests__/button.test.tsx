import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/Button";

describe("Button", () => {
  it("renders and handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Press</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Press" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
