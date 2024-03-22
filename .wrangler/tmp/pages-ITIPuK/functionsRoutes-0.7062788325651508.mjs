import { onRequestGet as __leaderboard_js_onRequestGet } from "C:\\Users\\7600X\\Documents\\GitHub\\cloudflare-edge-leaderboard\\functions\\leaderboard.js"
import { onRequestOptions as __leaderboard_js_onRequestOptions } from "C:\\Users\\7600X\\Documents\\GitHub\\cloudflare-edge-leaderboard\\functions\\leaderboard.js"
import { onRequestPost as __leaderboard_js_onRequestPost } from "C:\\Users\\7600X\\Documents\\GitHub\\cloudflare-edge-leaderboard\\functions\\leaderboard.js"

export const routes = [
    {
      routePath: "/leaderboard",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__leaderboard_js_onRequestGet],
    },
  {
      routePath: "/leaderboard",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__leaderboard_js_onRequestOptions],
    },
  {
      routePath: "/leaderboard",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__leaderboard_js_onRequestPost],
    },
  ]