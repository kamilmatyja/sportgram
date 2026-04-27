<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Entity\User;
use App\Enum\RoleEnum;
use Doctrine\DBAL\{Connection, Exception};
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Tests\Factory\{UserFactory, UserRoleFactory};

abstract class ApiTestCase extends WebTestCase
{
    private KernelBrowser $client;

    private EntityManagerInterface $em;

    private Connection $connection;

    private AbstractPlatform $platform;

    private UserPasswordHasherInterface $passwordHasher;

    private JWTTokenManagerInterface $jwtManager;

    /**
     * @throws Exception
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->em = $container->get('doctrine')->getManager();
        $this->connection = $this->em->getConnection();
        $this->platform = $this->connection->getDatabasePlatform();
        $this->passwordHasher = $container->get(UserPasswordHasherInterface::class);
        $this->jwtManager = $container->get(JWTTokenManagerInterface::class);
    }

    protected function post(string $uri, array $data, ?User $user = null): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        if ($user) {
            $headers['HTTP_Authorization'] = 'Bearer ' . $this->getToken($user);
        }
        $this->client->request('POST', $uri, [], [], $headers, json_encode($data));

        return [
            'status' => $this->client->getResponse()->getStatusCode(),
            'json' => json_decode($this->client->getResponse()->getContent(), true),
        ];
    }

    protected function put(string $uri, array $data, ?User $user = null): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        if ($user) {
            $headers['HTTP_Authorization'] = 'Bearer ' . $this->getToken($user);
        }
        $this->client->request('PUT', $uri, [], [], $headers, json_encode($data));

        return [
            'status' => $this->client->getResponse()->getStatusCode(),
            'json' => json_decode($this->client->getResponse()->getContent(), true),
        ];
    }

    protected function patch(string $uri, array $data, ?User $user = null): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        if ($user) {
            $headers['HTTP_Authorization'] = 'Bearer ' . $this->getToken($user);
        }
        $this->client->request('PATCH', $uri, [], [], $headers, json_encode($data));

        return [
            'status' => $this->client->getResponse()->getStatusCode(),
            'json' => json_decode($this->client->getResponse()->getContent(), true),
        ];
    }

    protected function delete(string $uri, ?User $user = null): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        if ($user) {
            $headers['HTTP_Authorization'] = 'Bearer ' . $this->getToken($user);
        }
        $this->client->request('DELETE', $uri, [], [], $headers, json_encode($data));

        return [
            'status' => $this->client->getResponse()->getStatusCode(),
            'json' => json_decode($this->client->getResponse()->getContent(), true),
        ];
    }

    protected function get(string $uri, ?User $user = null): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        if ($user) {
            $headers['HTTP_Authorization'] = 'Bearer ' . $this->getToken($user);
        }
        $this->client->request('GET', $uri, [], [], $headers);

        return [
            'status' => $this->client->getResponse()->getStatusCode(),
            'json' => json_decode($this->client->getResponse()->getContent(), true),
        ];
    }

    /**
     * @throws Exception
     */
    protected function truncate(string $name): void
    {
        $this->connection->executeStatement($this->platform->getTruncateTableSQL($name, true));
    }

    protected function save(object $entity): void
    {
        $this->em->persist($entity);
        $this->em->flush();
    }

    protected function createUser(RoleEnum $role, array $overrides = []): User
    {
        $user = UserFactory::make($overrides);
        $user->password = $this->passwordHasher->hashPassword($user, 'zaq1@WSX');
        $this->save($user);

        $userRole = UserRoleFactory::make(['user' => $user, 'role' => $role]);
        $this->save($userRole);

        $this->em->refresh($user);

        return $user;
    }

    private function getToken(User $user): string
    {
        return $this->jwtManager->create($user);
    }
}
