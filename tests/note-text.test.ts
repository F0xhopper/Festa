import { describe, expect, it } from "vitest";
import { hasMarker, insertAfterFrontmatter, splitFrontmatter } from "../src/note-text";

const BLOCK = "> [!festa|violet] X";

describe("insertAfterFrontmatter", () => {
	it("inserts after frontmatter", () => {
		expect(insertAfterFrontmatter("---\na: 1\n---\n## Tasks\n", BLOCK)).toBe(`---\na: 1\n---\n${BLOCK}\n\n## Tasks\n`);
	});
	it("collapses leading blank lines in the body", () => {
		expect(insertAfterFrontmatter("---\na: 1\n---\n\n\n## Tasks\n", BLOCK)).toBe(`---\na: 1\n---\n${BLOCK}\n\n## Tasks\n`);
	});
	it("inserts at the top without frontmatter", () => {
		expect(insertAfterFrontmatter("## Tasks\n", BLOCK)).toBe(`${BLOCK}\n\n## Tasks\n`);
	});
	it("handles an empty note", () => {
		expect(insertAfterFrontmatter("", BLOCK)).toBe(`${BLOCK}\n`);
	});
	it("handles frontmatter at end of file without a newline", () => {
		expect(insertAfterFrontmatter("---\na: 1\n---", BLOCK)).toBe(`---\na: 1\n---\n${BLOCK}\n`);
	});
	it("handles CRLF", () => {
		expect(insertAfterFrontmatter("---\r\na: 1\r\n---\r\nbody\r\n", BLOCK)).toBe(`---\r\na: 1\r\n---\r\n${BLOCK}\n\nbody\r\n`);
	});
	it("treats an unclosed fence as body", () => {
		expect(splitFrontmatter("---\nno close\n")).toEqual(["", "---\nno close\n"]);
	});
});

describe("hasMarker", () => {
	it("detects the frontmatter key", () => {
		expect(hasMarker("---\nfeast: X\n---\nbody", "feast")).toBe(true);
		expect(hasMarker("---\nfeast_la: X\n---\nbody", "feast")).toBe(false);
		expect(hasMarker("---\nother: 1\n---\nfeast: in body", "feast")).toBe(false);
	});
	it("detects the callout", () => {
		expect(hasMarker(`${BLOCK}\n\nbody`, "feast")).toBe(true);
		expect(hasMarker("plain", "feast")).toBe(false);
	});
});
