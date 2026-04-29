/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {css} from 'lit';

export const styles = css`
  :host {
    font-family: Arial, 'sans serif';
    display: block;
  }
  .hooks-main {
    width: 100%;
    height: 100%;
    background: lightblue;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .b1,
  .b2,
  .b3 {
    position: absolute;
    will-change: transform;
    border-radius: 50%;
    background: lightcoral;
    box-shadow: 10px 10px 5px 0px rgba(0, 0, 0, 0.75);
    opacity: 0.6;
  }

  .b1 {
    width: 170px;
    height: 170px;
  }

  .b2 {
    width: 350px;
    height: 350px;
  }

  .b3 {
    width: 200px;
    height: 200px;
  }

  .b1::after,
  .b2::after,
  .b3::after {
    content: '';
    position: absolute;
    top: 50px;
    left: 50px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
  }

  .b2::after {
    top: 70px;
    left: 70px;
    width: 70px;
    height: 70px;
  }

  .b3::after {
    top: 50px;
    left: 50px;
    width: 50px;
    height: 50px;
  }

  .hooks-filter {
    position: absolute;
    width: 100%;
    height: 100%;
    filter: url('#goo');
    overflow: hidden;
  }
`;
