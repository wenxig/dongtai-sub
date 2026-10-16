export function extractSubscriptions(markdown: string) {
  const subscriptions: string[] = []
  const fence = /^```[^\n]*\n([\s\S]*?)^```/gm
  let match: RegExpExecArray | null

  while ((match = fence.exec(markdown))) {
    const content = match[1]?.trim()
    if (content) subscriptions.push(content)
  }

  return subscriptions
}