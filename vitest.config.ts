import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			obsidian: fileURLToPath(new URL("./tests/stubs/obsidian.ts", import.meta.url)),
			"obsidian-daily-notes-interface": fileURLToPath(
				new URL("./tests/stubs/daily-notes-interface.ts", import.meta.url),
			),
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});
