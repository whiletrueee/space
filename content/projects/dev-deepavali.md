---
title: Dev Deepavali
logline: A short browser game. Walk a ghat in Varanasi on the night of a thousand lamps, and find out what you hold on to.
status: live
url: https://deepavali.whiletrueee.com
date: 2026-11-25T12:00:00+05:30
stack: three.js · Blender · ElevenLabs · Cloudflare Workers
stats: 15 characters | 65 props and animals | 1,018 voice lines | 80 questions
---

## What it is

Dev Deepavali is a game that runs in your web browser. You walk along a ghat in Varanasi on the night of Dev Deepavali. Thousands of lamps burn on the steps.

On your walk, people stop you. A chaiwala, a widow, a student, a priest. Each person asks you one question. You choose one of four answers.

At the end of the walk, Bhola sits with you. He is an old boatman. He tells you what your answers show about you. Then the fireworks start over the river.

The game uses one idea from the Bhagavad Gita: do your work, and let go of the result. The game does not tell you the correct answer. It only shows you the things that you hold on to.


## How to play

- Use a computer with a keyboard. The game does not work well on a phone.
- Use W, A, S and D to walk. Press E to speak to a person.
- Press 1, 2, 3 or 4 to choose an answer.
- One walk takes approximately 15 minutes. Use headphones.

## How I made it

I made this game with a team of AI coding agents. I gave the direction, the story and the reference images. The agents wrote the code, built the 3D models and recorded the voices. I examined each result and asked for changes. Many parts had five or more versions.

### The people

There are 15 characters. Each character starts as a human body model in Blender. A cloth simulation drapes the dhotis, saris and shawls on the body. The hair and the beards are flat cards with a texture. Each character has a skeleton, so it can walk, sit and talk.

![The cast, from the reference sheet to the game.](/projects/dev-deepavali/cast.jpg)
![Bhola in the game, in his walk, talk and sit poses.](/projects/dev-deepavali/bhola-poses.jpg)

The people on the ghat are not still. Each person changes what they do every few seconds. They talk on the phone, drink chai, fold their arms or nod. When you speak to a person, they talk while their line plays. They nod when you answer.

### The place

I gave the agents one reference board with all the items of a ghat. They built each item as a separate 3D model. Then one agent put the items on the ghat.

![Lamps and decorations for Dev Deepavali.](/projects/dev-deepavali/lamps.jpg)
![Street props and small things that people carry.](/projects/dev-deepavali/street.jpg)
![Steps, arches, a shrine and a temple spire.](/projects/dev-deepavali/ghat.jpg)
![The market stalls at night, in the game.](/projects/dev-deepavali/stalls.jpg)
![Boats for the river.](/projects/dev-deepavali/boats.jpg)
![A cow, a calf, a dog, a monkey and a pigeon. Each one moves.](/projects/dev-deepavali/animals.jpg)

![The start of the walk, by the boats.](/projects/dev-deepavali/start.jpg)
![The market, with the chai stall.](/projects/dev-deepavali/market.jpg)
![The aarti platforms.](/projects/dev-deepavali/aarti.jpg)
![A cow and her calf walk on the promenade.](/projects/dev-deepavali/cow.jpg)

### The words

The game has 80 questions and 480 answers. Each answer has a hidden tag. The tag shows if the answer lets go, holds on or pulls away. Each question is also about one fear: not enough, being left, being seen, time, or control.

Bhola does not read a fixed speech. The game builds his reflection from 361 short lines. It selects the lines that match your answers. The same answers always give the same reflection.

![Bhola asks his question. You choose one of four answers.](/projects/dev-deepavali/asks.jpg)

### The voices

Each person has a different voice. There are 1,018 recorded lines in 12 voices. The agents recorded long takes, one voice at a time, and then cut each take into lines at the pauses.

### The night

The sky has 7,000 stars and the Milky Way. The fireworks have nine types of shells. Each spark starts white, changes to its color, and then becomes a red ember.

![The night sky over the ghat.](/projects/dev-deepavali/sky.jpg)
![Fireworks at the end of the walk.](/projects/dev-deepavali/fireworks.jpg)

### The landing page

The landing page is a picture of the city that lights up while the game loads. Each lamp that lights is real progress. The number shows how much of the game your browser has. It goes to 100% only when the game is ready.

![The loading screen at 92%. 931 of 1,008 lamps are lit.](/projects/dev-deepavali/loading.jpg)

## For engineers

### Stack

- three.js on WebGL, with plain ES modules and an import map. There is no build step for the game code.
- Cloudflare Workers static assets serve the game. One Durable Object counts the live visitors over WebSockets.
- Blender 5.3 runs headless for all the characters and props. Each build is a script, so each build is repeatable.

### Characters

- The bodies come from MPFB (MakeHuman, CC0) with a game-engine rig.
- Garments are cloth simulations on the body. After the simulation, the script applies the result and skins it to the rig with a KD-tree weight transfer.
- One animation library drives all characters. The game retargets the clips at runtime.

### Performance

The first version ran at 18 fps. These changes brought it to approximately 45 fps:

- Each person has a culling test against the camera frustum and a 70 m limit. A hidden person does not animate.
- Beyond 18 m, each person changes to a lower-detail body with 20% of the triangles.
- After load, the game merges the meshes that do not move. It groups them by material and by 40 m section of the ghat.
- Still parts of the scene do not recalculate their matrices each frame.
- The 150 floating lamps are three instanced meshes, not 450 meshes.

### Download

- Geometry uses meshopt compression. Textures are WebP.
- The animation library went from 6.1 MB to 0.66 MB after keyframe resampling.
- The first download is 27.8 MB. The build script measures this value, and the loading screen uses it to show true progress.

### Dialogue engine

- The engine is deterministic. A seed selects the four meetings, so a seed and a set of answers always give the same walk and the same reflection.
- The reflection follows a fixed grammar: opening, witness, mirror, pattern, contradiction, underneath, shade, permission, practice and closing.
- Ten unit tests check the engine.

### Voice pipeline

- Each take is one voice and many lines, with pause tags between the lines.
- A script finds the silences and aligns the cuts to the length of each line with dynamic programming. It then trims the silence at the end of each clip.

### Security

- A strict Content Security Policy, no framing, and a strict referrer policy.
- The visitor WebSocket accepts only this origin, limits the number of connections and stores no data about the visitor.
