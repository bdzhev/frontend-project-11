install:
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .

build:
	NODE_ENV=production npx webpack

develop:
	npx webpack serve