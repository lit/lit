/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Data structure representing a Reddit-style comment
 */
export interface Comment {
  id: string;
  author: string;
  content: string;
  score: number;
  timestamp: Date;
  replies: Comment[];
  depth: number;
}

/**
 * Configuration for generating comment trees
 */
export interface CommentTreeConfig {
  /** Maximum depth of comment nesting */
  maxDepth: number;
  /** Maximum number of replies at each level */
  maxRepliesPerComment: number;
  /** Minimum number of replies at each level */
  minRepliesPerComment: number;
  /** Total number of top-level comments */
  topLevelComments: number;
  /** Default number of test iterations for this scenario */
  iterations: number;
  /** Default number of warmup iterations for this scenario */
  warmupIterations: number;
}

/**
 * Predefined configurations for different test scenarios
 */
export const COMMENT_TREE_CONFIGS = {
  shallow_wide: {
    maxDepth: 3,
    maxRepliesPerComment: 20,
    minRepliesPerComment: 5,
    topLevelComments: 50,
    iterations: 10,
    warmupIterations: 3,
  },
  deep_narrow: {
    maxDepth: 15,
    maxRepliesPerComment: 3,
    minRepliesPerComment: 1,
    topLevelComments: 10,
    iterations: 15,
    warmupIterations: 5,
  },
  balanced: {
    maxDepth: 8,
    maxRepliesPerComment: 8,
    minRepliesPerComment: 2,
    topLevelComments: 25,
    iterations: 10,
    warmupIterations: 3,
  },
  reddit_frontpage: {
    maxDepth: 12,
    maxRepliesPerComment: 15,
    minRepliesPerComment: 0,
    topLevelComments: 100,
    iterations: 8,
    warmupIterations: 2,
  },
  stress_test: {
    maxDepth: 20,
    maxRepliesPerComment: 50,
    minRepliesPerComment: 10,
    topLevelComments: 200,
    iterations: 5,
    warmupIterations: 2,
  },
} as const satisfies Record<string, CommentTreeConfig>;

/**
 * Sample content for generating realistic comments
 */
const SAMPLE_CONTENT = [
  'This is an interesting point. I never thought about it that way.',
  "I disagree with the premise here. The data doesn't support this conclusion.",
  'Great explanation! This really helps clarify the topic.',
  'Can you provide a source for this claim?',
  'TL;DR: The main takeaway is that performance matters a lot in web development.',
  'Edit: Thanks for the gold, kind stranger!',
  'This. So much this.',
  'Came here to say exactly this.',
  "I'm a software engineer with 15 years of experience, and I can confirm this is accurate.",
  'As someone who works in this field, I can tell you that the reality is much more complex.',
  'Your mileage may vary, but in my experience this approach works well.',
  "Here's a relevant XKCD: https://xkcd.com/927/",
  'Username checks out.',
  'Instructions unclear, got my head stuck in the ceiling fan.',
  '5/7 perfect score',
  'This deserves more upvotes.',
  'Underrated comment right here.',
  "I'm not crying, you're crying.",
  'Take my upvote and leave.',
  'The real life pro tip is always in the comments.',
];

const SAMPLE_LONG_CONTENT = [
  `This is a much longer comment that goes into great detail about the subject matter. It includes multiple paragraphs with various points of view and extensive analysis of the topic at hand. 

  The first paragraph introduces the main concept and provides necessary background information. This helps readers understand the context and importance of the discussion.

  In the second paragraph, we dive deeper into the technical aspects and explore various implications. This is where the real meat of the argument begins to take shape and we can see how different factors interact with each other.

  Finally, the conclusion ties everything together and provides actionable insights that readers can apply to their own situations. This comprehensive approach ensures that all aspects of the topic have been thoroughly covered.`,

  `I've been following this discussion for a while now, and I wanted to share some insights from my professional experience in this field. Having worked on similar projects for over a decade, I've seen how these patterns emerge and evolve over time.

  The key insight here is that performance optimization is rarely about finding a single silver bullet solution. Instead, it's about understanding the trade-offs and making informed decisions based on your specific use case and constraints.

  For example, when dealing with large datasets in server-side rendering, you need to consider not just the initial render time, but also memory usage, caching strategies, and how the solution will scale as your user base grows.`,

  `Let me break down the technical details for anyone who's interested in the implementation specifics:

  1. **Data Structure Optimization**: The key is using efficient data structures that minimize memory allocation and provide fast lookups.

  2. **Rendering Strategy**: Server-side rendering with proper streaming can significantly improve perceived performance.

  3. **Caching Layer**: Implementing intelligent caching at multiple levels (component, page, and CDN) is crucial for scale.

  4. **Measurement and Monitoring**: You can't optimize what you don't measure - proper benchmarking and real-user monitoring are essential.

  Each of these areas has its own complexities and nuances that require careful consideration and testing.`,
];

