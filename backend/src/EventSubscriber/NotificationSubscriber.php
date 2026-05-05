<?php

namespace App\EventSubscriber;

use App\Entity\Notification;
use App\Enum\NotificationStatusEnum;
use App\Event\NotificationEvent;
use ErrorException;
use App\Repository\{NotificationRepository, PushSubscriptionRepository};
use App\Service\WebPushService;
use Random\RandomException;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class NotificationSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private NotificationRepository $notificationRepository,
        private PushSubscriptionRepository $pushSubscriptionRepository,
        private WebPushService $webPushService,
        private TranslatorInterface $translator,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            NotificationEvent::class => 'onNotification',
        ];
    }

    /**
     * @throws RandomException
     * @throws ErrorException
     */
    final public function onNotification(NotificationEvent $event): void
    {
        $locale = $event->getUser()->language->getLocale();
        $body = $this->translator->trans(
            'notification.body.' . $event->getType()->name,
            ['%text%' => $event->getText()],
            null,
            $locale,
        );

        $notification = new Notification(
            $event->getUser(),
            $body,
            $event->getLink(),
            NotificationStatusEnum::NotSent,
        );
        $this->notificationRepository->save($notification);

        $pushSubscriptions = $this->pushSubscriptionRepository->findActiveByUserId($event->getUser()->id);

        $payload = json_encode([
            'title' => 'Sportgram',
            'body' => $body,
            'link' => $event->getLink(),
        ]);

        try {
            foreach ($pushSubscriptions as $subscription) {
                $this->webPushService->sendNotification(
                    $subscription->endpoint,
                    $subscription->p256dh,
                    $subscription->auth,
                    $payload,
                );
            }
        } finally {
            $notification->status = NotificationStatusEnum::Sent;
            $this->notificationRepository->save($notification);
        }
    }
}
