<?php

namespace App\EventSubscriber;

use App\Enum\UnauthorizedStatusEnum;
use App\Event\UserPasswordResetEmailEvent;
use App\Repository\UserPasswordResetRepository;
use App\Service\EmailService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class UserPasswordResetEmailSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private EmailService $emailService,
        private TranslatorInterface $translator,
        private UserPasswordResetRepository $userPasswordResetRepository,
    ) {
    }

    /** @return string[] */
    public static function getSubscribedEvents(): array
    {
        return [
            UserPasswordResetEmailEvent::class => 'onUserPasswordResetEmail',
        ];
    }

    /**
     * @throws TransportExceptionInterface
     */
    final public function onUserPasswordResetEmail(UserPasswordResetEmailEvent $event): void
    {
        $user = $event->getUser();
        $userPasswordReset = $event->getUserPasswordReset();
        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('passwordReset.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'passwordReset.code.body',
            ['%code%' => $userPasswordReset->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userPasswordReset->status = UnauthorizedStatusEnum::Sent;
            $this->userPasswordResetRepository->save($userPasswordReset);
        }
    }
}
