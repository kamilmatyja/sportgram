<?php

namespace App\Service;

use App\Dto\{NotificationIndexDto, NotificationStatusDto};
use App\Entity\{Notification, User};
use App\Enum\NotificationStatusEnum;
use App\Repository\NotificationRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class NotificationService
{
    public function __construct(
        private NotificationRepository $notificationRepository,
        private Security $security,
    ) {
    }

    final public function updateStatus(Uuid $storyId, NotificationStatusDto $dto): Uuid
    {
        $notification = $this->notificationRepository->findById($storyId);

        if (! $notification) {
            throw new ValidatorException('Notification not found.');
        }

        $notification->status = NotificationStatusEnum::from($dto->status);
        $this->notificationRepository->save($notification);

        return $notification->id;
    }

    final public function delete(Uuid $notificationId): Uuid
    {
        $notification = $this->notificationRepository->findById($notificationId);

        if (! $notification) {
            throw new ValidatorException('Notification not found.');
        }

        $notification->softDelete();
        $this->notificationRepository->save($notification);

        return $notification->id;
    }

    final public function index(NotificationIndexDto $dto): array
    {
        /** @var User $user */
        $user = $this->security->getUser();

        return $this->notificationRepository->findNotifications($user->id, $dto);
    }

    final public function details(Uuid $notificationId): Notification
    {
        $notification = $this->notificationRepository->findById($notificationId);

        if (! $notification) {
            throw new ValidatorException('Notification not found.');
        }

        return $notification;
    }
}
