import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. Inscription (Création de compte avec mot de passe crypté)
  async register(email: string, password: string, name: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('Cet email est déjà utilisé.');
    }

    // On crypte le mot de passe (Salt = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    // 3. On injecte le nom dans le JWT
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name, // 🌟 AJOUT ICI
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // 2. Connexion (Vérification du mot de passe)
  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name, // 🌟 AJOUT ICI
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // 3. Génération du passeport (Le Token JWT)
  private generateToken(userId: string, email: string) {
    const payload = { sub: userId, email: email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: userId, email: email },
    };
  }
}
