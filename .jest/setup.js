// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

import { TextEncoder, TextDecoder } from "util";
import { webcrypto } from "crypto";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.crypto = webcrypto;

jest.mock("webextension-polyfill", () => global.browser);
jest.mock("mem", () => (fn) => fn);
