import Link from "next/link";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getDefaultUser } from "@/lib/get-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, PlusCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, type EpisodeStatus } from "@/types";
import { FeedLinkCard } from "@/components/feed-link-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const feedUrl = `${protocol}://${host}/api/feed`;

  const user = await getDefaultUser();

  const [totalEpisodes, publishedEpisodes, failedEpisodes, recentEpisodes] =
    await Promise.all([
      prisma.episode.count({ where: { userId: user.id } }),
      prisma.episode.count({ where: { userId: user.id, status: "published" } }),
      prisma.episode.count({ where: { userId: user.id, status: "failed" } }),
      prisma.episode.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const hasAiKey = !!(user.settings?.openaiApiKey || user.settings?.anthropicApiKey);
  const hasElevenLabsKey = !!user.settings?.elevenlabsApiKey;
  const hasVoice = !!user.settings?.elevenlabsVoiceId;
  const isConfigured = hasAiKey && hasElevenLabsKey && hasVoice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/episodes/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Episode
          </Button>
        </Link>
      </div>

      {/* Setup Status */}
      {!isConfigured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <p className="mb-2 font-medium text-yellow-800">Setup Required</p>
            <ul className="space-y-1 text-sm text-yellow-700">
              {!hasAiKey && <li className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Configure AI API key (OpenAI or Anthropic)</li>}
              {!hasElevenLabsKey && <li className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Configure ElevenLabs API key</li>}
              {!hasVoice && <li className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Select an ElevenLabs voice</li>}
            </ul>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="mt-3">
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEpisodes}</p>
              <p className="text-sm text-muted-foreground">Total Episodes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-green-100 p-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedEpisodes}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-red-100 p-3">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failedEpisodes}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
        <FeedLinkCard feedUrl={feedUrl} />
      </div>

      {/* Recent Episodes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Episodes
            <Link href="/episodes">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentEpisodes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No episodes yet. Create your first one!
            </p>
          ) : (
            <div className="space-y-3">
              {recentEpisodes.map((ep) => (
                <Link key={ep.id} href={`/episodes/${ep.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                        {ep.episodeNumber || "#"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ep.title || ep.topic}</p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(ep.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[ep.status as EpisodeStatus]}>
                      {STATUS_LABELS[ep.status as EpisodeStatus]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
