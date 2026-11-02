SHELL := /bin/bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

.PHONY: build start seed

build:
	cp backend/.env.example backend/.env
	cp frontend/.env.example frontend/.env
	docker compose up -d --build
	docker compose exec php composer install
	docker compose exec php php bin/console app:generate-app-secret
	docker compose exec php php bin/console doctrine:database:create --if-not-exists
	docker compose exec php php bin/console doctrine:migrations:migrate -n
	docker compose exec php php bin/console doctrine:database:create --env=test --if-not-exists
	docker compose exec php php bin/console doctrine:migrations:migrate --env=test -n
	docker compose exec  php php bin/console lexik:jwt:generate-keypair --skip-if-exists
	docker compose exec php php bin/console app:generate-vapid-keys
	cd frontend
	npm install
	npm run build
	npm run dev

start:
	docker compose up -d
	cd frontend
	npm run dev

seed:
	docker compose exec php php bin/console app:seed --fresh
