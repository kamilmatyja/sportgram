<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{ElementStatusDto, StoryDto, StoryIndexDto};
use App\Entity\{Story, User};
use App\Enum\{ElementStatusEnum, NotificationTypeEnum};
use App\Repository\StoryRepository;
use App\Service\StoryService;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{StoryFactory, UserFactory};

#[AllowMockObjectsWithoutExpectations]
class StoryServiceTest extends ServiceTestCase
{
    private StoryRepository&MockObject $storyRepository;

    private User $currentUser;

    private StoryService $service;

    protected function setUp(): void
    {
        $this->storyRepository = $this->createMock(StoryRepository::class);
        $this->currentUser = self::entity(UserFactory::make(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'link' => 'jan']));

        $this->service = new StoryService(
            $this->storyRepository,
            $this->dispatcher(),
            $this->security($this->currentUser),
        );
    }

    final public function testCreateSavesActiveStoryOfCurrentUser(): void
    {
        $dto = self::storyDto('Morning run', 'photo-data');
        $saved = null;
        $this->storyRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (Story $story) use (&$saved): void {
                $saved = $story;
                self::persist()($story);
            });

        $id = $this->service->create($dto);

        $this->assertNotNull($id);
        $this->assertSame($saved->id, $id);
        $this->assertSame($this->currentUser, $saved->user);
        $this->assertSame('Morning run', $saved->text);
        $this->assertSame(base64_encode('photo-data'), $saved->photo);
        $this->assertSame(ElementStatusEnum::Active, $saved->status);
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateSavesTextAndPhoto(): void
    {
        $story = self::entity(StoryFactory::make(['status' => ElementStatusEnum::Draft]));
        $dto = self::storyDto('Evening ride', 'new-photo');
        $this->storyRepository->expects($this->once())->method('findById')->with($story->id)->willReturn($story);
        $this->storyRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Story $saved): bool => $saved === $story
                && 'Evening ride' === $saved->text
                && base64_encode('new-photo') === $saved->photo
                && ElementStatusEnum::Draft === $saved->status));

        $this->assertSame($story->id, $this->service->update($story->id, $dto));
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateFailsForUnknownStory(): void
    {
        $this->storyRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->storyRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update(Uuid::v7(), self::storyDto('text', 'photo'));
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    #[DataProvider('statusProvider')]
    final public function testUpdateStatusSavesStatusAndNotifiesAuthor(ElementStatusEnum $status): void
    {
        $author = self::entity(UserFactory::make(['link' => 'anna']));
        $story = self::entity(StoryFactory::make(['user' => $author, 'text' => 'My story', 'status' => ElementStatusEnum::Draft]));
        $dto = new ElementStatusDto();
        $dto->status = $status;
        $this->storyRepository->expects($this->once())->method('findById')->with($story->id)->willReturn($story);
        $this->storyRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Story $saved): bool => $saved === $story && $status === $saved->status));

        $this->assertSame($story->id, $this->service->updateStatus($story->id, $dto));
        $this->assertNotifications([[$author, NotificationTypeEnum::StoryStatus, 'My story', '/users/anna']]);
    }

    final public function testUpdateStatusFailsForUnknownStory(): void
    {
        $dto = new ElementStatusDto();
        $dto->status = ElementStatusEnum::Active;
        $this->storyRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->storyRepository->expects($this->never())->method('save');

        try {
            $this->service->updateStatus(Uuid::v7(), $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testDelete(): void
    {
        $story = self::entity(StoryFactory::make());
        $this->storyRepository->expects($this->once())->method('findById')->with($story->id)->willReturn($story);
        $this->storyRepository->expects($this->once())->method('delete')->with($story);

        $this->assertSame($story->id, $this->service->delete($story->id));
    }

    final public function testDeleteFailsForUnknownStory(): void
    {
        $this->storyRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->storyRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(Uuid::v7());
    }

    final public function testIndexDelegatesToRepositoryWithCurrentUser(): void
    {
        $dto = new StoryIndexDto();
        $window = self::window([self::entity(StoryFactory::make())]);
        $this->storyRepository->expects($this->once())
            ->method('findStories')
            ->with($this->currentUser->id, $dto)
            ->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $story = self::entity(StoryFactory::make());
        $this->storyRepository->expects($this->once())->method('findById')->with($story->id)->willReturn($story);

        $this->assertSame($story, $this->service->details($story->id));
    }

    final public function testDetailsFailsForUnknownStory(): void
    {
        $this->storyRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(Uuid::v7());
    }

    private static function storyDto(string $text, string $rawPhoto): StoryDto
    {
        $dto = new StoryDto();
        $dto->text = $text;
        $dto->photo = base64_encode($rawPhoto);

        return $dto;
    }
}
