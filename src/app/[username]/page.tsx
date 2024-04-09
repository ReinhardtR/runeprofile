import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountIsPrivateError } from "~/lib/data/errors";
import { getProfileFull } from "~/lib/data/profile/get-profile";
import { ProfileFull } from "~/lib/domain/profile-data-types";
import { Profile } from "~/components/profile";
import { StatusLayout, StatusMessage, StatusTitle } from "~/components/status";

const getProfilleFullCached = cache((param: string) => {
  const decodedParam = decodeURIComponent(param);
  return getProfileFull(
    // usernames has a max length of 12 characters
    param.length > 12
      ? {
          generatedUrlPath: decodedParam,
        }
      : {
          username: decodedParam,
        }
  );
});

// Prevent generating pages at build time
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: {
  params: { username: string };
}) {
  let profile: ProfileFull | null = null;
  try {
    profile = await getProfilleFullCached(props.params.username);
  } catch (error) {
    if (error instanceof AccountIsPrivateError) {
      return {
        title: `${decodeURIComponent(props.params.username)} | RuneProfile`,
        robots: {
          index: false,
        },
      };
    }

    return {
      title: "Not found | RuneProfile",
      robots: {
        index: false,
      },
    };
  }

  const title = `${profile.username} | RuneProfile`;
  const description = profile.description ?? "";
  const ogImageUrl = `https://runeprofile.com/api/og?username=${profile.username}`;

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
  let profile: ProfileFull | null = null;
  try {
    profile = await getProfilleFullCached(props.params.username);
  } catch (error) {
    if (error instanceof AccountIsPrivateError) {
      return (
        <StatusLayout>
          <StatusTitle>
            PRIVATE <span className="text-secondary">PROFILE</span>
          </StatusTitle>
          <StatusMessage>
            {decodeURIComponent(props.params.username)} has set their profile to
            private
          </StatusMessage>
        </StatusLayout>
      );
    }

    return notFound();
  }

  return <Profile profile={profile} />;
}
