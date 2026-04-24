<?php

namespace App\EventSubscriber;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\{ControllerEvent, ExceptionEvent, ResponseEvent};
use Symfony\Component\HttpKernel\KernelEvents;

readonly class DoctrineTransactionSubscriber implements EventSubscriberInterface
{
    public function __construct(private EntityManagerInterface $em)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::CONTROLLER => 'onKernelController',
            KernelEvents::RESPONSE => 'onKernelResponse',
            KernelEvents::EXCEPTION => 'onKernelException',
        ];
    }

    final public function onKernelController(ControllerEvent $event): void
    {
        $this->em->beginTransaction();
    }

    final public function onKernelResponse(ResponseEvent $event): void
    {
        if ($this->em->getConnection()->isTransactionActive()) {
            $this->em->commit();
        }
    }

    final public function onKernelException(ExceptionEvent $event): void
    {
        if ($this->em->getConnection()->isTransactionActive()) {
            $this->em->rollback();
        }
    }
}
