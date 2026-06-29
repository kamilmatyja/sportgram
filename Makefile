SHELL := /bin/bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

.PHONY: build start

build:
	docker compose up -d --build
	cp backend/.env.example backend/.env
	docker compose exec php composer install
	docker compose exec php php bin/console doctrine:migrations:migrate -n
	cd frontend
	npm install
	npm run build
	npm run dev

start:
	docker compose up -d
	cd frontend
	npm run dev
