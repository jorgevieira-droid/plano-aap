import { defineMcp, auth } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";

const SUPABASE_AUTH_ISSUER = "https://ynqpvyimpqovcbqtcntw.supabase.co/auth/v1";

export default defineMcp({
  name: "bussola-mcp",
  title: "Bússola MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Bússola pedagogical monitoring platform. Use `echo` to verify connectivity.",
  // Require a verified OAuth access token issued by the app's auth server.
  auth: auth.oauth.issuer({
    issuer: SUPABASE_AUTH_ISSUER,
    acceptedAudiences: ["authenticated"],
    resourceName: "Bússola MCP",
  }),
  tools: [echoTool],
});
