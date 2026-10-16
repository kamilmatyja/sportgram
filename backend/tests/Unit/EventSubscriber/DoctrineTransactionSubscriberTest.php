<?php

declare(strict_types=1);

namespace Tests\Unit\EventSubscriber;

use App\EventSubscriber\DoctrineTransactionSubscriber;
use App\Exception\SaveValidationException;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Component\HttpFoundation\{Request, Response};
use Symfony\Component\HttpKernel\Event\{ControllerEvent, ExceptionEvent, ResponseEvent};
use Symfony\Component\HttpKernel\{HttpKernelInterface, KernelEvents};
use Throwable;

class DoctrineTransactionSubscriberTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;

    private DoctrineTransactionSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->subscriber = new DoctrineTransactionSubscriber($this->em);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testSubscribesToKernelEvents(): void
    {
        $this->assertSame(
            [
                KernelEvents::CONTROLLER => 'onKernelController',
                KernelEvents::RESPONSE => 'onKernelResponse',
                KernelEvents::EXCEPTION => 'onKernelException',
            ],
            DoctrineTransactionSubscriber::getSubscribedEvents(),
        );
    }

    final public function testBeginsTransactionBeforeController(): void
    {
        $this->em->expects($this->once())->method('beginTransaction');

        $this->subscriber->onKernelController(
            new ControllerEvent($this->kernel(), static fn () => null, new Request(), HttpKernelInterface::MAIN_REQUEST),
        );
    }

    #[DataProvider('transactionStateProvider')]
    final public function testCommitsActiveTransactionOnResponse(bool $active): void
    {
        $this->givenTransactionActive($active);
        $this->em->expects($active ? $this->once() : $this->never())->method('commit');
        $this->em->expects($this->never())->method('rollback');

        $this->subscriber->onKernelResponse(
            new ResponseEvent($this->kernel(), new Request(), HttpKernelInterface::MAIN_REQUEST, new Response()),
        );
    }

    #[DataProvider('transactionStateProvider')]
    final public function testRollsBackActiveTransactionOnException(bool $active): void
    {
        $this->givenTransactionActive($active);
        $this->em->expects($active ? $this->once() : $this->never())->method('rollback');
        $this->em->expects($this->never())->method('commit');

        $this->subscriber->onKernelException($this->exceptionEvent(new RuntimeException()));
    }

    public static function transactionStateProvider(): iterable
    {
        yield 'active transaction' => [true];
        yield 'no transaction' => [false];
    }

    final public function testKeepsTransactionOnSaveValidationException(): void
    {
        $this->givenTransactionActive(true);
        $this->em->expects($this->never())->method('rollback');

        $this->subscriber->onKernelException($this->exceptionEvent(new SaveValidationException()));
    }

    private function givenTransactionActive(bool $active): void
    {
        $connection = $this->createStub(Connection::class);
        $connection->method('isTransactionActive')->willReturn($active);
        $this->em->method('getConnection')->willReturn($connection);
    }

    private function exceptionEvent(Throwable $e): ExceptionEvent
    {
        return new ExceptionEvent($this->kernel(), new Request(), HttpKernelInterface::MAIN_REQUEST, $e);
    }

    private function kernel(): HttpKernelInterface
    {
        return $this->createStub(HttpKernelInterface::class);
    }
}
