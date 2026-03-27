import "@testing-library/jest-dom";

// react-router (and some deps) rely on TextEncoder/TextDecoder.
// Jest's jsdom environment may not provide them depending on Node version.
import { TextDecoder, TextEncoder } from 'util';

if (!global.TextEncoder) {
	global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
	global.TextDecoder = TextDecoder;
}
