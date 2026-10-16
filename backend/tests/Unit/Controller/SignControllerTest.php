<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\SignController;
use App\Dto\{UserCodeDto, UserSignDto};
use App\Service\SignService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;

class SignControllerTest extends ControllerTestCase
{
    private const string TOKEN = 'header.payload.signature';

    private SignService&MockObject $service;

    private SignController $controller;

    protected function setUp(): void
    {
        $this->controller = new SignController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([SignController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([SignController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'sign' => ['sign', '/api/signs', 'POST', 'user_sign', 'PUBLIC_ACCESS', null];
        yield 'confirm' => ['confirm', '/api/signs/{id}/confirm', 'PATCH', 'user_sign_confirm', 'PUBLIC_ACCESS', null];
        yield 'resend' => ['resend', '/api/signs/{id}/resend', 'POST', 'user_sign_resend', 'PUBLIC_ACCESS', null];
        yield 'refresh' => ['refresh', '/api/signs/{id}/refresh', 'POST', 'user_sign_refresh', 'IS_AUTHENTICATED_FULLY', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(SignController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([SignController::class, 'sign'], 'dto');
        $this->assertMapsRequestPayload([SignController::class, 'confirm'], 'dto');
    }

    final public function testSign(): void
    {
        $dto = new UserSignDto();
        $dto->password = 'Secret-password-1';
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('sign')->with($dto)->willReturn($id);

        $response = $this->controller->sign($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
        $this->assertStringNotContainsString($dto->password, $response->getContent());
    }

    final public function testConfirm(): void
    {
        $id = Uuid::v4();
        $dto = new UserCodeDto();
        $this->service()->expects($this->once())->method('confirm')->with($id, $dto)->willReturn(self::TOKEN);

        $response = $this->controller->confirm($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['token' => self::TOKEN], $response);
    }

    final public function testResend(): void
    {
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('resend')->with($id)->willReturn($id);

        $response = $this->controller->resend($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testRefresh(): void
    {
        $id = Uuid::v4();
        $this->service()->expects($this->once())->method('refresh')->with($id)->willReturn(self::TOKEN);

        $response = $this->controller->refresh($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['token' => self::TOKEN], $response);
    }

    private function service(): SignService&MockObject
    {
        return $this->service ??= $this->createMock(SignService::class);
    }
}
