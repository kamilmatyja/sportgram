<?php

declare(strict_types=1);

namespace Tests\Unit\EventSubscriber;

use App\Entity\UserRegister;
use App\Enum\{LanguageEnum, UnauthorizedStatusEnum};
use App\Event\UserRegisterEmailEvent;
use App\EventSubscriber\UserRegisterEmailSubscriber;
use App\Repository\UserRegisterRepository;
use App\Service\EmailService;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Contracts\Translation\TranslatorInterface;
use Tests\Factory\{UserFactory, UserRegisterFactory};

class UserRegisterEmailSubscriberTest extends TestCase
{
    private EmailService&MockObject $emailService;

    private UserRegisterRepository&MockObject $userRegisterRepository;

    private UserRegisterEmailSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->emailService = $this->createMock(EmailService::class);
        $this->userRegisterRepository = $this->createMock(UserRegisterRepository::class);

        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(
            static fn (string $id, array $parameters = [], ?string $domain = null, ?string $locale = null): string => $locale . '|' . $id . '|' . implode(',', $parameters),
        );

        $this->subscriber = new UserRegisterEmailSubscriber($this->emailService, $translator, $this->userRegisterRepository);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testSubscribesToUserRegisterEmailEvent(): void
    {
        $this->assertSame(
            [UserRegisterEmailEvent::class => 'onUserRegisterEmail'],
            UserRegisterEmailSubscriber::getSubscribedEvents(),
        );
    }

    final public function testSendsTranslatedEmailAndMarksAsSent(): void
    {
        $user = UserFactory::make(['email' => 'jan@kowalski.pl', 'language' => LanguageEnum::Polish]);
        $userRegister = UserRegisterFactory::make(['user' => $user, 'code' => 123456, 'status' => UnauthorizedStatusEnum::NotSent]);

        $this->emailService->expects($this->once())
            ->method('send')
            ->with('jan@kowalski.pl', 'pl|register.code.subject|', 'pl|register.code.body|123456');
        $this->userRegisterRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(
                static fn (UserRegister $saved): bool => $saved === $userRegister && UnauthorizedStatusEnum::Sent === $saved->status,
            ));

        $this->subscriber->onUserRegisterEmail(new UserRegisterEmailEvent($user, $userRegister));

        $this->assertSame(UnauthorizedStatusEnum::Sent, $userRegister->status);
    }

    final public function testMarksAsSentEvenWhenSendingFails(): void
    {
        $user = UserFactory::make();
        $userRegister = UserRegisterFactory::make(['user' => $user, 'status' => UnauthorizedStatusEnum::NotSent]);

        $this->emailService->expects($this->once())->method('send')->willThrowException(new RuntimeException('SMTP down'));
        $this->userRegisterRepository->expects($this->once())->method('save')->with($userRegister);

        try {
            $this->subscriber->onUserRegisterEmail(new UserRegisterEmailEvent($user, $userRegister));
            $this->fail('Exception from email service should be rethrown.');
        } catch (RuntimeException $e) {
            $this->assertSame('SMTP down', $e->getMessage());
        }

        $this->assertSame(UnauthorizedStatusEnum::Sent, $userRegister->status);
    }
}
