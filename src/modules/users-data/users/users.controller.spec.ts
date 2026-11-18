import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindManyOptions } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../app.module';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { PaginatedResponse, UsersService } from './users.service';

// Solo se sustituye PostgreSQL: las rutas, el servicio y la validacion son reales.
describe('Usuarios via HTTP', () => {
  let app: INestApplication<App>;
  const users = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    nombre: `Usuario ${i + 1}`,
    edad: 25,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  }));
  const repository = {
    findOne: jest.fn(),
    update: () => Promise.resolve({ affected: 1 }),
    create: (data: Partial<User>) => Object.assign(new User(), data),
    save: (data: User) => Promise.resolve({ ...data, id: 12 }),
    findAndCount: ({ skip = 0, take = 10 }: FindManyOptions<User>) =>
      Promise.resolve([users.slice(skip, skip + take), users.length]),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => repository.findOne.mockReset());
  afterAll(async () => app.close());

  it('crea un usuario con los datos enviados', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ nombre: 'Ana', edad: 25 })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({ id: 12, nombre: 'Ana', edad: 25 });
      });
  });

  it.each([
    { nombre: 'Ana', edad: -1 },
    { nombre: '', edad: 25 },
    { nombre: 'Ana', edad: 151 },
    { nombre: 'Ana', edad: 1.5 },
    { nombre: 'Ana', edad: 25, id: 100 },
  ])('rechaza un cuerpo de creacion invalido: %j', async (body) => {
    await request(app.getHttpServer()).post('/users').send(body).expect(400);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('valida tambien los cambios parciales', async () => {
    repository.findOne.mockResolvedValue(users[0]);
    await request(app.getHttpServer())
      .patch('/users/1')
      .send({ edad: -1 })
      .expect(400);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('permite consultar la segunda pagina', async () => {
    await request(app.getHttpServer())
      .get('/users?page=2&limit=10')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          page: 2,
          limit: 10,
          total: 11,
          totalPages: 2,
          data: [{ id: 11, nombre: 'Usuario 11' }],
        });
      });
  });

  it('usa la primera pagina por defecto', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect(({ body }) => {
        const result = body as PaginatedResponse<User>;
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.data).toHaveLength(10);
      });
  });

  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'page=abc',
    'limit=0',
    'limit=101',
  ])('rechaza paginacion invalida: %s', async (query) => {
    await request(app.getHttpServer()).get(`/users?${query}`).expect(400);
  });

  it.each(['abc', '1.5', '0', '-1', '9007199254740992'])(
    'rechaza identificadores invalidos: %s',
    async (id) => {
      repository.findOne.mockResolvedValue(users[0]);
      await request(app.getHttpServer()).get(`/users/${id}`).expect(400);
      expect(repository.findOne).not.toHaveBeenCalled();
    },
  );
});
