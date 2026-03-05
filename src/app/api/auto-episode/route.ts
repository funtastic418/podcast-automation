import { NextRequest, NextResponse } from 'next/server';
import { getEpisodes, saveEpisodes, Episode } from '@/lib/simple-storage';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { topic, script, audioData } = await request.json();
    
    // Generate unique ID
    const episodeId = `episode-${Date.now()}`;
    
    // Save audio file to public/audio folder
    const audioBuffer = Buffer.from(audioData, 'base64');
    const audioFilename = `${episodeId}.mp3`;
    const audioDir = join(process.cwd(), 'public', 'audio');
    const audioPath = join(audioDir, audioFilename);
    
    // Ensure audio directory exists
    try {
      await writeFile(join(audioDir, '.gitkeep'), '');
    } catch {}
    
    await writeFile(audioPath, audioBuffer);
    
    // Create new episode
    const newEpisode: Episode = {
      id: episodeId,
      title: topic,
      description: script,
      audioUrl: `/audio/${audioFilename}`,
      pubDate: new Date().toUTCString(),
      duration: "00:10:00", // You can calculate this from audio
      fileSize: audioBuffer.length
    };
    
    // Get existing episodes and add new one
    const episodes = await getEpisodes();
    episodes.unshift(newEpisode); // Add to beginning
    await saveEpisodes(episodes);
    
    // Trigger RSS feed update (happens automatically when feed is requested)
    
    return NextResponse.json({ 
      success: true,
      episode: newEpisode,
      rssFeedUrl: `${new URL(request.url).origin}/api/feed`,
      message: "Episode added and RSS feed updated! Apple Podcasts will pick this up within 24 hours."
    });
    
  } catch (error) {
    console.error('Auto episode error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to create episode',
      details: errorMessage 
    }, { status: 500 });
  }
}
