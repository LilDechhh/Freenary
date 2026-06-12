import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'; // NOUVEAU
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  // NOUVEAU : Injection du ConfigService
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        // NOUVEAU : On lit la clé depuis l'environnement
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
    return true;
  }

  private extractToken(request: Request): string | undefined {
    // 1. Cherche le token dans les cookies HttpOnly
    if (request.cookies && request.cookies['wealth_token']) {
      return request.cookies['wealth_token'];
    }
    // 2. Fallback optionnel (pour les tests API avec Postman par exemple)
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
