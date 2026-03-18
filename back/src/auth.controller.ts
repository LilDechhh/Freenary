import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
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
  async deleteAccount(@Request() req: any) {
    return this.authService.deleteUser(req.user.sub);
  }
}
