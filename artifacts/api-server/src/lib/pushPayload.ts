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
