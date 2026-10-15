<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{ElementStatusDto,
    EventDisciplineDistanceDto,
    EventDisciplineDto,
    EventDisciplineSubDistanceDto,
    EventDto,
    EventIndexDto,
    EventListIndexDto,
    EventResultDto,
    EventSubResultDto,
    SaveStatusDto};
use App\Entity\{Event,
    EventDiscipline,
    EventDisciplineDistance,
    EventDisciplineList,
    EventDisciplineResult,
    EventDisciplineSubDistance,
    EventDisciplineSubResult,
    User};
use App\Enum\{DisciplineEnum, ElementStatusEnum, NotificationTypeEnum, SaveStatusEnum};
use App\Event\{EventProcessedEvent, NotificationEvent};
use App\Repository\{EventDisciplineDistanceRepository,
    EventDisciplineListRepository,
    EventDisciplineRepository,
    EventDisciplineResultRepository,
    EventDisciplineSubDistanceRepository,
    EventDisciplineSubResultRepository,
    EventRepository,
    FeedRepository,
    PageRepository};
use App\Service\EventService;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventDisciplineResultFactory,
    EventDisciplineSubDistanceFactory,
    EventDisciplineSubResultFactory,
    EventFactory,
    PageFactory,
    PageFollowFactory,
    PageParticipantFactory,
    UserFactory};

#[AllowMockObjectsWithoutExpectations]
class EventServiceTest extends ServiceTestCase
{
    private const string PHOTO = 'cGhvdG8=';

    private EventRepository&MockObject $eventRepository;

    private EventDisciplineRepository&MockObject $eventDisciplineRepository;

    private EventDisciplineDistanceRepository&MockObject $eventDisciplineDistanceRepository;

    private EventDisciplineSubDistanceRepository&MockObject $eventDisciplineSubDistanceRepository;

    private EventDisciplineListRepository&MockObject $eventDisciplineListRepository;

    private EventDisciplineResultRepository&MockObject $eventDisciplineResultRepository;

    private EventDisciplineSubResultRepository&MockObject $eventDisciplineSubResultRepository;

    private FeedRepository&MockObject $feedRepository;

    private PageRepository&MockObject $pageRepository;

    private User $currentUser;

    private EventService $service;

    protected function setUp(): void
    {
        $this->eventRepository = $this->createMock(EventRepository::class);
        $this->eventDisciplineRepository = $this->createMock(EventDisciplineRepository::class);
        $this->eventDisciplineDistanceRepository = $this->createMock(EventDisciplineDistanceRepository::class);
        $this->eventDisciplineSubDistanceRepository = $this->createMock(EventDisciplineSubDistanceRepository::class);
        $this->eventDisciplineListRepository = $this->createMock(EventDisciplineListRepository::class);
        $this->eventDisciplineResultRepository = $this->createMock(EventDisciplineResultRepository::class);
        $this->eventDisciplineSubResultRepository = $this->createMock(EventDisciplineSubResultRepository::class);
        $this->feedRepository = $this->createMock(FeedRepository::class);
        $this->pageRepository = $this->createMock(PageRepository::class);
        $this->currentUser = self::entity(UserFactory::make(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'link' => 'jan']));

