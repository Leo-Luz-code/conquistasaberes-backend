# AVA UniVC - Backend Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Given a version number `MAJOR.MINOR.PATCH`, increment the:
> 1. MAJOR version when you make incompatible API changes,
> 2. MINOR version when you add functionality in a backwards-compatible manner, and
> 3. PATCH version when you make backwards-compatible bug fixes.
>
> Additional labels for pre-release and build metadata are available as extensions to the `MAJOR.MINOR.PATCH` format.

## Changelog entry snippet

``` markdown
## [X.Y.Z] - yyyy-mm-dd

### Added
### Fixed
### Changed
### Removed
```

## Version summary

| Tag                      | Release date |
|--------------------------|--------------|
| [1.0.1](#101-2026-08-14) | 2026-08-14   |
| [1.0.0](#100-2026-08-14) | 2026-08-14   |


## [1.0.1] - 2026-08-14

### Added
- **Endpoint de Estatísticas Públicas (`auth.controller.ts` & `auth.service.ts`):**
  - Rota `GET /auth/public-stats` sem necessidade de autenticação para fornecer dados agregados e anônimos (total de cursos publicados e trilhas ativas) para a tela inicial/login.


## [1.0.0] - 2026-08-14

### Added
- **Endpoint de Inscritos por Trilha (`learning-paths.service.ts` & `learning-paths.controller.ts`):**
  - Rota `GET /learning-paths/:id/inscritos` para listar servidores matriculados na trilha com dados funcionais.
  - Inclusão do total de inscritos em `GET /learning-paths/admin/all`.

### Fixed
- **Filtro de Secretarias no Painel Executivo (`analytics.service.ts`):**
  - Correção de erro 500 no cálculo de engajamento mensal ao filtrar por secretaria (`LessonProgress` consultado via `userId: { in: secUserIds }`).
- **Cálculo de Taxa de Adesão em Trilhas (`analytics.service.ts`):**
  - Deduplicação de servidores distintos para cálculo real de adesão por trilha.
- **Configuração de Build e Deploy (`tsconfig.build.json` e `package.json`):**
  - Correção de compilação do ponto de entrada `dist/main.js`.
