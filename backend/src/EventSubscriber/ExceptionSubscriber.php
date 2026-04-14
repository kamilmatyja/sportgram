<?php

namespace App\EventSubscriber;

use App\Http\ApiResponse;
use App\Http\ValidationException;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            'kernel.exception' => 'onKernelException',
        ];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        if ($exception instanceof ValidationException) {
            $response = ApiResponse::validationErrors($exception->getViolations());
            $event->setResponse($response);
            return;
        }

        $status = 400;
        if ($exception instanceof HttpExceptionInterface) {
            $status = $exception->getStatusCode();
        }
        $response = ApiResponse::error($exception->getMessage(), $status);
        $event->setResponse($response);
    }
}

