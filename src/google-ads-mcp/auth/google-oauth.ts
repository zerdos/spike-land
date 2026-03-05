/**
 * Google Ads OAuth2 + developer token management.
 */

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class GoogleAdsAuthClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly developerToken: string;
  private readonly customerId: string;
  private readonly loginCustomerId: string | undefined;

  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(opts: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    developerToken: string;
    customerId: string;
    loginCustomerId?: string;
  }) {
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.refreshToken = opts.refreshToken;
    this.developerToken = opts.developerToken;
    this.customerId = opts.customerId.replace(/-/g, "");
    this.loginCustomerId = opts.loginCustomerId?.replace(/-/g, "");
  }

  getCustomerId(): string {
    return this.customerId;
  }

  async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "developer-token": this.developerToken,
      "Content-Type": "application/json",
    };
    if (this.loginCustomerId) {
      headers["login-customer-id"] = this.loginCustomerId;
    }
    return headers;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    if (this.accessToken && now < this.tokenExpiresAt - FIVE_MINUTES) {
      return this.accessToken;
    }
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    });
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OAuth token refresh failed (${resp.status}): ${text}`);
    }
    const data = (await resp.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = now + data.expires_in * 1000;
    return this.accessToken;
  }
}
