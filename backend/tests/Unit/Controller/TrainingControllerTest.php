<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\TrainingController;
use App\Dto\{ElementStatusDto, SaveStatusDto, TrainingDetailsQueryDto, TrainingDto, TrainingIndexDto};
use App\Entity\Training;
use App\Enum\{ElementStatusEnum, RoleEnum, SaveStatusEnum};
use App\Resource\TrainingResource;
use App\Security\Voter\{TrainingCreatorVoter, TrainingParticipantVoter, TrainingVoter};
use App\Service\TrainingService;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{TrainingDisciplineFactory, TrainingFactory, TrainingParticipantFactory};

class TrainingControllerTest extends ControllerTestCase
{
    private TrainingService&MockObject $service;

    private TrainingController $controller;

    protected function setUp(): void
    {
        $this->controller = new TrainingController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([TrainingController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([TrainingController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/trainings', 'POST', 'training_create', RoleEnum::ROLE_PARTICIPANT, null];
        yield 'update' => ['update', '/api/trainings/{id}', 'PUT', 'training_update', TrainingCreatorVoter::TRAINING_CREATOR, 'id'];
        yield 'updateStatus' => ['updateStatus', '/api/trainings/{id}/status', 'PATCH', 'training_update_status', TrainingVoter::TRAINING, 'id'];
        yield 'delete' => ['delete', '/api/trainings/{id}', 'DELETE', 'training_delete', TrainingCreatorVoter::TRAINING_CREATOR, 'id'];
        yield 'index' => ['index', '/api/trainings', 'GET', 'training_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/trainings/{id}', 'GET', 'training_details', 'IS_AUTHENTICATED_FULLY', null];
        yield 'participantUpdateStatus' => ['participantUpdateStatus', '/api/training-participants/{id}/status', 'PATCH', 'training_participant_update_status', TrainingParticipantVoter::TRAINING_PARTICIPANT, 'id'];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(TrainingController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([TrainingController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([TrainingController::class, 'update'], 'dto');
        $this->assertMapsRequestPayload([TrainingController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([TrainingController::class, 'index'], 'dto');
        $this->assertMapsQueryString([TrainingController::class, 'index'], 'include');
        $this->assertMapsQueryString([TrainingController::class, 'details'], 'dto');
        $this->assertMapsRequestPayload([TrainingController::class, 'participantUpdateStatus'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new TrainingDto();
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v4();
        $dto = new TrainingDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = new ElementStatusDto();
        $dto->status = ElementStatusEnum::Active;
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
        $dto = new TrainingIndexDto();
        $include = new TrainingDetailsQueryDto();
        $include->include = [TrainingDetailsQueryDto::TRAINING_DISCIPLINES, TrainingDetailsQueryDto::TRAINING_PARTICIPANTS];
        $trainings = [$this->trainingWithRelations(), $this->trainingWithRelations()];
        $window = self::window($trainings, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $include, $this->service());

        $data = TrainingResource::fromEntityCollection($trainings, $include);
        $this->assertArrayHasKey('disciplines', $data[0]);
        $this->assertArrayHasKey('participants', $data[0]);
        $this->assertJsonResponse(Response::HTTP_OK, ['data' => $data, 'pagination' => self::pagination($window)], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new TrainingIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, new TrainingDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $training = $this->trainingWithRelations();
        $dto = new TrainingDetailsQueryDto();
        $dto->include = [TrainingDetailsQueryDto::TRAINING_DISCIPLINES, TrainingDetailsQueryDto::TRAINING_PARTICIPANTS];
        $this->service()->expects($this->once())->method('details')->with($training->id)->willReturn($training);

        $response = $this->controller->details($training->id, $dto, $this->service());

        $data = TrainingResource::fromEntity($training, $dto);
        $this->assertArrayHasKey('disciplines', $data);
        $this->assertArrayHasKey('participants', $data);
        $this->assertJsonResponse(Response::HTTP_OK, ['data' => $data], $response);
    }

    final public function testDetailsWithoutInclude(): void
    {
        $training = $this->training();
        $this->service()->expects($this->once())->method('details')->with($training->id)->willReturn($training);

        $response = $this->controller->details($training->id, new TrainingDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => TrainingResource::fromEntity($training)], $response);
    }

    final public function testParticipantUpdateStatus(): void
    {
        $id = Uuid::v4();
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->service()->expects($this->once())->method('updateParticipantStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->participantUpdateStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    private function service(): TrainingService&MockObject
    {
        return $this->service ??= $this->createMock(TrainingService::class);
    }

    private function training(): Training
    {
        $training = TrainingFactory::make();
        $training->id = Uuid::v4();
        $training->onPrePersist();

        return $training;
    }

    private function trainingWithRelations(): Training
    {
        $training = $this->training();
        $training->disciplines = new ArrayCollection();

        $discipline = TrainingDisciplineFactory::make(['training' => $training]);
        $discipline->id = Uuid::v4();
        $discipline->onPrePersist();
        $training->disciplines->add($discipline);

        $participant = TrainingParticipantFactory::make(['training' => $training]);
        $participant->id = Uuid::v4();
        $participant->onPrePersist();
        $training->participants->add($participant);

        return $training;
    }
}
