import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Use vi.hoisted so mock fn is available inside vi.mock factory
const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock("@/lib/auth/client", () => ({
  useSession: mockUseSession,
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: vi.fn(),
  authClient: {},
}));

import { useSession } from "./hooks";
import { UserRole } from "../core/types";

describe("useSession hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthenticated state when underlying hook returns null data", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.data).toBeNull();
    expect(result.current.status).toBe("unauthenticated");
  });

  it("returns loading state", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();
  });

  it("returns session data when authenticated", () => {
    const fakeSession = {
      user: {
        id: "user_abc",
        name: "Alice",
        email: "alice@example.com",
        image: null,
        role: UserRole.USER,
      },
      expires: "2099-01-01T00:00:00.000Z",
    };
    mockUseSession.mockReturnValue({
      data: fakeSession,
      status: "authenticated",
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.status).toBe("authenticated");
    expect(result.current.data).toEqual(fakeSession);
    expect(result.current.data?.user.email).toBe("alice@example.com");
  });

  it("returns an update function", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    const { result } = renderHook(() => useSession());
    expect(typeof result.current.update).toBe("function");
  });

  it("returns admin role session correctly", () => {
    const adminSession = {
      user: {
        id: "admin_id",
        name: "Admin User",
        email: "admin@example.com",
        image: "https://example.com/avatar.jpg",
        role: UserRole.ADMIN,
      },
      expires: "2099-01-01T00:00:00.000Z",
    };
    mockUseSession.mockReturnValue({
      data: adminSession,
      status: "authenticated",
    });
    const { result } = renderHook(() => useSession());
    expect(result.current.data?.user.role).toBe(UserRole.ADMIN);
  });
});