        $this->service = new EventService(
            $this->eventRepository,
            $this->eventDisciplineRepository,
            $this->eventDisciplineDistanceRepository,
            $this->eventDisciplineSubDistanceRepository,
            $this->eventDisciplineListRepository,
            $this->eventDisciplineResultRepository,
            $this->eventDisciplineSubResultRepository,
            $this->feedRepository,
            $this->pageRepository,
            $this->dispatcher(),
            $this->security($this->currentUser),
        );
    }

    final public function testCreateSavesEventWithDisciplinesAndNotifiesFollowers(): void
    {
        $page = self::entity(PageFactory::make());
        $otherParticipant = self::entity(PageParticipantFactory::make(['page' => $page, 'user' => self::user()]));
        $ownParticipant = self::entity(PageParticipantFactory::make(['page' => $page, 'user' => $this->currentUser]));
        $page->participants->add($otherParticipant);
        $page->participants->add($ownParticipant);
        $follower1 = self::user();
        $follower2 = self::user();
        $page->follows->add(self::entity(PageFollowFactory::make(['page' => $page, 'user' => $follower1])));
        $page->follows->add(self::entity(PageFollowFactory::make(['page' => $page, 'user' => $follower2])));
        $dto = self::eventDto([
            [DisciplineEnum::Running, [[10000, [5000, 2500]], [5000, []]]],
            [DisciplineEnum::Cycling, []],
        ]);
        $this->pageRepository->expects($this->once())->method('findById')->with($page->id)->willReturn($page);
        $feeds = $events = $disciplines = $distances = $subDistances = [];
        $this->expectSaves($this->feedRepository, 1, $feeds);
        $this->expectSaves($this->eventRepository, 1, $events);
        $this->expectSaves($this->eventDisciplineRepository, 2, $disciplines);
        $this->expectSaves($this->eventDisciplineDistanceRepository, 2, $distances);
        $this->expectSaves($this->eventDisciplineSubDistanceRepository, 2, $subDistances);

        $id = $this->service->create($page->id, $dto);

        [$feed] = $feeds;
        $this->assertSame($this->currentUser, $feed->user);
        $this->assertNull($feed->text);
        $this->assertNull($feed->photo);
        $this->assertSame(ElementStatusEnum::Draft, $feed->status);
        [$event] = $events;
        $this->assertInstanceOf(Event::class, $event);
        $this->assertNotNull($id);
        $this->assertSame($event->id, $id);
        $this->assertSame($ownParticipant, $event->pageParticipant);
        $this->assertEventMatchesDto($dto, $event);
        $this->assertSame(ElementStatusEnum::Active, $event->status);

        $this->assertSame(
            [[$event, DisciplineEnum::Running], [$event, DisciplineEnum::Cycling]],
            array_map(static fn (EventDiscipline $d): array => [$d->event, $d->discipline], $disciplines),
        );
        $this->assertSame(
            [[$disciplines[0], 10000], [$disciplines[0], 5000]],
            array_map(static fn (EventDisciplineDistance $d): array => [$d->eventDiscipline, $d->distance], $distances),
        );
        $this->assertSame(
            [[$distances[0], 5000], [$distances[0], 2500]],
            array_map(static fn (EventDisciplineSubDistance $d): array => [$d->eventDisciplineDistance, $d->subDistance], $subDistances),
        );

        $link = '/events/' . $dto->link;
        $this->assertNotifications([
            [$follower1, NotificationTypeEnum::Event, 'City Run', $link],
            [$follower2, NotificationTypeEnum::Event, 'City Run', $link],
        ]);
    }

    final public function testCreateWithoutDisciplinesAndFollowers(): void
    {
        $page = self::entity(PageFactory::make());
        $ownParticipant = self::entity(PageParticipantFactory::make(['page' => $page, 'user' => $this->currentUser]));
        $page->participants->add($ownParticipant);
        $dto = self::eventDto([]);
        $this->pageRepository->expects($this->once())->method('findById')->willReturn($page);
        $feeds = $events = [];
        $this->expectSaves($this->feedRepository, 1, $feeds);
        $this->expectSaves($this->eventRepository, 1, $events);
        $this->eventDisciplineRepository->expects($this->never())->method('save');
        $this->eventDisciplineDistanceRepository->expects($this->never())->method('save');
        $this->eventDisciplineSubDistanceRepository->expects($this->never())->method('save');

        $id = $this->service->create($page->id, $dto);

        $this->assertSame($events[0]->id, $id);
        $this->assertSame($ownParticipant, $events[0]->pageParticipant);
        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateFailsForUnknownPage(): void
    {
        $this->pageRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedRepository->expects($this->never())->method('save');
        $this->eventRepository->expects($this->never())->method('save');

        try {
            $this->service->create(self::user()->id, self::eventDto([]));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateRejectsUserWhoIsNotPageParticipant(): void
    {
        $page = self::entity(PageFactory::make());
        $page->participants->add(self::entity(PageParticipantFactory::make(['page' => $page, 'user' => self::user()])));
        $page->follows->add(self::entity(PageFollowFactory::make(['page' => $page, 'user' => self::user()])));
        $this->pageRepository->expects($this->once())->method('findById')->willReturn($page);
        $this->feedRepository->expects($this->once())->method('save');
        $this->eventRepository->expects($this->never())->method('save');

        try {
            $this->service->create($page->id, self::eventDto([]));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not page participant.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateReplacesFieldsAndDisciplines(): void
    {
        $event = self::eventEntity();
        $oldDiscipline1 = self::addDiscipline($event);
        $oldDistance1 = self::addDistance($oldDiscipline1);
        $oldSub1 = self::addSubDistance($oldDistance1);
        $oldSub2 = self::addSubDistance($oldDistance1);
        $oldDistance2 = self::addDistance($oldDiscipline1);
        $oldDiscipline2 = self::addDiscipline($event);
        $pageParticipant = $event->pageParticipant;
        $status = $event->status;
        $dto = self::eventDto([[DisciplineEnum::InlineSkating, [[21097, [10000]]]]]);
        $this->eventRepository->expects($this->once())->method('findById')->with($event->id)->willReturn($event);
        $deletedSubs = $deletedDistances = $deletedDisciplines = [];
        $this->expectDeletes($this->eventDisciplineSubDistanceRepository, $deletedSubs);
        $this->expectDeletes($this->eventDisciplineDistanceRepository, $deletedDistances);
        $this->expectDeletes($this->eventDisciplineRepository, $deletedDisciplines);
        $disciplines = $distances = $subDistances = [];
        $this->expectSaves($this->eventDisciplineRepository, 1, $disciplines);
        $this->expectSaves($this->eventDisciplineDistanceRepository, 1, $distances);
        $this->expectSaves($this->eventDisciplineSubDistanceRepository, 1, $subDistances);
        $this->eventRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Event $saved): bool => $saved === $event && 'City Run' === $saved->title));
        $this->feedRepository->expects($this->never())->method('save');

        $this->assertSame($event->id, $this->service->update($event->id, $dto));

        $this->assertEventMatchesDto($dto, $event);
        $this->assertSame($pageParticipant, $event->pageParticipant);
        $this->assertSame($status, $event->status);
        $this->assertSame([$oldSub1, $oldSub2], $deletedSubs);
        $this->assertSame([$oldDistance1, $oldDistance2], $deletedDistances);
        $this->assertSame([$oldDiscipline1, $oldDiscipline2], $deletedDisciplines);
        $this->assertSame($event, $disciplines[0]->event);
        $this->assertSame(DisciplineEnum::InlineSkating, $disciplines[0]->discipline);
        $this->assertSame($disciplines[0], $distances[0]->eventDiscipline);
        $this->assertSame(21097, $distances[0]->distance);
        $this->assertSame($distances[0], $subDistances[0]->eventDisciplineDistance);
        $this->assertSame(10000, $subDistances[0]->subDistance);
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateWithoutExistingOrNewDisciplines(): void
    {
        $event = self::eventEntity();
        $this->eventRepository->expects($this->once())->method('findById')->willReturn($event);
        $this->eventDisciplineRepository->expects($this->never())->method('delete');
        $this->eventDisciplineRepository->expects($this->never())->method('save');
        $this->eventRepository->expects($this->once())->method('save')->with($event);

        $this->assertSame($event->id, $this->service->update($event->id, self::eventDto([])));
        $this->assertSame('City Run', $event->title);
    }

    final public function testUpdateRejectsDistanceWithLists(): void
    {
        $event = self::eventEntity();
        $distance = self::addDistance(self::addDiscipline($event));
        self::addSubDistance($distance);
        $distance->lists->add(self::entity(EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance])));
        $this->eventRepository->expects($this->once())->method('findById')->willReturn($event);
        $this->eventRepository->expects($this->never())->method('save');
        $this->eventDisciplineSubDistanceRepository->expects($this->never())->method('delete');
        $this->eventDisciplineDistanceRepository->expects($this->never())->method('delete');
        $this->eventDisciplineRepository->expects($this->never())->method('delete');
        $this->eventDisciplineRepository->expects($this->never())->method('save');

        try {
            $this->service->update($event->id, self::eventDto([[DisciplineEnum::Running, []]]));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('Cannot delete event discipline distance with lists.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateRejectsListsAfterDeletingPrecedingDisciplines(): void
    {
        $event = self::eventEntity();
        $firstDiscipline = self::addDiscipline($event);
        $firstDistance = self::addDistance($firstDiscipline);
        $secondDistance = self::addDistance(self::addDiscipline($event));
        $secondDistance->lists->add(self::entity(EventDisciplineListFactory::make(['eventDisciplineDistance' => $secondDistance])));
        $this->eventRepository->expects($this->once())->method('findById')->willReturn($event);
        $this->eventRepository->expects($this->never())->method('save');
        $this->eventDisciplineDistanceRepository->expects($this->once())->method('delete')->with($firstDistance);
        $this->eventDisciplineRepository->expects($this->once())->method('delete')->with($firstDiscipline);
        $this->eventDisciplineRepository->expects($this->never())->method('save');

        $this->expectException(ValidatorException::class);
        $this->expectExceptionMessage('Cannot delete event discipline distance with lists.');

        $this->service->update($event->id, self::eventDto([]));
    }

    final public function testUpdateFailsForUnknownEvent(): void
    {
        $this->eventRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->eventRepository->expects($this->never())->method('save');
        $this->eventDisciplineRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update(self::user()->id, self::eventDto([[DisciplineEnum::Running, []]]));
    }

    #[DataProvider('elementStatuses')]
    final public function testUpdateStatusSavesStatusAndNotifiesOwner(ElementStatusEnum $status): void
    {
        $event = self::eventEntity();
        $dto = new ElementStatusDto();
        $dto->status = $status;
        $this->eventRepository->expects($this->once())->method('findById')->with($event->id)->willReturn($event);
        $this->eventRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Event $saved): bool => $saved === $event && $status === $saved->status));

        $this->assertSame($event->id, $this->service->updateStatus($event->id, $dto));
        $this->assertNotifications([[$event->pageParticipant->user, NotificationTypeEnum::EventStatus, 'City Run', '/events/city-run']]);
    }

    public static function elementStatuses(): iterable
    {
        foreach (ElementStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testUpdateStatusFailsForUnknownEvent(): void
    {
        $dto = new ElementStatusDto();
        $dto->status = ElementStatusEnum::Active;
        $this->eventRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->eventRepository->expects($this->never())->method('save');

        try {
            $this->service->updateStatus(self::user()->id, $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testDeleteEventWithoutLists(): void
    {
        $event = self::eventEntity();
        self::addSubDistance(self::addDistance(self::addDiscipline($event)));
        self::addDistance(self::addDiscipline($event));
        self::addDiscipline($event);
        $this->eventRepository->expects($this->once())->method('findById')->with($event->id)->willReturn($event);
        $this->eventRepository->expects($this->once())->method('delete')->with($event);

        $this->assertSame($event->id, $this->service->delete($event->id));
    }

    final public function testDeleteEventWithoutDisciplines(): void
    {
        $event = self::eventEntity();
        $this->eventRepository->expects($this->once())->method('findById')->willReturn($event);
        $this->eventRepository->expects($this->once())->method('delete')->with($event);

        $this->assertSame($event->id, $this->service->delete($event->id));
    }

    final public function testDeleteRejectsEventWithLists(): void
    {
        $event = self::eventEntity();
        self::addDistance(self::addDiscipline($event));
        $distance = self::addDistance(self::addDiscipline($event));
        $distance->lists->add(self::entity(EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance])));
        $this->eventRepository->expects($this->once())->method('findById')->willReturn($event);
        $this->eventRepository->expects($this->never())->method('delete');

        $this->expectException(ValidatorException::class);
        $this->expectExceptionMessage('Cannot delete event with lists.');

        $this->service->delete($event->id);
    }

    final public function testDeleteFailsForUnknownEvent(): void
    {
        $this->eventRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->eventRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(self::user()->id);
    }

    final public function testIndexDelegatesToRepository(): void
    {
        $dto = new EventIndexDto();
        $window = self::window([self::eventEntity()]);
        $this->eventRepository->expects($this->once())->method('findEvents')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $event = self::eventEntity();
        $this->eventRepository->expects($this->once())->method('findById')->with($event->id)->willReturn($event);

        $this->assertSame($event, $this->service->details($event->id));
    }

    final public function testDetailsFailsForUnknownEvent(): void
    {
        $this->eventRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(self::user()->id);
    }

    final public function testCreateListSavesPendingListAndNotifiesOwner(): void
    {
        $event = self::eventEntity();
        $distance = self::addDistance(self::addDiscipline($event));
        $this->eventDisciplineDistanceRepository->expects($this->once())->method('findById')->with($distance->id)->willReturn($distance);
        $feeds = $lists = [];
        $this->expectSaves($this->feedRepository, 1, $feeds);
        $this->expectSaves($this->eventDisciplineListRepository, 1, $lists);

        $id = $this->service->createList($distance->id);

        [$feed] = $feeds;
        $this->assertSame($this->currentUser, $feed->user);
        $this->assertNull($feed->text);
        $this->assertNull($feed->photo);
        $this->assertSame(ElementStatusEnum::Draft, $feed->status);
        [$list] = $lists;
        $this->assertInstanceOf(EventDisciplineList::class, $list);
        $this->assertNotNull($id);
        $this->assertSame($list->id, $id);
        $this->assertSame($distance, $list->eventDisciplineDistance);
        $this->assertSame($feed, $list->feed);
        $this->assertSame($this->currentUser, $list->user);
        $this->assertSame(SaveStatusEnum::Pending, $list->status);
        $this->assertNotifications([[$event->pageParticipant->user, NotificationTypeEnum::EventList, 'City Run', '/events/city-run']]);
    }

    final public function testCreateListFailsForUnknownDistance(): void
    {
        $this->eventDisciplineDistanceRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedRepository->expects($this->never())->method('save');
        $this->eventDisciplineListRepository->expects($this->never())->method('save');

        try {
            $this->service->createList(self::user()->id);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    #[DataProvider('saveStatuses')]
    final public function testUpdateListStatusSavesStatusAndNotifiesOwnerAndParticipant(SaveStatusEnum $status): void
    {
        $event = self::eventEntity();
        $participant = self::user();
        $list = self::entity(EventDisciplineListFactory::make([
            'eventDisciplineDistance' => self::addDistance(self::addDiscipline($event)),
            'user' => $participant,
        ]));
        $dto = new SaveStatusDto();
        $dto->status = $status;
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->with($list->id)->willReturn($list);
        $this->eventDisciplineListRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (EventDisciplineList $saved): bool => $saved === $list && $status === $saved->status));

        $this->assertSame($list->id, $this->service->updateListStatus($list->id, $dto));
        $this->assertNotifications([
            [$event->pageParticipant->user, NotificationTypeEnum::EventListStatus, 'City Run', '/events/city-run'],
            [$participant, NotificationTypeEnum::EventListStatus, 'City Run', '/events/city-run'],
        ]);
    }

    public static function saveStatuses(): iterable
    {
        foreach (SaveStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testUpdateListStatusFailsForUnknownList(): void
    {
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->eventDisciplineListRepository->expects($this->never())->method('save');

        try {
            $this->service->updateListStatus(self::user()->id, $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testDeleteList(): void
    {
        $list = self::entity(EventDisciplineListFactory::make());
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->with($list->id)->willReturn($list);
        $this->eventDisciplineListRepository->expects($this->once())->method('delete')->with($list);

        $this->assertSame($list->id, $this->service->deleteList($list->id));
    }

    final public function testDeleteListFailsForUnknownList(): void
    {
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->eventDisciplineListRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->deleteList(self::user()->id);
    }

    final public function testIndexListDelegatesToRepository(): void
    {
        $distanceId = self::user()->id;
        $dto = new EventListIndexDto();
        $window = self::window([self::entity(EventDisciplineListFactory::make())]);
        $this->eventDisciplineListRepository->expects($this->once())
            ->method('findLists')
            ->with($distanceId, $dto)
            ->willReturn($window);

        $this->assertSame($window, $this->service->indexList($distanceId, $dto));
    }

    final public function testDetailsList(): void
    {
        $list = self::entity(EventDisciplineListFactory::make());
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->with($list->id)->willReturn($list);

        $this->assertSame($list, $this->service->detailsList($list->id));
    }

    final public function testDetailsListFailsForUnknownList(): void
    {
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->detailsList(self::user()->id);
    }

    final public function testCreateResultSavesResultWithSubResultsAndDispatchesEvents(): void
    {
        $event = self::eventEntity();
        $participant = self::user();
        $distance = self::addDistance(self::addDiscipline($event));
        $sub1 = self::addSubDistance($distance);
        $sub2 = self::addSubDistance($distance);
        $list = self::entity(EventDisciplineListFactory::make([
            'eventDisciplineDistance' => $distance,
            'user' => $participant,
            'status' => SaveStatusEnum::Accepted,
        ]));
        $dto = self::resultDto(3600, [[$sub1->id, 1700], [$sub2->id, 1900]]);
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->with($list->id)->willReturn($list);
        $this->eventDisciplineSubDistanceRepository->expects($this->exactly(2))
            ->method('findById')
            ->willReturnMap([[$sub1->id, $sub1], [$sub2->id, $sub2]]);
        $feeds = $results = $subResults = [];
        $this->expectSaves($this->feedRepository, 1, $feeds);
        $this->expectSaves($this->eventDisciplineResultRepository, 1, $results);
        $this->expectSaves($this->eventDisciplineSubResultRepository, 2, $subResults);

        $id = $this->service->createResult($list->id, $dto);

        [$feed] = $feeds;
        $this->assertSame($participant, $feed->user);
        $this->assertNull($feed->text);
        $this->assertNull($feed->photo);
        $this->assertSame(ElementStatusEnum::Draft, $feed->status);
        [$result] = $results;
        $this->assertInstanceOf(EventDisciplineResult::class, $result);
        $this->assertNotNull($id);
        $this->assertSame($result->id, $id);
        $this->assertSame($list, $result->eventDisciplineList);
        $this->assertSame($feed, $result->feed);
        $this->assertSame($participant, $result->user);
        $this->assertSame(3600, $result->time);
        $this->assertSame(
            [[$sub1, $result, $participant, 1700], [$sub2, $result, $participant, 1900]],
            array_map(
                static fn (EventDisciplineSubResult $s): array => [$s->eventDisciplineSubDistance, $s->eventDisciplineResult, $s->user, $s->time],
                $subResults,
            ),
        );

        $processed = array_shift($this->dispatched);
        $this->assertInstanceOf(EventProcessedEvent::class, $processed);
        $this->assertSame($result, $processed->getResult());
        $this->assertNotifications([[$participant, NotificationTypeEnum::EventResult, 'City Run', '/events/city-run']]);
    }

    final public function testCreateResultWithoutSubResults(): void
    {
        $event = self::eventEntity();
        $list = self::entity(EventDisciplineListFactory::make([
            'eventDisciplineDistance' => self::addDistance(self::addDiscipline($event)),
            'status' => SaveStatusEnum::Accepted,
        ]));
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->willReturn($list);
        $this->eventDisciplineSubDistanceRepository->expects($this->never())->method('findById');
        $this->eventDisciplineSubResultRepository->expects($this->never())->method('save');
        $feeds = $results = [];
        $this->expectSaves($this->feedRepository, 1, $feeds);
        $this->expectSaves($this->eventDisciplineResultRepository, 1, $results);

        $id = $this->service->createResult($list->id, self::resultDto(1234, []));

        $this->assertSame($results[0]->id, $id);
        $this->assertSame(1234, $results[0]->time);
        $this->assertCount(2, $this->dispatched);
        $this->assertInstanceOf(EventProcessedEvent::class, $this->dispatched[0]);
        $this->assertInstanceOf(NotificationEvent::class, $this->dispatched[1]);
    }

    #[DataProvider('notAcceptedStatuses')]
    final public function testCreateResultRejectsNotAcceptedList(SaveStatusEnum $status): void
    {
        $list = self::entity(EventDisciplineListFactory::make(['status' => $status]));
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->willReturn($list);
        $this->feedRepository->expects($this->never())->method('save');
        $this->eventDisciplineResultRepository->expects($this->never())->method('save');
        $this->eventDisciplineSubResultRepository->expects($this->never())->method('save');

        try {
            $this->service->createResult($list->id, self::resultDto(100, []));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('Results can only be added to accepted lists.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    public static function notAcceptedStatuses(): iterable
    {
        yield 'pending' => [SaveStatusEnum::Pending];
        yield 'rejected' => [SaveStatusEnum::Rejected];
    }

    final public function testCreateResultFailsForUnknownList(): void
    {
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->feedRepository->expects($this->never())->method('save');
        $this->eventDisciplineResultRepository->expects($this->never())->method('save');

        try {
            $this->service->createResult(self::user()->id, self::resultDto(100, []));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateResultFailsForUnknownSubDistance(): void
    {
        $list = self::entity(EventDisciplineListFactory::make(['status' => SaveStatusEnum::Accepted]));
        $this->eventDisciplineListRepository->expects($this->once())->method('findById')->willReturn($list);
        $this->eventDisciplineSubDistanceRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException());
        $this->eventDisciplineSubResultRepository->expects($this->never())->method('save');

        try {
            $this->service->createResult($list->id, self::resultDto(100, [[self::user()->id, 50]]));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateResultReplacesTimeAndSubResults(): void
    {
        $participant = self::user();
        $result = self::entity(EventDisciplineResultFactory::make(['user' => $participant, 'time' => 5000]));
        $old1 = self::entity(EventDisciplineSubResultFactory::make(['eventDisciplineResult' => $result]));
        $old2 = self::entity(EventDisciplineSubResultFactory::make(['eventDisciplineResult' => $result]));
        $result->subResults->add($old1);
        $result->subResults->add($old2);
        $sub = self::entity(EventDisciplineSubDistanceFactory::make());
        $this->eventDisciplineResultRepository->expects($this->once())->method('findById')->with($result->id)->willReturn($result);
        $deleted = [];
        $this->expectDeletes($this->eventDisciplineSubResultRepository, $deleted);
        $this->eventDisciplineSubDistanceRepository->expects($this->once())->method('findById')->with($sub->id)->willReturn($sub);
        $subResults = [];
        $this->expectSaves($this->eventDisciplineSubResultRepository, 1, $subResults);
        $this->eventDisciplineResultRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (EventDisciplineResult $saved): bool => $saved === $result && 4000 === $saved->time));

        $this->assertSame($result->id, $this->service->updateResult($result->id, self::resultDto(4000, [[$sub->id, 2000]])));

        $this->assertSame([$old1, $old2], $deleted);
        [$subResult] = $subResults;
        $this->assertSame($sub, $subResult->eventDisciplineSubDistance);
        $this->assertSame($result, $subResult->eventDisciplineResult);
        $this->assertSame($participant, $subResult->user);
        $this->assertSame(2000, $subResult->time);
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateResultWithoutSubResults(): void
    {
        $result = self::entity(EventDisciplineResultFactory::make(['time' => 5000]));
        $this->eventDisciplineResultRepository->expects($this->once())->method('findById')->willReturn($result);
        $this->eventDisciplineSubResultRepository->expects($this->never())->method('delete');
        $this->eventDisciplineSubResultRepository->expects($this->never())->method('save');
        $this->eventDisciplineSubDistanceRepository->expects($this->never())->method('findById');
        $this->eventDisciplineResultRepository->expects($this->once())->method('save')->with($result);

        $this->assertSame($result->id, $this->service->updateResult($result->id, self::resultDto(4500, [])));
        $this->assertSame(4500, $result->time);
    }

    final public function testUpdateResultFailsForUnknownResult(): void
    {
        $this->eventDisciplineResultRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->eventDisciplineResultRepository->expects($this->never())->method('save');
        $this->eventDisciplineSubResultRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateResult(self::user()->id, self::resultDto(100, []));
    }

    final public function testUpdateResultFailsForUnknownSubDistance(): void
    {
        $result = self::entity(EventDisciplineResultFactory::make());
        $this->eventDisciplineResultRepository->expects($this->once())->method('findById')->willReturn($result);
        $this->eventDisciplineSubDistanceRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException());
        $this->eventDisciplineSubResultRepository->expects($this->never())->method('save');
        $this->eventDisciplineResultRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateResult($result->id, self::resultDto(100, [[self::user()->id, 50]]));
    }

    final public function testDeleteResult(): void
    {
        $result = self::entity(EventDisciplineResultFactory::make());
        $this->eventDisciplineResultRepository->expects($this->once())->method('findById')->with($result->id)->willReturn($result);
        $this->eventDisciplineResultRepository->expects($this->once())->method('delete')->with($result);

        $this->assertSame($result->id, $this->service->deleteResult($result->id));
    }

    final public function testDeleteResultFailsForUnknownResult(): void
    {
        $this->eventDisciplineResultRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->eventDisciplineResultRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->deleteResult(self::user()->id);
    }

    /** @param array{DisciplineEnum, array{int, int[]}[]}[] $disciplines */
    private static function eventDto(array $disciplines): EventDto
    {
        $dto = new EventDto();
        $dto->startedAt = new DateTimeImmutable('2026-05-01 09:00:00');
        $dto->endedAt = new DateTimeImmutable('2026-05-01 14:00:00');
        $dto->title = 'City Run';
        $dto->description = 'Annual city run';
        $dto->link = 'city-run-2026';
        $dto->rules = 'Be nice';
        $dto->photo = self::PHOTO;
        $dto->location = 'Warsaw';

        foreach ($disciplines as [$discipline, $distances]) {
            $disciplineDto = new EventDisciplineDto();
            $disciplineDto->discipline = $discipline;

            foreach ($distances as [$distance, $subDistances]) {
                $distanceDto = new EventDisciplineDistanceDto();
                $distanceDto->distance = $distance;

                foreach ($subDistances as $subDistance) {
                    $subDistanceDto = new EventDisciplineSubDistanceDto();
                    $subDistanceDto->subDistance = $subDistance;
                    $distanceDto->addSubDistance($subDistanceDto);
                }

                $disciplineDto->addDistance($distanceDto);
            }

            $dto->addDiscipline($disciplineDto);
        }

        return $dto;
    }

    /** @param array{Uuid, int}[] $subResults */
    private static function resultDto(int $time, array $subResults): EventResultDto
    {
        $dto = new EventResultDto();
        $dto->time = $time;

        foreach ($subResults as [$subDistanceId, $subTime]) {
            $subResultDto = new EventSubResultDto();
            $subResultDto->eventDisciplineSubDistanceId = $subDistanceId;
            $subResultDto->time = $subTime;
            $dto->addSubResult($subResultDto);
        }

        return $dto;
    }

    private static function eventEntity(): Event
    {
        $owner = self::entity(UserFactory::make(['firstName' => 'Anna', 'lastName' => 'Nowak', 'link' => 'anna']));

        return self::entity(EventFactory::make([
            'pageParticipant' => self::entity(PageParticipantFactory::make(['user' => $owner])),
            'title' => 'City Run',
            'link' => 'city-run',
        ]));
    }

    private static function addDiscipline(Event $event): EventDiscipline
    {
        $discipline = self::entity(EventDisciplineFactory::make(['event' => $event]));
        $event->disciplines->add($discipline);

        return $discipline;
    }

    private static function addDistance(EventDiscipline $discipline): EventDisciplineDistance
    {
        $distance = self::entity(EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline]));
        $discipline->distances->add($distance);

        return $distance;
    }

    private static function addSubDistance(EventDisciplineDistance $distance): EventDisciplineSubDistance
    {
        $subDistance = self::entity(EventDisciplineSubDistanceFactory::make(['eventDisciplineDistance' => $distance]));
        $distance->subDistances->add($subDistance);

        return $subDistance;
    }

    private function expectSaves(MockObject $repository, int $count, array &$saved): void
    {
        $repository->expects($this->exactly($count))
            ->method('save')
            ->willReturnCallback(static function (object $entity) use (&$saved): void {
                $saved[] = $entity;
                self::persist()($entity);
            });
    }

    private function expectDeletes(MockObject $repository, array &$deleted): void
    {
        $repository->method('delete')->willReturnCallback(static function (object $entity) use (&$deleted): void {
            $deleted[] = $entity;
        });
    }

    private function assertEventMatchesDto(EventDto $dto, Event $event): void
    {
        $this->assertSame($dto->startedAt, $event->startedAt);
        $this->assertSame($dto->endedAt, $event->endedAt);
        $this->assertSame($dto->title, $event->title);
        $this->assertSame($dto->description, $event->description);
        $this->assertSame($dto->link, $event->link);
        $this->assertSame($dto->rules, $event->rules);
        $this->assertSame($dto->photo, $event->photo);
        $this->assertSame($dto->location, $event->location);
    }
}
