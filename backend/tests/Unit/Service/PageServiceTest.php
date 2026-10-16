<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{ElementStatusDto, PageDto, PageFollowIndexDto, PageFollowStatusDto, PageIndexDto, SaveStatusDto};
use App\Entity\{Page, PageFollow, PageParticipant, User};
use App\Enum\{ColorEnum, ElementStatusEnum, NotificationTypeEnum, PageFollowStatusEnum, SaveStatusEnum};
use App\Repository\{FriendRepository, PageFollowRepository, PageParticipantRepository, PageRepository, UserRepository};
use App\Service\PageService;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{EventFactory, PageFactory, PageFollowFactory, PageParticipantFactory, UserFactory};

#[AllowMockObjectsWithoutExpectations]
class PageServiceTest extends ServiceTestCase
{
    private PageRepository&MockObject $pageRepository;

    private PageParticipantRepository&MockObject $pageParticipantRepository;

    private PageFollowRepository&MockObject $pageFollowRepository;

    private UserRepository&MockObject $userRepository;

    private FriendRepository&MockObject $friendRepository;

    private User $currentUser;

    private PageService $service;

    protected function setUp(): void
    {
        $this->pageRepository = $this->createMock(PageRepository::class);
        $this->pageParticipantRepository = $this->createMock(PageParticipantRepository::class);
        $this->pageFollowRepository = $this->createMock(PageFollowRepository::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->friendRepository = $this->createMock(FriendRepository::class);
        $this->currentUser = self::entity(UserFactory::make(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'link' => 'jan']));

        $this->service = new PageService(
            $this->pageRepository,
            $this->pageParticipantRepository,
            $this->pageFollowRepository,
            $this->userRepository,
            $this->friendRepository,
            $this->dispatcher(),
            $this->security($this->currentUser),
        );
    }

