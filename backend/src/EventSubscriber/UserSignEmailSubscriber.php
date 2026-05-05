<?php

namespace App\EventSubscriber;

use App\Enum\UnauthorizedStatusEnum;
use App\Event\UserSignEmailEvent;
use App\Repository\UserSignRepository;
use App\Service\EmailService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class UserSignEmailSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private EmailService $emailService,
        private TranslatorInterface $translator,
        private UserSignRepository $userSignRepository,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            UserSignEmailEvent::class => 'onUserSignEmail',
        ];
    }

    /**
     * @throws TransportExceptionInterface
     */
    final public function onUserSignEmail(UserSignEmailEvent $event): void
    {
        $user = $event->getUser();
        $userSign = $event->getUserSign();
        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('sign.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'sign.code.body',
            ['%code%' => $userSign->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userSign->status = UnauthorizedStatusEnum::Sent;
            $this->userSignRepository->save($userSign);
        }
    }
}
