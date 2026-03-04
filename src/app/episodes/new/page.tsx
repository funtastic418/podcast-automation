"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export default function NewEpisodePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();

      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        setCreating(false);
        return;
      }

      toast({ title: "Episode created! Pipeline starting..." });
      router.push(`/episodes/${data.id}`);
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">New Episode</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate a Podcast Episode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Episode Topic</Label>
            <Textarea
              rows={4}
              placeholder="Enter your episode topic or idea. Be as specific or general as you like.&#10;&#10;Examples:&#10;- The future of AI in healthcare&#10;- 5 tips for better sleep&#10;- Why remote work is here to stay"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={creating}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating || !topic.trim()}
            className="w-full"
            size="lg"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Episode...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Episode
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            AI will generate a script, convert it to audio, and publish it to your RSS feed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