    public static function elementStatusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    public static function saveStatusProvider(): iterable
    {
        foreach (SaveStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    public static function followStatusProvider(): iterable
    {
        foreach (PageFollowStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    public static function participantCountProvider(): iterable
    {
        yield 'no participants' => [0];
        yield 'one participant' => [1];
        yield 'several participants' => [3];
    }

    final public function testCreateSavesPageAndParticipantsAndNotifiesThem(): void
    {
        $anna = self::user();
        $piotr = self::user();
        $dto = self::pageDto([$anna->id, $piotr->id]);
        $this->expectUsers($anna, $piotr, $this->currentUser);
        $this->friendRepository->method('isFriend')->willReturn(true);
        $savedPage = null;
        $this->pageRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (Page $page) use (&$savedPage): void {
                $savedPage = $page;
                self::persist()($page);
            });
        $savedParticipants = [];
        $this->pageParticipantRepository->expects($this->exactly(3))
            ->method('save')
            ->willReturnCallback(static function (PageParticipant $participant) use (&$savedParticipants): void {
                $savedParticipants[] = $participant;
                self::persist()($participant);
            });

        $id = $this->service->create($dto);

        $this->assertNotNull($id);
        $this->assertSame($savedPage->id, $id);
        $this->assertSame($this->currentUser, $savedPage->user);
        $this->assertSame('Runners', $savedPage->title);
        $this->assertSame('Running club', $savedPage->description);
        $this->assertSame('runners', $savedPage->link);
        $this->assertSame(base64_encode('profile'), $savedPage->profilePhoto);
        $this->assertSame(base64_encode('background'), $savedPage->backgroundPhoto);
        $this->assertSame(ColorEnum::cases()[0], $savedPage->color);
        $this->assertSame(ElementStatusEnum::Active, $savedPage->status);
        $this->assertSame(
            [
                [$anna, SaveStatusEnum::Pending],
                [$piotr, SaveStatusEnum::Pending],
                [$this->currentUser, SaveStatusEnum::Accepted],
            ],
            array_map(static fn (PageParticipant $p): array => [$p->user, $p->status], $savedParticipants),
        );
        foreach ($savedParticipants as $participant) {
            $this->assertSame($savedPage, $participant->page);
        }
        $this->assertNotifications([
            [$anna, NotificationTypeEnum::PageParticipant, 'Runners', '/pages/runners'],
            [$piotr, NotificationTypeEnum::PageParticipant, 'Runners', '/pages/runners'],
            [$this->currentUser, NotificationTypeEnum::PageParticipant, 'Runners', '/pages/runners'],
        ]);
    }

    final public function testCreateDoesNotDuplicateCurrentUserAlreadyInParticipants(): void
    {
        $anna = self::user();
        $dto = self::pageDto([$this->currentUser->id, $anna->id]);
        $this->expectUsers($this->currentUser, $anna);
        $this->friendRepository->method('isFriend')->willReturn(true);
        $this->pageRepository->expects($this->once())->method('save')->willReturnCallback(self::persist());
        $savedParticipants = [];
        $this->pageParticipantRepository->expects($this->exactly(2))
            ->method('save')
            ->willReturnCallback(static function (PageParticipant $participant) use (&$savedParticipants): void {
                $savedParticipants[] = $participant;
            });

        $this->service->create($dto);

        $this->assertSame(
            [[$this->currentUser, SaveStatusEnum::Accepted], [$anna, SaveStatusEnum::Pending]],
            array_map(static fn (PageParticipant $p): array => [$p->user, $p->status], $savedParticipants),
        );
        $this->assertCount(2, $this->dispatched);
    }

    final public function testCreateWithoutParticipantsAddsOnlyCurrentUser(): void
    {
        $dto = self::pageDto([]);
        $this->expectUsers($this->currentUser);
        $this->friendRepository->method('isFriend')->willReturn(false);
        $this->pageRepository->expects($this->once())->method('save')->willReturnCallback(self::persist());
        $savedParticipants = [];
        $this->pageParticipantRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (PageParticipant $participant) use (&$savedParticipants): void {
                $savedParticipants[] = $participant;
            });

        $this->service->create($dto);

        $this->assertSame($this->currentUser, $savedParticipants[0]->user);
        $this->assertSame(SaveStatusEnum::Accepted, $savedParticipants[0]->status);
        $this->assertNotifications([[$this->currentUser, NotificationTypeEnum::PageParticipant, 'Runners', '/pages/runners']]);
    }

    final public function testCreateRejectsNonFriendParticipant(): void
    {
        $stranger = self::user();
        $dto = self::pageDto([$stranger->id]);
        $this->expectUsers($stranger);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $stranger->id)
            ->willReturn(false);
        $this->pageRepository->expects($this->once())->method('save')->willReturnCallback(self::persist());
        $this->pageParticipantRepository->expects($this->never())->method('save');

        try {
            $this->service->create($dto);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not friend.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateFailsForUnknownParticipant(): void
    {
        $dto = self::pageDto([Uuid::v4()]);
        $this->userRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageParticipantRepository->expects($this->never())->method('save');

        try {
            $this->service->create($dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateSavesFieldsAddsAndRemovesParticipants(): void
    {
        $kept = self::user();
        $removed = self::user();
        $added = self::user();
        $page = self::entity(PageFactory::make(['user' => $this->currentUser, 'status' => ElementStatusEnum::Draft]));
        self::participant($page, $this->currentUser);
        self::participant($page, $kept);
        $removedParticipant = self::participant($page, $removed);
        $dto = self::pageDto([$kept->id, $added->id]);
        $this->pageRepository->expects($this->once())->method('findById')->with($page->id)->willReturn($page);
        $this->pageParticipantRepository->expects($this->once())->method('delete')->with($removedParticipant);
        $this->userRepository->expects($this->once())->method('findById')->with($added->id)->willReturn($added);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $added->id)
            ->willReturn(true);
        $this->pageParticipantRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (PageParticipant $p): bool => $p->page === $page
                && $p->user === $added
                && SaveStatusEnum::Pending === $p->status));
        $this->pageRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Page $saved): bool => $saved === $page
                && 'Runners' === $saved->title
                && 'Running club' === $saved->description
                && 'runners' === $saved->link
                && base64_encode('profile') === $saved->profilePhoto
                && base64_encode('background') === $saved->backgroundPhoto
                && ColorEnum::cases()[0] === $saved->color
                && ElementStatusEnum::Draft === $saved->status));

        $this->assertSame($page->id, $this->service->update($page->id, $dto));
        $this->assertNotifications([[$added, NotificationTypeEnum::PageParticipant, $page->title, '/pages/' . $page->link]]);
    }

