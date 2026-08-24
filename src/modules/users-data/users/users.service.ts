// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserFilters {
  nombre?: string;
  edadMin?: number;
  edadMax?: number;
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

  // Obtener todos los usuarios con filtros y paginación
  async findAll(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const { nombre, edadMin, edadMax, page = 1, limit = 10 } = filters;

    // Construir opciones de búsqueda
    const options: FindManyOptions<User> = {
      where: {},
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    };

    // Aplicar filtros
    if (nombre) {
      options.where = {
        ...options.where,
        nombre: Like(`%${nombre}%`), // Búsqueda parcial
      };
    }

    if (edadMin && edadMax) {
      options.where = {
        ...options.where,
        edad: Between(edadMin, edadMax),
      };
    } else if (edadMin) {
      options.where = {
        ...options.where,
        edad: Between(edadMin, 200),
      };
    } else if (edadMax) {
      options.where = {
        ...options.where,
        edad: Between(0, edadMax),
      };
    }

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
    if (!id || id < 1) {
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

  // Buscar usuarios por nombre (búsqueda exacta)
  async findByNombre(nombre: string): Promise<User[]> {
    if (!nombre || nombre.trim().length === 0) {
      throw new BadRequestException('El nombre no puede estar vacío');
    }

    return await this.usersRepository.find({
      where: { nombre: Like(`%${nombre.trim()}%`) },
      order: { created_at: 'DESC' },
    });
  }

  // Obtener usuarios por rango de edad
  async findByEdadRange(edadMin: number, edadMax: number): Promise<User[]> {
    if (edadMin < 0 || edadMax < 0 || edadMin > edadMax) {
      throw new BadRequestException('Rango de edad inválido');
    }

    return await this.usersRepository.find({
      where: {
        edad: Between(edadMin, edadMax),
      },
      order: { edad: 'ASC' },
    });
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

  // Actualización parcial con merge
  async patch(id: number, updateData: Partial<UpdateUserDto>): Promise<User> {
    const user = await this.findOne(id);

    // Merge de datos
    const updatedUser = this.usersRepository.merge(user, {
      ...updateData,
      updated_at: new Date(),
    });

    return await this.usersRepository.save(updatedUser);
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

  // Eliminar por ID directamente (más eficiente)
  async delete(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id); // Verificar que existe

    const deleteResult = await this.usersRepository.delete(id);

    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        `No se pudo eliminar el usuario con ID ${id}`,
      );
    }

    return {
      message: `Usuario '${user.nombre}' eliminado exitosamente`,
    };
  }

  // Contar usuarios
  async count(): Promise<number> {
    return await this.usersRepository.count();
  }

  // Bulk operations - Crear múltiples usuarios
  async createMany(createUserDtos: CreateUserDto[]): Promise<User[]> {
    const users = this.usersRepository.create(
      createUserDtos.map((dto) => ({
        ...dto,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    );

    return await this.usersRepository.save(users);
  }

  // Bulk update - Actualizar múltiples usuarios
  async updateMany(
    ids: number[],
    updateData: Partial<UpdateUserDto>,
  ): Promise<{ affected: number }> {
    const result = await this.usersRepository.update(ids, {
      ...updateData,
      updated_at: new Date(),
    });

    return { affected: result.affected || 0 };
  }
}
