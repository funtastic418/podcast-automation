import Link from "next/link";
import { getEpisodes, getSettings } from "@/lib/simple-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, PlusCircle, Rss, Settings } from "lucide-react";

export default async function SimpleDashboardPage() {
  const episodes = await getEpisodes();
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{settings.podcastName}</h1>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Link href="/episodes/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Episode
            </Button>
          </Link>
        </div>
      </div>

      {/* Podcast Info */}
      <Card>
        <CardHeader>
          <CardTitle>Podcast Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{settings.podcastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Author</p>
              <p className="text-sm text-muted-foreground">{settings.podcastAuthor}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Category</p>
              <p className="text-sm text-muted-foreground">{settings.podcastCategory}</p>
            </div>
            <div>
              <p className="text-sm font-medium">RSS Feed</p>
              <a href="/api/feed" className="text-sm text-blue-600 hover:underline">
                /api/feed
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{episodes.length}</p>
              <p className="text-sm text-muted-foreground">Total Episodes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-green-100 p-3">
              <Rss className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">RSS Feed</p>
              <p className="text-sm text-muted-foreground">Ready for Apple Podcasts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Episodes */}
      <Card>
        <CardHeader>
          <CardTitle>Episodes</CardTitle>
        </CardHeader>
        <CardContent>
          {episodes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No episodes yet. Create your first one!
            </p>
          ) : (
            <div className="space-y-3">
              {episodes.map((ep) => (
                <div key={ep.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{ep.title}</p>
                    <p className="text-xs text-muted-foreground">{ep.pubDate}</p>
                  </div>
                  <a 
                    href={ep.audioUrl} 
                    className="text-sm text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Listen
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
