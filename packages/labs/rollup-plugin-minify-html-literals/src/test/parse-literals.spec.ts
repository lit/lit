import {test, describe as suite} from 'node:test';
import * as assert from 'node:assert/strict';
import sinon from 'sinon';
import {parseLiterals} from '../lib/parse-literals.js';
import createParseTests from './parse-tests.js';

suite('parse-literals', () => {
  test('should allow overriding strategy', () => {
    const result: unknown[] = [];
    const strategy = {
      getRootNode: sinon.fake(),
      walkNodes: sinon.fake.returns(result),
      isTaggedTemplate: sinon.fake.returns(false),
      getTagText: sinon.fake(),
      getTaggedTemplateTemplate: sinon.fake(),
      isTemplate: sinon.fake.returns(false),
      getTemplateParts: sinon.fake(),
    };

    parseLiterals('true', {strategy});
    assert.ok(strategy.getRootNode.calledWith('true'));
    assert.ok(strategy.walkNodes.called);
  });

  createParseTests();
});
