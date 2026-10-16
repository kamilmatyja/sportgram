<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{GoalDto, GoalIndexDto, GoalStatusDto, SaveStatusDto};
use App\Entity\{Goal, GoalParticipant, GoalParticipantResult, User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, GoalStatusEnum, NotificationTypeEnum, SaveStatusEnum};
use App\Repository\{FeedRepository,
    FriendRepository,
    GoalParticipantRepository,
    GoalParticipantResultRepository,
    GoalRepository,
    UserRepository};
use App\Service\GoalService;
use ArrayObject;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory};

#[AllowMockObjectsWithoutExpectations]
class GoalServiceTest extends ServiceTestCase
{
    private GoalRepository&MockObject $goalRepository;

    private GoalParticipantRepository&MockObject $goalParticipantRepository;

    private GoalParticipantResultRepository&MockObject $goalParticipantResultRepository;

    private UserRepository&MockObject $userRepository;

    private FriendRepository&MockObject $friendRepository;

    private FeedRepository&MockObject $feedRepository;

    private User $currentUser;

    private GoalService $service;

    protected function setUp(): void
    {
        $this->goalRepository = $this->createMock(GoalRepository::class);
        $this->goalParticipantRepository = $this->createMock(GoalParticipantRepository::class);
        $this->goalParticipantResultRepository = $this->createMock(GoalParticipantResultRepository::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->friendRepository = $this->createMock(FriendRepository::class);
        $this->feedRepository = $this->createMock(FeedRepository::class);
        $this->currentUser = self::user();

        $this->service = new GoalService(
            $this->goalRepository,
            $this->goalParticipantRepository,
            $this->goalParticipantResultRepository,
            $this->userRepository,
            $this->friendRepository,
            $this->feedRepository,
            $this->dispatcher(),
            $this->security($this->currentUser),
        );
    }

    final public function testCreateSavesFeedGoalAndParticipantsAndNotifiesThem(): void
    {
        $friend = self::user();
        $dto = self::goalDto([$friend->id]);
        $feeds = $this->captureSaves($this->feedRepository, 1);
        $goals = $this->captureSaves($this->goalRepository, 1);
        $participants = $this->captureSaves($this->goalParticipantRepository, 2);
        $this->userRepository->expects($this->exactly(2))
            ->method('findById')
            ->willReturnMap([[$friend->id, $friend], [$this->currentUser->id, $this->currentUser]]);
        $this->friendRepository->method('isFriend')->willReturnMap([
            [$this->currentUser->id, $friend->id, true],
            [$this->currentUser->id, $this->currentUser->id, false],
        ]);

        $id = $this->service->create($dto);

        [$feed] = $feeds->getArrayCopy();
        $this->assertSame($this->currentUser, $feed->user);
        $this->assertNull($feed->text);
        $this->assertNull($feed->photo);
        $this->assertSame(ElementStatusEnum::Draft, $feed->status);

        [$goal] = $goals->getArrayCopy();
        $this->assertSame($goal->id, $id);
        $this->assertSame($feed, $goal->feed);
        $this->assertSame($this->currentUser, $goal->user);
        $this->assertSame($dto->startedAt, $goal->startedAt);
        $this->assertSame($dto->endedAt, $goal->endedAt);
        $this->assertSame('Run 100 km', $goal->text);
        $this->assertSame('run-100', $goal->link);
        $this->assertSame(DisciplineEnum::Running, $goal->discipline);
        $this->assertSame(100000, $goal->distance);
        $this->assertSame(36000, $goal->time);
        $this->assertSame(GoalStatusEnum::Active, $goal->status);

        $this->assertSame(
            [[$goal, $friend, SaveStatusEnum::Pending], [$goal, $this->currentUser, SaveStatusEnum::Accepted]],
            array_map(
                static fn (GoalParticipant $p): array => [$p->goal, $p->user, $p->status],
                $participants->getArrayCopy(),
            ),
        );
        $this->assertNotifications([
            [$friend, NotificationTypeEnum::GoalParticipant, 'Run 100 km', '/goals/run-100'],
            [$this->currentUser, NotificationTypeEnum::GoalParticipant, 'Run 100 km', '/goals/run-100'],
        ]);
    }

    final public function testCreateDoesNotDuplicateCurrentUserAlreadyInUserIds(): void
    {
        $dto = self::goalDto([$this->currentUser->id]);
        $this->captureSaves($this->goalRepository, 1);
        $participants = $this->captureSaves($this->goalParticipantRepository, 1);
        $this->userRepository->expects($this->once())
            ->method('findById')
            ->with($this->currentUser->id)
            ->willReturn($this->currentUser);

        $this->service->create($dto);

        $this->assertSame([$this->currentUser->id], $dto->userIds);
        $this->assertSame(SaveStatusEnum::Accepted, $participants[0]->status);
        $this->assertNotifications([
            [$this->currentUser, NotificationTypeEnum::GoalParticipant, 'Run 100 km', '/goals/run-100'],
        ]);
    }

    final public function testCreateWithoutTimesAndTime(): void
    {
        $dto = self::goalDto([]);
        $dto->startedAt = null;
        $dto->endedAt = null;
        $dto->time = null;
        $goals = $this->captureSaves($this->goalRepository, 1);
        $this->userRepository->method('findById')->willReturn($this->currentUser);

        $this->service->create($dto);

        $this->assertNull($goals[0]->startedAt);
        $this->assertNull($goals[0]->endedAt);
        $this->assertNull($goals[0]->time);
    }

    final public function testCreateRejectsNonFriendParticipant(): void
    {
        $stranger = self::user();
        $dto = self::goalDto([$stranger->id]);
        $this->captureSaves($this->goalRepository, 1);
        $this->userRepository->expects($this->once())->method('findById')->with($stranger->id)->willReturn($stranger);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $stranger->id)
            ->willReturn(false);
        $this->goalParticipantRepository->expects($this->never())->method('save');

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
        $dto = self::goalDto([Uuid::v4()]);
        $this->captureSaves($this->goalRepository, 1);
        $this->userRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->goalParticipantRepository->expects($this->never())->method('save');

        try {
            $this->service->create($dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateChangesFieldsAndSyncsParticipants(): void
    {
        $goal = self::entity(GoalFactory::make(['user' => $this->currentUser]));
        $owner = $this->addParticipant($goal, $this->currentUser);
        $kept = $this->addParticipant($goal, self::user());
        $removed = $this->addParticipant($goal, self::user());
        $added = self::user();
        $dto = self::goalDto([$kept->user->id, $added->id]);
        $this->goalRepository->expects($this->once())->method('findById')->with($goal->id)->willReturn($goal);
        $this->goalParticipantRepository->expects($this->once())->method('delete')->with($removed);
        $this->userRepository->expects($this->once())->method('findById')->with($added->id)->willReturn($added);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $added->id)
            ->willReturn(true);
        $saved = $this->captureSaves($this->goalParticipantRepository, 1);
        $this->goalRepository->expects($this->once())->method('save')->with($goal);

        $this->assertSame($goal->id, $this->service->update($goal->id, $dto));

        $this->assertSame($dto->startedAt, $goal->startedAt);
        $this->assertSame($dto->endedAt, $goal->endedAt);
        $this->assertSame('Run 100 km', $goal->text);
        $this->assertSame('run-100', $goal->link);
        $this->assertSame(DisciplineEnum::Running, $goal->discipline);
        $this->assertSame(100000, $goal->distance);
        $this->assertSame(36000, $goal->time);
        $this->assertSame($goal, $saved[0]->goal);
        $this->assertSame($added, $saved[0]->user);
        $this->assertSame(SaveStatusEnum::Pending, $saved[0]->status);
        $this->assertContains($owner, $goal->participants);
        $this->assertNotifications([[$added, NotificationTypeEnum::GoalParticipant, $goal->text, '/goals/' . $goal->link]]);
    }

    final public function testUpdateWithUnchangedParticipantsSavesOnlyGoal(): void
    {
        $goal = self::entity(GoalFactory::make(['user' => $this->currentUser]));
        $this->addParticipant($goal, $this->currentUser);
        $friend = $this->addParticipant($goal, self::user());
        $this->goalRepository->method('findById')->willReturn($goal);
        $this->goalParticipantRepository->expects($this->never())->method('delete');
        $this->goalParticipantRepository->expects($this->never())->method('save');
        $this->userRepository->expects($this->never())->method('findById');
        $this->goalRepository->expects($this->once())->method('save')->with($goal);

        $this->assertSame($goal->id, $this->service->update($goal->id, self::goalDto([$friend->user->id])));
    }

    final public function testUpdateRejectsRemovingParticipantWithResults(): void
    {
        $goal = self::entity(GoalFactory::make(['user' => $this->currentUser]));
        $this->addParticipant($goal, $this->currentUser);
        $withResults = $this->addParticipant($goal, self::user());
        $withResults->results->add(self::entity(GoalParticipantResultFactory::make(['goalParticipant' => $withResults])));
        $this->goalRepository->method('findById')->willReturn($goal);
        $this->goalParticipantRepository->expects($this->never())->method('delete');
        $this->goalRepository->expects($this->never())->method('save');

        try {
            $this->service->update($goal->id, self::goalDto([]));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('Cannot delete goal participant with results.', $e->getMessage());
        }
    }

    final public function testUpdateRejectsAddingNonFriend(): void
    {
        $goal = self::entity(GoalFactory::make(['user' => $this->currentUser]));
        $this->addParticipant($goal, $this->currentUser);
        $stranger = self::user();
        $this->goalRepository->method('findById')->willReturn($goal);
        $this->userRepository->method('findById')->willReturn($stranger);
        $this->friendRepository->method('isFriend')->willReturn(false);
        $this->goalParticipantRepository->expects($this->never())->method('save');
        $this->goalRepository->expects($this->never())->method('save');

        try {
            $this->service->update($goal->id, self::goalDto([$stranger->id]));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not friend.', $e->getMessage());
        }
    }

    final public function testUpdatePropagatesNotFound(): void
    {
        $this->goalRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->goalRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update(Uuid::v4(), self::goalDto([]));
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
        $goal = self::entity(GoalFactory::make(['text' => 'Swim', 'link' => 'swim', 'status' => GoalStatusEnum::Active]));
        $expected = [];

        for ($i = 0; $i < $count; ++$i) {
            $user = $this->addParticipant($goal, self::user())->user;
            $expected[] = [$user, NotificationTypeEnum::GoalStatus, 'Swim', '/goals/swim'];
        }

        $dto = new GoalStatusDto();
        $dto->status = GoalStatusEnum::Completed;
        $this->goalRepository->expects($this->once())->method('findById')->with($goal->id)->willReturn($goal);
        $this->goalRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Goal $saved): bool => $saved === $goal && GoalStatusEnum::Completed === $saved->status));