const USERNAMES = [
  'dev_guru_42',
  'code_ninja',
  'react_fanboy',
  'vue_enthusiast',
  'angular_architect',
  'fullstack_wizard',
  'frontend_master',
  'backend_beast',
  'database_destroyer',
  'algorithm_ace',
  'performance_prophet',
  'bug_hunter',
  'refactor_king',
  'test_driven_dev',
  'agile_advocate',
  'devops_deity',
  'security_specialist',
  'ui_ux_unicorn',
  'api_architect',
  'cloud_captain',
  'mobile_maverick',
  'game_dev_god',
  'data_scientist',
  'ml_engineer',
  'blockchain_believer',
];

/**
 * Generates a single comment with deterministic data based on depth and index
 */
function generateComment(depth: number, index: number): Comment {
  // Deterministic long content: every 10th comment is long (index % 10 === 0)
  const isLongContent = index % 10 === 0;

  // Deterministic content selection based on depth and index
  const contentSeed =
    (depth * 1000 + index) %
    (isLongContent ? SAMPLE_LONG_CONTENT.length : SAMPLE_CONTENT.length);
  const content = isLongContent
    ? SAMPLE_LONG_CONTENT[contentSeed]
    : SAMPLE_CONTENT[contentSeed];

  // Deterministic username selection
  const usernameSeed = (depth * 100 + index) % USERNAMES.length;
  const author = USERNAMES[usernameSeed];

  // Deterministic score based on depth and index (-50 to 949 range)
  const score = ((depth * 173 + index * 47) % 1000) - 50;

  // Fixed timestamp (2024-01-01 minus deterministic days)
  const baseDays = (depth * 7 + index * 3) % 30; // 0-29 days ago
  const timestamp = new Date('2024-01-01');
  timestamp.setDate(timestamp.getDate() - baseDays);

  return {
    id: `comment_d${depth}_i${index}`,
    author,
    content,
    score,
    timestamp,
    replies: [],
    depth,
  };
}

/**
 * Recursively generates a comment tree with deterministic structure
 */
function generateCommentTree(
  depth: number,
  config: CommentTreeConfig,
  parentIndex = 0
): Comment[] {
  if (depth >= config.maxDepth) {
    return [];
  }

  // Deterministic number of comments at each level
  const numComments =
    depth === 0
      ? config.topLevelComments
      : Math.min(
          config.maxRepliesPerComment,
          Math.max(
            config.minRepliesPerComment,
            // Use a deterministic pattern: reduce replies as depth increases
            Math.floor(config.maxRepliesPerComment * Math.pow(0.8, depth)) +
              (parentIndex % 3)
          )
        );

  const comments: Comment[] = [];

  for (let i = 0; i < numComments; i++) {
    const comment = generateComment(depth, i);

    // Deterministic reply generation: create replies based on patterns
    // Comments with even index at shallow depths get more replies
    const shouldHaveReplies =
      depth < config.maxDepth - 1 && // Not at max depth - 1
      ((depth === 0 && i % 2 === 0) || // Top level: every other comment
        (depth === 1 && i % 3 === 0) || // Depth 1: every third comment
        (depth === 2 && i % 4 === 0) || // Depth 2: every fourth comment
        (depth >= 3 && i === 0)); // Deeper: only first comment

    if (shouldHaveReplies) {
      comment.replies = generateCommentTree(depth + 1, config, i);
    }

    comments.push(comment);
  }

  return comments;
}

/**
 * Generates a complete comment tree with deterministic structure based on configuration
 * Results are reproducible - the same config will always generate identical trees
 */
export function generateCommentTreeData(config: CommentTreeConfig): Comment[] {
  return generateCommentTree(0, config);
}

/**
 * Calculates statistics about a comment tree
 */
export interface CommentTreeStats {
  totalComments: number;
  maxDepth: number;
  avgRepliesPerComment: number;
  totalCharacters: number;
}

/**
 * Analyzes a comment tree and returns statistics
 */
export function analyzeCommentTree(comments: Comment[]): CommentTreeStats {
  let totalComments = 0;
  let maxDepth = 0;
  let totalReplies = 0;
  let totalCharacters = 0;
  let commentsWithReplies = 0;

  function traverse(comments: Comment[], currentDepth = 0) {
    for (const comment of comments) {
      totalComments++;
      totalCharacters += comment.content.length;
      maxDepth = Math.max(maxDepth, currentDepth);

      if (comment.replies.length > 0) {
        totalReplies += comment.replies.length;
        commentsWithReplies++;
        traverse(comment.replies, currentDepth + 1);
      }
    }
  }

  traverse(comments);

  return {
    totalComments,
    maxDepth,
    avgRepliesPerComment:
      commentsWithReplies > 0 ? totalReplies / commentsWithReplies : 0,
    totalCharacters,
  };
}
