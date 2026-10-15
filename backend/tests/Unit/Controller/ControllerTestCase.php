<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use Doctrine\ORM\Tools\Pagination\{Window, WindowPage};
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionMethod;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

abstract class ControllerTestCase extends TestCase
{
    /**
     * @param string[] $actions
     */
    final protected function assertCoversAllRoutes(string $controllerClass, array $actions): void
    {
        $routed = [];

        foreach (new ReflectionClass($controllerClass)->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            if ($method->class === $controllerClass && $method->getAttributes(Route::class)) {
                $routed[] = $method->getName();
            }
        }

        sort($routed);
        sort($actions);

        $this->assertSame($routed, $actions);
    }

    /** @param string[] $methods */
    final protected function assertRoute(array $action, string $path, array $methods, string $name): void
    {
        $route = $this->singleAttribute($action, Route::class);

        $this->assertSame($path, $route->path);
        $this->assertSame($methods, $route->methods);
        $this->assertSame($name, $route->name);
    }

    final protected function assertGrantedBy(array $action, string $attribute, ?string $subject = null): void
    {
        $isGranted = $this->singleAttribute($action, IsGranted::class);

        $this->assertSame($attribute, $isGranted->attribute);
        $this->assertSame($subject, $isGranted->subject);
    }

    final protected function assertNotGranted(array $action): void
    {
        $this->assertSame([], new ReflectionMethod(...$action)->getAttributes(IsGranted::class));
        $this->assertSame([], new ReflectionClass($action[0])->getAttributes(IsGranted::class));
    }

    final protected function assertMapsRequestPayload(array $action, string $parameter): void
    {
        $this->assertParameterAttribute($action, $parameter, MapRequestPayload::class);
    }

    final protected function assertMapsQueryString(array $action, string $parameter, ?int $validationFailedStatusCode = 400): object
    {
        $attribute = $this->assertParameterAttribute($action, $parameter, MapQueryString::class);
        $this->assertSame($validationFailedStatusCode, $attribute->validationFailedStatusCode);

        return $attribute;
    }

    final protected function assertJsonResponse(int $status, array $expected, Response $response): void
    {
        $this->assertSame($status, $response->getStatusCode());
        $this->assertSame(
            json_decode(json_encode($expected, JSON_THROW_ON_ERROR), true),
            json_decode($response->getContent(), true, flags: JSON_THROW_ON_ERROR),
        );
    }

    final protected static function pagination(WindowPage $window): array
    {
        return [
            'total' => $window->getTotalCount(),
            'page' => $window->getPageNumber(),
            'perPage' => $window->getPageCount(),
            'hasNextPage' => $window->hasNextPage(),
        ];
    }

    final protected static function window(array $items, ?int $total = null, int $page = 1, int $limit = 10): WindowPage
    {
        return new WindowPage($items, $total ?? count($items), Window::fromPageNumberAndSize($page, $limit));
    }

    private function assertParameterAttribute(array $action, string $parameter, string $attributeClass): object
    {
        foreach (new ReflectionMethod(...$action)->getParameters() as $reflectionParameter) {
            if ($reflectionParameter->getName() === $parameter) {
                $attributes = $reflectionParameter->getAttributes($attributeClass);
                $this->assertCount(1, $attributes, "Parameter \$$parameter is not mapped with $attributeClass.");

                return $attributes[0]->newInstance();
            }
        }

        $this->fail("Action has no parameter \$$parameter.");
    }

    private function singleAttribute(array $action, string $attributeClass): object
    {
        $attributes = new ReflectionMethod(...$action)->getAttributes($attributeClass);
        $this->assertCount(1, $attributes, sprintf('%s::%s must have exactly one %s.', $action[0], $action[1], $attributeClass));

        return $attributes[0]->newInstance();
    }
}
