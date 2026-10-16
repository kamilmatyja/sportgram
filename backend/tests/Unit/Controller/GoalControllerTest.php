<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\GoalController;
use App\Dto\{GoalDetailsQueryDto, GoalDto, GoalIndexDto, GoalStatusDto, SaveStatusDto};
use App\Entity\Goal;
use App\Enum\{GoalStatusEnum, RoleEnum, SaveStatusEnum};
use App\Resource\GoalResource;
use App\Security\Voter\{GoalCreatorVoter, GoalParticipantResultVoter, GoalParticipantVoter, GoalVoter};
use App\Service\GoalService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory};

class GoalControllerTest extends ControllerTestCase
{
    private GoalService&MockObject $service;

    private GoalController $controller;

    protected function setUp(): void
    {
        $this->controller = new GoalController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([GoalController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([GoalController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/goals', 'POST', 'goal_create', RoleEnum::ROLE_PARTICIPANT, null];
        yield 'update' => ['update', '/api/goals/{id}', 'PUT', 'goal_update', GoalCreatorVoter::GOAL_CREATOR, 'id'];
        yield 'updateStatus' => ['updateStatus', '/api/goals/{id}/status', 'PATCH', 'goal_update_status', GoalVoter::GOAL, 'id'];
        yield 'delete' => ['delete', '/api/goals/{id}', 'DELETE', 'goal_delete', GoalCreatorVoter::GOAL_CREATOR, 'id'];
        yield 'index' => ['index', '/api/goals', 'GET', 'goal_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/goals/{id}', 'GET', 'goal_details', 'IS_AUTHENTICATED_FULLY', null];
        yield 'participantUpdateStatus' => ['participantUpdateStatus', '/api/goal-participants/{id}/status', 'PATCH', 'goal_participant_update_status', GoalParticipantVoter::GOAL_PARTICIPANT, 'id'];
        yield 'participantResultUpdateStatus' => ['participantResultUpdateStatus', '/api/goal-participant-results/{id}/status', 'PATCH', 'goal_participant_result_update_status', GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT, 'id'];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(GoalController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([GoalController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([GoalController::class, 'update'], 'dto');
        $this->assertMapsRequestPayload([GoalController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([GoalController::class, 'index'], 'dto');
        $this->assertMapsQueryString([GoalController::class, 'index'], 'include');
        $this->assertMapsQueryString([GoalController::class, 'details'], 'dto');
        $this->assertMapsRequestPayload([GoalController::class, 'participantUpdateStatus'], 'dto');
        $this->assertMapsRequestPayload([GoalController::class, 'participantResultUpdateStatus'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new GoalDto();
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v4();
        $dto = new GoalDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = new GoalStatusDto();
        $dto->status = GoalStatusEnum::Completed;
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
        $dto = new GoalIndexDto();
        $include = self::includeAll();
        $goals = [$this->goalWithParticipants(), $this->goal()];
        $window = self::window($goals, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $include, $this->service());

        $expected = GoalResource::fromEntityCollection($goals, $include);
        $this->assertCount(1, $expected[0]['participants']);
        $this->assertCount(1, $expected[0]['participants'][0]['results']);
        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => $expected,
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new GoalIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, new GoalDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $goal = $this->goalWithParticipants();
        $dto = self::includeAll();
        $this->service()->expects($this->once())->method('details')->with($goal->id)->willReturn($goal);

        $response = $this->controller->details($goal->id, $dto, $this->service());

        $expected = GoalResource::fromEntity($goal, $dto);
        $this->assertArrayHasKey('results', $expected['participants'][0]);
        $this->assertJsonResponse(Response::HTTP_OK, ['data' => $expected], $response);
    }

    final public function testDetailsWithoutIncludes(): void
    {
        $goal = $this->goalWithParticipants();
        $this->service()->expects($this->once())->method('details')->with($goal->id)->willReturn($goal);

        $response = $this->controller->details($goal->id, new GoalDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => GoalResource::fromEntity($goal)], $response);
    }

    final public function testParticipantUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = self::saveStatus();
        $this->service()->expects($this->once())->method('updateParticipantStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->participantUpdateStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testParticipantResultUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = self::saveStatus();
        $this->service()->expects($this->once())->method('updateParticipantResultStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->participantResultUpdateStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    private function service(): GoalService&MockObject
    {
        return $this->service ??= $this->createMock(GoalService::class);
    }

    private static function includeAll(): GoalDetailsQueryDto
    {
        $dto = new GoalDetailsQueryDto();
        $dto->include = [GoalDetailsQueryDto::GOAL_PARTICIPANTS, GoalDetailsQueryDto::GOAL_PARTICIPANT_RESULTS];

        return $dto;
    }

    private static function saveStatus(): SaveStatusDto
    {
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;

        return $dto;
    }

    private function goal(): Goal
    {
        $goal = GoalFactory::make();
        $goal->id = Uuid::v4();
        $goal->feed->id = Uuid::v4();
        $goal->onPrePersist();

        return $goal;
    }

    private function goalWithParticipants(): Goal
    {
        $goal = $this->goal();

        $participant = GoalParticipantFactory::make(['goal' => $goal]);
        $participant->id = Uuid::v4();
        $participant->onPrePersist();
        $goal->participants->add($participant);

        $result = GoalParticipantResultFactory::make(['goalParticipant' => $participant, 'feed' => $goal->feed]);
        $result->id = Uuid::v4();
        $result->onPrePersist();
        $participant->results->add($result);

        return $goal;
    }
}
