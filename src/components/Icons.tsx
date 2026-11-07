import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Boxes,
  Brackets,
  Link2,
  Layers,
  ListOrdered,
  Hash,
  Network,
  Triangle,
  Share2,
  Type,
  CircleDot,
  Search,
  ArrowDownUp,
  Repeat,
  Compass,
  Brain,
  MoveHorizontal,
  AppWindow,
  Undo2,
  Coins,
  CalendarRange,
  Merge,
  Puzzle,
  Server,
  MessagesSquare,
  Wrench,
  Mic,
} from "lucide-react";
import type { PillarKey } from "../data/companies";

/** One line icon per DSA topic (replaces the content's emoji). */
export const TOPIC_ICONS: Record<string, LucideIcon> = {
  array: Brackets,
  linkedlist: Link2,
  stack: Layers,
  queue: ListOrdered,
  hashtable: Hash,
  tree: Network,
  heap: Triangle,
  graph: Share2,
  trie: Type,
  set: CircleDot,
  binarysearch: Search,
  sorting: ArrowDownUp,
  recursion: Repeat,
  bfsdfs: Compass,
  dp: Brain,
  twopointers: MoveHorizontal,
  slidingwindow: AppWindow,
  backtracking: Undo2,
  greedy: Coins,
  intervals: CalendarRange,
  unionfind: Merge,
};

export function TopicIcon({ k, ...props }: { k: string } & LucideProps) {
  const Icon = TOPIC_ICONS[k] ?? Boxes;
  return <Icon {...props} />;
}

/** Icons for the company-prep pillars. */
export const PILLAR_ICONS: Record<PillarKey | "mock", LucideIcon> = {
  dsa: Puzzle,
  sd: Server,
  behavioral: MessagesSquare,
  domain: Wrench,
  mock: Mic,
};

export function PillarIcon({ p, ...props }: { p: PillarKey | "mock" } & LucideProps) {
  const Icon = PILLAR_ICONS[p];
  return <Icon {...props} />;
}
