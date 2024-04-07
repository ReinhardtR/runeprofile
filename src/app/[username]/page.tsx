import { cache } from "react";
import { Metadata } from "next";

import { getProfileFull } from "~/lib/data/profile/get-profile";
import { Profile } from "~/components/profile";

const getProfilleFullCached = cache(getProfileFull);

// Prevent generating pages at build time
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: {
  params: { username: string };
}) {
  const profile = await getProfilleFullCached({
    username: decodeURIComponent(props.params.username),
  });

  const title = `${profile.username} | RuneProfile`;
  const description = profile.description ?? "";
  const ogImageUrl = `https://runeprofile-git-next-13-app-dir-reinhardtr.vercel.app/api/og?username=${profile.username}`;

  const metadata: Metadata = {
    title,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "RuneProfile",
      url: `https://runeprofile.com/${profile.username}`,
      images: [
        {
          // TODO: change to runeprofile.com when in prod
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/png",
        },
      ],
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [ogImageUrl],
    },
    robots: {
      index: true,
    },
  };

  return metadata;
}

export default async function ProfilePage(props: {
  params: {
    username: string;
  };
}) {
  const profile = await getProfilleFullCached({
    username: decodeURIComponent(props.params.username),
  });

  return <Profile profile={profile} />;
}
