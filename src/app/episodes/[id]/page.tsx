"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Clock,
  HardDrive,
} from "lucide-react";
import { PIPELINE_STEPS, STATUS_COLORS, STATUS_LABELS, type EpisodeStatus } from "@/types";

interface Episode {
  id: string;
  topic: string;
  title: string | null;
  slug: string | null;
  episodeNumber: number | null;
  script: string | null;
  summary: string | null;
  duration: number | null;
  audioUrl: string | null;
  audioFileSize: number | null;
  status: EpisodeStatus;
  errorMessage: string | null;
  errorStep: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export default function EpisodeDetailPage() {
  const params = useParams();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [showScript, setShowScript] = useState(false);

  const fetchEpisode = useCallback(async () => {
    try {
      const res = await fetch(`/api/episodes/${params.id}`);
      const data = await res.json();
      if (!data.error) setEpisode(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchEpisode();
  }, [fetchEpisode]);

  // Poll while pipeline is running
  useEffect(() => {
    if (!episode) return;
    const isRunning = !["published", "failed", "pending"].includes(episode.status);
    if (!isRunning) return;

    const interval = setInterval(fetchEpisode, 2000);
    return () => clearInterval(interval);
  }, [episode, fetchEpisode]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await fetch(`/api/episodes/${params.id}`, { method: "POST" });
      fetchEpisode();
    } catch {
      // ignore
    }
    setRetrying(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!episode) {
    return <div className="py-20 text-center text-muted-foreground">Episode not found</div>;
  }

  const currentStepIndex = PIPELINE_STEPS.findIndex(
    (s) => s.key === episode.status
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {episode.title || episode.topic}
          </h1>
          {episode.episodeNumber && (
            <p className="text-sm text-muted-foreground">
              Episode {episode.episodeNumber}
            </p>
          )}
        </div>
        <Badge className={STATUS_COLORS[episode.status]}>
          {STATUS_LABELS[episode.status]}
        </Badge>
      </div>

      {/* Pipeline Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step, i) => {
              let icon;
              let textClass = "text-muted-foreground";

              if (episode.status === "failed" && episode.errorStep === step.key) {
                icon = <XCircle className="h-5 w-5 text-red-500" />;
                textClass = "text-red-600 font-medium";
              } else if (episode.status === step.key) {
                icon = <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
                textClass = "text-blue-600 font-medium";
              } else if (
                episode.status === "published" ||
                (currentStepIndex >= 0 && i < currentStepIndex)
              ) {
                icon = <CheckCircle className="h-5 w-5 text-green-500" />;
                textClass = "text-green-700";
              } else {
                icon = (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                );
              }

              return (
                <div key={step.key} className="flex items-center gap-3">
                  {icon}
                  <span className={textClass}>{step.label}</span>
                </div>
              );
            })}
          </div>

          {episode.status === "failed" && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-red-600">
                Error: {episode.errorMessage}
              </p>
              <Button
                onClick={handleRetry}
                disabled={retrying}
                variant="outline"
                size="sm"
              >
                {retrying ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                Retry from {episode.errorStep}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Player */}
      {episode.audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Audio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <audio controls className="w-full" src={episode.audioUrl} />
            <div className="flex gap-4 text-sm text-muted-foreground">
              {episode.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.floor(episode.duration / 60)}:{String(episode.duration % 60).padStart(2, "0")}
                </span>
              )}
              {episode.audioFileSize && (
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {(episode.audioFileSize / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {episode.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{episode.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Script */}
      {episode.script && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Script
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScript(!showScript)}
              >
                {showScript ? "Hide" : "Show"}
              </Button>
            </CardTitle>
          </CardHeader>
          {showScript && (
            <CardContent>
              <Separator className="mb-4" />
              <div className="max-h-96 overflow-auto whitespace-pre-wrap text-sm">
                {episode.script}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Meta */}
      <Card>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Topic</dt>
              <dd>{episode.topic}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd>{episode.slug || "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(episode.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Published</dt>
              <dd>
                {episode.publishedAt
                  ? new Date(episode.publishedAt).toLocaleString()
                  : "-"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
