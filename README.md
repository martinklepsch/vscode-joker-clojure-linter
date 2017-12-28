# clojure-joker-linter

A [Joker](https://github.com/candid82/joker) integration for VSCode. The `joker` binary **needs to be installed separately**.

## Features

- Lint Clojure files using `joker` whenever they are opened or changed.
- Show warnings and errors in the editor as well as in the problems tab in the Panel.

Note that `joker` isn't a *proper* Clojure runtime and this may provide false positives or miss certain things.
The [Joker README](https://github.com/candid82/joker) provides some guidance on reducing false positives etc.

## Requirements

Install Joker as per it's [installation instructions](https://github.com/candid82/joker#installation).

## Extension Settings

There are no settings yet.

## Known Issues

This is alpha quality, things may not work.

## Release Notes

#### 0.0.1 — 25th Dec 2017

- initial release