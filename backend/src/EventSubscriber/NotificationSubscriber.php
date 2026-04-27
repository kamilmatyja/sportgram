<?php

namespace App\EventSubscriber;

use App\Entity\Notification;
use App\Enum\NotificationStatusEnum;
use App\Event\NotificationEvent;
use App\Repository\NotificationRepository;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

readonly class NotificationSubscriber implements EventSubscriberInterface
{
    public function __construct(private NotificationRepository $notificationRepository)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            NotificationEvent::class => 'onNotification',
        ];
    }

    final public function onNotification(NotificationEvent $event): void
    {
        $notification = new Notification(
            $event->getUser(),
            $event->getText(),
            $event->getLink(),
            NotificationStatusEnum::NotSent,
        );
        $this->notificationRepository->save($notification);
    }
}