    final public function testUpdateWithUnchangedParticipantsOnlySavesPage(): void
    {
        $anna = self::user();
        $page = self::entity(PageFactory::make(['user' => $this->currentUser]));
        self::participant($page, $this->currentUser);
        self::participant($page, $anna);
        $this->pageRepository->expects($this->once())->method('findById')->willReturn($page);
        $this->pageParticipantRepository->expects($this->never())->method('delete');
        $this->pageParticipantRepository->expects($this->never())->method('save');
        $this->userRepository->expects($this->never())->method('findById');
        $this->pageRepository->expects($this->once())->method('save')->with($page);

        $this->assertSame($page->id, $this->service->update($page->id, self::pageDto([$anna->id, $this->currentUser->id])));
    }

    final public function testUpdateRejectsRemovingParticipantWithEvents(): void
    {
        $removed = self::user();
        $page = self::entity(PageFactory::make(['user' => $this->currentUser]));
        self::participant($page, $this->currentUser);
        self::participant($page, $removed, withEvent: true);
        $this->pageRepository->expects($this->once())->method('findById')->willReturn($page);
        $this->pageParticipantRepository->expects($this->never())->method('delete');
        $this->pageParticipantRepository->expects($this->never())->method('save');
        $this->pageRepository->expects($this->never())->method('save');

        try {
            $this->service->update($page->id, self::pageDto([]));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('Cannot delete page participant with events.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateRejectsAddingNonFriend(): void
    {
        $stranger = self::user();
        $page = self::entity(PageFactory::make(['user' => $this->currentUser]));
        self::participant($page, $this->currentUser);
        $this->pageRepository->expects($this->once())->method('findById')->willReturn($page);
        $this->userRepository->expects($this->once())->method('findById')->with($stranger->id)->willReturn($stranger);
        $this->friendRepository->expects($this->once())->method('isFriend')->willReturn(false);
        $this->pageParticipantRepository->expects($this->never())->method('save');
        $this->pageRepository->expects($this->never())->method('save');

        try {
            $this->service->update($page->id, self::pageDto([$stranger->id]));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not friend.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateFailsForUnknownPage(): void
    {
        $this->pageRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update(Uuid::v4(), self::pageDto([]));
    }

    final public function testUpdateFailsForUnknownAddedUser(): void
    {
        $page = self::entity(PageFactory::make(['user' => $this->currentUser]));
        self::participant($page, $this->currentUser);
        $this->pageRepository->expects($this->once())->method('findById')->willReturn($page);
        $this->userRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update($page->id, self::pageDto([Uuid::v4()]));
    }

    #[DataProvider('elementStatusProvider')]
    final public function testUpdateStatusSavesStatus(ElementStatusEnum $status): void
    {
        $page = self::entity(PageFactory::make(['status' => ElementStatusEnum::Draft]));
        $this->pageRepository->expects($this->once())->method('findById')->with($page->id)->willReturn($page);
        $this->pageRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Page $saved): bool => $saved === $page && $status === $saved->status));

        $this->assertSame($page->id, $this->service->updateStatus($page->id, self::elementStatusDto($status)));
    }

    #[DataProvider('participantCountProvider')]
    final public function testUpdateStatusNotifiesEveryParticipant(int $count): void
    {
        $page = self::entity(PageFactory::make(['title' => 'Runners', 'link' => 'runners']));
        $expected = [];
        for ($i = 0; $i < $count; ++$i) {
            $user = self::user();
            self::participant($page, $user);
            $expected[] = [$user, NotificationTypeEnum::PageStatus, 'Runners', '/pages/runners'];
        }
        $this->pageRepository->expects($this->once())->method('findById')->willReturn($page);
        $this->pageRepository->expects($this->once())->method('save');

        $this->service->updateStatus($page->id, self::elementStatusDto(ElementStatusEnum::Rejected));

        $this->assertNotifications($expected);
    }

    final public function testUpdateStatusFailsForUnknownPage(): void
    {
        $this->pageRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageRepository->expects($this->never())->method('save');

        try {
            $this->service->updateStatus(Uuid::v4(), self::elementStatusDto(ElementStatusEnum::Active));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    #[DataProvider('participantCountProvider')]
    final public function testDeleteRemovesPageWhenParticipantsHaveNoEvents(int $count): void
    {
        $page = self::entity(PageFactory::make());
        for ($i = 0; $i < $count; ++$i) {
            self::participant($page, self::user());
        }
        $this->pageRepository->expects($this->once())->method('findById')->with($page->id)->willReturn($page);
        $this->pageRepository->expects($this->once())->method('delete')->with($page);

        $this->assertSame($page->id, $this->service->delete($page->id));
    }

    final public function testDeleteRejectsPageWithParticipantEvents(): void
    {
        $page = self::entity(PageFactory::make());
        self::participant($page, self::user());
        self::participant($page, self::user(), withEvent: true);
        $this->pageRepository->expects($this->once())->method('findById')->willReturn($page);
        $this->pageRepository->expects($this->never())->method('delete');

        $this->expectException(ValidatorException::class);
        $this->expectExceptionMessage('Cannot delete page with participant events.');

        $this->service->delete($page->id);
    }

    final public function testDeleteFailsForUnknownPage(): void
    {
        $this->pageRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(Uuid::v4());
    }

    final public function testIndexDelegatesToRepository(): void
    {
        $dto = new PageIndexDto();
        $window = self::window([self::entity(PageFactory::make())]);
        $this->pageRepository->expects($this->once())->method('findPages')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $page = self::entity(PageFactory::make());
        $this->pageRepository->expects($this->once())->method('findById')->with($page->id)->willReturn($page);

        $this->assertSame($page, $this->service->details($page->id));
    }

    final public function testDetailsFailsForUnknownPage(): void
    {
        $this->pageRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(Uuid::v4());
    }

    #[DataProvider('saveStatusProvider')]
    final public function testUpdateParticipantStatusSavesStatusAndNotifiesParticipant(SaveStatusEnum $status): void
    {
        $user = self::user();
        $page = self::entity(PageFactory::make(['title' => 'Runners', 'link' => 'runners']));
        $participant = self::entity(PageParticipantFactory::make(['page' => $page, 'user' => $user, 'status' => SaveStatusEnum::Pending]));
        $dto = new SaveStatusDto();
        $dto->status = $status;
        $this->pageParticipantRepository->expects($this->once())->method('findById')->with($participant->id)->willReturn($participant);
        $this->pageParticipantRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (PageParticipant $saved): bool => $saved === $participant && $status === $saved->status));

        $this->assertSame($participant->id, $this->service->updateParticipantStatus($participant->id, $dto));
        $this->assertNotifications([[$user, NotificationTypeEnum::PageParticipantStatus, 'Runners', '/pages/runners']]);
    }

    final public function testUpdateParticipantStatusFailsForUnknownParticipant(): void
    {
        $dto = new SaveStatusDto();
        $dto->status = SaveStatusEnum::Accepted;
        $this->pageParticipantRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageParticipantRepository->expects($this->never())->method('save');

        try {
            $this->service->updateParticipantStatus(Uuid::v4(), $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    #[DataProvider('participantCountProvider')]
    final public function testCreateFollowSavesFollowAndNotifiesEveryParticipant(int $count): void
    {
        $page = self::entity(PageFactory::make(['title' => 'Runners', 'link' => 'runners']));
        $expected = [];
        for ($i = 0; $i < $count; ++$i) {
            $user = self::user();
            self::participant($page, $user);
            $expected[] = [$user, NotificationTypeEnum::PageFollow, 'Runners', '/pages/runners'];
        }
        $this->pageFollowRepository->expects($this->once())
            ->method('hasRow')
            ->with($this->currentUser->id, $page->id)
            ->willReturn(false);
        $this->pageRepository->expects($this->once())->method('findById')->with($page->id)->willReturn($page);
        $saved = null;
        $this->pageFollowRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (PageFollow $follow) use (&$saved): void {
                $saved = $follow;
                self::persist()($follow);
            });

        $id = $this->service->createFollow($page->id, self::followStatusDto(PageFollowStatusEnum::Pending));

        $this->assertNotNull($id);
        $this->assertSame($saved->id, $id);
        $this->assertSame($page, $saved->page);
        $this->assertSame($this->currentUser, $saved->user);
        $this->assertSame(PageFollowStatusEnum::Pending, $saved->status);
        $this->assertNotifications($expected);
    }

    final public function testCreateFollowRejectsAlreadyFollowedPage(): void
    {
        $this->pageFollowRepository->expects($this->once())->method('hasRow')->willReturn(true);
        $this->pageRepository->expects($this->never())->method('findById');
        $this->pageFollowRepository->expects($this->never())->method('save');

        try {
            $this->service->createFollow(Uuid::v4(), self::followStatusDto(PageFollowStatusEnum::Pending));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User already follows this page.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateFollowFailsForUnknownPage(): void
    {
        $this->pageFollowRepository->expects($this->once())->method('hasRow')->willReturn(false);
        $this->pageRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageFollowRepository->expects($this->never())->method('save');

        try {
            $this->service->createFollow(Uuid::v4(), self::followStatusDto(PageFollowStatusEnum::Pending));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    #[DataProvider('followStatusProvider')]
    final public function testUpdateFollowStatusSavesStatusAndNotifiesFollower(PageFollowStatusEnum $status): void
    {
        $follower = self::user();
        $page = self::entity(PageFactory::make(['title' => 'Runners', 'link' => 'runners']));
        $follow = self::entity(PageFollowFactory::make(['page' => $page, 'user' => $follower, 'status' => PageFollowStatusEnum::Pending]));
        $this->pageFollowRepository->expects($this->once())->method('findById')->with($follow->id)->willReturn($follow);
        $this->pageFollowRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (PageFollow $saved): bool => $saved === $follow && $status === $saved->status));

        $this->assertSame($follow->id, $this->service->updateFollowStatus($follow->id, self::followStatusDto($status)));
        $this->assertNotifications([[$follower, NotificationTypeEnum::PageFollowStatus, 'Runners', '/pages/runners']]);
    }

    final public function testUpdateFollowStatusFailsForUnknownFollow(): void
    {
        $this->pageFollowRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageFollowRepository->expects($this->never())->method('save');

        try {
            $this->service->updateFollowStatus(Uuid::v4(), self::followStatusDto(PageFollowStatusEnum::Accepted));
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testDeleteFollow(): void
    {
        $follow = self::entity(PageFollowFactory::make());
        $this->pageFollowRepository->expects($this->once())->method('findById')->with($follow->id)->willReturn($follow);
        $this->pageFollowRepository->expects($this->once())->method('delete')->with($follow);

        $this->assertSame($follow->id, $this->service->deleteFollow($follow->id));
    }

    final public function testDeleteFollowFailsForUnknownFollow(): void
    {
        $this->pageFollowRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pageFollowRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->deleteFollow(Uuid::v4());
    }

    final public function testIndexFollowsDelegatesToRepository(): void
    {
        $dto = new PageFollowIndexDto();
        $window = self::window([self::entity(PageFollowFactory::make())]);
        $this->pageFollowRepository->expects($this->once())->method('findPageFollows')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->indexFollows($dto));
    }

    final public function testDetailsFollow(): void
    {
        $follow = self::entity(PageFollowFactory::make());
        $this->pageFollowRepository->expects($this->once())->method('findById')->with($follow->id)->willReturn($follow);

        $this->assertSame($follow, $this->service->detailsFollow($follow->id));
    }

    final public function testDetailsFollowFailsForUnknownFollow(): void
    {
        $this->pageFollowRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->detailsFollow(Uuid::v4());
    }

    /** @param Uuid[] $userIds */
    private static function pageDto(array $userIds): PageDto
    {
        $dto = new PageDto();
        $dto->title = 'Runners';
        $dto->description = 'Running club';
        $dto->link = 'runners';
        $dto->profilePhoto = base64_encode('profile');
        $dto->backgroundPhoto = base64_encode('background');
        $dto->color = ColorEnum::cases()[0];
        $dto->userIds = $userIds;

        return $dto;
    }

    private static function elementStatusDto(ElementStatusEnum $status): ElementStatusDto
    {
        $dto = new ElementStatusDto();
        $dto->status = $status;

        return $dto;
    }

    private static function followStatusDto(PageFollowStatusEnum $status): PageFollowStatusDto
    {
        $dto = new PageFollowStatusDto();
        $dto->status = $status;

        return $dto;
    }

    private static function participant(Page $page, User $user, bool $withEvent = false): PageParticipant
    {
        $participant = self::entity(PageParticipantFactory::make(['page' => $page, 'user' => $user]));
        $page->participants->add($participant);

        if ($withEvent) {
            $participant->events->add(self::entity(EventFactory::make(['pageParticipant' => $participant])));
        }

        return $participant;
    }

    private function expectUsers(User ...$users): void
    {
        $this->userRepository->expects($this->exactly(count($users)))
            ->method('findById')
            ->willReturnCallback(static function (Uuid $id) use (&$users): User {
                $user = array_shift($users);
                self::assertTrue($user->id->equals($id));

                return $user;
            });
    }
}
