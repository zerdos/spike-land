import { defineApp } from "rwsdk/worker";
import { route, render } from "rwsdk/router";
import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { HomePage } from "@/app/pages/home";
import { PostPage } from "@/app/pages/post";
import { RssFeed } from "@/app/pages/rss";

const app = defineApp([
  setCommonHeaders,
  render(Document, [route("/", HomePage), route("/rss", RssFeed), route("/:slug", PostPage)]),
]);

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    if (url.pathname === "/musical-hexagons" || url.pathname === "/musical-hexagons.html") {
      return new Response(null, {
        status: 301,
        headers: { Location: url.origin + "/musical-hexagons-arena" },
      });
    }
    if (url.pathname.endsWith(".html")) {
      const newPath = url.pathname.slice(0, -5);
      return new Response(null, {
        status: 301,
        headers: { Location: url.origin + newPath },
      });
    }
    return app.fetch(request, env, ctx);
  },
};
