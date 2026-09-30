/**
 * Posting activity cards to a channel.
 *
 * Shared by the real fan-out and the simulator so the two cannot drift —
 * the whole point of the simulator is that what it posts is what players
 * will see.
 */
export async function postCardsMessage(params: {
  token: string;
  channelId: string;
  cards: { file: Uint8Array; alt: string }[];
}) {
  const { token, channelId, cards } = params;

  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({
      // One embed per card, each holding just the image.
      //
      // An embed's image column is narrower than a components v2 media
      // gallery, and that is the point: Discord sizes an image from its own
      // pixel width, so a gallery big enough to stay sharp on a high-DPI
      // screen is also as wide as the message column. An embed caps the
      // image well below that and scales the file down to fit, which leaves
      // room to send a card at twice its displayed size — small on screen
      // and still crisp.
      //
      // One embed each rather than several images on one, because bare
      // attachments get cropped into a mosaic gallery. No description and
      // no content: the card carries its own text, and a caption above the
      // artwork read as bolted on. The color matches the card background so
      // the embed's accent strip blends away.
      embeds: cards.map((_, i) => ({
        image: { url: `attachment://activity-${i}.png` },
        color: 0x0d0d0c,
      })),
      // Alt text lives on the attachment, the only place Discord accepts it
      // for an embed image.
      attachments: cards.map((card, i) => ({
        id: i,
        filename: `activity-${i}.png`,
        description: card.alt,
      })),
    }),
  );
  for (let i = 0; i < cards.length; i++) {
    form.append(
      `files[${i}]`,
      new Blob([cards[i]!.file as unknown as BlobPart], {
        type: "image/png",
      }),
      `activity-${i}.png`,
    );
  }

  const post = () =>
    fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}` },
      body: form,
    });

  // A big batch goes out as several messages back to back, which can trip
  // the per-channel rate limit. Wait out a short limit once rather than
  // dropping the rest of the batch.
  let response = await post();
  if (response.status === 429) {
    const waitMs = Number(response.headers.get("retry-after") ?? 1) * 1000;
    if (waitMs <= MAX_RATE_LIMIT_WAIT_MS) {
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      response = await post();
    }
  }
  if (!response.ok) {
    throw await DiscordMessageError.from(response);
  }
}

/**
 * A message Discord refused, with what it said about it.
 *
 * The status and body are fields rather than folded into the message
 * because Workers Logs keeps only the stack of an Error handed to
 * console.error - the message, and with it Discord's reason, was lost.
 */
export class DiscordMessageError extends Error {
  constructor(
    readonly status: number,
    /** Discord's JSON error code, e.g. 50013 for missing permissions. */
    readonly code: number | null,
    readonly body: string,
  ) {
    super(`Discord message failed (${status}): ${body}`);
    this.name = "DiscordMessageError";
  }

  static async from(response: Response): Promise<DiscordMessageError> {
    const body = (await response.text()).slice(0, 500);
    let code: number | null = null;
    try {
      const parsed = JSON.parse(body) as { code?: unknown };
      if (typeof parsed.code === "number") code = parsed.code;
    } catch {
      // Not JSON - a proxy or gateway error page. The body says enough.
    }
    return new DiscordMessageError(response.status, code, body);
  }
}

/** Discord accepts at most ten attachments, and so ten cards, per message. */
export const MAX_CARDS_PER_MESSAGE = 10;

/** Longest rate limit worth waiting out inside a request's waitUntil. */
const MAX_RATE_LIMIT_WAIT_MS = 10_000;
