"use strict";
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var module_1 = require("module");
var import_module_js_1 = require("../../lib/import-module.js");
var dom_shim_js_1 = require("../../lib/dom-shim.js");
var tape_1 = require("tape");
var tape_promise_1 = require("tape-promise");
var tapePromise = tape_promise_1["default"]["default"];
var test = tapePromise(tape_1["default"]);
/**
 * Promise for importing the "app module". This is a module that implements the
 * templates and elements to be SSRed. In this case it implements our test
 * cases.
 */
var appModuleImport = import_module_js_1.importModule('../test-files/render-test-module.js', import.meta.url, dom_shim_js_1.getWindow({ require: module_1.createRequire(import.meta.url) }));
/* Real Tests */
/**
 * This test helper waits for the app module to load, and returns an object
 * with all the exports, and a render helper that renders a template to a
 * string.
 */
var setup = function () { return __awaiter(void 0, void 0, void 0, function () {
    var appModule, collectResult;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, appModuleImport];
            case 1:
                appModule = _a.sent();
                collectResult = function (iterable) { var iterable_1, iterable_1_1; return __awaiter(void 0, void 0, void 0, function () {
                    var result, chunk, e_1_1;
                    var e_1, _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                result = '';
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 6, 7, 12]);
                                iterable_1 = __asyncValues(iterable);
                                _b.label = 2;
                            case 2: return [4 /*yield*/, iterable_1.next()];
                            case 3:
                                if (!(iterable_1_1 = _b.sent(), !iterable_1_1.done)) return [3 /*break*/, 5];
                                chunk = iterable_1_1.value;
                                result += chunk;
                                _b.label = 4;
                            case 4: return [3 /*break*/, 2];
                            case 5: return [3 /*break*/, 12];
                            case 6:
                                e_1_1 = _b.sent();
                                e_1 = { error: e_1_1 };
                                return [3 /*break*/, 12];
                            case 7:
                                _b.trys.push([7, , 10, 11]);
                                if (!(iterable_1_1 && !iterable_1_1.done && (_a = iterable_1["return"]))) return [3 /*break*/, 9];
                                return [4 /*yield*/, _a.call(iterable_1)];
                            case 8:
                                _b.sent();
                                _b.label = 9;
                            case 9: return [3 /*break*/, 11];
                            case 10:
                                if (e_1) throw e_1.error;
                                return [7 /*endfinally*/];
                            case 11: return [7 /*endfinally*/];
                            case 12: return [2 /*return*/, result];
                        }
                    });
                }); };
                return [2 /*return*/, __assign(__assign({}, appModule.namespace), { 
                        /** Renders the value with declarative shadow roots */
                        render: function (r) { return collectResult(appModule.namespace.render(r)); }, 
                        /** Renders the value with flattened shadow roots */
                        renderFlattened: function (r) {
                            return collectResult(appModule.namespace.render(r, undefined, true));
                        } })];
        }
    });
}); };
test('simple TemplateResult', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, simpleTemplateResult, digestForTemplateResult, digest, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, simpleTemplateResult = _a.simpleTemplateResult, digestForTemplateResult = _a.digestForTemplateResult;
                digest = digestForTemplateResult(simpleTemplateResult);
                return [4 /*yield*/, render(simpleTemplateResult)];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part " + digest + "--><div></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
/* Text Expressions */
test('text expression with string value', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, templateWithTextExpression, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, templateWithTextExpression = _a.templateWithTextExpression;
                return [4 /*yield*/, render(templateWithTextExpression('foo'))];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->foo<!--/lit-part--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('text expression with undefined value', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, templateWithTextExpression, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, templateWithTextExpression = _a.templateWithTextExpression;
                return [4 /*yield*/, render(templateWithTextExpression(undefined))];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--/lit-part--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('text expression with null value', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, templateWithTextExpression, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, templateWithTextExpression = _a.templateWithTextExpression;
                return [4 /*yield*/, render(templateWithTextExpression(null))];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--/lit-part--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
/* Attribute Expressions */
test('attribute expression with string value', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, templateWithAttributeExpression, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, templateWithAttributeExpression = _a.templateWithAttributeExpression;
                return [4 /*yield*/, render(templateWithAttributeExpression('foo'))];
            case 2:
                result = _b.sent();
                // TODO: test for the marker comment for attribute binding
                t.equal(result, "<!--lit-part FAR9hgjJqTI=--><div class=\"foo\"><!--lit-bindings 0--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('multiple attribute expressions with string value', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, templateWithMultipleAttributeExpressions, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, templateWithMultipleAttributeExpressions = _a.templateWithMultipleAttributeExpressions;
                return [4 /*yield*/, render(templateWithMultipleAttributeExpressions('foo', 'bar'))];
            case 2:
                result = _b.sent();
                // Has marker attribute for number of bound attributes.
                t.equal(result, "<!--lit-part FQlA2/EioQk=--><div x=\"foo\" y=\"bar\" z=\"not-dynamic\"><!--lit-bindings 0--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('attribute expression with multiple bindings', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, templateWithMultiBindingAttributeExpression, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, templateWithMultiBindingAttributeExpression = _a.templateWithMultiBindingAttributeExpression;
                return [4 /*yield*/, render(templateWithMultiBindingAttributeExpression('foo', 'bar'))];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part D+PQMst9obo=--><div test=\"a foo b bar c\"><!--lit-bindings 0--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
/* Reflected property Expressions */
test('HTMLInputElement.value', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, inputTemplateWithValueProperty, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, inputTemplateWithValueProperty = _a.inputTemplateWithValueProperty;
                return [4 /*yield*/, render(inputTemplateWithValueProperty('foo'))];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part AxWziS+Adpk=--><input value=\"foo\"><!--lit-bindings 0--><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('HTMLElement.className', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, elementTemplateWithClassNameProperty, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, elementTemplateWithClassNameProperty = _a.elementTemplateWithClassNameProperty;
                return [4 /*yield*/, render(elementTemplateWithClassNameProperty('foo'))];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part I7NxrdZ/Zxo=--><div class=\"foo\"><!--lit-bindings 0--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('HTMLElement.classname does not reflect', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, elementTemplateWithClassnameProperty, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, elementTemplateWithClassnameProperty = _a.elementTemplateWithClassnameProperty;
                return [4 /*yield*/, render(elementTemplateWithClassnameProperty('foo'))];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part I7NxrbZzZGA=--><div ><!--lit-bindings 0--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('HTMLElement.id', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, elementTemplateWithIDProperty, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, elementTemplateWithIDProperty = _a.elementTemplateWithIDProperty;
                return [4 /*yield*/, render(elementTemplateWithIDProperty('foo'))];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part IgnmhhM3LsA=--><div id=\"foo\"><!--lit-bindings 0--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
/* Nested Templates */
test('nested template', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, nestedTemplate, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, nestedTemplate = _a.nestedTemplate;
                return [4 /*yield*/, render(nestedTemplate)];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part P/cIB3F0dnw=--><p>Hi</p><!--/lit-part--></div><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
/* Custom Elements */
test('simple custom element', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, simpleTemplateWithElement, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, simpleTemplateWithElement = _a.simpleTemplateWithElement;
                return [4 /*yield*/, render(simpleTemplateWithElement)];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part tjmYe1kHIVM=--><test-simple><template shadowroot=\"open\"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template></test-simple><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('element with property', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, elementWithProperty, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, elementWithProperty = _a.elementWithProperty;
                return [4 /*yield*/, render(elementWithProperty)];
            case 2:
                result = _b.sent();
                // TODO: we'd like to remove the extra space in the start tag
                t.equal(result, "<!--lit-part v2CxGIW+qHI=--><test-property ><!--lit-bindings 0--><template shadowroot=\"open\"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->bar<!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
test('element with `willUpdate`', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, elementWithWillUpdate, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, elementWithWillUpdate = _a.elementWithWillUpdate;
                return [4 /*yield*/, render(elementWithWillUpdate)];
            case 2:
                result = _b.sent();
                // TODO: we'd like to remove the extra space in the start tag
                t.equal(result, "<!--lit-part Q0bbGrx71ic=--><test-will-update  ><!--lit-bindings 0--><template shadowroot=\"open\"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->Foo Bar<!--/lit-part--></main><!--/lit-part--></template></test-will-update><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
/* Slots and Distribution */
/* Declarative Shadow Root */
test('no slot', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, noSlot, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, noSlot = _a.noSlot;
                return [4 /*yield*/, render(noSlot)];
            case 2:
                result = _b.sent();
                t.equal(result, "<!--lit-part OpS0yFtM48Q=--><test-simple><template shadowroot=\"open\"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template><p>Hi</p></test-simple><!--/lit-part-->");
                return [2 /*return*/];
        }
    });
}); });
/* Directives */
test('repeat directive with a template result', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, repeatDirectiveWithTemplateResult, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, repeatDirectiveWithTemplateResult = _a.repeatDirectiveWithTemplateResult;
                return [4 /*yield*/, render(repeatDirectiveWithTemplateResult)];
            case 2:
                result = _b.sent();
                t.equal(result, '<!--lit-part AEmR7W+R0Ak=-->' +
                    '<div>' +
                    '<!--lit-part-->' + // part that wraps the directive
                    '<!--lit-part AgkKByTWdnw=-->' + // part for child template 0
                    '<p><!--lit-part-->0<!--/lit-part-->) <!--lit-part-->foo<!--/lit-part--></p>' +
                    '<!--/lit-part-->' +
                    '<!--lit-part AgkKByTWdnw=-->' + // part for child template 1
                    '<p><!--lit-part-->1<!--/lit-part-->) <!--lit-part-->bar<!--/lit-part--></p>' +
                    '<!--/lit-part-->' +
                    '<!--lit-part AgkKByTWdnw=-->' + // part for child template 2
                    '<p><!--lit-part-->2<!--/lit-part-->) <!--lit-part-->qux<!--/lit-part--></p>' +
                    '<!--/lit-part-->' +
                    '<!--/lit-part-->' +
                    '</div>' +
                    '<!--/lit-part-->');
                return [2 /*return*/];
        }
    });
}); });
test('repeat directive with a string', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, repeatDirectiveWithString, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, repeatDirectiveWithString = _a.repeatDirectiveWithString;
                return [4 /*yield*/, render(repeatDirectiveWithString)];
            case 2:
                result = _b.sent();
                t.equal(result, '<!--lit-part BRUAAAUVAAA=-->' +
                    '<!--lit-part-->' + // part that wraps the directive
                    '<!--lit-part-->' + // part for child template 0
                    'foo' +
                    '<!--/lit-part-->' +
                    '<!--lit-part-->' + // part for child template 1
                    'bar' +
                    '<!--/lit-part-->' +
                    '<!--lit-part-->' + // part for child template 2
                    'qux' +
                    '<!--/lit-part-->' +
                    '<!--/lit-part-->' +
                    '<?>' + // endNode for template instance since it had no
                    // static end node
                    '<!--/lit-part-->');
                return [2 /*return*/];
        }
    });
}); });
test('simple class-map directive', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, classMapDirective, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, classMapDirective = _a.classMapDirective;
                return [4 /*yield*/, render(classMapDirective)];
            case 2:
                result = _b.sent();
                t.equal(result, '<!--lit-part PkF/hiJU4II=--><div class="a c"><!--lit-bindings 0--></div><!--/lit-part-->');
                return [2 /*return*/];
        }
    });
}); });
test.skip('class-map directive with other bindings', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, render, classMapDirectiveMultiBinding, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setup()];
            case 1:
                _a = _b.sent(), render = _a.render, classMapDirectiveMultiBinding = _a.classMapDirectiveMultiBinding;
                return [4 /*yield*/, render(classMapDirectiveMultiBinding)];
            case 2:
                result = _b.sent();
                t.equal(result, '<!--lit-part pNgepkKFbd0=--><div class="z hi a c"><!--lit-bindings 0--></div><!--/lit-part-->');
                return [2 /*return*/];
        }
    });
}); });
