/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, type TemplateResult} from 'lit';
import type {Comment} from './comment-tree-generator.js';

/**
 * Formats a timestamp for display
 */
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return timestamp.toLocaleDateString();
}

/**
 * Formats a score with appropriate styling
 */
function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
}

/**
 * Renders a single comment without replies
 */
export function renderComment(comment: Comment): TemplateResult {
  return html`
    <div
      class="comment"
      data-comment-id="${comment.id}"
      data-depth="${comment.depth}"
      style="margin-left: ${comment.depth *
      20}px; border-left: ${comment.depth > 0
        ? '2px solid #e1e5e9'
        : 'none'}; padding-left: ${comment.depth > 0 ? '12px' : '0'};"
    >
      <div class="comment-header">
        <span class="comment-author">${comment.author}</span>
        <span
          class="comment-score ${comment.score >= 0 ? 'positive' : 'negative'}"
          title="${comment.score} points"
        >
          ${formatScore(comment.score)}
        </span>
        <span class="comment-timestamp"
          >${formatTimestamp(comment.timestamp)}</span
        >
      </div>
      <div class="comment-content">
        ${comment.content
          .split('\n\n')
          .map((paragraph) => html`<p>${paragraph.trim()}</p>`)}
      </div>
      <div class="comment-actions">
        <button class="action-button upvote" type="button">↑</button>
        <button class="action-button downvote" type="button">↓</button>
        <button class="action-button reply" type="button">Reply</button>
        <button class="action-button share" type="button">Share</button>
        <button class="action-button save" type="button">Save</button>
        ${comment.replies.length > 0
          ? html`
              <button class="action-button collapse" type="button">
                [−] ${comment.replies.length}
                ${comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            `
          : ''}
      </div>
    </div>
  `;
}

/**
 * Recursively renders a comment and all its replies
 */
export function renderCommentWithReplies(comment: Comment): TemplateResult {
  return html`
    ${renderComment(comment)}
    ${comment.replies.length > 0
      ? html`
          <div class="comment-replies">
            ${comment.replies.map((reply) => renderCommentWithReplies(reply))}
          </div>
        `
      : ''}
  `;
}

/**
 * Renders a complete comment thread
 */
export function renderCommentThread(comments: Comment[]): TemplateResult {
  return html`
    <div class="comment-thread">
      <style>
        .comment-thread {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.4;
          color: #222;
          background: #fff;
          max-width: 800px;
          margin: 0 auto;
          padding: 16px;
        }

        .comment {
          margin-bottom: 12px;
          position: relative;
        }

        .comment-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .comment-author {
          font-weight: 600;
          color: #1c1c1c;
        }

        .comment-score {
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 2px;
          background: #f6f7f8;
        }

        .comment-score.positive {
          color: #d93f00;
        }

        .comment-score.negative {
          color: #7e53c3;
        }

        .comment-timestamp {
          color: #7c7c7c;
        }

        .comment-content {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .comment-content p {
          margin: 0 0 8px 0;
        }

        .comment-content p:last-child {
          margin-bottom: 0;
        }

        .comment-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-button {
          background: none;
          border: none;
          padding: 4px 8px;
          font-size: 12px;
          color: #878a8c;
          cursor: pointer;
          border-radius: 2px;
          font-weight: 700;
        }

        .action-button:hover {
          background: #f6f7f8;
        }

        .action-button.upvote:hover {
          color: #d93f00;
        }

        .action-button.downvote:hover {
          color: #7e53c3;
        }

        .comment-replies {
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .comment-thread {
            padding: 8px;
          }

          .comment {
            margin-left: 10px;
          }
        }
      </style>

      <div class="comments-container">
        ${comments.map((comment) => renderCommentWithReplies(comment))}
      </div>
    </div>
  `;
}

/**
 * Renders a simplified version for performance testing (no styling)
 */
export function renderCommentThreadMinimal(
  comments: Comment[]
): TemplateResult {
  return html`
    <div class="comment-thread-minimal">
      ${comments.map((comment) => renderCommentMinimal(comment))}
    </div>
  `;
}

/**
 * Minimal comment rendering for performance testing
 */
function renderCommentMinimal(comment: Comment): TemplateResult {
  return html`
    <div data-id="${comment.id}" data-depth="${comment.depth}">
      <header>
        ${comment.author} • ${formatScore(comment.score)} •
        ${formatTimestamp(comment.timestamp)}
      </header>
      <content>${comment.content}</content>
      ${comment.replies.length > 0
        ? html`
            <replies>
              ${comment.replies.map((reply) => renderCommentMinimal(reply))}
            </replies>
          `
        : ''}
    </div>
  `;
}

/**
 * Renders comment statistics for benchmarking info
 */
export function renderBenchmarkInfo(stats: {
  totalComments: number;
  maxDepth: number;
  avgRepliesPerComment: number;
  totalCharacters: number;
  renderTime?: number;
  templateSize?: number;
}): TemplateResult {
  return html`
    <div class="benchmark-info">
      <h3>Benchmark Statistics</h3>
      <ul>
        <li>Total Comments: ${stats.totalComments}</li>
        <li>Max Depth: ${stats.maxDepth}</li>
        <li>
          Avg Replies per Comment: ${stats.avgRepliesPerComment.toFixed(2)}
        </li>
        <li>Total Characters: ${stats.totalCharacters.toLocaleString()}</li>
        ${stats.renderTime
          ? html`<li>Render Time: ${stats.renderTime}ms</li>`
          : ''}
        ${stats.templateSize
          ? html`<li>
              Template Size: ${(stats.templateSize / 1024).toFixed(2)}KB
            </li>`
          : ''}
      </ul>
    </div>
  `;
}
