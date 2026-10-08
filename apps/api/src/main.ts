import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ExcepcionesFilter } from './comun/filtros/excepciones.filter';

async function iniciarServidor() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGEN', 'http://localhost:5173'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new ExcepcionesFilter());

  const configuracionSwagger = new DocumentBuilder()
    .setTitle('Aethelgard API REST')
    .setDescription('Documentación interactiva de la API REST del juego Aethelgard')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const documento = SwaggerModule.createDocument(app, configuracionSwagger);
  SwaggerModule.setup('docs', app, documento);

  const puerto = configService.get<number>('PUERTO_API', 3000);
  await app.listen(puerto);
}

iniciarServidor();
