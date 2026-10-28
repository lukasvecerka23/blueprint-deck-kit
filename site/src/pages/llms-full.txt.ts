// /llms-full.txt: the whole documentation as one plain-text file, for AI tools
import { llmsFullTxt } from "../data/llms";
export const GET = () => new Response(llmsFullTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
