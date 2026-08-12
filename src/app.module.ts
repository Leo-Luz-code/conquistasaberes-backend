import { Module } from '@nestjs/common';
import * as ConfigEnv from '@nestjs/config';
import { DatabaseModule } from './plugins/database/database.module';
import { SharedModule } from './shared/shared.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ForumModule } from './modules/forum/forum.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LearningPathsModule } from './modules/learning-paths/learning-paths.module';
import { SecretariasModule } from './modules/secretarias/secretarias.module';
import { NoticiasModule } from './modules/noticias/noticias.module';
import { EixosModule } from './modules/eixos/eixos.module';
import { LibraryModule } from './library/library.module';

@Module({
  imports: [
    ConfigEnv.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    SharedModule,
    AuthModule,
    UsuariosModule,
    CoursesModule,
    CertificatesModule,
    GamificationModule,
    ForumModule,
    RecommendationModule,
    AnalyticsModule,
    LearningPathsModule,
    SecretariasModule,
    NoticiasModule,
    EixosModule,
    LibraryModule
  ],
})
export class AppModule {}
