<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Conversation, User};
use App\Enum\RoleEnum;
use App\Repository\ConversationRepository;
use App\Security\Voter\ConversationVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\ConversationFactory;

class ConversationVoterTest extends VoterTestCase
{
    private ConversationRepository&MockObject $conversationRepository;

    private ConversationVoter $voter;

    protected function setUp(): void
    {
        $this->conversationRepository = $this->createMock(ConversationRepository::class);
        $this->voter = new ConversationVoter($this->conversationRepository);
    }

    final public function testGrantsSender(): void
    {
        $sender = self::user(RoleEnum::Participant);
        $conversation = $this->conversationBetween($sender, self::user(RoleEnum::Participant));
        $this->givenConversation($conversation);

        $this->assertGranted($this->voter, $sender, self::idOf($conversation), ConversationVoter::CONVERSATION);
    }

    final public function testGrantsReceiver(): void
    {
        $receiver = self::user(RoleEnum::Participant);
        $conversation = $this->conversationBetween(self::user(RoleEnum::Participant), $receiver);
        $this->givenConversation($conversation);

        $this->assertGranted($this->voter, $receiver, self::idOf($conversation), ConversationVoter::CONVERSATION);
    }

    final public function testDeniesOtherUser(): void
    {
        $conversation = $this->conversationBetween(
            self::user(RoleEnum::Participant),
            self::user(RoleEnum::Participant),
        );
        $this->givenConversation($conversation);

        $this->assertDenied(
            $this->voter,
            self::user(RoleEnum::Participant),
            self::idOf($conversation),
            ConversationVoter::CONVERSATION,
        );
    }

    final public function testDeniesAdministratorWhoIsNotParticipant(): void
    {
        $conversation = $this->conversationBetween(
            self::user(RoleEnum::Participant),
            self::user(RoleEnum::Participant),
        );
        $this->givenConversation($conversation);

        $this->assertDenied($this->voter, self::admin(), self::idOf($conversation), ConversationVoter::CONVERSATION);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->conversationRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, ConversationVoter::CONVERSATION);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->conversationRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v4(), ConversationVoter::CONVERSATION);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v4(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, ConversationVoter::CONVERSATION);
    }

    final public function testPropagatesMissingConversation(): void
    {
        $this->conversationRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v4(), [ConversationVoter::CONVERSATION]);
    }

    private function conversationBetween(User $sender, User $receiver): Conversation
    {
        $conversation = ConversationFactory::make(['senderUser' => $sender, 'receiverUser' => $receiver]);
        $conversation->id = Uuid::v4();

        return $conversation;
    }

    private function givenConversation(Conversation $conversation): void
    {
        $this->conversationRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($conversation->id)))
            ->willReturn($conversation);
    }
}
