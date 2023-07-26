import {expect} from 'chai';
import sinon from 'sinon';
import {parseLiterals} from '../lib/parse-literals.js';
import createParseTests from './parse-tests.js';

describe('parse-literals', () => {
  it('should allow overriding strategy', () => {
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
    expect(strategy.getRootNode.calledWith('true')).to.be.true;
    expect(strategy.walkNodes.called).to.be.true;
  });

  createParseTests();
});
