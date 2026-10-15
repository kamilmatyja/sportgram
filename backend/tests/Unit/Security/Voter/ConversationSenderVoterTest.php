<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Conversation, User};
use App\Enum\RoleEnum;
use App\Repository\ConversationRepository;
use App\Security\Voter\ConversationSenderVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\ConversationFactory;

class ConversationSenderVoterTest extends VoterTestCase
{
    private ConversationRepository&MockObject $conversationRepository;

    private ConversationSenderVoter $voter;

    protected function setUp(): void
    {
        $this->conversationRepository = $this->createMock(ConversationRepository::class);
        $this->voter = new ConversationSenderVoter($this->conversationRepository);
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsSender(RoleEnum $role): void
    {
        $owner = self::user($role);
        $conversation = $this->conversationOwnedBy($owner);
        $this->givenConversation($conversation);

        $this->assertGranted($this->voter, $owner, self::idOf($conversation), ConversationSenderVoter::CONVERSATION_SENDER);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
    }

    final public function testGrantsOwnerWithFreshlyLoadedUserInstance(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $conversation = $this->conversationOwnedBy($owner);
        $this->givenConversation($conversation);

        $sameUser = self::user(RoleEnum::Participant);
        $sameUser->id = self::idOf($owner);

        $this->assertGranted($this->voter, $sameUser, self::idOf($conversation), ConversationSenderVoter::CONVERSATION_SENDER);
    }

    final public function testDeniesOtherUser(): void
    {
        $conversation = $this->conversationOwnedBy(self::user(RoleEnum::Participant));
        $this->givenConversation($conversation);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($conversation), ConversationSenderVoter::CONVERSATION_SENDER);
    }

    final public function testDeniesAdministratorWhoIsNotOwner(): void
    {
        $conversation = $this->conversationOwnedBy(self::user(RoleEnum::Participant));
        $this->givenConversation($conversation);

        $this->assertDenied($this->voter, self::admin(), self::idOf($conversation), ConversationSenderVoter::CONVERSATION_SENDER);
    }

    final public function testGrantsAdministratorWhoIsOwner(): void
    {
        $owner = self::admin();
        $conversation = $this->conversationOwnedBy($owner);
        $this->givenConversation($conversation);

        $this->assertGranted($this->voter, $owner, self::idOf($conversation), ConversationSenderVoter::CONVERSATION_SENDER);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->conversationRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, ConversationSenderVoter::CONVERSATION_SENDER);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->conversationRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), ConversationSenderVoter::CONVERSATION_SENDER);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, ConversationSenderVoter::CONVERSATION_SENDER);
    }

    final public function testPropagatesMissingConversation(): void
    {
        $this->conversationRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [ConversationSenderVoter::CONVERSATION_SENDER]);
    }

    private function conversationOwnedBy(User $owner): Conversation
    {
        $conversation = ConversationFactory::make(['senderUser' => $owner, 'receiverUser' => self::user(RoleEnum::Participant)]);
        $conversation->id = Uuid::v7();

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
