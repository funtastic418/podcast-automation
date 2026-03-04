"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [voices, setVoices] = useState<{ voice_id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    aiProvider: "openai",
    openaiApiKey: "",
    anthropicApiKey: "",
    aiModel: "gpt-4o",
    elevenlabsApiKey: "",
    elevenlabsVoiceId: "",
    elevenlabsModelId: "eleven_multilingual_v2",
    elevenlabsStability: 0.5,
    elevenlabsSimilarity: 0.75,
    podcastName: "",
    podcastDescription: "",
    podcastAuthor: "",
    podcastCoverUrl: "",
    podcastCategory: "Technology",
    podcastLanguage: "en-us",
    podcastExplicit: false,
    defaultPromptTemplate: "",
    targetScriptLength: 1500,
  });

  // Track which keys are already set on the server
  const [keysSet, setKeysSet] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          // Coerce null values to empty strings to avoid React warnings
          const cleaned = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, v === null ? "" : v])
          );
          setForm((prev) => ({ ...prev, ...cleaned }));
          setKeysSet({
            openaiApiKey: data.openaiApiKey_set,
            anthropicApiKey: data.anthropicApiKey_set,
            elevenlabsApiKey: data.elevenlabsApiKey_set,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const update = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Settings saved" });
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
    setSaving(false);
  };

  const testConnection = async (service: string) => {
    setTesting(service);
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, ...data }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [service]: { ok: false, message: "Connection failed" },
      }));
    }
    setTesting(null);
  };

  const loadVoices = async () => {
    try {
      const res = await fetch("/api/voices");
      const data = await res.json();
      if (Array.isArray(data)) setVoices(data);
    } catch {
      toast({ title: "Failed to load voices", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="ai">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai">AI Provider</TabsTrigger>
          <TabsTrigger value="elevenlabs">ElevenLabs</TabsTrigger>
          <TabsTrigger value="podcast">Podcast</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                AI Script Generation
                <div className="flex items-center gap-2">
                  {testResults.ai && (
                    testResults.ai.ok
                      ? <Badge variant="outline" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Connected</Badge>
                      : <Badge variant="outline" className="text-red-600"><XCircle className="mr-1 h-3 w-3" /> {testResults.ai.message}</Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => testConnection("ai")} disabled={testing === "ai"}>
                    {testing === "ai" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.aiProvider}
                  onChange={(e) => update("aiProvider", e.target.value)}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>

              {form.aiProvider === "openai" ? (
                <div className="space-y-2">
                  <Label>OpenAI API Key {keysSet.openaiApiKey && <Badge variant="secondary" className="ml-2">Set</Badge>}</Label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={form.openaiApiKey}
                    onChange={(e) => update("openaiApiKey", e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Anthropic API Key {keysSet.anthropicApiKey && <Badge variant="secondary" className="ml-2">Set</Badge>}</Label>
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={form.anthropicApiKey}
                    onChange={(e) => update("anthropicApiKey", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={form.aiModel}
                  onChange={(e) => update("aiModel", e.target.value)}
                  placeholder={form.aiProvider === "openai" ? "gpt-4o" : "claude-sonnet-4-20250514"}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Script Prompt (optional)</Label>
                <Textarea
                  rows={4}
                  value={form.defaultPromptTemplate ?? ""}
                  onChange={(e) => update("defaultPromptTemplate", e.target.value)}
                  placeholder="You are a podcast script writer for a technology news podcast..."
                />
              </div>

              <div className="space-y-2">
                <Label>Target Script Length (words)</Label>
                <Input
                  type="number"
                  value={form.targetScriptLength}
                  onChange={(e) => update("targetScriptLength", parseInt(e.target.value) || 1500)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elevenlabs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ElevenLabs Voice
                <div className="flex items-center gap-2">
                  {testResults.elevenlabs && (
                    testResults.elevenlabs.ok
                      ? <Badge variant="outline" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Connected</Badge>
                      : <Badge variant="outline" className="text-red-600"><XCircle className="mr-1 h-3 w-3" /> Error</Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => testConnection("elevenlabs")} disabled={testing === "elevenlabs"}>
                    {testing === "elevenlabs" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ElevenLabs API Key {keysSet.elevenlabsApiKey && <Badge variant="secondary" className="ml-2">Set</Badge>}</Label>
                <Input
                  type="password"
                  placeholder="Your ElevenLabs API key"
                  value={form.elevenlabsApiKey}
                  onChange={(e) => update("elevenlabsApiKey", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Voice</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.elevenlabsVoiceId}
                    onChange={(e) => update("elevenlabsVoiceId", e.target.value)}
                    placeholder="Voice ID or click Load Voices"
                  />
                  <Button variant="outline" onClick={loadVoices}>
                    Load Voices
                  </Button>
                </div>
                {voices.length > 0 && (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.elevenlabsVoiceId}
                    onChange={(e) => update("elevenlabsVoiceId", e.target.value)}
                  >
                    <option value="">Select a voice...</option>
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.elevenlabsModelId}
                  onChange={(e) => update("elevenlabsModelId", e.target.value)}
                >
                  <option value="eleven_multilingual_v2">Multilingual v2</option>
                  <option value="eleven_monolingual_v1">Monolingual v1</option>
                  <option value="eleven_turbo_v2_5">Turbo v2.5</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stability: {form.elevenlabsStability}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="w-full"
                    value={form.elevenlabsStability}
                    onChange={(e) => update("elevenlabsStability", parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Similarity: {form.elevenlabsSimilarity}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="w-full"
                    value={form.elevenlabsSimilarity}
                    onChange={(e) => update("elevenlabsSimilarity", parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="podcast">
          <Card>
            <CardHeader>
              <CardTitle>Podcast Info (RSS Feed)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Podcast Name</Label>
                <Input
                  value={form.podcastName}
                  onChange={(e) => update("podcastName", e.target.value)}
                  placeholder="My AI Podcast"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={form.podcastDescription ?? ""}
                  onChange={(e) => update("podcastDescription", e.target.value)}
                  placeholder="A weekly podcast about..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={form.podcastAuthor}
                    onChange={(e) => update("podcastAuthor", e.target.value)}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.podcastCategory}
                    onChange={(e) => update("podcastCategory", e.target.value)}
                  >
                    <option>Technology</option>
                    <option>Business</option>
                    <option>Education</option>
                    <option>News</option>
                    <option>Entertainment</option>
                    <option>Health &amp; Fitness</option>
                    <option>Science</option>
                    <option>Society &amp; Culture</option>
                    <option>Comedy</option>
                    <option>Arts</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image URL (3000x3000px recommended)</Label>
                <Input
                  value={form.podcastCoverUrl}
                  onChange={(e) => update("podcastCoverUrl", e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Input
                    value={form.podcastLanguage}
                    onChange={(e) => update("podcastLanguage", e.target.value)}
                    placeholder="en-us"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="explicit"
                    checked={form.podcastExplicit}
                    onChange={(e) => update("podcastExplicit", e.target.checked)}
                  />
                  <Label htmlFor="explicit">Explicit Content</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
