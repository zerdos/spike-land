# Language Contribution Guide

This guide walks you through adding a new Monarch tokenizer language to monaco-editor. All examples reference the `ini` language definition as a concrete reference.

## Overview

Monaco Editor uses [Monarch](https://microsoft.github.io/monaco-editor/monarch.html) for syntax highlighting. Monarch is a declarative lexer specification format: you define tokenizer states, regex rules, and token types in a plain JavaScript/TypeScript object. The editor compiles this into a fast tokenizer at runtime.

Each language in this repo consists of three files plus a registration import. No build configuration changes are needed.

## The 3 Required Files

Every language lives in its own directory at `src/languages/definitions/{lang}/` and has three files:

### 1. `{lang}.ts` -- Language Definition

This file exports two things:

- **`conf`** (`languages.LanguageConfiguration`) -- Editor behavior: comments, brackets, auto-closing pairs, surrounding pairs, and indentation rules.
- **`language`** (`languages.IMonarchLanguage`) -- The Monarch tokenizer definition with states, rules, and token types.

Example from `ini/ini.ts`:

```typescript
import type { languages } from '../../../editor';

export const conf: languages.LanguageConfiguration = {
	comments: {
		lineComment: '#'
	},
	brackets: [
		['{', '}'],
		['[', ']'],
		['(', ')']
	],
	autoClosingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"' },
		{ open: "'", close: "'" }
	],
	surroundingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"' },
		{ open: "'", close: "'" }
	]
};

export const language = <languages.IMonarchLanguage>{
	defaultToken: '',
	tokenPostfix: '.ini',

	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

	tokenizer: {
		root: [
			[/^\[[^\]]*\]/, 'metatag'],
			[/(^\w+)(\s*)(\=)/, ['key', '', 'delimiter']],
			{ include: '@whitespace' },
			[/\d+/, 'number'],
			[/"([^"\\]|\\.)*$/, 'string.invalid'],
			[/'([^'\\]|\\.)*$/, 'string.invalid'],
			[/"/, 'string', '@string."'],
			[/'/, 'string', "@string.'"]
		],

		whitespace: [
			[/[ \t\r\n]+/, ''],
			[/^\s*[#;].*$/, 'comment']
		],

		string: [
			[/[^\\"']+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[
				/["']/,
				{
					cases: {
						'$#==$S2': { token: 'string', next: '@pop' },
						'@default': 'string'
					}
				}
			]
		]
	}
};
```

### 2. `register.ts` -- Language Registration

This file registers the language ID, file extensions, aliases, and a lazy loader that points to the language definition file.

Example from `ini/register.ts`:

```typescript
import { registerLanguage } from '../_.contribution';

registerLanguage({
	id: 'ini',
	extensions: ['.ini', '.properties', '.gitconfig'],
	filenames: ['config', '.gitattributes', '.gitconfig', '.editorconfig'],
	aliases: ['Ini', 'ini'],
	loader: () => import('./ini')
});
```

Fields:

| Field        | Required | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `id`         | Yes      | Unique language identifier (lowercase)               |
| `extensions` | Yes      | File extensions that trigger this language           |
| `filenames`  | No       | Exact filenames that trigger this language           |
| `aliases`    | Yes      | Display names (first one is the primary name)        |
| `loader`     | Yes      | Dynamic import pointing to the `.ts` definition file |

The `loader` uses dynamic `import()` so the tokenizer is only loaded when the language is actually needed (tree-shaking friendly).

### 3. `{lang}.test.ts` -- Grammar Tests

Tests verify that your tokenizer produces the expected tokens for given input lines.

Example from `ini/ini.test.ts`:

```typescript
import { testTokenization } from '../test/testRunner';

testTokenization('ini', [
	// Section headers
	[
		{
			line: '[section]',
			tokens: [{ startIndex: 0, type: 'metatag.ini' }]
		}
	],

	// Key-value pairs
	[
		{
			line: 'key=value',
			tokens: [
				{ startIndex: 0, type: 'key.ini' },
				{ startIndex: 3, type: 'delimiter.ini' },
				{ startIndex: 4, type: '' }
			]
		}
	],

	// Comments
	[
		{
			line: '# this is a comment',
			tokens: [{ startIndex: 0, type: 'comment.ini' }]
		}
	]
]);
```

## Monarch Tokenizer Concepts

### States

The tokenizer is organized as a set of named **states**. Each state contains an ordered list of rules. The tokenizer always starts in the `root` state.

```typescript
tokenizer: {
	root: [ /* rules */ ],
	string: [ /* rules */ ],
	comment: [ /* rules */ ]
}
```

### Rules

Each rule is an array with 2-3 elements: `[regex, action]` or `[regex, action, nextState]`.

```typescript
// Simple: match digits, emit 'number' token
[/\d+/, 'number'][
	// With state transition: match '"', emit 'string', push '@string' state
	(/"/, 'string', '@string')
][
	// Object action with cases:
	(/["']/,
	{
		cases: {
			'$#==$S2': { token: 'string', next: '@pop' },
			'@default': 'string'
		}
	})
];
```

### Token Types

Tokens are strings like `'comment'`, `'string'`, `'keyword'`, `'number'`, `'delimiter'`, etc. The `tokenPostfix` (e.g., `.ini`) is automatically appended, so a `'comment'` token becomes `'comment.ini'` in the output.

An empty string `''` means "no specific token type" (default styling).

Common token types: `comment`, `string`, `string.escape`, `string.invalid`, `keyword`, `number`, `delimiter`, `operator`, `identifier`, `type`, `tag`, `metatag`, `attribute.name`, `attribute.value`.

### Including Other States

Use `{ include: '@stateName' }` to include all rules from another state:

```typescript
root: [
	{ include: '@whitespace' },
	{ include: '@comments' }
	// ... other rules
];
```

### Regex Patterns

Monarch uses standard JavaScript regex. Some conventions:

- Use `^` for start-of-line matching (e.g., `^\s*#` for comments)
- Use `@escapes` to reference patterns defined at the top level of the language object
- Capture groups in the regex correspond to multiple token types in an array action

### Multi-Token Rules

When a regex has capture groups, you can assign different token types to each group:

```typescript
// (key)(whitespace)(equals sign)
[/(^\w+)(\s*)(\=)/, ['key', '', 'delimiter']];
```

### State Stack and Guards

- `@pop` -- Pop the current state and return to the previous one
- `@push` -- Push the current state again
- `$#` -- The matched text of the current rule
- `$S2` -- A state argument (set when entering a state with `@state.arg`)

## Test File Format

Tests use `testTokenization(languageId, testCases)` from the shared test runner.

### Structure

```typescript
testTokenization('mylang', [
	// Each top-level array element is an independent test case.
	// Each test case is an array of { line, tokens } objects.
	[
		{
			line: 'some input text',
			tokens: [
				{ startIndex: 0, type: 'keyword.mylang' },
				{ startIndex: 4, type: '' },
				{ startIndex: 5, type: 'identifier.mylang' }
			]
		}
	],

	// Multi-line test: lines are joined with \n and tokenized together.
	// This tests that state transitions carry across lines.
	[
		{
			line: '/* start of comment',
			tokens: [{ startIndex: 0, type: 'comment.mylang' }]
		},
		{
			line: 'end of comment */',
			tokens: [{ startIndex: 0, type: 'comment.mylang' }]
		}
	]
]);
```

### Key Details

- **`startIndex`** is the character offset within that line (0-based).
- **`type`** includes the `tokenPostfix` (e.g., `'comment.ini'`, not just `'comment'`). An empty string `''` is valid for unstyled tokens.
- **Multi-line tests** are arrays with multiple `{ line, tokens }` objects. The lines are joined with newlines and tokenized as a block, which tests that state transitions persist across line boundaries.
- Every token produced by the tokenizer must be accounted for. The test runner uses `assert.deepStrictEqual`.

### Writing Good Tests

Cover at minimum:

- Every state in your tokenizer
- Boundary cases (empty lines, whitespace-only lines)
- Multi-line constructs (block comments, multi-line strings)
- Invalid/unterminated constructs (if your tokenizer handles them)
- A realistic multi-line example that combines several constructs

## Registration

After creating the three files, add your language to `src/languages/definitions/register.all.ts`:

```typescript
// Add in alphabetical order
import './mylang/register';
```

This file is a flat list of imports, sorted alphabetically by directory name.

## Running Tests

Run all grammar tests:

```bash
npm run test:grammars
```

The grammar tests use Node.js's built-in test runner (`node:test`). To run a specific language's tests, use the `--test-name-pattern` flag:

```bash
npx tsx --test --test-name-pattern 'ini' src/languages/definitions/ini/ini.test.ts
```

Run the full test suite (grammar tests + sample checks):

```bash
npm test
```

## Common Pitfalls

1. **Greedy regexes** -- A pattern like `/".*"/` will match across multiple quoted strings on one line. Use `/"[^"]*"/` or `/"([^"\\]|\\.)*"/` instead.

2. **Missing `tokenPostfix`** -- If you forget to set `tokenPostfix: '.mylang'`, all your tokens will lack the language suffix. Tests will fail because they expect `'keyword.mylang'`, not `'keyword'`.

3. **State stack leaks** -- Every `@push` or state transition needs a corresponding `@pop`. If you push a state but never pop it, the tokenizer gets stuck and subsequent lines tokenize incorrectly.

4. **Rule ordering matters** -- Monarch evaluates rules top-to-bottom within a state. Put more specific patterns before general ones. For example, put keyword matching before identifier matching.

5. **Forgetting `{ include: '@whitespace' }`** -- If your root state doesn't handle whitespace, the tokenizer may produce unexpected tokens for spaces and newlines.

6. **Capture group mismatch** -- If your regex has 3 capture groups but your action array has 2 token types, the tokenizer will behave unexpectedly. The counts must match.

7. **Start-of-line anchors in non-root states** -- `^` anchors work per-line, but only if the tokenizer is at the beginning of the line when it enters that rule. Be careful with `^` in states that can be entered mid-line.

8. **`defaultToken` value** -- Setting `defaultToken: 'invalid'` during development highlights everything your tokenizer doesn't explicitly handle, which is useful for finding gaps. Change it back to `''` before submitting.

## Checklist

Before submitting your PR:

- [ ] Created `src/languages/definitions/{lang}/{lang}.ts` with `conf` and `language` exports
- [ ] Created `src/languages/definitions/{lang}/register.ts` with `registerLanguage` call
- [ ] Created `src/languages/definitions/{lang}/{lang}.test.ts` with comprehensive token tests
- [ ] Added `import './{lang}/register'` to `src/languages/definitions/register.all.ts` (alphabetical order)
- [ ] Created `website/index/samples/sample.{lang}.txt` with a representative code sample
- [ ] `tokenPostfix` is set to `.{lang}`
- [ ] Tests cover all tokenizer states
- [ ] Tests cover edge cases (empty input, unterminated strings, etc.)
- [ ] `npm run test:grammars` passes
- [ ] `npm run prettier-check` passes
