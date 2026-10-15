<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\EntryController;
use App\Dto\{EntryCountDto, EntryCountIndexDto, EntryDto, EntryIndexDto};
use App\Entity\Entry;
use App\Enum\EntryTypeEnum;
use App\Resource\{EntryCountResource, EntryResource};
use App\Service\EntryService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\EntryFactory;

class EntryControllerTest extends ControllerTestCase
{
    private EntryService&MockObject $service;

    private EntryController $controller;

    protected function setUp(): void
    {
        $this->controller = new EntryController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([EntryController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([EntryController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/entries', 'POST', 'entry_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'index' => ['index', '/api/entries', 'GET', 'entry_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/entries/{id}', 'GET', 'entry_details', 'IS_AUTHENTICATED_FULLY', null];
        yield 'indexCount' => ['indexCount', '/api/entry-counts', 'GET', 'entry_count_index', 'IS_AUTHENTICATED_FULLY', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(EntryController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([EntryController::class, 'create'], 'dto');
        $this->assertMapsQueryString([EntryController::class, 'index'], 'dto');
        $this->assertMapsQueryString([EntryController::class, 'indexCount'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new EntryDto();
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testIndex(): void
    {
        $dto = new EntryIndexDto();
        $entries = [$this->entry(), $this->entry()];
        $window = self::window($entries, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => EntryResource::fromEntityCollection($entries),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new EntryIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $entry = $this->entry();
        $this->service()->expects($this->once())->method('details')->with($entry->id)->willReturn($entry);

        $response = $this->controller->details($entry->id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => EntryResource::fromEntity($entry)], $response);
    }

    final public function testIndexCount(): void
    {
        $dto = new EntryCountIndexDto();
        $counts = [
            new EntryCountDto(Uuid::v7(), EntryTypeEnum::Feed, 3),
            new EntryCountDto(Uuid::v7(), EntryTypeEnum::Event, 1),
        ];
        $window = self::window($counts, total: 5, page: 2, limit: 2);
        $this->service()->expects($this->once())->method('indexCount')->with($dto)->willReturn($window);

        $response = $this->controller->indexCount($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => EntryCountResource::fromEntityCollection($counts),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexCountWithoutResults(): void
    {
        $dto = new EntryCountIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('indexCount')->with($dto)->willReturn($window);

        $response = $this->controller->indexCount($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    private function service(): EntryService&MockObject
    {
        return $this->service ??= $this->createMock(EntryService::class);
    }

    private function entry(): Entry
    {
        $entry = EntryFactory::make();
        $entry->id = Uuid::v7();
        $entry->onPrePersist();

        return $entry;
    }
}
