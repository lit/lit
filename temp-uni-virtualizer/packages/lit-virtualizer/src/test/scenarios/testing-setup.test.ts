/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { ignoreBenignErrors, ignoreWindowErrors } from "../helpers.js";
import { expect } from "@esm-bundle/chai";
 
describe('ignoreBenignErrors', () => {

    ignoreBenignErrors(beforeEach, afterEach);

    // Chrome
    it('ignores ResizeObserver loop limit exceeded error', async () => {
        let errorThrown = false;
        setTimeout(() => {
            errorThrown = true;
            throw new Error("ResizeObserver loop limit exceeded");
        }, 0);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(errorThrown).to.eq(true);
    });

    // Safari/WebKit
    it('ignores ResizeObserver loop completed with undelivered notifications error', async () => {
        let errorThrown = false;
        setTimeout(() => {
            errorThrown = true;
            throw new Error("ResizeObserver loop completed with undelivered notifications.");
        }, 0);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(errorThrown).to.eq(true);
    });

    describe('Nested ignoreWindowErrors', () => {

        // This ignoreWindowErrors setup is nested within the ignoreBenignErrors setup in the containing
        // describe block.  This is an expected configuration and should be handled correctly because of
        // ordering of hooks by Mocha.
        ignoreWindowErrors(beforeEach, afterEach, /APPLES|BANANAS/);

        // Note that if we put another ignoreWindowErrors here, its afterEach will be called out
        // of order and then the teardown will fail with an explicit error, since we need the
        // advised method to be torn down LIFO instead of FIFO.

        it('ignores APPLES error and BANANAS error and tears down in correct order', async () => {
            let applesErrorThrown = false;
            let bananasErrorThrown = false;
            setTimeout(() => {
                applesErrorThrown = true;
                throw new Error("APPLES");
            }, 0);
            setTimeout(() => {
                bananasErrorThrown = true;
                throw new Error("BANANAS");
            }, 0);
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(applesErrorThrown).to.eq(true);
            expect(bananasErrorThrown).to.eq(true);
        });
    });
});