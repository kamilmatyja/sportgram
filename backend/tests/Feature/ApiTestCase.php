<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Doctrine\DBAL\{Connection, Exception};
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Exception\ORMException;
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

    protected function post(string $uri, array $data, ?RoleEnum $role = null): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        if ($role) {
            $token = $this->getToken($role);
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

    /**
     * @throws ORMException
     */
    private function getToken(RoleEnum $role): string
    {
        $user = UserFactory::make();
        $user->password = $this->passwordHasher->hashPassword($user, 'zaq1@WSX');
        $this->em->persist($user);
        $this->em->flush();

        $userRole = UserRoleFactory::make(['user' => $user, 'role' => $role]);
        $this->em->persist($userRole);
        $this->em->flush();

        $this->em->refresh($user);

        return $this->jwtManager->create($user);
    }
}
