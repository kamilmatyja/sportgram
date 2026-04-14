<?php

namespace App\EventSubscriber;

use App\Http\ApiResponse;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Validator\Exception\ValidationFailedException;

class ExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            'kernel.exception' => 'onException',
        ];
    }

    public function onException(ExceptionEvent $event): void
    {
        $e = $event->getThrowable();

        $violations = null;

        if ($e instanceof ValidationFailedException) {
            $violations = $e->getViolations();
        }

        if ($e instanceof UnprocessableEntityHttpException) {
            $previous = $e->getPrevious();

            if ($previous instanceof ValidationFailedException) {
                $violations = $previous->getViolations();
            }
        }

        if (!$violations) {
            return;
        }

        $errors = [];

        foreach ($violations as $violation) {
            $field = $violation->getPropertyPath();

            $errors[$field][] = $violation->getMessage();
        }

        $event->setResponse(ApiResponse::error($errors));
    }
}

