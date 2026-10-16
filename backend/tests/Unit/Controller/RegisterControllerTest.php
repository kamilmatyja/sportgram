<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\RegisterController;
use App\Dto\{UserCodeDto, UserEmailDto};
use App\Service\RegisterService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;

class RegisterControllerTest extends ControllerTestCase
{
    private RegisterService&MockObject $service;

    private RegisterController $controller;

    protected function setUp(): void
    {
        $this->controller = new RegisterController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([RegisterController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([RegisterController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'register' => ['register', '/api/registers', 'POST', 'user_register', 'PUBLIC_ACCESS', null];
        yield 'confirm' => ['confirm', '/api/registers/{id}/confirm', 'PATCH', 'user_register_confirm', 'PUBLIC_ACCESS', null];
        yield 'resend' => ['resend', '/api/registers/{id}/resend', 'POST', 'user_register_resend', 'PUBLIC_ACCESS', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(RegisterController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([RegisterController::class, 'register'], 'dto');
        $this->assertMapsRequestPayload([RegisterController::class, 'confirm'], 'dto');
    }

    final public function testRegister(): void
    {
        $dto = new UserEmailDto();
        $dto->email = 'jan@kowalski.pl';
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('register')->with($dto)->willReturn($id);

        $response = $this->controller->register($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testConfirm(): void
    {
        $id = Uuid::v4();
        $dto = new UserCodeDto();
        $dto->code = 213700;
        $this->service()->expects($this->once())->method('confirm')->with($id, $dto)->willReturn($id);

        $response = $this->controller->confirm($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testResend(): void
    {
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('resend')->with($id)->willReturn($id);

        $response = $this->controller->resend($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    private function service(): RegisterService&MockObject
    {
        return $this->service ??= $this->createMock(RegisterService::class);
    }
}
