install:
	npm i

test:
	NODE_ENV=test npm test

test-only:
	NODE_ENV=test npm run-script test-only

autod:
	npm i autod && autod -w -e example --prefix=~ --keep=debug, --semver=koa@1
	$(MAKE) install

.PHONY: test
