import {
  Injectable as InjectableDecorator,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DrizzleService } from '../drizzle/drizzle.service';
import { eq } from 'drizzle-orm';
import * as schema from '../drizzle/schema';
import * as bcrypt from 'bcrypt';

@InjectableDecorator()
export class AuthService {
  constructor(
    private drizzle: DrizzleService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.email, email)
    });
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
