<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\PasswordResetController;
use App\Dto\{UserEmailDto, UserPasswordDto};
use App\Service\PasswordResetService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;

class PasswordResetControllerTest extends ControllerTestCase
{
    private PasswordResetService&MockObject $service;

    private PasswordResetController $controller;

    protected function setUp(): void
    {
        $this->controller = new PasswordResetController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([PasswordResetController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([PasswordResetController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'passwordReset' => ['passwordReset', '/api/password-resets', 'POST', 'user_password_reset', 'PUBLIC_ACCESS', null];
        yield 'confirm' => ['confirm', '/api/password-resets/{id}/confirm', 'PATCH', 'user_password_reset_confirm', 'PUBLIC_ACCESS', null];
        yield 'resend' => ['resend', '/api/password-resets/{id}/resend', 'POST', 'user_password_reset_resend', 'PUBLIC_ACCESS', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(PasswordResetController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([PasswordResetController::class, 'passwordReset'], 'dto');
        $this->assertMapsRequestPayload([PasswordResetController::class, 'confirm'], 'dto');
    }

    final public function testPasswordReset(): void
    {
        $dto = new UserEmailDto();
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('passwordReset')->with($dto)->willReturn($id);

        $response = $this->controller->passwordReset($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testConfirm(): void
    {
        $id = Uuid::v4();
        $dto = new UserPasswordDto();
        $dto->password = 'Secret-password-1';
        $this->service()->expects($this->once())->method('confirm')->with($id, $dto)->willReturn($id);

        $response = $this->controller->confirm($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
        $this->assertStringNotContainsString($dto->password, $response->getContent());
    }

    final public function testResend(): void
    {
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('resend')->with($id)->willReturn($id);

        $response = $this->controller->resend($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    private function service(): PasswordResetService&MockObject
    {
        return $this->service ??= $this->createMock(PasswordResetService::class);
    }
}
