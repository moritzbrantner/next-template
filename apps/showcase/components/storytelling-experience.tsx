'use client';

import { useMemo, useState } from 'react';
import {
  defineStory,
  StoryMinimap,
  StoryStageFrame,
  type StoryDocument,
  type StoryRenderProps,
} from '@moritzbrantner/storytelling';

export type StoryScene = {
  id: string;
  title: string;
  description: string;
  progressionStart: number;
  progressionEnd: number;
  color: string;
  position: [number, number, number];
  scale?: number;
};

type StorytellingExperienceProps = {
  scenes: StoryScene[];
};

type StorySceneData = StoryScene;

function formatPosition(position: [number, number, number]) {
  return position.map((value) => value.toFixed(1)).join(', ');
}

function toRgb(hexColor: string) {
  const normalized = hexColor.replace('#', '');

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const value = Number.parseInt(normalized, 16);

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  };
}

function toAlphaColor(hexColor: string, alpha: number) {
  const rgb = toRgb(hexColor);

  if (!rgb) {
    return hexColor;
  }

  return `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${alpha})`;
}

function buildStoryDocument(
  scenes: StoryScene[],
): StoryDocument<StorySceneData> {
  return defineStory({
    id: 'package-powered-story-sequence',
    title: 'Package-powered story sequence',
    subtitle:
      'This scroll sequence now runs on @moritzbrantner/storytelling instead of the local prototype.',
    openingNodeId: scenes[0]?.id ?? 'empty',
    nodes:
      scenes.length > 0
        ? scenes.map((scene, index) => ({
            id: scene.id,
            title: scene.title,
            eyebrow: `Scene ${index + 1}`,
            next: scenes[index + 1]?.id,
            data: scene,
            stage: {
              renderer: 'showcase-scene',
            },
          }))
        : [
            {
              id: 'empty',
              title: 'No scenes',
              data: {
                id: 'empty',
                title: 'No scenes',
                description: 'No storytelling scenes are configured.',
                progressionStart: 0,
                progressionEnd: 0,
                color: '#71717a',
                position: [0, 0, 0],
              },
              stage: {
                renderer: 'showcase-scene',
              },
            },
          ],
    labels: {
      minimapLabel: 'Story sequence scenes',
    },
  });
}

function ShowcaseStoryStage({ node }: StoryRenderProps<StorySceneData>) {
  const scene = node.data;

  if (!scene) {
    return null;
  }

  const accentBackground = toAlphaColor(scene.color, 0.14);
  const accentBorder = toAlphaColor(scene.color, 0.34);
  const accentGlow = toAlphaColor(scene.color, 0.18);

  return (
    <section className="relative min-h-[26rem] overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/80 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] md:min-h-[30rem] md:p-8">
      <div className="space-y-5">
        <div
          className="inline-flex items-center gap-3 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]"
          style={{
            backgroundColor: accentBackground,
            borderColor: accentBorder,
            boxShadow: `0 0 0 1px ${accentGlow}`,
          }}
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: scene.color }}
            aria-hidden="true"
          />
          Internal Progression {scene.progressionStart}-{scene.progressionEnd}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {node.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            {scene.title}
          </h2>
        </div>

        <p className="max-w-2xl text-muted-foreground">{scene.description}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div
            className="rounded-[1.5rem] border p-4"
            style={{
              background: `linear-gradient(135deg, ${accentBackground}, transparent 70%)`,
              borderColor: accentBorder,
            }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Focus Vector
            </p>
            <p className="mt-2 font-mono text-sm text-foreground">
              {formatPosition(scene.position)}
            </p>
          </div>

          <div
            className="rounded-[1.5rem] border p-4"
            style={{
              background: `linear-gradient(135deg, ${accentGlow}, transparent 70%)`,
              borderColor: accentBorder,
            }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Scene Scale
            </p>
            <p className="mt-2 text-sm text-foreground">
              {(scene.scale ?? 1).toFixed(2)}x
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const storyRegistry = {
  web: {
    'showcase-scene': ShowcaseStoryStage,
  },
};

export function StorytellingExperience({
  scenes,
}: StorytellingExperienceProps) {
  const story = useMemo(() => buildStoryDocument(scenes), [scenes]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeNode = story.nodes[activeIndex] ?? story.nodes[0];
  const history = story.nodes.slice(0, activeIndex + 1).map((node) => ({
    nodeId: node.id,
    data: node.data,
  }));
  const isEnding = activeIndex >= story.nodes.length - 1;
  const path = {
    nodes: story.nodes.slice(0, activeIndex + 1),
    history,
    currentNode: activeNode,
    completed: isEnding,
  };
  const renderProps: StoryRenderProps<StorySceneData> = {
    story,
    node: activeNode,
    history,
    path,
    currentIndex: activeIndex,
    progress: (activeIndex + 1) / Math.max(story.nodes.length, 1),
    isEnding,
    canGoBack: activeIndex > 0,
    choices: [],
    choose: () => {},
    goBack: () => setActiveIndex((current) => Math.max(0, current - 1)),
    restart: () => setActiveIndex(0),
  };

  return (
    <section
      aria-label="Storytelling package demo"
      className="rounded-[2rem] border border-border/60 bg-gradient-to-b from-background via-background to-muted/30 p-4 shadow-sm md:p-6"
    >
      <div className="mb-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {story.title}
        </p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {story.subtitle}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
        <StoryMinimap
          items={story.nodes.map((node, index) => ({
            id: node.id,
            title: node.title,
            eyebrow: node.eyebrow,
            menuLabel: String(index + 1).padStart(2, '0'),
          }))}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          className="rounded-[1.25rem] border border-border/60 bg-background/80 p-3"
          ariaLabel="Story sequence scenes"
        />
        <StoryStageFrame
          {...renderProps}
          registry={storyRegistry}
          className="p-0"
        />
      </div>
    </section>
  );
}
