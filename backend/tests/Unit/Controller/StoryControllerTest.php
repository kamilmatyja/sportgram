<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\StoryController;
use App\Dto\{ElementStatusDto, StoryDto, StoryIndexDto};
use App\Entity\Story;
use App\Enum\ElementStatusEnum;
use App\Resource\StoryResource;
use App\Security\Voter\{StoryCreatorVoter, StoryVoter};
use App\Service\StoryService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\StoryFactory;

class StoryControllerTest extends ControllerTestCase
{
    private StoryService&MockObject $service;

    private StoryController $controller;

    protected function setUp(): void
    {
        $this->controller = new StoryController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([StoryController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([StoryController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/stories', 'POST', 'story_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'update' => ['update', '/api/stories/{id}', 'PUT', 'story_update', StoryCreatorVoter::STORY_CREATOR, 'id'];
        yield 'updateStatus' => ['updateStatus', '/api/stories/{id}/status', 'PATCH', 'story_update_status', StoryVoter::STORY, 'id'];
        yield 'delete' => ['delete', '/api/stories/{id}', 'DELETE', 'story_delete', StoryCreatorVoter::STORY_CREATOR, 'id'];
        yield 'index' => ['index', '/api/stories', 'GET', 'story_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/stories/{id}', 'GET', 'story_details', 'IS_AUTHENTICATED_FULLY', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(StoryController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([StoryController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([StoryController::class, 'update'], 'dto');
        $this->assertMapsRequestPayload([StoryController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([StoryController::class, 'index'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new StoryDto();
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v4();
        $dto = new StoryDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = new ElementStatusDto();
        $dto->status = ElementStatusEnum::Rejected;
        $this->service()->expects($this->once())->method('updateStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDelete(): void
    {
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('delete')->with($id)->willReturn($id);

        $response = $this->controller->delete($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndex(): void
    {
        $dto = new StoryIndexDto();
        $stories = [$this->story(), $this->story()];
        $window = self::window($stories, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => StoryResource::fromEntityCollection($stories),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new StoryIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $story = $this->story();
        $this->service()->expects($this->once())->method('details')->with($story->id)->willReturn($story);

        $response = $this->controller->details($story->id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => StoryResource::fromEntity($story)], $response);
    }

    private function service(): StoryService&MockObject
    {
        return $this->service ??= $this->createMock(StoryService::class);
    }

    private function story(): Story
    {
        $story = StoryFactory::make();
        $story->id = Uuid::v4();
        $story->onPrePersist();

        return $story;
    }
}
