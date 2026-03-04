"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Rss, Copy, Check } from "lucide-react";

export function FeedLinkCard({ feedUrl }: { feedUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-lg bg-blue-100 p-3">
          <Rss className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">RSS Feed</p>
          <div className="flex items-center gap-1">
            <p className="truncate text-xs text-muted-foreground">{feedUrl}</p>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded p-1 hover:bg-accent"
              title="Copy feed URL"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
