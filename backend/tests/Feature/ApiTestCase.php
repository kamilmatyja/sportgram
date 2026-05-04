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

    protected EntityManagerInterface $em;

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
        $this->client->request('POST', $uri, [], [], $this->getHeaders($user), json_encode($data));

        return $this->getResponse();
    }

    protected function put(string $uri, array $data, ?User $user = null): array
    {
        $this->client->request('PUT', $uri, [], [], $this->getHeaders($user), json_encode($data));

        return $this->getResponse();
    }

    protected function patch(string $uri, array $data, ?User $user = null): array
    {
        $this->client->request('PATCH', $uri, [], [], $this->getHeaders($user), json_encode($data));

        return $this->getResponse();
    }

    protected function delete(string $uri, ?User $user = null): array
    {
        $this->client->request('DELETE', $uri, [], [], $this->getHeaders($user));

        return $this->getResponse();
    }

    protected function get(string $uri, ?User $user = null): array
    {
        $this->client->request('GET', $uri, [], [], $this->getHeaders($user));

        return $this->getResponse();
    }

    /**
     * @throws Exception
     */
    protected function truncate(string $name): void
    {
        $this->connection->executeStatement($this->platform->getTruncateTableSQL($name, true));
    }

    protected function createUser(RoleEnum $role, array $overrides = []): User
    {
        $user = UserFactory::make($overrides, $this->em);
        $user->password = $this->passwordHasher->hashPassword($user, 'zaq1@WSX');
        $this->save($user);

        UserRoleFactory::make(['user' => $user, 'role' => $role], $this->em);

        $this->refresh($user);

        return $user;
    }

    private function save(object $entity): void
    {
        $this->em->persist($entity);
        $this->em->flush();
    }

    private function refresh(object $entity): void
    {
        $this->em->refresh($entity);
    }

    private function getToken(User $user): string
    {
        return $this->jwtManager->create($user);
    }

    private function getHeaders(?User $user): array
    {
        $this->em->clear();

        $headers = ['CONTENT_TYPE' => 'application/json'];

        if ($user) {
            $headers['HTTP_Authorization'] = 'Bearer ' . $this->getToken($user);
        }

        return $headers;
    }

    private function getResponse(): array
    {
        return [
            'status' => $this->client->getResponse()->getStatusCode(),
            'json' => json_decode($this->client->getResponse()->getContent(), true),
        ];
    }
}
