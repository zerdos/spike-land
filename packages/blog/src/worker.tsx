import { defineApp } from "rwsdk/worker";
import { route, render } from "rwsdk/router";
import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { HomePage } from "@/app/pages/home";
import { PostPage } from "@/app/pages/post";
import { RssFeed } from "@/app/pages/rss";

export default defineApp([
  setCommonHeaders,
  render(Document, [route("/", HomePage), route("/rss", RssFeed), route("/:slug", PostPage)]),
]);
