SHELL := /bin/bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

.PHONY: build start stop seed migrate test-backend test-frontend test-load format

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

stop:
	docker compose down

seed:
	docker compose exec php php bin/console app:seed --fresh

migrate:
	docker compose exec php php bin/console doctrine:database:create --if-not-exists
	docker compose exec php php bin/console doctrine:migrations:migrate -n
	docker compose exec php php bin/console doctrine:database:create --env=test --if-not-exists
	docker compose exec php php bin/console doctrine:migrations:migrate --env=test -n

test-backend:
	docker compose exec php vendor/bin/phpunit

test-frontend:
	cd frontend
	npm test

test-load:
	export LOAD_TEST_TOKEN="$${LOAD_TEST_TOKEN:-$$(docker compose exec -T php php bin/console app:load-test-token)}"
	training_status=0
	docker compose --profile load run --rm k6 run --include-system-env-vars /scripts/trainings_load_test.js || training_status=$$?
	feed_status=0
	docker compose --profile load run --rm k6 run --include-system-env-vars /scripts/feed_load_test.js || feed_status=$$?
	cleanup_status=0
	docker compose exec -T php php bin/console app:load-test-token --cleanup-only || cleanup_status=$$?
	test "$$training_status" -eq 0 -a "$$feed_status" -eq 0 -a "$$cleanup_status" -eq 0

format:
	docker compose exec php vendor/bin/php-cs-fixer fix
	cd frontend
	npm run fix
