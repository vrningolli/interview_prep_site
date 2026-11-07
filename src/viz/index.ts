import { Viz } from "./frames";
import * as ds from "./generators-ds";
import * as algo from "./generators-algo";

const registry: Record<string, () => Viz> = {
  array: ds.arrayViz,
  linkedlist: ds.linkedlistViz,
  stack: ds.stackViz,
  queue: ds.queueViz,
  hashtable: ds.hashtableViz,
  tree: ds.treeViz,
  heap: ds.heapViz,
  graph: ds.graphViz,
  trie: ds.trieViz,
  set: ds.setViz,
  binarysearch: algo.binarysearchViz,
  sorting: algo.sortingViz,
  recursion: algo.recursionViz,
  bfsdfs: algo.bfsdfsViz,
  dp: algo.dpViz,
  twopointers: algo.twopointersViz,
  slidingwindow: algo.slidingwindowViz,
  backtracking: algo.backtrackingViz,
  greedy: algo.greedyViz,
  intervals: algo.intervalsViz,
  unionfind: algo.unionfindViz,
};

export function getViz(topicKey: string): Viz | null {
  const make = registry[topicKey];
  return make ? make() : null;
}
