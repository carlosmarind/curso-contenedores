import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue(undefined),
    create: jest
      .fn()
      .mockImplementation((data: Partial<User>) =>
        Object.assign(new User(), data),
      ),
    save: jest
      .fn()
      .mockImplementation((user: User) => Promise.resolve({ ...user, id: 2 })),
    findAndCount: jest.fn().mockResolvedValue([
      [{ id: 1, nombre: 'Test User', edad: 31 }], // entities
      1, // total
    ]),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository, // 👈 inyectamos el mock
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all users', async () => {
    const users = await service.findAll();
    expect(users).toEqual({
      data: [{ edad: 31, id: 1, nombre: 'Test User' }],
      limit: 10,
      page: 1,
      total: 1,
      totalPages: 1,
    });
    expect(mockUserRepository.findAndCount).toHaveBeenCalled();
  });

  it('should save a user', async () => {
    const newUser = await service.create({ nombre: 'Nuevo', edad: 31 });
    expect(newUser).toMatchObject({ id: 2, nombre: 'Nuevo', edad: 31 });
  });
});
