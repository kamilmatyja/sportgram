<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Doctrine\DBAL\{Connection, Exception};
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Tests\Factory\UserFactory;
use Tests\Factory\UserRoleFactory;

abstract class ApiTestCase extends WebTestCase
{
    private KernelBrowser $client;
    private Container $container;
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
        $this->container = static::getContainer();
        $em = $this->container->get('doctrine')->getManager();
        $this->connection = $em->getConnection();
        $this->platform = $this->connection->getDatabasePlatform();
        $this->passwordHasher = $this->container->get(UserPasswordHasherInterface::class);
        $this->jwtManager = $this->container->get(JWTTokenManagerInterface::class);
    }

    protected function post(string $uri, array $data, bool $isSigned = true): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        if ($isSigned) {
            $token = $this->getToken();
            $headers['HTTP_Authorization'] = 'Bearer ' . $token;
        }
        $this->client->request('POST', $uri, [], [], $headers, json_encode($data));
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

    private function getToken(): string
    {
        $user = UserFactory::make();
        $user->password = $this->passwordHasher->hashPassword($user, 'zaq1@WSX');

        $em = $this->container->get('doctrine')->getManager();
        $em->persist($user);
        $em->flush();

        $userRole = UserRoleFactory::make(['user' => $user, 'role' => RoleEnum::Administrator]);
        $user->addRole($userRole);

        $em->persist($userRole);
        $em->flush();

        return $this->jwtManager->create($user);
    }
}
