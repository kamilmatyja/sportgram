<?php

declare(strict_types=1);

namespace Tests\Unit\EventSubscriber;

use App\EventSubscriber\ExceptionSubscriber;
use Exception;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Component\HttpFoundation\{Request, Response};
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\{BadRequestHttpException,
    NotFoundHttpException,
    UnprocessableEntityHttpException};
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Validator\{ConstraintViolation, ConstraintViolationList};
use Symfony\Component\Validator\Exception\{ValidationFailedException, ValidatorException};
use Throwable;

class ExceptionSubscriberTest extends TestCase
{
    final public function testSubscribesToKernelException(): void
    {
        $this->assertSame(['kernel.exception' => 'onException'], ExceptionSubscriber::getSubscribedEvents());
    }

    #[DataProvider('validationWrapperProvider')]
    final public function testValidationErrorsBecomeBadRequest(string $wrapperClass): void
    {
        $violations = new ConstraintViolationList([
            $this->violation('email', 'This value is not a valid email address.'),
            $this->violation('email', 'This value is too short.'),
            $this->violation('filter.link', 'This value should not be blank.'),
        ]);
        $previous = new ValidationFailedException(null, $violations);
        $e = UnprocessableEntityHttpException::class === $wrapperClass
            ? new UnprocessableEntityHttpException('Invalid', $previous)
            : new BadRequestHttpException('Invalid', $previous);

        $response = $this->handle($e);

        $this->assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        $this->assertSame([
            'errors' => [
                'email' => ['This value is not a valid email address.', 'This value is too short.'],
                'filter.link' => ['This value should not be blank.'],
            ],
        ], $this->body($response));
    }

    public static function validationWrapperProvider(): iterable
    {
        yield 'unprocessable entity' => [UnprocessableEntityHttpException::class];
        yield 'bad request' => [BadRequestHttpException::class];
    }

    #[DataProvider('unhandledValidationProvider')]
    final public function testLeavesResponseUnsetWhenThereAreNoViolations(Throwable $e): void
    {
        $event = $this->event($e);

        new ExceptionSubscriber()->onException($event);

        $this->assertNull($event->getResponse());
    }

    public static function unhandledValidationProvider(): iterable
    {
        yield 'bad request without violations' => [new BadRequestHttpException('Malformed JSON')];
        yield 'unprocessable entity with other previous' => [
            new UnprocessableEntityHttpException('Invalid', new RuntimeException()),
        ];
    }

    final public function testEmptyViolationListBecomesBadRequestWithoutErrors(): void
    {
        $e = new BadRequestHttpException('Invalid', new ValidationFailedException(null, new ConstraintViolationList()));

        $response = $this->handle($e);

        $this->assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
        $this->assertSame(['errors' => []], $this->body($response));
    }

    final public function testNotFound(): void
    {
        $response = $this->handle(new NotFoundHttpException('Page not found.'));

        $this->assertSame(Response::HTTP_NOT_FOUND, $response->getStatusCode());
        $this->assertSame(['error' => 'Page not found.'], $this->body($response));
    }

    final public function testValidatorExceptionBecomesConflict(): void
    {
        $response = $this->handle(new ValidatorException('Already exists.'));

        $this->assertSame(Response::HTTP_CONFLICT, $response->getStatusCode());
        $this->assertSame(['error' => 'Already exists.'], $this->body($response));
    }

    #[DataProvider('genericExceptionProvider')]
    final public function testGenericException(Throwable $e, int $expectedStatus, string $expectedMessage): void
    {
        $response = $this->handle($e);

        $this->assertSame($expectedStatus, $response->getStatusCode());
        $this->assertSame(['error' => $expectedMessage], $this->body($response));
    }

    public static function genericExceptionProvider(): iterable
    {
        yield 'http-like code is used as status' => [new RuntimeException('Forbidden.', 403), 403, 'Forbidden.'];
        yield 'zero code becomes server error' => [new RuntimeException('Boom.'), 500, 'Boom.'];
        yield 'out of range code becomes server error' => [new RuntimeException('Db.', 23505), 500, 'Db.'];
        yield 'code is taken from first previous with non-zero code' => [
            new RuntimeException('Outer.', 0, new Exception('Inner.', 409)),
            409,
            'Inner.',
        ];
        yield 'outer non-zero code wins over previous' => [
            new RuntimeException('Outer.', 401, new Exception('Inner.', 409)),
            401,
            'Outer.',
        ];
        yield 'no code in chain falls back to outer exception' => [
            new RuntimeException('Outer.', 0, new Exception('Inner.')),
            500,
            'Outer.',
        ];
    }

    private function handle(Throwable $e): Response
    {
        $event = $this->event($e);

        new ExceptionSubscriber()->onException($event);

        $this->assertNotNull($event->getResponse());

        return $event->getResponse();
    }

    private function event(Throwable $e): ExceptionEvent
    {
        return new ExceptionEvent(
            $this->createStub(HttpKernelInterface::class),
            new Request(),
            HttpKernelInterface::MAIN_REQUEST,
            $e,
        );
    }

    private function violation(string $path, string $message): ConstraintViolation
    {
        return new ConstraintViolation($message, null, [], null, $path, null);
    }

    private function body(Response $response): array
    {
        return json_decode($response->getContent(), true, flags: JSON_THROW_ON_ERROR);
    }
}
