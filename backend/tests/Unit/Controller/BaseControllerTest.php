<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\BaseController;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpFoundation\{Request, RequestStack, Response};
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Uid\Uuid;

class BaseControllerTest extends ControllerTestCase
{
    private BaseController $controller;

    protected function setUp(): void
    {
        $this->controller = new BaseController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([BaseController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([BaseController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'swagger' => ['swagger', '/api/doc', 'GET', 'swagger_ui', 'PUBLIC_ACCESS', null];
        yield 'swaggerJson' => ['swaggerJson', '/api/doc.json', 'GET', 'swagger_json', 'PUBLIC_ACCESS', null];
        yield 'health' => ['health', '/api/health', 'GET', 'health', 'PUBLIC_ACCESS', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(BaseController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    #[DataProvider('forwardProvider')]
    final public function testForwardsToNelmioController(string $action, string $path, string $method, string $name, string $forwardedController): void
    {
        $request = Request::create($path, $method);
        $expected = new Response('docs', Response::HTTP_OK);
        $kernel = $this->createMock(HttpKernelInterface::class);
        $kernel->expects($this->once())
            ->method('handle')
            ->with(
                $this->callback(function (Request $subRequest) use ($request, $forwardedController): bool {
                    $this->assertNotSame($request, $subRequest);
                    $this->assertSame($forwardedController, $subRequest->attributes->get('_controller'));

                    return true;
                }),
                HttpKernelInterface::SUB_REQUEST,
            )
            ->willReturn($expected);

        $this->controller->setContainer($this->container($kernel, $request));

        $this->assertSame($expected, $this->controller->{$action}());
    }

    public static function forwardProvider(): iterable
    {
        yield 'swagger' => ['swagger', '/api/doc', 'GET', 'swagger_ui', 'nelmio_api_doc.controller.swagger_ui'];
        yield 'swaggerJson' => ['swaggerJson', '/api/doc.json', 'GET', 'swagger_json', 'nelmio_api_doc.controller.swagger_json'];
    }

    final public function testHealth(): void
    {
        $response = $this->controller->health();

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('id', $content);
        $this->assertTrue(Uuid::isValid($content['id']));
    }

    private function container(HttpKernelInterface $kernel, Request $request): Container
    {
        $requestStack = new RequestStack();
        $requestStack->push($request);

        $container = new Container();
        $container->set('http_kernel', $kernel);
        $container->set('request_stack', $requestStack);

        return $container;
    }
}
