<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{PushSubscriptionDto, PushSubscriptionIndexDto};
use App\Entity\{PushSubscription, User};
use App\Enum\PushSubscriptionStatusEnum;
use App\Repository\PushSubscriptionRepository;
use App\Service\PushSubscriptionService;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Tests\Factory\PushSubscriptionFactory;

#[AllowMockObjectsWithoutExpectations]
class PushSubscriptionServiceTest extends ServiceTestCase
{
    private PushSubscriptionRepository&MockObject $pushSubscriptionRepository;

    private User $currentUser;

    private PushSubscriptionService $service;

    protected function setUp(): void
    {
        $this->pushSubscriptionRepository = $this->createMock(PushSubscriptionRepository::class);
        $this->currentUser = self::user();

        $this->service = new PushSubscriptionService(
            $this->pushSubscriptionRepository,
            $this->security($this->currentUser),
        );
    }

    final public function testCreateSavesSubscriptionForCurrentUser(): void
    {
        $dto = self::dto('https://push.example.com/abc', 'p256dh-key', 'auth-key', 'Firefox', PushSubscriptionStatusEnum::Active);
        $saved = null;
        $this->pushSubscriptionRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (PushSubscription $pushSubscription) use (&$saved): void {
                $saved = $pushSubscription;
                self::persist()($pushSubscription);
            });

        $id = $this->service->create($dto);

        $this->assertSame($saved->id, $id);
        $this->assertSame($this->currentUser, $saved->user);
        $this->assertSame('https://push.example.com/abc', $saved->endpoint);
        $this->assertSame('p256dh-key', $saved->p256dh);
        $this->assertSame('auth-key', $saved->auth);
        $this->assertSame('Firefox', $saved->userAgent);
        $this->assertSame(PushSubscriptionStatusEnum::Active, $saved->status);
    }

    final public function testCreateAcceptsMissingUserAgent(): void
    {
        $dto = self::dto('https://push.example.com/abc', 'p256dh-key', 'auth-key', null, PushSubscriptionStatusEnum::Inactive);
        $this->pushSubscriptionRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (PushSubscription $saved): bool => null === $saved->userAgent))
            ->willReturnCallback(self::persist());

        $this->service->create($dto);
    }

    final public function testUpdateChangesKeysAndStatusButKeepsOwnerAndUserAgent(): void
    {
        $owner = self::user();
        $pushSubscription = self::entity(PushSubscriptionFactory::make([
            'user' => $owner,
            'userAgent' => 'Chrome',
            'status' => PushSubscriptionStatusEnum::Active,
        ]));
        $dto = self::dto('https://push.example.com/new', 'new-p256dh', 'new-auth', 'Safari', PushSubscriptionStatusEnum::Revoked);
        $this->pushSubscriptionRepository->expects($this->once())
            ->method('findById')
            ->with($pushSubscription->id)
            ->willReturn($pushSubscription);
        $this->pushSubscriptionRepository->expects($this->once())->method('save')->with($pushSubscription);

        $this->assertSame($pushSubscription->id, $this->service->update($pushSubscription->id, $dto));
        $this->assertSame($owner, $pushSubscription->user);
        $this->assertSame('https://push.example.com/new', $pushSubscription->endpoint);
        $this->assertSame('new-p256dh', $pushSubscription->p256dh);
        $this->assertSame('new-auth', $pushSubscription->auth);
        $this->assertSame(PushSubscriptionStatusEnum::Revoked, $pushSubscription->status);
        $this->assertSame('Chrome', $pushSubscription->userAgent);
    }

    final public function testUpdatePropagatesNotFound(): void
    {
        $this->pushSubscriptionRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pushSubscriptionRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update(
            self::user()->id,
            self::dto('https://push.example.com/new', 'k', 'a', null, PushSubscriptionStatusEnum::Active),
        );
    }

    final public function testDelete(): void
    {
        $pushSubscription = self::entity(PushSubscriptionFactory::make());
        $this->pushSubscriptionRepository->expects($this->once())
            ->method('findById')
            ->with($pushSubscription->id)
            ->willReturn($pushSubscription);
        $this->pushSubscriptionRepository->expects($this->once())->method('delete')->with($pushSubscription);

        $this->assertSame($pushSubscription->id, $this->service->delete($pushSubscription->id));
    }

    final public function testDeletePropagatesNotFound(): void
    {
        $this->pushSubscriptionRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->pushSubscriptionRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(self::user()->id);
    }

    final public function testIndexIsScopedToCurrentUser(): void
    {
        $dto = new PushSubscriptionIndexDto();
        $window = self::window([self::entity(PushSubscriptionFactory::make(['user' => $this->currentUser]))]);
        $this->pushSubscriptionRepository->expects($this->once())
            ->method('findPushSubscriptions')
            ->with($this->currentUser->id, $dto)
            ->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $pushSubscription = self::entity(PushSubscriptionFactory::make());
        $this->pushSubscriptionRepository->expects($this->once())
            ->method('findById')
            ->with($pushSubscription->id)
            ->willReturn($pushSubscription);

        $this->assertSame($pushSubscription, $this->service->details($pushSubscription->id));
    }

    final public function testDetailsPropagatesNotFound(): void
    {
        $this->pushSubscriptionRepository->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(self::user()->id);
    }

    private static function dto(
        string $endpoint,
        string $p256dh,
        string $auth,
        ?string $userAgent,
        PushSubscriptionStatusEnum $status,
    ): PushSubscriptionDto {
        $dto = new PushSubscriptionDto();
        $dto->endpoint = $endpoint;
        $dto->p256dh = $p256dh;
        $dto->auth = $auth;
        $dto->userAgent = $userAgent;
        $dto->status = $status;

        return $dto;
    }
}
