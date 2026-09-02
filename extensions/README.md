# Extensions

This directory contains the individual Chrome Extensions developed in this repository.

Each extension should:

- Be independently buildable and testable.
- Have its own package.json.
- Have its own manifest.json.
- Keep extension-specific source code inside its own directory.
- Document its purpose, architecture, setup, and Chrome APIs used.

Example:

extensions/
+-- my-extension/
    +-- src/
    +-- public/
    +-- manifest.json
    +-- package.json
    +-- README.md
