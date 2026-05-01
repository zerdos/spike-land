import type { RequestInfo } from "rwsdk/worker";

export function redirectHtml(info: RequestInfo) {
  console.log(Object.keys(info));
}
