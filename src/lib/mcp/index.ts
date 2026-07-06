import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";

export default defineMcp({
  name: "bussola-mcp",
  title: "Bússola MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Bússola pedagogical monitoring platform. Use `echo` to verify connectivity.",
  tools: [echoTool],
});
