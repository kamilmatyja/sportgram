<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\UserController;
use App\Dto\{UserCreateDto, UserCreateNanoDto, UserDetailsQueryDto, UserIndexDto, UserStatusDto, UserUpdateDto};
use App\Entity\User;
use App\Enum\RoleEnum;
use App\Resource\UserResource;
use App\Security\Voter\UserVoter;
use App\Service\UserService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserDisciplineFactory, UserFactory, UserRoleFactory};

class UserControllerTest extends ControllerTestCase
{
    private UserService&MockObject $service;

    private UserController $controller;

    protected function setUp(): void
    {
        $this->controller = new UserController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([UserController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([UserController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/users', 'POST', 'user_create', RoleEnum::ROLE_ADMINISTRATOR, null];
        yield 'createNano' => ['createNano', '/api/user-nano', 'POST', 'user_create_nano', 'PUBLIC_ACCESS', null];
        yield 'update' => ['update', '/api/users/{id}', 'PUT', 'user_update', UserVoter::USER, 'id'];
        yield 'updateStatus' => ['updateStatus', '/api/users/{id}/status', 'PATCH', 'user_update_status', RoleEnum::ROLE_ADMINISTRATOR, null];
        yield 'delete' => ['delete', '/api/users/{id}', 'DELETE', 'user_delete', UserVoter::USER, 'id'];
        yield 'index' => ['index', '/api/users', 'GET', 'user_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/users/{id}', 'GET', 'user_details', 'IS_AUTHENTICATED_FULLY', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(UserController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([UserController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([UserController::class, 'createNano'], 'dto');
        $this->assertMapsRequestPayload([UserController::class, 'update'], 'dto');
        $this->assertMapsRequestPayload([UserController::class, 'updateStatus'], 'dto');
        $this->assertMapsQueryString([UserController::class, 'index'], 'dto');
        $this->assertMapsQueryString([UserController::class, 'index'], 'include');
        $this->assertMapsQueryString([UserController::class, 'details'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new UserCreateDto();
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testCreateNano(): void
    {
        $dto = new UserCreateNanoDto();
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('createNano')->with($dto)->willReturn($id);

        $response = $this->controller->createNano($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v7();
        $dto = new UserUpdateDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testUpdateStatus(): void
    {
        $id = Uuid::v7();
        $dto = new UserStatusDto();
        $this->service()->expects($this->once())->method('updateStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->updateStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDelete(): void
    {
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('delete')->with($id)->willReturn($id);

        $response = $this->controller->delete($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndex(): void
    {
        $dto = new UserIndexDto();
        $include = $this->includeAll();
        $users = [$this->userWithRelations(), $this->user()];
        $window = self::window($users, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $include, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => UserResource::fromEntityCollection($users, $include),
            'pagination' => self::pagination($window),
        ], $response);
        $this->assertPasswordsNotExposed($users, $response->getContent());
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new UserIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, new UserDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $user = $this->userWithRelations();
        $dto = $this->includeAll();
        $this->service()->expects($this->once())->method('details')->with($user->id)->willReturn($user);

        $response = $this->controller->details($user->id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => UserResource::fromEntity($user, $dto)], $response);
        $this->assertPasswordsNotExposed([$user], $response->getContent());
    }

    final public function testDetailsWithoutIncludes(): void
    {
        $user = $this->userWithRelations();
        $this->service()->expects($this->once())->method('details')->with($user->id)->willReturn($user);

        $response = $this->controller->details($user->id, new UserDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => UserResource::fromEntity($user)], $response);
        $this->assertPasswordsNotExposed([$user], $response->getContent());
    }

    /** @param User[] $users */
    private function assertPasswordsNotExposed(array $users, string $content): void
    {
        $this->assertStringNotContainsString('password', $content);

        foreach ($users as $user) {
            $this->assertStringNotContainsString($user->password, $content);
        }
    }

    private function service(): UserService&MockObject
    {
        return $this->service ??= $this->createMock(UserService::class);
    }

    private function includeAll(): UserDetailsQueryDto
    {
        $dto = new UserDetailsQueryDto();
        $dto->include = [UserDetailsQueryDto::USER_DISCIPLINES, UserDetailsQueryDto::USER_ROLES];

        return $dto;
    }

    private function user(): User
    {
        $user = UserFactory::make();
        $user->id = Uuid::v7();
        $user->onPrePersist();

        return $user;
    }

    private function userWithRelations(): User
    {
        $user = $this->user();

        $role = UserRoleFactory::make(['user' => $user]);
        $role->id = Uuid::v7();
        $role->onPrePersist();
        $user->roles->add($role);

        $discipline = UserDisciplineFactory::make(['user' => $user]);
        $discipline->id = Uuid::v7();
        $discipline->onPrePersist();
        $user->disciplines->add($discipline);

        return $user;
    }
}
