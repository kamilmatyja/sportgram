<?php

declare(strict_types=1);

namespace Tests\Unit\EventSubscriber;

use App\Entity\UserPasswordReset;
use App\Enum\{LanguageEnum, UnauthorizedStatusEnum};
use App\Event\UserPasswordResetEmailEvent;
use App\EventSubscriber\UserPasswordResetEmailSubscriber;
use App\Repository\UserPasswordResetRepository;
use App\Service\EmailService;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Contracts\Translation\TranslatorInterface;
use Tests\Factory\{UserFactory, UserPasswordResetFactory};

class UserPasswordResetEmailSubscriberTest extends TestCase
{
    private EmailService&MockObject $emailService;

    private UserPasswordResetRepository&MockObject $userPasswordResetRepository;

    private UserPasswordResetEmailSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->emailService = $this->createMock(EmailService::class);
        $this->userPasswordResetRepository = $this->createMock(UserPasswordResetRepository::class);

        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(
            static fn (string $id, array $parameters = [], ?string $domain = null, ?string $locale = null): string => $locale . '|' . $id . '|' . implode(',', $parameters),
        );

        $this->subscriber = new UserPasswordResetEmailSubscriber($this->emailService, $translator, $this->userPasswordResetRepository);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testSubscribesToUserPasswordResetEmailEvent(): void
    {
        $this->assertSame(
            [UserPasswordResetEmailEvent::class => 'onUserPasswordResetEmail'],
            UserPasswordResetEmailSubscriber::getSubscribedEvents(),
        );
    }

    final public function testSendsTranslatedEmailAndMarksAsSent(): void
    {
        $user = UserFactory::make(['email' => 'jan@kowalski.pl', 'language' => LanguageEnum::Polish]);
        $userPasswordReset = UserPasswordResetFactory::make(['user' => $user, 'code' => 123456, 'status' => UnauthorizedStatusEnum::NotSent]);

        $this->emailService->expects($this->once())
            ->method('send')
            ->with('jan@kowalski.pl', 'pl|passwordReset.code.subject|', 'pl|passwordReset.code.body|123456');
        $this->userPasswordResetRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(
                static fn (UserPasswordReset $saved): bool => $saved === $userPasswordReset && UnauthorizedStatusEnum::Sent === $saved->status,
            ));

        $this->subscriber->onUserPasswordResetEmail(new UserPasswordResetEmailEvent($user, $userPasswordReset));

        $this->assertSame(UnauthorizedStatusEnum::Sent, $userPasswordReset->status);
    }

    final public function testMarksAsSentEvenWhenSendingFails(): void
    {
        $user = UserFactory::make();
        $userPasswordReset = UserPasswordResetFactory::make(['user' => $user, 'status' => UnauthorizedStatusEnum::NotSent]);

        $this->emailService->expects($this->once())->method('send')->willThrowException(new RuntimeException('SMTP down'));
        $this->userPasswordResetRepository->expects($this->once())->method('save')->with($userPasswordReset);

        try {
            $this->subscriber->onUserPasswordResetEmail(new UserPasswordResetEmailEvent($user, $userPasswordReset));
            $this->fail('Exception from email service should be rethrown.');
        } catch (RuntimeException $e) {
            $this->assertSame('SMTP down', $e->getMessage());
        }

        $this->assertSame(UnauthorizedStatusEnum::Sent, $userPasswordReset->status);
    }
}
