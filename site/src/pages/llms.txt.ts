// /llms.txt: a short map of the site for AI tools (https://llmstxt.org)
import { llmsTxt } from "../data/llms";
export const GET = () => new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
