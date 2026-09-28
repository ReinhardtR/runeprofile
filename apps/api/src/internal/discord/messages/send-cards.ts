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
    throw new Error(
      `Discord message with attachments failed (${response.status}): ${await response.text()}`,
    );
  }
}

/** Discord accepts at most ten attachments, and so ten cards, per message. */
export const MAX_CARDS_PER_MESSAGE = 10;

/** Longest rate limit worth waiting out inside a request's waitUntil. */
const MAX_RATE_LIMIT_WAIT_MS = 10_000;
