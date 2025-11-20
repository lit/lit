import {renderFromWorker, renderThunked} from '../../index.js';
import {
  simpleTemplateWithElement,
  templateWithTextExpression,
} from './render-test-module.js';

export interface Data {
  value: unknown | 'simpleTemplateWithElement';
}

renderFromWorker<Data>((data) => {
  if (data.value === 'simpleTemplateWithElement') {
    return renderThunked(simpleTemplateWithElement);
  } else {
    return renderThunked(templateWithTextExpression(data.value as string));
  }
});
