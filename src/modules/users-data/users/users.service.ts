import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserPagination {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Crear usuario
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Verificar si ya existe un usuario con ese nombre (opcional)
      const existingUser = await this.usersRepository.findOne({
        where: { nombre: createUserDto.nombre },
      });
      if (existingUser) {
        throw new ConflictException(
          `Usuario con nombre '${createUserDto.nombre}' ya existe`,
        );
      }

      // Crear nueva instancia
      const user = this.usersRepository.create({
        ...createUserDto,
        created_at: new Date(),
        updated_at: new Date(),
      });
      // Guardar en la base de datos
      const savedUser = await this.usersRepository.save(user);
      return savedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.log(error);
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  // Obtener usuarios con paginacion
  async findAll(
    pagination: UserPagination = {},
  ): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10 } = pagination;

    // Construir opciones de búsqueda
    const options: FindManyOptions<User> = {
      where: {},
      order: { created_at: 'DESC', id: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    };

    // Ejecutar consulta con conteo
    const [users, total] = await this.usersRepository.findAndCount(options);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Obtener usuario por ID
  async findOne(id: number): Promise<User> {
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException('ID debe ser un número válido mayor a 0');
    }

    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  // Actualizar usuario
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Verificar que el usuario existe
    const existingUser = await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista otro usuario con ese nombre
    if (updateUserDto.nombre && updateUserDto.nombre !== existingUser.nombre) {
      const userWithSameName = await this.usersRepository.findOne({
        where: { nombre: updateUserDto.nombre },
      });

      if (userWithSameName && userWithSameName.id !== id) {
        throw new ConflictException(
          `Usuario con nombre '${updateUserDto.nombre}' ya existe`,
        );
      }
    }

    // Actualizar campos
    const updateData = {
      ...updateUserDto,
      updated_at: new Date(),
    };

    // Ejecutar actualización
    const updateResult = await this.usersRepository.update(id, updateData);

    if (updateResult.affected === 0) {
      throw new NotFoundException(
        `No se pudo actualizar el usuario con ID ${id}`,
      );
    }

    // Retornar usuario actualizado
    return await this.findOne(id);
  }

  // Eliminar usuario (soft delete si lo configuraste, o hard delete)
  async remove(id: number): Promise<{ message: string; deletedUser: User }> {
    const user = await this.findOne(id);

    await this.usersRepository.remove(user);

    return {
      message: `Usuario '${user.nombre}' eliminado exitosamente`,
      deletedUser: user,
    };
  }
}
