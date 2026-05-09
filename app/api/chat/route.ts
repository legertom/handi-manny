import { createAgentUIStreamResponse } from "ai";
import { chatAgent, type ChatUIMessage } from "@/lib/chat-agent";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatUIMessage[] };
  return createAgentUIStreamResponse({
    agent: chatAgent,
    uiMessages: messages,
  });
}
