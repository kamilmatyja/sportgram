<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Entity\User;
use App\Enum\NotificationTypeEnum;
use App\Event\NotificationEvent;
use Doctrine\ORM\Tools\Pagination\{Window, WindowPage};
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\UserFactory;

abstract class ServiceTestCase extends TestCase
{
    /** @var object[] */
    protected array $dispatched = [];

    /**
     * @template T of object
     * @param T $entity
     * @return T
     */
    final protected static function entity(object $entity): object
    {
        $entity->id = Uuid::v7();
        $entity->onPrePersist();

        return $entity;
    }

    final protected static function user(): User
    {
        return self::entity(UserFactory::make());
    }

    final protected static function persist(): callable
    {
        return static function (object $entity): void {
            if (null === $entity->id) {
                $entity->id = Uuid::v7();
                $entity->onPrePersist();
            } else {
                $entity->onPreUpdate();
            }
        };
    }

    final protected function security(?User $user): Security
    {
        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn($user);

        return $security;
    }

    final protected function dispatcher(): EventDispatcherInterface
    {
        $dispatcher = $this->createStub(EventDispatcherInterface::class);
        $dispatcher->method('dispatch')->willReturnCallback(function (object $event): object {
            $this->dispatched[] = $event;

            return $event;
        });

        return $dispatcher;
    }

    /** @param array{User, NotificationTypeEnum, string, ?string}[] $expected */
    final protected function assertNotifications(array $expected): void
    {
        $this->assertContainsOnlyInstancesOf(NotificationEvent::class, $this->dispatched);
        $this->assertSame(
            $expected,
            array_map(
                static fn (NotificationEvent $event): array => [$event->getUser(), $event->getType(), $event->getText(), $event->getLink()],
                $this->dispatched,
            ),
        );
    }

    final protected static function window(array $items): WindowPage
    {
        return new WindowPage($items, count($items), new Window(0, 10));
    }
}
