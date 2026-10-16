<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Story, User};
use App\Enum\RoleEnum;
use App\Repository\StoryRepository;
use App\Security\Voter\StoryVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\StoryFactory;

class StoryVoterTest extends VoterTestCase
{
    private StoryRepository&MockObject $storyRepository;

    private StoryVoter $voter;

    protected function setUp(): void
    {
        $this->storyRepository = $this->createMock(StoryRepository::class);
        $this->voter = new StoryVoter($this->storyRepository);
    }

    final public function testGrantsStoryAuthor(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $story = $this->storyOwnedBy($owner);
        $this->givenStory($story);

        $this->assertGranted($this->voter, self::reloaded($owner), self::idOf($story), StoryVoter::STORY);
    }

    final public function testDeniesOtherUser(): void
    {
        $story = $this->storyOwnedBy(self::user(RoleEnum::Participant));
        $this->givenStory($story);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($story), StoryVoter::STORY);
    }

    final public function testGrantsAdministratorWithoutLookup(): void
    {
        $this->storyRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), Uuid::v4(), StoryVoter::STORY);
    }

    final public function testAdministratorIsGrantedEvenForInvalidSubject(): void
    {
        $this->storyRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), 'not-a-uuid', StoryVoter::STORY);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->storyRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, StoryVoter::STORY);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->storyRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v4(), StoryVoter::STORY);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v4(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, StoryVoter::STORY);
    }

    final public function testPropagatesMissingStory(): void
    {
        $this->storyRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v4(), [StoryVoter::STORY]);
    }

    private function storyOwnedBy(User $owner): Story
    {
        $story = StoryFactory::make(['user' => $owner]);
        $story->id = Uuid::v4();

        return $story;
    }

    private function givenStory(Story $story): void
    {
        $this->storyRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($story->id)))
            ->willReturn($story);
    }
}
