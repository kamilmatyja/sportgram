<?php

declare(strict_types=1);

namespace Tests\Unit\EventSubscriber;

use App\Entity\{Feed, Goal, GoalParticipant, GoalParticipantResult, User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, NotificationTypeEnum, SaveStatusEnum};
use App\Event\{EventProcessedEvent, NotificationEvent, TrainingProcessedEvent};
use App\EventSubscriber\GoalProgressSubscriber;
use App\Repository\{FeedRepository, GoalParticipantRepository, GoalParticipantResultRepository, GoalRepository};
use DateTimeImmutable;
use Doctrine\ORM\Tools\Pagination\{Window, WindowPage};
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\{MockObject, Stub};
use PHPUnit\Framework\TestCase;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{
    EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventDisciplineResultFactory,
    GoalFactory,
    GoalParticipantFactory,
    TrainingDisciplineDistanceFactory,
    TrainingDisciplineFactory,
    UserFactory};

class GoalProgressSubscriberTest extends TestCase
{
    private const DisciplineEnum DISCIPLINE = DisciplineEnum::Running;

    private const int DISTANCE = 10000;

    private const int TIME = 3600;

    private GoalRepository&Stub $goalRepository;

    private GoalParticipantRepository&Stub $goalParticipantRepository;

    private GoalParticipantResultRepository&MockObject $goalParticipantResultRepository;

    private FeedRepository&MockObject $feedRepository;

    private EventDispatcherInterface&MockObject $eventDispatcher;

    private GoalProgressSubscriber $subscriber;

    private User $user;

    /** @var array<string, GoalParticipant> */
    private array $participants = [];

    /** @var array{0: Uuid, 1: DisciplineEnum, 2: DateTimeImmutable}[] */
    private array $goalQueries = [];

    protected function setUp(): void
    {
        $this->goalRepository = $this->createStub(GoalRepository::class);
        $this->goalParticipantRepository = $this->createStub(GoalParticipantRepository::class);
        $this->goalParticipantResultRepository = $this->createMock(GoalParticipantResultRepository::class);
        $this->feedRepository = $this->createMock(FeedRepository::class);
        $this->eventDispatcher = $this->createMock(EventDispatcherInterface::class);

        $this->subscriber = new GoalProgressSubscriber(
            $this->goalRepository,
            $this->goalParticipantRepository,
            $this->goalParticipantResultRepository,
            $this->feedRepository,
            $this->eventDispatcher,
        );

        $this->user = UserFactory::make();
        $this->user->id = Uuid::v7();

        $this->goalParticipantRepository->method('findByUserId')
            ->willReturnCallback(function (Uuid $goalId, Uuid $userId): ?GoalParticipant {
                $this->assertTrue($userId->equals($this->user->id));

                return $this->participants[$goalId->toRfc4122()] ?? null;
            });
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testSubscribesToProcessedEvents(): void
    {
        $this->assertSame(
            [
                TrainingProcessedEvent::class => 'onTrainingProcessed',
                EventProcessedEvent::class => 'onEventProcessed',
            ],
            GoalProgressSubscriber::getSubscribedEvents(),
        );
    }

    #[DataProvider('handlerProvider')]
    final public function testLooksUpActiveGoalsForUserDisciplineAndCurrentDate(string $handler): void
    {
        $this->givenGoals([]);
        $this->feedRepository->expects($this->never())->method('save');
        $this->goalParticipantResultRepository->expects($this->never())->method('save');
        $this->eventDispatcher->expects($this->never())->method('dispatch');

        $before = new DateTimeImmutable();
        $this->handle($handler);
        $after = new DateTimeImmutable();

        $this->assertCount(1, $this->goalQueries);
        [$userId, $discipline, $date] = $this->goalQueries[0];
        $this->assertTrue($userId->equals($this->user->id));
        $this->assertSame(self::DISCIPLINE, $discipline);
        $this->assertGreaterThanOrEqual($before, $date);
        $this->assertLessThanOrEqual($after, $date);
    }

    #[DataProvider('handlerProvider')]
    final public function testRecordsResultForParticipatedGoal(string $handler): void
    {
        $goal = $this->goal('Run 10k', 'run-10k', null);
        $participant = $this->participate($goal);
        $this->givenGoals([$goal]);

        $savedFeeds = [];
        $this->feedRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(function (Feed $feed) use (&$savedFeeds): void {
                $savedFeeds[] = $feed;
            });
        $this->goalParticipantResultRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(function (GoalParticipantResult $result) use ($participant, &$savedFeeds): bool {
                $this->assertSame($participant, $result->goalParticipant);
                $this->assertSame($savedFeeds[0], $result->feed);
                $this->assertSame(self::DISTANCE, $result->distance);
                $this->assertSame(self::TIME, $result->time);
                $this->assertSame(SaveStatusEnum::Pending, $result->status);

                return true;
            }));
        $this->eventDispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(function (NotificationEvent $event): bool {
                $this->assertSame($this->user, $event->getUser());
                $this->assertSame(NotificationTypeEnum::GoalResult, $event->getType());
                $this->assertSame('/goals/run-10k', $event->getLink());

                return true;
            }))
            ->willReturnArgument(0);

