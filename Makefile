all:
	@make cleanup
	@make install-deps
	@make build
cleanup:
	@rm -rf build
install-deps:
	@npm install -g
	@npm i --save-dev @types/node
build:
	@npm run build
	@rm -rf build
	@mkdir build
	@cp -r ./kastchensystem-server ./build
	@cp -r ./public ./build
	@cp TimeTableConfig.json ./build
	@cp config.cfg ./build
	@echo "Build complete"