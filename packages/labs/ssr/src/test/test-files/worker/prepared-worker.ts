import {render} from '../../../lib/render.js';
import {registerRenderRequestHandler} from '../../../worker.js';
import {templateWithTextExpression} from '../render-test-module.js';

import '../../../lib/install-global-dom-shim.js';

interface Data {
  value: string;
}

registerRenderRequestHandler<Data>(async (data, context) => {
  const template = templateWithTextExpression(data.value);
  for await (const chunk of render(template)) {
    context.write(chunk as string);
  }
});
