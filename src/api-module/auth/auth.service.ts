import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { UserDetails } from './type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.logger.log('loaded', configService.get<string>('jwt.expiresIn'));
  }
  async validateUser({ displayName, email, googleId }: UserDetails) {
    this.logger.log('AuthService');
    const user = await this.userRepository.findOneBy({ email: email });
    this.logger.log(user);
    if (user) return user;
    this.logger.log('User not found. Creating...');
    const newUser = this.userRepository.create({
      email: email,
      googleId: googleId,
      name: displayName,
    });
    return this.userRepository.save(newUser);
  }

  async findUser(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    return user;
  }

  generateJwtToken(user: { id: string; email: string; displayName: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    };
    return this.jwtService.sign(payload);
  }
}
