all:
	@make cleanup
	@make install-deps
	@make build
cleanup:
	@rm -rf build
install-deps:
	@apt update
	@apt install -y nodejs npm
	@npm install
build:
	@npm run build
	@cp config.cfg build/config.cfg
	@cp TimeTableConfig.json build/TimeTableConfig.json
	@cp -r public build/public