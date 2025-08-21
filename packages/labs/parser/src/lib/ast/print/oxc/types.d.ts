import type {Directive, Statement, TemplateElement} from 'oxc-parser';
import {Expression} from '../../types.js';

export type Node = Directive | Statement | Expression | TemplateElement;
