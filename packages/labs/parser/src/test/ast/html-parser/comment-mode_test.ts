/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {Mode} from '../../../lib/ast/html-parser/state.js';
import {
  CommentNode,
  Element,
} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser Comment Mode', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Comment Mode Transitions', () => {
    test('transitions to COMMENT mode when encountering comment start', () => {
      const state = harness.getParserState('<!-');
      assert.equal(state.mode, Mode.COMMENT);
    });

    test('transitions from COMMENT mode to TEXT mode when comment ends', () => {
      harness.assertParserMode('<!-- comment -->', Mode.TEXT);
    });
  });

  suite('Comment Parsing', () => {
    test('parses simple comments', () => {
      harness.testParse('<!-- A simple comment -->', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const comment = fragment.childNodes[0] as CommentNode;
        assert.equal(comment.nodeName, '#comment');
        harness.assertCommentNode(comment, ' A simple comment ');
      });
    });

    test('parses comments with special characters', () => {
      harness.testParse('<!-- Special chars: !@#$%^&*()_+ -->', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const comment = fragment.childNodes[0] as CommentNode;
        harness.assertCommentNode(comment, ' Special chars: !@#$%^&*()_+ ');
      });
    });

    test('parses comments inside elements', () => {
      harness.testParse(
        '<div><!-- Comment inside element --></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          harness.assertChildCount(div, 1);
          const comment = div.childNodes[0] as CommentNode;
          harness.assertCommentNode(comment, ' Comment inside element ');
        }
      );
    });

    test('parses comments with expressions', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<!-- Comment with ${expr} -->',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const comment = fragment.childNodes[0] as CommentNode;
          assert.equal(comment.nodeName, '#comment');

          // The comment data should include the expression
          assert.equal(comment.data.length, 3);
          assert.equal(comment.data[0].type, 'LitTagLiteral');
          assert.equal(comment.data[1].type, 'LitHtmlExpression');
          assert.equal(comment.data[2].type, 'LitTagLiteral');

          const commentText = comment.data
            .filter((item) => item.type === 'LitTagLiteral')
            .map((item) => (item as any).value)
            .join('');

          assert.equal(commentText, ' Comment with  ');
        },
        [expr]
      );
    });

    test('parses multiple comments', () => {
      harness.testParse(
        '<!-- First comment --><!-- Second comment -->',
        (fragment) => {
          harness.assertChildCount(fragment, 2);

          const comment1 = fragment.childNodes[0] as CommentNode;
          harness.assertCommentNode(comment1, ' First comment ');

          const comment2 = fragment.childNodes[1] as CommentNode;
          harness.assertCommentNode(comment2, ' Second comment ');
        }
      );
    });

    test('parses comments with HTML-like content', () => {
      harness.testParse(
        '<!-- This comment has <div>HTML</div> inside -->',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const comment = fragment.childNodes[0] as CommentNode;
          harness.assertCommentNode(
            comment,
            ' This comment has <div>HTML</div> inside '
          );
        }
      );
    });
  });
});