        $this->assertSame($goal->id, $this->service->updateStatus($goal->id, $dto));
        $this->assertNotifications($expected);
    }

    final public function testUpdateStatusPropagatesNotFound(): void
    {
        $dto = new GoalStatusDto();
        $dto->status = GoalStatusEnum::Completed;
        $this->goalRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->goalRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateStatus(Uuid::v4(), $dto);
    }

    #[DataProvider('participantCounts')]
    final public function testDeleteGoalWithoutResults(int $count): void
    {
        $goal = self::entity(GoalFactory::make());

        for ($i = 0; $i < $count; ++$i) {
            $this->addParticipant($goal, self::user());
        }

        $this->goalRepository->expects($this->once())->method('findById')->with($goal->id)->willReturn($goal);
        $this->goalRepository->expects($this->once())->method('delete')->with($goal);

        $this->assertSame($goal->id, $this->service->delete($goal->id));
    }

    final public function testDeleteRejectsGoalWithParticipantResults(): void
    {
        $goal = self::entity(GoalFactory::make());
        $this->addParticipant($goal, self::user());
        $participant = $this->addParticipant($goal, self::user());
        $participant->results->add(self::entity(GoalParticipantResultFactory::make(['goalParticipant' => $participant])));
        $this->goalRepository->method('findById')->willReturn($goal);
        $this->goalRepository->expects($this->never())->method('delete');

        $this->expectException(ValidatorException::class);
        $this->expectExceptionMessage('Cannot delete goal with participant results.');

        $this->service->delete($goal->id);
    }

    final public function testDeletePropagatesNotFound(): void
    {
        $this->goalRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->goalRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(Uuid::v4());
    }

    final public function testIndexDelegatesToRepository(): void
    {
        $dto = new GoalIndexDto();
        $window = self::window([self::entity(GoalFactory::make())]);
        $this->goalRepository->expects($this->once())->method('findGoals')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $goal = self::entity(GoalFactory::make());
        $this->goalRepository->expects($this->once())->method('findById')->with($goal->id)->willReturn($goal);

        $this->assertSame($goal, $this->service->details($goal->id));
    }

    final public function testDetailsPropagatesNotFound(): void
    {
        $this->goalRepository->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(Uuid::v4());
    }

    final public function testUpdateParticipantStatusSavesStatusAndNotifiesParticipant(): void
    {
        $goal = self::entity(GoalFactory::make(['text' => 'Ride', 'link' => 'ride']));
        $participant = self::entity(GoalParticipantFactory::make(['goal' => $goal, 'status' => SaveStatusEnum::Pending]));
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->goalParticipantRepository->expects($this->once())
            ->method('findById')
            ->with($participant->id)
            ->willReturn($participant);
        $this->goalParticipantRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (GoalParticipant $saved): bool => $saved === $participant && SaveStatusEnum::Accepted === $saved->status));

        $this->assertSame($participant->id, $this->service->updateParticipantStatus($participant->id, $dto));
        $this->assertNotifications([[$participant->user, NotificationTypeEnum::GoalParticipantStatus, 'Ride', '/goals/ride']]);
    }

    final public function testUpdateParticipantStatusPropagatesNotFound(): void
    {
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->goalParticipantRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->goalParticipantRepository->expects($this->never())->method('save');

        try {
            $this->service->updateParticipantStatus(Uuid::v4(), $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateParticipantResultStatusSavesStatusAndNotifiesParticipant(): void
    {
        $goal = self::entity(GoalFactory::make(['text' => 'Ski', 'link' => 'ski']));
        $participant = self::entity(GoalParticipantFactory::make(['goal' => $goal]));
        $result = self::entity(GoalParticipantResultFactory::make([
            'goalParticipant' => $participant,
            'status' => SaveStatusEnum::Pending,
        ]));
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Rejected;
        $this->goalParticipantResultRepository->expects($this->once())
            ->method('findById')
            ->with($result->id)
            ->willReturn($result);
        $this->goalParticipantResultRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (GoalParticipantResult $saved): bool => $saved === $result && SaveStatusEnum::Rejected === $saved->status));

        $this->assertSame($result->id, $this->service->updateParticipantResultStatus($result->id, $dto));
        $this->assertNotifications([[$participant->user, NotificationTypeEnum::GoalResultStatus, 'Ski', '/goals/ski']]);
    }

    final public function testUpdateParticipantResultStatusPropagatesNotFound(): void
    {
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->goalParticipantResultRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->goalParticipantResultRepository->expects($this->never())->method('save');

        try {
            $this->service->updateParticipantResultStatus(Uuid::v4(), $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    /** @param Uuid[] $userIds */
    private static function goalDto(array $userIds): GoalDto
    {
        $dto = new GoalDto();
        $dto->startedAt = new DateTimeImmutable('2026-01-01 00:00:00');
        $dto->endedAt = new DateTimeImmutable('2026-12-31 23:59:59');
        $dto->text = 'Run 100 km';
        $dto->link = 'run-100';
        $dto->discipline = DisciplineEnum::Running;
        $dto->distance = 100000;
        $dto->time = 36000;
        $dto->userIds = $userIds;

        return $dto;
    }

    private function addParticipant(Goal $goal, User $user): GoalParticipant
    {
        $participant = self::entity(GoalParticipantFactory::make(['goal' => $goal, 'user' => $user]));
        $goal->participants->add($participant);

        return $participant;
    }

    /**
     * @return ArrayObject<int, object>
     */
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
}
