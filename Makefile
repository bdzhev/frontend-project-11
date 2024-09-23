install:
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8%

build:
	NODE_ENV=production npx webpack

develop:
	npx webpack serve