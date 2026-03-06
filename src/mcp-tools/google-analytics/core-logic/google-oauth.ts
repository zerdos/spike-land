/**
 * Google OAuth2 token management via refresh token flow.
 */

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class GoogleAuthClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;

  private accessToken: string | null = null;
  private expiresAt = 0;

  constructor(config: { clientId: string; clientSecret: string; refreshToken: string }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.refreshToken = config.refreshToken;
  }

  async getAccessToken(): Promise<string> {
    const bufferMs = 5 * 60 * 1000;
    if (this.accessToken && Date.now() < this.expiresAt - bufferMs) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OAuth2 token refresh failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
}
