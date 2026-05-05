<?php

namespace App\EventSubscriber;

use App\Http\ApiResponse;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\{BadRequestHttpException,
    NotFoundHttpException,
    UnprocessableEntityHttpException};
use Symfony\Component\Validator\Exception\{ValidationFailedException, ValidatorException};
use Throwable;

class ExceptionSubscriber implements EventSubscriberInterface
{
    /** @return string[] */
    public static function getSubscribedEvents(): array
    {
        return [
            'kernel.exception' => 'onException',
        ];
    }

    final public function onException(ExceptionEvent $event): void
    {
        $e = $event->getThrowable();

        $violations = null;

        if ($e instanceof ValidationFailedException || $e instanceof UnprocessableEntityHttpException || $e instanceof BadRequestHttpException) {
            $previous = $e->getPrevious();

            if ($previous instanceof ValidationFailedException) {
                $violations = $previous->getViolations();
            }
        } elseif ($e instanceof NotFoundHttpException) {
            $event->setResponse(ApiResponse::notFound($e->getMessage()));
        } elseif ($e instanceof ValidatorException) {
            $event->setResponse(ApiResponse::conflict($e->getMessage()));
        } else {
            $exceptionWithCode = $this->findExceptionWithNonZeroCode($e) ?? $e;

            $event->setResponse(ApiResponse::error($exceptionWithCode->getMessage(), $exceptionWithCode->getCode()));
        }

        if (! $violations) {
            return;
        }

        $errors = [];

        foreach ($violations as $violation) {
            $field = $violation->getPropertyPath();

            $errors[$field][] = $violation->getMessage();
        }

        $event->setResponse(ApiResponse::badRequest($errors));
    }

    private function findExceptionWithNonZeroCode(Throwable $e): ?Throwable
    {
        while ($e !== null) {
            if ($e->getCode() !== 0) {
                return $e;
            }

            $e = $e->getPrevious();
        }

        return null;
    }
}
