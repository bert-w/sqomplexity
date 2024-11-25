# Changelog

All notable changes to `filament-socialite` will be documented in this file.

## [2.0.0 - 2024-11-25](https://github.com/bert-w/sqomplexity/compare/v1.5.0...v2.0.0)

## What's Changed
* Removed `src/program.js` (unnecessary layer).
* Removed base64-encoded queries, queries by filename and file-based weights options from the SQompLexity file itself. The CLI tool still allows these options.
* Changed the function name from `sqomplexity.run()` to `sqomplexity.score()` (numeric score output) and `sqomplexity.analyze()` (object output).
* For any more changes, see the updated examples and readme.