        $this->handle($handler);

        $this->assertSame($this->user, $savedFeeds[0]->user);
        $this->assertNull($savedFeeds[0]->text);
        $this->assertNull($savedFeeds[0]->photo);
        $this->assertSame(ElementStatusEnum::Draft, $savedFeeds[0]->status);
    }

    #[DataProvider('handlerProvider')]
    final public function testOnlyRecordsGoalsWithinTimeLimitAndWithParticipation(string $handler): void
    {
        $tooSlow = $this->goal('Too slow', 'too-slow', self::TIME - 1);
        $exactLimit = $this->goal('Exact', 'exact', self::TIME);
        $noLimit = $this->goal('No limit', 'no-limit', null);
        $notParticipating = $this->goal('Other', 'other', null);
        $this->participate($tooSlow);
        $this->participate($exactLimit);
        $this->participate($noLimit);
        $this->givenGoals([$tooSlow, $exactLimit, $noLimit, $notParticipating]);

        $this->feedRepository->expects($this->exactly(2))->method('save');
        $this->goalParticipantResultRepository->expects($this->exactly(2))->method('save');
        $links = [];
        $this->eventDispatcher->expects($this->exactly(2))
            ->method('dispatch')
            ->willReturnCallback(function (NotificationEvent $event) use (&$links): NotificationEvent {
                $links[] = $event->getLink();

                return $event;
            });

        $this->handle($handler);

        $this->assertSame(['/goals/exact', '/goals/no-limit'], $links);
    }

    #[DataProvider('handlerProvider')]
    final public function testZeroTimeLimitIsTreatedAsNoLimit(string $handler): void
    {
        $goal = $this->goal('Zero', 'zero', 0);
        $this->participate($goal);
        $this->givenGoals([$goal]);

        $this->feedRepository->expects($this->once())->method('save');
        $this->goalParticipantResultRepository->expects($this->once())->method('save');
        $this->eventDispatcher->expects($this->once())->method('dispatch')->willReturnArgument(0);

        $this->handle($handler);
    }

    public static function handlerProvider(): iterable
    {
        yield 'training processed' => ['training'];
        yield 'event processed' => ['event'];
    }

    private function handle(string $handler): void
    {
        if ('training' === $handler) {
            $result = TrainingDisciplineDistanceFactory::make([
                'trainingDiscipline' => TrainingDisciplineFactory::make(['discipline' => self::DISCIPLINE]),
                'distance' => self::DISTANCE,
                'time' => self::TIME,
            ]);

            $this->subscriber->onTrainingProcessed(new TrainingProcessedEvent($this->user, $result));

            return;
        }

        $result = EventDisciplineResultFactory::make([
            'eventDisciplineList' => EventDisciplineListFactory::make([
                'user' => $this->user,
                'eventDisciplineDistance' => EventDisciplineDistanceFactory::make([
                    'eventDiscipline' => EventDisciplineFactory::make(['discipline' => self::DISCIPLINE]),
                    'distance' => self::DISTANCE,
                ]),
            ]),
            'user' => $this->user,
            'time' => self::TIME,
        ]);

        $this->subscriber->onEventProcessed(new EventProcessedEvent($result));
    }

    /** @param Goal[] $goals */
    private function givenGoals(array $goals): void
    {
        $this->goalRepository->method('findActiveByDiscipline')
            ->willReturnCallback(function (Uuid $userId, DisciplineEnum $discipline, DateTimeImmutable $date) use ($goals): WindowPage {
                $this->goalQueries[] = [$userId, $discipline, $date];

                return new WindowPage($goals, count($goals), new Window(0, PHP_INT_MAX));
            });
    }

    private function goal(string $text, string $link, ?int $time): Goal
    {
        $goal = GoalFactory::make(['text' => $text, 'link' => $link, 'time' => $time, 'discipline' => self::DISCIPLINE]);
        $goal->id = Uuid::v7();

        return $goal;
    }

    private function participate(Goal $goal): GoalParticipant
    {
        $participant = GoalParticipantFactory::make(['goal' => $goal, 'user' => $this->user]);
        $this->participants[$goal->id->toRfc4122()] = $participant;

        return $participant;
    }
}
