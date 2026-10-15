<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{ElementStatusDto,
    SaveStatusDto,
    TrainingDisciplineDistanceDto,
    TrainingDisciplineDto,
    TrainingDisciplineSubDistanceDto,
    TrainingDto,
    TrainingIndexDto};
use App\Entity\{Training, TrainingDiscipline, TrainingDisciplineDistance, TrainingParticipant, User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, NotificationTypeEnum, SaveStatusEnum};
use App\Event\{NotificationEvent, TrainingProcessedEvent};
use App\Repository\{FeedRepository,
    FriendRepository,
    TrainingDisciplineDistanceRepository,
    TrainingDisciplineRepository,
    TrainingDisciplineSubDistanceRepository,
    TrainingParticipantRepository,
    TrainingRepository,
    UserRepository};
use App\Service\TrainingService;
use ArrayObject;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{TrainingDisciplineDistanceFactory,
    TrainingDisciplineFactory,
    TrainingDisciplineSubDistanceFactory,
    TrainingFactory,
    TrainingParticipantFactory};

#[AllowMockObjectsWithoutExpectations]
class TrainingServiceTest extends ServiceTestCase
{
    private TrainingRepository&MockObject $trainingRepository;

    private TrainingParticipantRepository&MockObject $participantRepository;

    private TrainingDisciplineRepository&MockObject $disciplineRepository;

    private TrainingDisciplineDistanceRepository&MockObject $distanceRepository;

    private TrainingDisciplineSubDistanceRepository&MockObject $subDistanceRepository;

    private UserRepository&MockObject $userRepository;

    private FeedRepository&MockObject $feedRepository;

    private FriendRepository&MockObject $friendRepository;

    private User $currentUser;

    private TrainingService $service;

