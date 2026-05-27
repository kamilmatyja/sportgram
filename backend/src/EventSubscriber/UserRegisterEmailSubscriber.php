<?php

namespace App\EventSubscriber;

use App\Enum\UnauthorizedStatusEnum;
use App\Event\UserRegisterEmailEvent;
use App\Repository\UserRegisterRepository;
use App\Service\EmailService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class UserRegisterEmailSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private EmailService $emailService,
        private TranslatorInterface $translator,
        private UserRegisterRepository $userRegisterRepository,
    ) {
    }

    /** @return string[] */
    public static function getSubscribedEvents(): array
    {
        return [
            UserRegisterEmailEvent::class => 'onUserRegisterEmail',
        ];
    }

    /**
     * @throws TransportExceptionInterface
     */
    final public function onUserRegisterEmail(UserRegisterEmailEvent $event): void
    {
        $user = $event->getUser();
        $userRegister = $event->getUserRegister();
        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('register.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'register.code.body',
            ['%code%' => $userRegister->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userRegister->status = UnauthorizedStatusEnum::Sent;
            $this->userRegisterRepository->save($userRegister);
        }
    }
}
