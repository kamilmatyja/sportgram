<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\UserDetailsQueryDto;
use App\Entity\User;
use App\Resource\{UserDisciplineResource, UserResource, UserRoleResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{UserDisciplineFactory, UserFactory, UserRoleFactory};

class UserResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $user = self::persisted(UserFactory::make());

        $data = UserResource::fromEntity($user);

        $this->assertSame([
            'id' => $user->id,
            'createdAt' => self::formatDate($user->createdAt),
            'updatedAt' => self::formatDate($user->updatedAt),
            'birthAt' => self::formatDate($user->birthAt),
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'gender' => $user->gender,
            'phone' => $user->phone,
            'email' => $user->email,
            'link' => $user->link,
            'language' => $user->language,
            'country' => $user->country,
            'theme' => $user->theme,
            'color' => $user->color,
            'profilePhoto' => $user->profilePhoto,
            'backgroundPhoto' => $user->backgroundPhoto,
            'bio' => $user->bio,
            'status' => $user->status,
        ], $data);
        $this->assertMatchesSchema(UserResource::class, $data);
    }

    final public function testDoesNotExposePassword(): void
    {
        $this->assertArrayNotHasKey('password', UserResource::fromEntity(self::persisted(UserFactory::make())));
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $data = UserResource::fromEntity($this->userWithRelations(), new UserDetailsQueryDto());

        $this->assertArrayNotHasKey('disciplines', $data);
        $this->assertArrayNotHasKey('roles', $data);
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $disciplines, bool $roles): void
    {
        $user = $this->userWithRelations();
        $dto = new UserDetailsQueryDto();
        $dto->include = $include;

        $data = UserResource::fromEntity($user, $dto);

        if ($disciplines) {
            $this->assertSame(
                array_map(UserDisciplineResource::fromEntity(...), $user->disciplines->toArray()),
                $data['disciplines'],
            );
        } else {
            $this->assertArrayNotHasKey('disciplines', $data);
        }

        if ($roles) {
            $this->assertSame(array_map(UserRoleResource::fromEntity(...), $user->roles->toArray()), $data['roles']);
        } else {
            $this->assertArrayNotHasKey('roles', $data);
        }

        $this->assertMatchesSchema(UserResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'disciplines' => [[UserDetailsQueryDto::USER_DISCIPLINES], true, false];
        yield 'roles' => [[UserDetailsQueryDto::USER_ROLES], false, true];
        yield 'both' => [[UserDetailsQueryDto::USER_DISCIPLINES, UserDetailsQueryDto::USER_ROLES], true, true];
    }

    final public function testIncludedRelationsMayBeEmpty(): void
    {
        $dto = new UserDetailsQueryDto();
        $dto->include = [UserDetailsQueryDto::USER_DISCIPLINES, UserDetailsQueryDto::USER_ROLES];

        $data = UserResource::fromEntity(self::persisted(UserFactory::make()), $dto);

        $this->assertSame([], $data['disciplines']);
        $this->assertSame([], $data['roles']);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $users = [self::persisted(UserFactory::make()), self::persisted(UserFactory::make())];

        $data = UserResource::fromEntityCollection($users);

        $this->assertSame([UserResource::fromEntity($users[0]), UserResource::fromEntity($users[1])], $data);
        $this->assertSame([], UserResource::fromEntityCollection([]));
    }

    final public function testCollectionPassesDtoToEachItem(): void
    {
        $dto = new UserDetailsQueryDto();
        $dto->include = [UserDetailsQueryDto::USER_ROLES];
        $users = [$this->userWithRelations(), $this->userWithRelations()];

        $data = UserResource::fromEntityCollection($users, $dto);

        $this->assertSame([UserResource::fromEntity($users[0], $dto), UserResource::fromEntity($users[1], $dto)], $data);
        $this->assertArrayHasKey('roles', $data[1]);
    }

    private function userWithRelations(): User
    {
        $user = self::persisted(UserFactory::make());
        $user->disciplines->add(self::persisted(UserDisciplineFactory::make(['user' => $user])));
        $user->disciplines->add(self::persisted(UserDisciplineFactory::make(['user' => $user])));
        $user->roles->add(self::persisted(UserRoleFactory::make(['user' => $user])));

        return $user;
    }
}