    protected function setUp(): void
    {
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->participantRepository = $this->createMock(TrainingParticipantRepository::class);
        $this->disciplineRepository = $this->createMock(TrainingDisciplineRepository::class);
        $this->distanceRepository = $this->createMock(TrainingDisciplineDistanceRepository::class);
        $this->subDistanceRepository = $this->createMock(TrainingDisciplineSubDistanceRepository::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->feedRepository = $this->createMock(FeedRepository::class);
        $this->friendRepository = $this->createMock(FriendRepository::class);
        $this->currentUser = self::user();

        $this->service = new TrainingService(
            $this->trainingRepository,
            $this->participantRepository,
            $this->disciplineRepository,
            $this->distanceRepository,
            $this->subDistanceRepository,
            $this->userRepository,
            $this->feedRepository,
            $this->friendRepository,
            $this->dispatcher(),
            $this->security($this->currentUser),
        );
    }

    final public function testCreateSavesTrainingTreeParticipantsAndDispatchesEvents(): void
    {
        $friend = self::user();
        $dto = self::trainingDto([
            self::disciplineDto(DisciplineEnum::Running, [
                self::distanceDto(5000, 1500, [
                    self::subDistanceDto(1000, 300, 52, 21, 5, 12),
                    self::subDistanceDto(2000, 610),
                ]),
                self::distanceDto(10000, 3100),
            ]),
            self::disciplineDto(DisciplineEnum::Cycling, []),
        ], [$friend->id]);
        $feeds = $this->captureSaves($this->feedRepository, 1);
        $trainings = $this->captureSaves($this->trainingRepository, 1);
        $disciplines = $this->captureSaves($this->disciplineRepository, 2);
        $distances = $this->captureSaves($this->distanceRepository, 2);
        $subDistances = $this->captureSaves($this->subDistanceRepository, 2);
        $participants = $this->captureSaves($this->participantRepository, 2);
        $this->userRepository->expects($this->exactly(2))
            ->method('findById')
            ->willReturnMap([[$friend->id, $friend], [$this->currentUser->id, $this->currentUser]]);
        $this->friendRepository->method('isFriend')->willReturnMap([
            [$this->currentUser->id, $friend->id, true],
            [$this->currentUser->id, $this->currentUser->id, false],
        ]);

        $id = $this->service->create($dto);

        $feed = $feeds[0];
        $this->assertSame($this->currentUser, $feed->user);
        $this->assertNull($feed->text);
        $this->assertNull($feed->photo);
        $this->assertSame(ElementStatusEnum::Draft, $feed->status);

        $training = $trainings[0];
        $this->assertSame($training->id, $id);
        $this->assertSame($feed, $training->feed);
        $this->assertSame($this->currentUser, $training->user);
        $this->assertSame($dto->startedAt, $training->startedAt);
        $this->assertSame($dto->endedAt, $training->endedAt);
        $this->assertSame('Morning run', $training->title);
        $this->assertSame('Easy pace', $training->description);
        $this->assertSame('morning-run', $training->link);
        $this->assertSame('Warsaw', $training->location);
        $this->assertSame(ElementStatusEnum::Active, $training->status);

        $this->assertSame(
            [[$training, DisciplineEnum::Running], [$training, DisciplineEnum::Cycling]],
            array_map(static fn (TrainingDiscipline $d): array => [$d->training, $d->discipline], $disciplines->getArrayCopy()),
        );
        $this->assertSame(
            [[$disciplines[0], 5000, 1500], [$disciplines[0], 10000, 3100]],
            array_map(
                static fn (TrainingDisciplineDistance $d): array => [$d->trainingDiscipline, $d->distance, $d->time],
                $distances->getArrayCopy(),
            ),
        );
        $this->assertSame(
            [[$distances[0], 1000, 300, 52, 21, 5, 12], [$distances[0], 2000, 610, null, null, null, null]],
            array_map(
                static fn (object $s): array => [$s->trainingDisciplineDistance, $s->subDistance, $s->time, $s->lat, $s->lng, $s->accuracy, $s->speed],
                $subDistances->getArrayCopy(),
            ),
        );
        $this->assertSame(
            [[$training, $friend, SaveStatusEnum::Pending], [$training, $this->currentUser, SaveStatusEnum::Accepted]],
            array_map(
                static fn (TrainingParticipant $p): array => [$p->training, $p->user, $p->status],
                $participants->getArrayCopy(),
            ),
        );
        $this->assertEvents([
            ['processed', $friend, $distances[0]],
            ['processed', $friend, $distances[1]],
            ['notification', $friend, NotificationTypeEnum::TrainingParticipant, 'Morning run', '/trainings/morning-run'],
            ['processed', $this->currentUser, $distances[0]],
            ['processed', $this->currentUser, $distances[1]],
            ['notification', $this->currentUser, NotificationTypeEnum::TrainingParticipant, 'Morning run', '/trainings/morning-run'],
        ]);
    }

    final public function testCreateWithoutDisciplinesDispatchesOnlyNotification(): void
    {
        $dto = self::trainingDto([], [$this->currentUser->id]);
        $this->captureSaves($this->trainingRepository, 1);
        $this->disciplineRepository->expects($this->never())->method('save');
        $this->distanceRepository->expects($this->never())->method('save');
        $this->subDistanceRepository->expects($this->never())->method('save');
        $participants = $this->captureSaves($this->participantRepository, 1);
        $this->userRepository->expects($this->once())
            ->method('findById')
            ->with($this->currentUser->id)
            ->willReturn($this->currentUser);

        $this->service->create($dto);

        $this->assertSame([$this->currentUser->id], $dto->userIds);
        $this->assertSame(SaveStatusEnum::Accepted, $participants[0]->status);
        $this->assertEvents([
            ['notification', $this->currentUser, NotificationTypeEnum::TrainingParticipant, 'Morning run', '/trainings/morning-run'],
        ]);
    }

    final public function testCreateWithDisciplineWithoutDistancesDispatchesNoProcessedEvents(): void
    {
        $dto = self::trainingDto([self::disciplineDto(DisciplineEnum::Swimming, [])], []);
        $this->captureSaves($this->trainingRepository, 1);
        $this->captureSaves($this->disciplineRepository, 1);
        $this->distanceRepository->expects($this->never())->method('save');
        $this->userRepository->method('findById')->willReturn($this->currentUser);

        $this->service->create($dto);

        $this->assertEvents([
            ['notification', $this->currentUser, NotificationTypeEnum::TrainingParticipant, 'Morning run', '/trainings/morning-run'],
        ]);
    }

    final public function testCreateRejectsNonFriendParticipant(): void
    {
        $stranger = self::user();
        $dto = self::trainingDto([self::disciplineDto(DisciplineEnum::Running, [self::distanceDto(1000, 300)])], [$stranger->id]);
        $this->captureSaves($this->trainingRepository, 1);
        $this->captureSaves($this->disciplineRepository, 1);
        $this->captureSaves($this->distanceRepository, 1);
        $this->userRepository->expects($this->once())->method('findById')->with($stranger->id)->willReturn($stranger);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $stranger->id)
            ->willReturn(false);
        $this->participantRepository->expects($this->never())->method('save');

        try {
            $this->service->create($dto);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not friend.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreatePropagatesNotFoundForUnknownParticipant(): void
    {
        $dto = self::trainingDto([], [Uuid::v7()]);
        $this->captureSaves($this->trainingRepository, 1);
        $this->userRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->participantRepository->expects($this->never())->method('save');

        try {
            $this->service->create($dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateReplacesDisciplinesAndSyncsParticipants(): void
    {
        $training = $this->training(['user' => $this->currentUser]);
        $oldDiscipline = self::entity(TrainingDisciplineFactory::make(['training' => $training]));
        $oldDistance = self::entity(TrainingDisciplineDistanceFactory::make(['trainingDiscipline' => $oldDiscipline]));
        $oldSubDistance = self::entity(TrainingDisciplineSubDistanceFactory::make(['trainingDisciplineDistance' => $oldDistance]));
        $oldDistance->subDistances->add($oldSubDistance);
        $oldDiscipline->distances->add($oldDistance);
        $training->disciplines->add($oldDiscipline);
        $this->addParticipant($training, $this->currentUser);
        $kept = $this->addParticipant($training, self::user());
        $removed = $this->addParticipant($training, self::user());
        $added = self::user();
        $dto = self::trainingDto([
            self::disciplineDto(DisciplineEnum::Rowing, [self::distanceDto(2000, 480, [self::subDistanceDto(500, 120, 1, 2, 3, 4)])]),
        ], [$kept->user->id, $added->id]);
        $this->trainingRepository->expects($this->once())->method('findById')->with($training->id)->willReturn($training);
        $this->subDistanceRepository->expects($this->once())->method('delete')->with($oldSubDistance);
        $this->distanceRepository->expects($this->once())->method('delete')->with($oldDistance);
        $this->disciplineRepository->expects($this->once())->method('delete')->with($oldDiscipline);
        $disciplines = $this->captureSaves($this->disciplineRepository, 1);
        $distances = $this->captureSaves($this->distanceRepository, 1);
        $subDistances = $this->captureSaves($this->subDistanceRepository, 1);
        $this->participantRepository->expects($this->once())->method('delete')->with($removed);
        $this->userRepository->expects($this->once())->method('findById')->with($added->id)->willReturn($added);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $added->id)
            ->willReturn(true);
        $participants = $this->captureSaves($this->participantRepository, 1);
        $this->trainingRepository->expects($this->once())->method('save')->with($training);

        $this->assertSame($training->id, $this->service->update($training->id, $dto));

        $this->assertSame($dto->startedAt, $training->startedAt);
        $this->assertSame($dto->endedAt, $training->endedAt);
        $this->assertSame('Morning run', $training->title);
        $this->assertSame('Easy pace', $training->description);
        $this->assertSame('morning-run', $training->link);
        $this->assertSame('Warsaw', $training->location);
        $this->assertSame($training, $disciplines[0]->training);
        $this->assertSame(DisciplineEnum::Rowing, $disciplines[0]->discipline);
        $this->assertSame([$disciplines[0], 2000, 480], [$distances[0]->trainingDiscipline, $distances[0]->distance, $distances[0]->time]);
        $this->assertSame(
            [$distances[0], 500, 120, 1, 2, 3, 4],
            [
                $subDistances[0]->trainingDisciplineDistance,
                $subDistances[0]->subDistance,
                $subDistances[0]->time,
                $subDistances[0]->lat,
                $subDistances[0]->lng,
                $subDistances[0]->accuracy,
                $subDistances[0]->speed,
            ],
        );
        $this->assertSame([$training, $added, SaveStatusEnum::Pending], [$participants[0]->training, $participants[0]->user, $participants[0]->status]);
        $this->assertNotifications([[$added, NotificationTypeEnum::TrainingParticipant, $training->title, '/trainings/' . $training->link]]);
    }

    final public function testUpdateKeepsTrainingOwnerEvenWhenNotCurrentUser(): void
    {
        $owner = self::user();
        $training = $this->training(['user' => $owner]);
        $ownerParticipant = $this->addParticipant($training, $owner);
        $this->trainingRepository->method('findById')->willReturn($training);
        $this->participantRepository->expects($this->never())->method('delete');
        $this->participantRepository->expects($this->never())->method('save');
        $this->userRepository->expects($this->never())->method('findById');
        $this->trainingRepository->expects($this->once())->method('save')->with($training);

        $dto = self::trainingDto([], []);

        $this->service->update($training->id, $dto);

        $this->assertSame([$owner->id], $dto->userIds);
        $this->assertContains($ownerParticipant, $training->participants);
    }

    final public function testUpdateWithoutExistingOrNewDisciplines(): void
    {
        $training = $this->training(['user' => $this->currentUser]);
        $this->addParticipant($training, $this->currentUser);
        $this->trainingRepository->method('findById')->willReturn($training);
        $this->disciplineRepository->expects($this->never())->method('delete');
        $this->disciplineRepository->expects($this->never())->method('save');
        $this->trainingRepository->expects($this->once())->method('save')->with($training);

        $this->assertSame($training->id, $this->service->update($training->id, self::trainingDto([], [$this->currentUser->id])));
    }

    final public function testUpdateRejectsAddingNonFriend(): void
    {
        $training = $this->training(['user' => $this->currentUser]);
        $this->addParticipant($training, $this->currentUser);
        $stranger = self::user();
        $this->trainingRepository->method('findById')->willReturn($training);
        $this->userRepository->method('findById')->willReturn($stranger);
        $this->friendRepository->method('isFriend')->willReturn(false);
        $this->participantRepository->expects($this->never())->method('save');
        $this->trainingRepository->expects($this->never())->method('save');

        try {
            $this->service->update($training->id, self::trainingDto([], [$stranger->id]));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not friend.', $e->getMessage());
        }
    }

    final public function testUpdatePropagatesNotFound(): void
    {
        $this->trainingRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->trainingRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update(Uuid::v7(), self::trainingDto([], []));
    }

    public static function participantCounts(): iterable
    {
        yield 'no participants' => [0];
        yield 'one participant' => [1];
        yield 'several participants' => [3];
    }

    #[DataProvider('participantCounts')]
    final public function testUpdateStatusSavesStatusAndNotifiesEveryParticipant(int $count): void
    {
        $training = $this->training(['title' => 'Swim', 'link' => 'swim', 'status' => ElementStatusEnum::Active]);
        $expected = [];

        for ($i = 0; $i < $count; ++$i) {
            $user = $this->addParticipant($training, self::user())->user;
            $expected[] = ['notification', $user, NotificationTypeEnum::TrainingStatus, 'Swim', '/trainings/swim'];
        }

        $dto = new ElementStatusDto();
        $dto->status = ElementStatusEnum::Rejected;
        $this->trainingRepository->expects($this->once())->method('findById')->with($training->id)->willReturn($training);
        $this->trainingRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Training $saved): bool => $saved === $training && ElementStatusEnum::Rejected === $saved->status));

        $this->assertSame($training->id, $this->service->updateStatus($training->id, $dto));
        $this->assertEvents($expected);
    }

    final public function testUpdateStatusPropagatesNotFound(): void
    {
        $dto = new ElementStatusDto();
        $dto->status = ElementStatusEnum::Active;
        $this->trainingRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->trainingRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateStatus(Uuid::v7(), $dto);
    }

    public static function deletableParticipants(): iterable
    {
        yield 'no participants' => [false];
        yield 'only current user' => [true];
    }

    #[DataProvider('deletableParticipants')]
    final public function testDeleteTrainingWithoutOtherParticipants(bool $withCurrentUser): void
    {
        $training = $this->training(['user' => $this->currentUser]);

        if ($withCurrentUser) {
            $this->addParticipant($training, $this->currentUser);
        }

        $this->trainingRepository->expects($this->once())->method('findById')->with($training->id)->willReturn($training);
        $this->trainingRepository->expects($this->once())->method('delete')->with($training);

        $this->assertSame($training->id, $this->service->delete($training->id));
    }

    final public function testDeleteRejectsTrainingWithOtherParticipants(): void
    {
        $training = $this->training(['user' => $this->currentUser]);
        $this->addParticipant($training, $this->currentUser);
        $this->addParticipant($training, self::user());
        $this->trainingRepository->method('findById')->willReturn($training);
        $this->trainingRepository->expects($this->never())->method('delete');

        $this->expectException(ValidatorException::class);
        $this->expectExceptionMessage('Cannot delete training with participants.');

        $this->service->delete($training->id);
    }

    final public function testDeletePropagatesNotFound(): void
    {
        $this->trainingRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->trainingRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(Uuid::v7());
    }

    final public function testIndexDelegatesToRepository(): void
    {
        $dto = new TrainingIndexDto();
        $window = self::window([$this->training()]);
        $this->trainingRepository->expects($this->once())->method('findTrainings')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $training = $this->training();
        $this->trainingRepository->expects($this->once())->method('findById')->with($training->id)->willReturn($training);

        $this->assertSame($training, $this->service->details($training->id));
    }

    final public function testDetailsPropagatesNotFound(): void
    {
        $this->trainingRepository->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(Uuid::v7());
    }

    final public function testUpdateParticipantStatusSavesStatusAndNotifiesParticipant(): void
    {
        $training = $this->training(['title' => 'Ride', 'link' => 'ride']);
        $participant = self::entity(TrainingParticipantFactory::make(['training' => $training, 'status' => SaveStatusEnum::Pending]));
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->participantRepository->expects($this->once())
            ->method('findById')
            ->with($participant->id)
            ->willReturn($participant);
        $this->participantRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (TrainingParticipant $saved): bool => $saved === $participant && SaveStatusEnum::Accepted === $saved->status));

