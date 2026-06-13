import { describe, it, expect } from "vitest";
import { canDeleteComment } from "./comments";

describe("canDeleteComment", () => {
  it("lets the comment author delete their own comment", () => {
    expect(
      canDeleteComment({
        viewerId: "u1",
        commentAuthorId: "u1",
        spotAuthorId: "u2",
      }),
    ).toBe(true);
  });

  it("lets the spot author delete a comment on their spot", () => {
    expect(
      canDeleteComment({
        viewerId: "u2",
        commentAuthorId: "u1",
        spotAuthorId: "u2",
      }),
    ).toBe(true);
  });

  it("rejects an unrelated user", () => {
    expect(
      canDeleteComment({
        viewerId: "u3",
        commentAuthorId: "u1",
        spotAuthorId: "u2",
      }),
    ).toBe(false);
  });

  it("rejects when viewerId is empty/undefined", () => {
    expect(
      canDeleteComment({
        viewerId: "",
        commentAuthorId: "u1",
        spotAuthorId: "u2",
      }),
    ).toBe(false);
  });
});
