import type { Code } from "../../lazy-imports/chatRoom";

export class StorageRoutes {
  private code: Code;
  constructor(code: Code) {
    this.code = code;
  }

  async handleHashCodeRoute(_request: Request, _url: URL, path: string[]): Promise<Response> {
    const hashCode = String(Number(path[1]));
    const patch = await this.code
      .getState()
      .storage.get<{ patch: string; oldHash: number }>(hashCode, {
        allowConcurrency: true,
      });

    return new Response(JSON.stringify(patch || {}), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json; charset=UTF-8",
      },
    });
  }
}
