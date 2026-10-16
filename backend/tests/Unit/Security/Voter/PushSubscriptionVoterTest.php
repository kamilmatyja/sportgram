<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{PushSubscription, User};
use App\Enum\RoleEnum;
use App\Repository\PushSubscriptionRepository;
use App\Security\Voter\PushSubscriptionVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\PushSubscriptionFactory;

class PushSubscriptionVoterTest extends VoterTestCase
{
    private PushSubscriptionRepository&MockObject $pushSubscriptionRepository;

    private PushSubscriptionVoter $voter;

    protected function setUp(): void
    {
        $this->pushSubscriptionRepository = $this->createMock(PushSubscriptionRepository::class);
        $this->voter = new PushSubscriptionVoter($this->pushSubscriptionRepository);
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsSubscriptionOwner(RoleEnum $role): void
    {
        $owner = self::user($role);
        $pushSubscription = $this->pushSubscriptionOwnedBy($owner);
        $this->givenPushSubscription($pushSubscription);

        $this->assertGranted($this->voter, $owner, self::idOf($pushSubscription), PushSubscriptionVoter::PUSH_SUBSCRIPTION);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
    }

    final public function testGrantsOwnerWithFreshlyLoadedUserInstance(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $pushSubscription = $this->pushSubscriptionOwnedBy($owner);
        $this->givenPushSubscription($pushSubscription);

        $sameUser = self::user(RoleEnum::Participant);
        $sameUser->id = self::idOf($owner);

        $this->assertGranted($this->voter, $sameUser, self::idOf($pushSubscription), PushSubscriptionVoter::PUSH_SUBSCRIPTION);
    }

    final public function testDeniesOtherUser(): void
    {
        $pushSubscription = $this->pushSubscriptionOwnedBy(self::user(RoleEnum::Participant));
        $this->givenPushSubscription($pushSubscription);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($pushSubscription), PushSubscriptionVoter::PUSH_SUBSCRIPTION);
    }

    final public function testDeniesAdministratorWhoIsNotOwner(): void
    {
        $pushSubscription = $this->pushSubscriptionOwnedBy(self::user(RoleEnum::Participant));
        $this->givenPushSubscription($pushSubscription);

        $this->assertDenied($this->voter, self::admin(), self::idOf($pushSubscription), PushSubscriptionVoter::PUSH_SUBSCRIPTION);
    }

    final public function testGrantsAdministratorWhoIsOwner(): void
    {
        $owner = self::admin();
        $pushSubscription = $this->pushSubscriptionOwnedBy($owner);
        $this->givenPushSubscription($pushSubscription);

        $this->assertGranted($this->voter, $owner, self::idOf($pushSubscription), PushSubscriptionVoter::PUSH_SUBSCRIPTION);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->pushSubscriptionRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, PushSubscriptionVoter::PUSH_SUBSCRIPTION);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->pushSubscriptionRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v4(), PushSubscriptionVoter::PUSH_SUBSCRIPTION);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v4(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, PushSubscriptionVoter::PUSH_SUBSCRIPTION);
    }

    final public function testPropagatesMissingPushSubscription(): void
    {
        $this->pushSubscriptionRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v4(), [PushSubscriptionVoter::PUSH_SUBSCRIPTION]);
    }

    private function pushSubscriptionOwnedBy(User $owner): PushSubscription
    {
        $pushSubscription = PushSubscriptionFactory::make(['user' => $owner]);
        $pushSubscription->id = Uuid::v4();

        return $pushSubscription;
    }

    private function givenPushSubscription(PushSubscription $pushSubscription): void
    {
        $this->pushSubscriptionRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($pushSubscription->id)))
            ->willReturn($pushSubscription);
    }
}
