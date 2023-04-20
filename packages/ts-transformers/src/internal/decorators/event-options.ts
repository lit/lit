/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {cloneNode} from 'ts-clone-node';

import type {LitClassContext} from '../lit-class-context.js';
import type {LitFileContext} from '../lit-file-context.js';
import type {MemberDecoratorVisitor, GenericVisitor} from '../visitor.js';

/**
 * Transform:
 *
 *   class MyElement extends LitElement {
 *
 *     @eventOptions({capture: true})
 *     private _onClick(event) {
 *       console.log('click', event.target);
 *     }
 *
 *     @eventOptions({passive: true})
 *     public onKeydown(event) {
 *       console.log('keydown', event.target);
 *     }
 *
 *     render() {
 *       return html`
 *         <button @click=${this._onClick}
 *                 @keydown=${this.onKeydown}>
 *           Foo
 *         </button>`;
 *     }
 *   }
 *
 * Into:
 *
 *   class MyElement extends LitElement {
 *
 *     _onClick(event) {
 *       console.log('click', event.target);
 *     }
 *
 *     onKeydown(event) {
 *       console.log('keydown', event.target);
 *     }
 *
 *     render() {
 *       return html`
 *         <button @click=${{handleEvent: (e) => this._onClick(e), capture: true}}
 *                 @keydown=${this.onKeydown}>
 *           Foo
 *         </button>
 *       `;
 *     }
 *   }
 *   Object.assign(MyElement.prototype.onKeydown, {passive: true});
 */
export class EventOptionsVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'eventOptions';

  private readonly _factory: ts.NodeFactory;
  private readonly _program: ts.Program;

  constructor({factory}: ts.TransformationContext, program: ts.Program) {
    this._factory = factory;
    this._program = program;
  }

  visit(
    litClassContext: LitClassContext,
    method: ts.ClassElement,
    decorator: ts.Decorator
  ) {
    if (!ts.isMethodDeclaration(method)) {
      return;
    }
    if (!ts.isCallExpression(decorator.expression)) {
      return;
    }
    if (!method.body) {
      return;
    }
    const [eventOptionsNode] = decorator.expression.arguments;
    if (
      eventOptionsNode === undefined ||
      !ts.isObjectLiteralExpression(eventOptionsNode)
    ) {
      return;
    }
    if (!ts.isIdentifier(method.name)) {
      return;
    }
    if (
      !ts.isClassDeclaration(method.parent) ||
      method.parent.name === undefined
    ) {
      return;
    }

    litClassContext.litFileContext.nodeReplacements.set(decorator, undefined);

    // If private, assume no outside access is possible, and transform any
    // references to this function inside template event bindings to
    // `{handleEvent: (e) => this._onClick(e), ...options}` objects.
    if (
      method.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.PrivateKeyword)
    ) {
      const methodSymbol = this._program
        .getTypeChecker()
        .getSymbolAtLocation(method.name);
      if (methodSymbol !== undefined) {
        litClassContext.additionalClassVisitors.add(
          new EventOptionsBindingVisitor(
            this._factory,
            this._program,
            methodSymbol,
            eventOptionsNode
          )
        );
        return;
      }
    }

    // If not private, keep the method as it is and annotate options on it
    // directly, exactly like the decorator does.
    litClassContext.adjacentStatements.push(
      this._createMethodOptionsAssignment(
        method.parent.name.text,
        method.name.text,
        eventOptionsNode
      )
    );
  }

  private _createMethodOptionsAssignment(
    className: string,
    methodName: string,
    options: ts.ObjectLiteralExpression
  ): ts.Node {
    const factory = this._factory;
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('Object'),
        factory.createIdentifier('assign')
      ),
      undefined,
      [
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier(className),
            factory.createIdentifier('prototype')
          ),
          factory.createIdentifier(methodName)
        ),
        options,
      ]
    );
  }
}

/**
 * Transforms Lit template event bindings for a particular event handler method
 * that was annotated with @eventOptions.
 */
class EventOptionsBindingVisitor implements GenericVisitor {
  readonly kind = 'generic';

  private readonly _factory: ts.NodeFactory;
  private readonly _program: ts.Program;
  private readonly _eventHandlerSymbol: ts.Symbol;
  private readonly _eventOptionsNode: ts.ObjectLiteralExpression;

  constructor(
    factory: ts.NodeFactory,
    program: ts.Program,
    eventHandlerSymbol: ts.Symbol,
    eventOptionsNode: ts.ObjectLiteralExpression
  ) {
    this._factory = factory;
    this._program = program;
    this._eventHandlerSymbol = eventHandlerSymbol;
    this._eventOptionsNode = eventOptionsNode;
  }

  visit(litFileContext: LitFileContext, node: ts.Node): ts.Node {
    if (!ts.isPropertyAccessExpression(node)) {
      return node;
    }
    if (
      node.parent === undefined ||
      !this._isLitEventBinding(litFileContext, node.parent)
    ) {
      return node;
    }
    const symbol = this._program
      .getTypeChecker()
      .getSymbolAtLocation(node.name);
    if (symbol !== this._eventHandlerSymbol) {
      return node;
    }
    return this._createEventHandlerObject(node);
  }

  private _isLitEventBinding(litFileContext: LitFileContext, span: ts.Node) {
    if (!ts.isTemplateSpan(span)) {
      return false;
    }
    const template = span.parent;
    if (template === undefined || !ts.isTemplateExpression(template)) {
      return false;
    }
    const tagged = template.parent;
    if (!ts.isTaggedTemplateExpression(tagged)) {
      return false;
    }
    const pos = template.templateSpans.indexOf(span as ts.TemplateSpan);
    if (pos === -1) {
      return false;
    }
    const priorText =
      pos === 0
        ? template.head.text
        : template.templateSpans[pos - 1]!.literal.text;
    if (priorText.match(/@[^\s"'>]+\s*=\s*["']*$/) === null) {
      return false;
    }
    // Note we check for the lit tag last because it requires the type checker
    // which is expensive.
    if (litFileContext.getCanonicalName(tagged.tag) !== 'html') {
      return false;
    }
    return true;
  }

  private _createEventHandlerObject(
    eventHandlerReference: ts.PropertyAccessExpression
  ): ts.ObjectLiteralExpression {
    const factory = this._factory;
    return factory.createObjectLiteralExpression(
      [
        factory.createPropertyAssignment(
          factory.createIdentifier('handleEvent'),
          factory.createArrowFunction(
            undefined,
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                factory.createIdentifier('e')
              ),
            ],
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createCallExpression(
              // Clone because there could be multiple event bindings and each
              // needs its own copy of the event handler reference.
              cloneNode(eventHandlerReference, {factory: factory}),
              undefined,
              [factory.createIdentifier('e')]
            )
          )
        ),
        ...this._eventOptionsNode.properties.map((property) =>
          // Clone because there could be multiple event bindings and each needs
          // its own copy of the event options.
          cloneNode(property, {factory: factory})
        ),
      ],
      false
    );
  }
}