        $this->assertSame($participant->id, $this->service->updateParticipantStatus($participant->id, $dto));
        $this->assertEvents([
            ['notification', $participant->user, NotificationTypeEnum::TrainingParticipantStatus, 'Ride', '/trainings/ride'],
        ]);
    }

    final public function testUpdateParticipantStatusPropagatesNotFound(): void
    {
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->participantRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->participantRepository->expects($this->never())->method('save');

        try {
            $this->service->updateParticipantStatus(Uuid::v7(), $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    /**
     * @param TrainingDisciplineDto[] $disciplines
     * @param Uuid[]                  $userIds
     */
    private static function trainingDto(array $disciplines, array $userIds): TrainingDto
    {
        $dto = new TrainingDto();
        $dto->startedAt = new DateTimeImmutable('2026-05-01 07:00:00');
        $dto->endedAt = new DateTimeImmutable('2026-05-01 08:00:00');
        $dto->title = 'Morning run';
        $dto->description = 'Easy pace';
        $dto->link = 'morning-run';
        $dto->location = 'Warsaw';
        $dto->disciplines = $disciplines;
        $dto->userIds = $userIds;

        return $dto;
    }

    /** @param TrainingDisciplineDistanceDto[] $distances */
    private static function disciplineDto(DisciplineEnum $discipline, array $distances): TrainingDisciplineDto
    {
        $dto = new TrainingDisciplineDto();
        $dto->discipline = $discipline;
        $dto->distances = $distances;

        return $dto;
    }

    /** @param TrainingDisciplineSubDistanceDto[] $subDistances */
    private static function distanceDto(int $distance, int $time, array $subDistances = []): TrainingDisciplineDistanceDto
    {
        $dto = new TrainingDisciplineDistanceDto();
        $dto->distance = $distance;
        $dto->time = $time;
        $dto->subDistances = $subDistances;

        return $dto;
    }

    private static function subDistanceDto(
        int $subDistance,
        int $time,
        ?int $lat = null,
        ?int $lng = null,
        ?int $accuracy = null,
        ?int $speed = null,
    ): TrainingDisciplineSubDistanceDto {
        $dto = new TrainingDisciplineSubDistanceDto();
        $dto->subDistance = $subDistance;
        $dto->time = $time;
        $dto->lat = $lat;
        $dto->lng = $lng;
        $dto->accuracy = $accuracy;
        $dto->speed = $speed;

        return $dto;
    }

    private function training(array $overrides = []): Training
    {
        $training = self::entity(TrainingFactory::make($overrides));
        $training->disciplines = new ArrayCollection();

        return $training;
    }

    private function addParticipant(Training $training, User $user): TrainingParticipant
    {
        $participant = self::entity(TrainingParticipantFactory::make(['training' => $training, 'user' => $user]));
        $training->participants->add($participant);

        return $participant;
    }

    /** @return ArrayObject<int, object> */
    private function captureSaves(MockObject $repository, int $count): ArrayObject
    {
        $saved = new ArrayObject();
        $repository->expects($this->exactly($count))
            ->method('save')
            ->willReturnCallback(static function (object $entity) use ($saved): void {
                $saved[] = $entity;
                self::persist()($entity);
            });

        return $saved;
    }

    /**
     * @param array<array{'processed', User, TrainingDisciplineDistance}|array{'notification', User, NotificationTypeEnum, string, ?string}> $expected
     */
    private function assertEvents(array $expected): void
    {
        $this->assertSame(
            $expected,
            array_map(
                static fn (object $event): array => match (true) {
                    $event instanceof TrainingProcessedEvent => ['processed', $event->getUser(), $event->getResult()],
                    $event instanceof NotificationEvent => ['notification', $event->getUser(), $event->getType(), $event->getText(), $event->getLink()],
                },
                $this->dispatched,
            ),
        );
    }
}
