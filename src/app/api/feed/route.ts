import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDefaultUser } from "@/lib/get-user";
import { formatDuration } from "@/lib/slug";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  try {
    const user = await getDefaultUser();
    const settings = user.settings;

    if (!settings) {
      return new NextResponse("Podcast not configured", { status: 404 });
    }

    const episodes = await prisma.episode.findMany({
      where: { userId: user.id, status: "published" },
      orderBy: { publishedAt: "desc" },
    });

    const baseUrl = new URL(request.url).origin;
    const feedUrl = `${baseUrl}/api/feed`;
    const podcastTitle = settings.podcastName || "My Podcast";
    const podcastDescription = settings.podcastDescription || "A podcast generated with AI";
    const podcastAuthor = settings.podcastAuthor || "Podcast Automation";
    const coverUrl = settings.podcastCoverUrl || `${baseUrl}/logo.svg`;

    const items = episodes
      .map((ep) => {
        const pubDate = ep.publishedAt
          ? new Date(ep.publishedAt).toUTCString()
          : new Date(ep.createdAt).toUTCString();
        const duration = ep.duration ? formatDuration(ep.duration) : "00:00:00";

        return `    <item>
      <title>${escapeXml(ep.title || ep.topic)}</title>
      <description><![CDATA[${ep.summary || ep.topic}]]></description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(ep.audioUrl || "")}" length="${ep.audioFileSize || 0}" type="audio/mpeg"/>
      <itunes:duration>${duration}</itunes:duration>
      <itunes:episode>${ep.episodeNumber || 1}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>${settings.podcastExplicit ? "yes" : "no"}</itunes:explicit>
      <guid isPermaLink="false">${ep.id}</guid>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.apple.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(podcastTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(podcastDescription)}</description>
    <language>${settings.podcastLanguage || "en-us"}</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <itunes:author>${escapeXml(podcastAuthor)}</itunes:author>
    <itunes:summary>${escapeXml(podcastDescription)}</itunes:summary>
    <itunes:category text="${escapeXml(settings.podcastCategory || "Technology")}"/>
    <itunes:explicit>${settings.podcastExplicit ? "yes" : "no"}</itunes:explicit>
    <itunes:image href="${escapeXml(coverUrl)}"/>
    <image>
      <url>${escapeXml(coverUrl)}</url>
      <title>${escapeXml(podcastTitle)}</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Error generating feed: ${message}`, { status: 500 });
  }
}
