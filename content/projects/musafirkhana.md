---
title: Musafirkhana
logline: A story fire on the internet. One fire a night, by the Beas river in Manali. Everyone hears the same story at the same second.
status: live
url: https://fire.whiletrueee.com
date: 2026-11-22T23:30:00+05:30
stack: three.js · Cloudflare Durable Objects · D1 · React · ElevenLabs
stats: 1 fire a night | 30 minutes | 6 stories | 1 shared second
---

## What it is

Musafirkhana means a rest house for travellers. This project is a fire that you can visit on the internet.

The fire opens once a night, at 11:30 pm in India. You sit at the fire with the other people who are there at that time. Travellers tell short stories: love, gossip, travel, office romance and ghosts. After half an hour, the fire goes out. The next night has new stories.

Everyone hears the same story at the same second. You cannot pause it, and you cannot go back. It is like a radio, or like a play in a theatre.


## Why I made it

People told stories around a fire before they wrote anything. I want to know if this still works on the internet. The test is simple. Do people stay for a full story? Do they come back the next night?

![Before the fire opens: tonight's stories and the time.](/projects/musafirkhana/gate.jpg)

## How I made it

I made this project with a team of AI coding agents. I gave the idea, the place and the feeling. The agents built the parts, and I examined each one.

### The place

The mountains have the real shape of the valley around the Beas river at Manali. The shape comes from satellite height data. There is a dhaba with a thatched roof, deodar trees, tall grass and prayer flags. The moon rises over a real ridge line.

### The people and the stories

Real visitors walk in and sit on the logs around the fire. The host is Kabir. A different traveller tells each story, and each traveller has a different voice.

AI agents wrote the stories from a brief, like a writers' room. Each story is short, has an ending, and feels like something that happened to a friend.

![A story at the fire. Real visitors sit with the cast.](/projects/musafirkhana/telling.jpg)

### The studio

I direct each night like a play. For this, I made a tool called Theatre Studio. It has a timeline for the voices, the camera shots, the sounds and the notes. I put each camera move on a word in the story. Then I publish the night, and the fire plays it.

![Theatre Studio: the running order, the stage and the timeline.](/projects/musafirkhana/studio.jpg)

## For engineers

- **Shared time, no streaming.** The schedule comes from the clock. Each browser calculates which second of the show it is, so all visitors hear the same moment without a media server.
- **Presence.** One Cloudflare Durable Object holds the WebSockets. It gives each visitor a seat, batches the reactions each second, and keeps a nightly count. D1 stores the letters that visitors leave.
- **Scene.** three.js with a water shader on a strip that follows the river course. The terrain comes from AWS Terrain Tiles (SRTM). The deodar trees are instanced. The people are on a separate layer, so the water reflection does not draw them.
- **Sound.** Web Audio with stereo panning for each speaker. The gestures of each character follow the loudness of the voice.
- **Studio.** Vite and React 19 over a pure TypeScript engine. The engine evaluates the show at a given time. Cues attach to words and paragraphs, so a new voice take does not break the timing. An auto-cut feature selects camera shots.
