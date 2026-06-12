import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Put,
  Delete,
  Get,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setTokenCookie(res: Response, token: string) {
    res.cookie('wealth_token', token, {
      httpOnly: true,
      // secure: true est OBLIGATOIRE quand sameSite est sur 'none' (force le passage par HTTPS)
      secure: true,
      // sameSite: 'none' autorise le cookie à voyager entre Vercel et Heroku
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });
  }

  @Post('register')
  async register(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(body.email, body.password, body.name);
    this.setTokenCookie(res, result.access_token);
    return { message: 'Inscription réussie', user: result.user };
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body.email, body.password);
    this.setTokenCookie(res, result.access_token);
    return { message: 'Connexion réussie', user: result.user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('wealth_token');
    return { message: 'Déconnexion réussie' };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return { user: req.user };
  }
  @UseGuards(AuthGuard)
  @Put('update-password')
  async updatePassword(@Body() body: any, @Request() req: any) {
    return this.authService.updatePassword(
      req.user.sub,
      body.oldPassword,
      body.newPassword,
    );
  }

  @UseGuards(AuthGuard)
  @Delete('delete-account')
  async deleteAccount(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.deleteUser(req.user.sub);
    res.clearCookie('wealth_token');
    return { message: 'Compte supprimé' };
  }
}
