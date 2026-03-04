"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Clock, Mic } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, type EpisodeStatus } from "@/types";

interface Episode {
  id: string;
  topic: string;
  title: string | null;
  episodeNumber: number | null;
  status: EpisodeStatus;
  duration: number | null;
  createdAt: string;
  publishedAt: string | null;
}

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/episodes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEpisodes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Episodes</h1>
        <Link href="/episodes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Episode
          </Button>
        </Link>
      </div>

      {episodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mic className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No episodes yet</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first episode to get started
            </p>
            <Link href="/episodes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Episode
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep) => (
            <Link key={ep.id} href={`/episodes/${ep.id}`}>
              <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                      {ep.episodeNumber || "#"}
                    </div>
                    <div>
                      <p className="font-medium">
                        {ep.title || ep.topic}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ep.createdAt).toLocaleDateString()}
                        {ep.duration && (
                          <span className="ml-3 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(ep.duration / 60)}:{String(ep.duration % 60).padStart(2, "0")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[ep.status]}>
                    {STATUS_LABELS[ep.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
