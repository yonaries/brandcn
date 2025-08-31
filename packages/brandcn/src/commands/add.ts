import * as p from "@clack/prompts";
import { Command, Flags } from "@oclif/core";
import type { LogoOperationResult } from "../types/logos.js";
import {
  getDefaultDirectoryPath,
  processLogos,
  setCustomTargetDirectory,
  targetDirectoryExists,
} from "../utils/fs.js";
import { LogoSpinner, displayError, displayUsage } from "../utils/log.js";
import { validateLogoNames } from "../utils/validate.js";

export default class Add extends Command {
  static override args = {};
  static override description = "Add brand logos to your project";
  static override examples = [
    "$ brandcn add vercel",
    "$ brandcn add vercel neon react",
    "$ brandcn add vercel --dark --light",
    "$ brandcn add github --wordmark",
    "$ bunx brandcn@latest add nextjs tailwindcss",
  ];
  static override flags = {
    dark: Flags.boolean({
      char: "d",
      description: "Add only dark variant of the logo",
    }),
    light: Flags.boolean({
      char: "l",
      description: "Add only light variant of the logo",
    }),
    wordmark: Flags.boolean({
      char: "w",
      description: "Add only wordmark variant of the logo",
    }),
  };
  static override strict = false;

  public async run(): Promise<void> {
    const { argv, flags } = await this.parse(Add);
    const logoNames = argv as string[];

    if (!logoNames || logoNames.length === 0) {
      displayError("No logo names provided");
      displayUsage();
      this.exit(1);
    }

    const validation = validateLogoNames(logoNames);

    if (validation.hasErrors) {
      displayError("Invalid logo names:");
      for (const error of validation.errors) {
        console.log(`  • ${error.name}: ${error.error}`);
      }

      console.log("");
      displayUsage();
      this.exit(1);
    }

    if (validation.validNames.length === 0) {
      displayError("No valid logo names provided");
      displayUsage();
      this.exit(1);
    }

    const directoryExists = await targetDirectoryExists();
    if (!directoryExists) {
      p.intro("🎨 brandcn");

      const defaultPath = getDefaultDirectoryPath()
      const directory = await p.text({
        message: "Would you like to specify a custom directory?",
        placeholder: "components/logos",
      });

      if (p.isCancel(directory)) {
        p.cancel("Operation cancelled.");
        this.exit(0);
      }

      if (directory !== "components/logos") {
        setCustomTargetDirectory(directory);
      }
    }

    const spinner = new LogoSpinner(
      `Processing ${validation.validNames.length} logo(s)...`
    );
    spinner.start();

    try {
      const results = await processLogos(validation.validNames, flags);

      spinner.stop();

      this.displayResultsWithClack(results);

      const hasFailures = results.some((r) => !r.success);
      const hasSuccesses = results.some((r) => r.success);
      const successfulCount = results.filter(
        (r) => r.success && !r.skipped
      ).length;
      const skippedCount = results.filter((r) => r.success && r.skipped).length;

      if (hasFailures && !hasSuccesses) {
        p.outro("❌ All operations failed. Please check the errors above.");
        this.exit(1);
      } else if (hasFailures && hasSuccesses) {
        p.outro(
          `⚠️  Completed with warnings. ${successfulCount} logos added${
            skippedCount > 0 ? `, ${skippedCount} skipped` : ""
          }.`
        );
      } else {
        const message =
          successfulCount > 0
            ? `🎉 Successfully added ${successfulCount} logo${
                successfulCount === 1 ? "" : "s"
              }${skippedCount > 0 ? ` (${skippedCount} already existed)` : ""}!`
            : "✨ All logos were already present in your project.";
        p.outro(message);
      }
    } catch (error) {
      spinner.fail("Operation failed");
      p.outro(
        `❌ ${
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        }`
      );
      this.exit(1);
    }
  }

  private displayResultsWithClack(results: LogoOperationResult[]): void {
    console.log("");

    const successful = results.filter((r) => r.success && !r.skipped);
    const skipped = results.filter((r) => r.success && r.skipped);
    const failed = results.filter((r) => !r.success);

    if (successful.length > 0) {
      p.log.success("Added logos:");
      for (const result of successful) {
        p.log.step(`✨ ${result.logoName}.svg`);
      }
    }

    if (skipped.length > 0) {
      p.log.info("Skipped (already exist):");
      for (const result of skipped) {
        p.log.step(`⏭️  ${result.logoName}.svg`);
      }
    }

    if (failed.length > 0) {
      p.log.error("Failed:");
      for (const result of failed) {
        p.log.step(`❌ ${result.logoName}: ${result.error}`);
      }
    }
  }
}
