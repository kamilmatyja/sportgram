<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{ConversationActivity, User};
use App\Enum\RoleEnum;
use App\Repository\ConversationActivityRepository;
use App\Security\Voter\ConversationActivityVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\ConversationActivityFactory;

class ConversationActivityVoterTest extends VoterTestCase
{
    private ConversationActivityRepository&MockObject $conversationActivityRepository;

    private ConversationActivityVoter $voter;

    protected function setUp(): void
    {
        $this->conversationActivityRepository = $this->createMock(ConversationActivityRepository::class);
        $this->voter = new ConversationActivityVoter($this->conversationActivityRepository);
    }

    final public function testGrantsReceiverOfActivityFromSender(): void
    {
        $sender = self::user(RoleEnum::Participant);
        $receiver = self::user(RoleEnum::Participant);
        $activity = ConversationActivityFactory::make(['senderUser' => $sender, 'receiverUser' => $receiver]);
        $this->givenActivity($sender, $receiver, $activity);

        $this->assertGranted(
            $this->voter,
            self::reloaded($receiver),
            Uuid::fromString((string) $sender->id),
            ConversationActivityVoter::CONVERSATION_ACTIVITY,
        );
    }

    final public function testDeniesWhenNoActivityBetweenUsers(): void
    {
        $sender = self::user(RoleEnum::Participant);
        $receiver = self::user(RoleEnum::Participant);
        $this->givenActivity($sender, $receiver, null);

        $this->assertDenied(
            $this->voter,
            $receiver,
            Uuid::fromString((string) $sender->id),
            ConversationActivityVoter::CONVERSATION_ACTIVITY,
        );
    }

    final public function testAdministratorWithoutActivityIsDenied(): void
    {
        $sender = self::user(RoleEnum::Participant);
        $admin = self::admin();
        $this->givenActivity($sender, $admin, null);

        $this->assertDenied($this->voter, $admin, self::idOf($sender), ConversationActivityVoter::CONVERSATION_ACTIVITY);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->conversationActivityRepository->expects($this->never())->method('findByUserIds');

        $this->assertDenied(
            $this->voter,
            self::user(RoleEnum::Participant),
            $subject,
            ConversationActivityVoter::CONVERSATION_ACTIVITY,
        );
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->conversationActivityRepository->expects($this->never())->method('findByUserIds');

        $this->assertDenied($this->voter, null, Uuid::v7(), ConversationActivityVoter::CONVERSATION_ACTIVITY);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, ConversationActivityVoter::CONVERSATION_ACTIVITY);
    }

    private function givenActivity(User $sender, User $receiver, ?ConversationActivity $activity): void
    {
        $this->conversationActivityRepository->expects($this->once())
            ->method('findByUserIds')
            ->with(
                $this->callback(static fn (Uuid $id): bool => $id->equals($sender->id)),
                $this->callback(static fn (Uuid $id): bool => $id->equals($receiver->id)),
            )
            ->willReturn($activity);
    }
}
