export type PushMessage = { title: string; body: string; url: string; tag: string };

export function validVapidSubject(subject: string): boolean {
  return /^(mailto:.+@.+|https:\/\/.+)$/i.test(subject);
}

export function validVapidConfiguration(publicKey?: string, privateKey?: string, subject?: string): boolean {
  return Boolean(publicKey && privateKey && subject && validVapidSubject(subject));
}

export function safePushMessage(message: PushMessage): PushMessage {
  const url = message.url.startsWith("/") && !message.url.startsWith("//") ? message.url : "/";
  return {
    title: message.title.slice(0, 80),
    body: message.body.slice(0, 180),
    url,
    tag: message.tag.slice(0, 80),
  };
}

export function weeklyStrategyPush(topic: { title: string; sourceLabel: string }, weekIndex: number): PushMessage {
  return safePushMessage({
    title: "This week's SEO + GEO strategy",
    body: `${topic.sourceLabel}: ${topic.title}`,
    url: "/methodology",
    tag: `weekly-strategy-${weekIndex}`,
  });
}

export function materialMonitoringPush(auditId: number, nextTask?: { id: string; title: string }): PushMessage {
  return safePushMessage({
    title: "A monitored site changed",
    body: nextTask?.title ? `Next task: ${nextTask.title}` : "Review the updated audit and choose the next useful improvement.",
    url: nextTask
      ? `/actions/${auditId}?task=${encodeURIComponent(nextTask.id)}#recommendations`
      : `/results/${auditId}`,
    tag: `score-change-${auditId}`,
  });
}
