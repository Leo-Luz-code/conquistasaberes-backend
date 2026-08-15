import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, CertificateStatus } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgres://postgres:123@localhost:5432/conquista-saberes?schema=public';
const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('🌱 Iniciando Seeding Expandido do Conquista Saberes AVA UniVC...');

  // ===========================================================================
  // 0. LIMPEZA DA BASE DE DADOS (ORDEM RESPEITANDO TODAS AS CHAVES ESTRANGEIRAS)
  // ===========================================================================
  await prisma.userSkill.deleteMany();
  await prisma.courseSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.eventEnrollment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.biblioteca.deleteMany();
  await prisma.noticia.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.forumComment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.certificadoExterno.deleteMany();
  await prisma.passaportePontuacao.deleteMany();
  await prisma.frequenciaQrcode.deleteMany();
  await prisma.projetoFinal.deleteMany();
  await prisma.learningPathEnrollment.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.eixoConhecimento.deleteMany();
  await prisma.user.deleteMany();
  await prisma.servidor.deleteMany();
  await prisma.secretaria.deleteMany();

  console.log('🧹 Base de dados limpa com sucesso.');

  // ===========================================================================
  // 1. SECRETARIAS MUNICIPAIS DE VITÓRIA DA CONQUISTA (PMVC)
  // ===========================================================================
  const setp = await prisma.secretaria.create({
    data: {
      nome: 'Secretaria Municipal de Transparência, Controle e Governança',
      sigla: 'SETP',
      descricao: 'Promoção da integridade pública, controle interno, auditoria e governança municipal.',
      responsavelNome: 'Dr. Roberto Mendes',
      responsavelEmail: 'roberto.mendes@pmvc.ba.gov.br',
      telefone: '(77) 3429-9000',
      endereco: 'Praça Joaquim Correia, 55 - Centro',
      corIdentificacao: '#8B5CF6',
    },
  });

  const sms = await prisma.secretaria.create({
    data: {
      nome: 'Secretaria Municipal de Saúde',
      sigla: 'SMS',
      descricao: 'Gestão da rede pública de saúde, atenção básica, vigilância epidemiológica e sanitária.',
      responsavelNome: 'Dra. Ana Paula Oliveira',
      responsavelEmail: 'ana.oliveira@pmvc.ba.gov.br',
      telefone: '(77) 3429-7000',
      endereco: 'Av. Maceió, 98 - Brasil',
      corIdentificacao: '#10B981',
    },
  });

  const smed = await prisma.secretaria.create({
    data: {
      nome: 'Secretaria Municipal de Educação',
      sigla: 'SMED',
      descricao: 'Coordenação do ensino municipal infantil e fundamental, formação continuada de educadores.',
      responsavelNome: 'Prof. Carlos Eduardo Santos',
      responsavelEmail: 'carlos.santos@pmvc.ba.gov.br',
      telefone: '(77) 3429-8000',
      endereco: 'Rua Siqueira Campos, 184 - Centro',
      corIdentificacao: '#3B82F6',
    },
  });

  const semdes = await prisma.secretaria.create({
    data: {
      nome: 'Secretaria Municipal de Desenvolvimento Social',
      sigla: 'SEMDES',
      descricao: 'Garantia de assistência social, proteção a famílias em vulnerabilidade e projetos comunitários.',
      responsavelNome: 'Maria do Carmo Prado',
      responsavelEmail: 'maria.prado@pmvc.ba.gov.br',
      telefone: '(77) 3429-9200',
      endereco: 'Av. Juracy Magalhães, 182 - Felícia',
      corIdentificacao: '#EC4899',
    },
  });

  const sefin = await prisma.secretaria.create({
    data: {
      nome: 'Secretaria Municipal de Finanças e Execução Orçamentária',
      sigla: 'SEFIN',
      descricao: 'Arrecadação tributária, planejamento orçamentário, contabilidade pública e prestação de contas.',
      responsavelNome: 'Jonas Ribeiro de Sousa',
      responsavelEmail: 'jonas.sousa@pmvc.ba.gov.br',
      telefone: '(77) 3429-9100',
      endereco: 'Praça Joaquim Correia, 55 - Centro',
      corIdentificacao: '#F59E0B',
    },
  });

  const semob = await prisma.secretaria.create({
    data: {
      nome: 'Secretaria Municipal de Mobilidade Urbana',
      sigla: 'SEMOB',
      descricao: 'Planejamento e fiscalização do trânsito, engenharia de tráfego e transporte público coletivo.',
      responsavelNome: 'Eng. Fernando Dantas',
      responsavelEmail: 'fernando.dantas@pmvc.ba.gov.br',
      telefone: '(77) 3429-9300',
      endereco: 'Rua Coronel Gugé, 201 - Centro',
      corIdentificacao: '#06B6D4',
    },
  });

  console.log('✅ 6 Secretarias municipais cadastradas: SETP, SMS, SMED, SEMDES, SEFIN, SEMOB');

  // ===========================================================================
  // 2. SERVIDORES FUNCIONAIS & USUÁRIOS DE AUTH
  // ===========================================================================
  const defaultPasswordHash = await bcrypt.hash('123456', 10);
  const adminPasswordHash = await bcrypt.hash('admin', 10);

  // Admin CETI
  const sAdmin = await prisma.servidor.create({
    data: {
      cpf: '11122233344',
      matriculaPmvc: '2026000',
      nomeCompleto: 'Roberto Mendes (CETI)',
      cargoFuncao: 'Administrador de TI e Capacitação CETI',
      secretariaId: setp.id,
    },
  });
  const uAdmin = await prisma.user.create({
    data: {
      cpf: '11122233344',
      matricula: '2026000',
      nome: 'Roberto Mendes (CETI)',
      email: 'admin.rh@pmvc.ba.gov.br',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN_RH_CETI,
      cargo: 'Administrador de TI e Capacitação CETI',
      secretariaId: setp.id,
      servidorId: sAdmin.id,
      xpPoints: 1750,
      level: 6,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  // Gestor SMS
  const sGestorSms = await prisma.servidor.create({
    data: {
      cpf: '98765432100',
      matriculaPmvc: '2026002',
      nomeCompleto: 'Dra. Ana Paula Souza',
      cargoFuncao: 'Coordenadora Geral de Saúde Pública',
      secretariaId: sms.id,
    },
  });
  const uGestorSms = await prisma.user.create({
    data: {
      cpf: '98765432100',
      matricula: '2026002',
      nome: 'Dra. Ana Paula Souza',
      email: 'ana.souza@pmvc.ba.gov.br',
      passwordHash: defaultPasswordHash,
      role: Role.GESTOR_SECRETARIA,
      cargo: 'Coordenadora Geral de Saúde Pública',
      secretariaId: sms.id,
      servidorId: sGestorSms.id,
      xpPoints: 920,
      level: 4,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  // Gestor SEFIN
  const sGestorSefin = await prisma.servidor.create({
    data: {
      cpf: '55566677788',
      matriculaPmvc: '2026005',
      nomeCompleto: 'Lucas Rodrigues Alves',
      cargoFuncao: 'Auditor Fiscal e Gestor de Finanças',
      secretariaId: sefin.id,
    },
  });
  const uGestorSefin = await prisma.user.create({
    data: {
      cpf: '55566677788',
      matricula: '2026005',
      nome: 'Lucas Rodrigues Alves',
      email: 'lucas.alves@pmvc.ba.gov.br',
      passwordHash: defaultPasswordHash,
      role: Role.GESTOR_SECRETARIA,
      cargo: 'Auditor Fiscal e Gestor de Finanças',
      secretariaId: sefin.id,
      servidorId: sGestorSefin.id,
      xpPoints: 650,
      level: 3,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  // Servidor 1 (SETP)
  const sServ1 = await prisma.servidor.create({
    data: {
      cpf: '12345678900',
      matriculaPmvc: '2026001',
      nomeCompleto: 'Carlos Alberto Silva',
      cargoFuncao: 'Técnico Administrativo',
      secretariaId: setp.id,
    },
  });
  const uServ1 = await prisma.user.create({
    data: {
      cpf: '12345678900',
      matricula: '2026001',
      nome: 'Carlos Alberto Silva',
      email: 'carlos.silva@pmvc.ba.gov.br',
      passwordHash: defaultPasswordHash,
      role: Role.SERVIDOR,
      cargo: 'Técnico Administrativo',
      secretariaId: setp.id,
      servidorId: sServ1.id,
      xpPoints: 580,
      level: 3,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  // Servidor 2 (SMED)
  const sServ2 = await prisma.servidor.create({
    data: {
      cpf: '33344455566',
      matriculaPmvc: '2026004',
      nomeCompleto: 'Mariana Fernandes Costa',
      cargoFuncao: 'Professora e Coordenadora Pedagógica',
      secretariaId: smed.id,
    },
  });
  const uServ2 = await prisma.user.create({
    data: {
      cpf: '33344455566',
      matricula: '2026004',
      nome: 'Mariana Fernandes Costa',
      email: 'mariana.costa@pmvc.ba.gov.br',
      passwordHash: defaultPasswordHash,
      role: Role.SERVIDOR,
      cargo: 'Professora e Coordenadora Pedagógica',
      secretariaId: smed.id,
      servidorId: sServ2.id,
      xpPoints: 380,
      level: 2,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  // Servidor 3 (SEMDES)
  const sServ3 = await prisma.servidor.create({
    data: {
      cpf: '77788899900',
      matriculaPmvc: '2026006',
      nomeCompleto: 'Juliana Castro Peixoto',
      cargoFuncao: 'Assistente Social e Orientadora Comunitária',
      secretariaId: semdes.id,
    },
  });
  const uServ3 = await prisma.user.create({
    data: {
      cpf: '77788899900',
      matricula: '2026006',
      nome: 'Juliana Castro Peixoto',
      email: 'juliana.peixoto@pmvc.ba.gov.br',
      passwordHash: defaultPasswordHash,
      role: Role.SERVIDOR,
      cargo: 'Assistente Social e Orientadora Comunitária',
      secretariaId: semdes.id,
      servidorId: sServ3.id,
      xpPoints: 290,
      level: 2,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  // Servidor 4 (SEMOB)
  const sServ4 = await prisma.servidor.create({
    data: {
      cpf: '44455566677',
      matriculaPmvc: '2026007',
      nomeCompleto: 'Paulo Henrique Lima',
      cargoFuncao: 'Agente Municipal de Trânsito e Mobilidade',
      secretariaId: semob.id,
    },
  });
  const uServ4 = await prisma.user.create({
    data: {
      cpf: '44455566677',
      matricula: '2026007',
      nome: 'Paulo Henrique Lima',
      email: 'paulo.lima@pmvc.ba.gov.br',
      passwordHash: defaultPasswordHash,
      role: Role.SERVIDOR,
      cargo: 'Agente Municipal de Trânsito e Mobilidade',
      secretariaId: semob.id,
      servidorId: sServ4.id,
      xpPoints: 120,
      level: 1,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  console.log('✅ 7 Usuários e Servidores cadastrados com diferentes papéis e perfis');

  // ===========================================================================
  // 3. EIXOS DE CONHECIMENTO OFICIAIS
  // ===========================================================================
  const eixoGovernanca = await prisma.eixoConhecimento.create({
    data: {
      nomeEixo: 'Governança e Liderança',
      descricao:
        'Desenvolvimento de competências estratégicas em liderança pública, integridade institucional, conformidade, compliance e gestão orientada a resultados.',
    },
  });

  const eixoCompetencia = await prisma.eixoConhecimento.create({
    data: {
      nomeEixo: 'Competência e Desempenho',
      descricao:
        'Aprimoramento técnico e operacional, gestão por competências, excelência no atendimento ao munícipe e eficiência fiscal e orçamentária.',
    },
  });

  const eixoInovacao = await prisma.eixoConhecimento.create({
    data: {
      nomeEixo: 'Inovação e Governo Digital',
      descricao:
        'Capacitações em transformação digital, inteligência artificial, segurança da informação, desburocratização e LGPD na gestão municipal.',
    },
  });

  const eixoCidadania = await prisma.eixoConhecimento.create({
    data: {
      nomeEixo: 'Cidadania e Bem-Estar',
      descricao:
        'Fortalecimento de políticas públicas sociais, atenção à saúde integral, acessibilidade, inclusão e participação popular nos serviços da PMVC.',
    },
  });

  const eixoCultura = await prisma.eixoConhecimento.create({
    data: {
      nomeEixo: 'Cultura e Valorização Humana',
      descricao:
        'Desenvolvimento interpessoal, inteligência emocional, saúde mental no trabalho, acolhimento funcional e ética nas relações do serviço público.',
    },
  });

  console.log('✅ 5 Eixos de Conhecimento criados com sucesso.');

  // ===========================================================================
  // 4. TRILHAS DE APRENDIZAGEM POR EIXO
  // ===========================================================================
  // Eixo 1: Governança e Liderança
  const trilhaLideranca = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Liderança Estratégica e Gestão Pública Municipal',
      cargaHorariaTotal: 40,
      eixoId: eixoGovernanca.id,
      capaUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    },
  });

  const trilhaCompliance = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Compliance, Ética e Governança Pública',
      cargaHorariaTotal: 30,
      eixoId: eixoGovernanca.id,
      capaUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&q=80',
    },
  });

  // Eixo 2: Competência e Desempenho
  const trilhaAtendimento = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Excelência no Atendimento ao Cidadão e Eficiência Operacional',
      cargaHorariaTotal: 25,
      eixoId: eixoCompetencia.id,
      capaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    },
  });

  const trilhaOrcamento = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Gestão Orçamentária e Finanças Públicas',
      cargaHorariaTotal: 35,
      eixoId: eixoCompetencia.id,
      capaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    },
  });

  // Eixo 3: Inovação e Governo Digital
  const trilhaGovDigital = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Transformação Digital e IA no Setor Público',
      cargaHorariaTotal: 40,
      eixoId: eixoInovacao.id,
      capaUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
    },
  });

  const trilhaLgpd = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de LGPD, Segurança da Informação e Cidadania Digital',
      cargaHorariaTotal: 30,
      eixoId: eixoInovacao.id,
      capaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    },
  });

  // Eixo 4: Cidadania e Bem-Estar
  const trilhaSaude = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Políticas de Saúde e Vigilância Comunitária',
      cargaHorariaTotal: 30,
      eixoId: eixoCidadania.id,
      capaUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
    },
  });

  const trilhaAcessibilidade = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Acessibilidade, Inclusão e Direitos Sociais',
      cargaHorariaTotal: 25,
      eixoId: eixoCidadania.id,
      capaUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80',
    },
  });

  // Eixo 5: Cultura e Valorização Humana
  const trilhaSaudeMental = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Inteligência Emocional e Saúde Mental no Trabalho',
      cargaHorariaTotal: 20,
      eixoId: eixoCultura.id,
      capaUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    },
  });

  const trilhaIntegracao = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Integração e Acolhimento do Servidor Municipal',
      cargaHorariaTotal: 20,
      eixoId: eixoCultura.id,
      capaUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
    },
  });

  console.log('✅ 10 Trilhas de Aprendizagem criadas e distribuídas nos 5 eixos.');

  // ===========================================================================
  // 5. BADGES DE GAMIFICAÇÃO INSTITUCIONAIS
  // ===========================================================================
  const badgeInovador = await prisma.badge.create({
    data: {
      nome: 'Servidor Inovador',
      descricao: 'Concluiu com êxito o curso de Inovação e Transformação Digital na Gestão Pública.',
      icone: 'auto_awesome',
      xpBonus: 100,
    },
  });

  const badgeLgpd = await prisma.badge.create({
    data: {
      nome: 'Mestre em LGPD',
      descricao: 'Alcançou aproveitamento máximo no treinamento de Proteção de Dados e Privacidade.',
      icone: 'gavel',
      xpBonus: 100,
    },
  });

  const badgeLider = await prisma.badge.create({
    data: {
      nome: 'Líder Municipal',
      descricao: 'Finalizou a capacitação de liderança estratégica e gestão de equipes públicas.',
      icone: 'workspace_premium',
      xpBonus: 120,
    },
  });

  const badgeCidadao = await prisma.badge.create({
    data: {
      nome: 'Foco no Cidadão',
      descricao: 'Demonstrou excelência em atendimento humanizado e resolução de demandas da população.',
      icone: 'volunteer_activism',
      xpBonus: 80,
    },
  });

  const badgePioneiro = await prisma.badge.create({
    data: {
      nome: 'Pioneiro Conquista',
      descricao: 'Completou o seu primeiro curso na plataforma AVA UniVC.',
      icone: 'military_tech',
      xpBonus: 50,
    },
  });

  const badgeEtica = await prisma.badge.create({
    data: {
      nome: 'Guardião da Ética',
      descricao: 'Atestou conformidade total com o Código de Conduta e Ética Pública da PMVC.',
      icone: 'verified_user',
      xpBonus: 90,
    },
  });

  const badgeAcessibilidade = await prisma.badge.create({
    data: {
      nome: 'Promotor da Acessibilidade',
      descricao: 'Capacitou-se em práticas de inclusão, atendimento acessível e Libras.',
      icone: 'accessibility_new',
      xpBonus: 85,
    },
  });

  console.log('✅ 7 Badges de Gamificação criadas.');

  // ===========================================================================
  // 6. SKILLS E MATRIZ DE COMPETÊNCIAS RH
  // ===========================================================================
  const skillLideranca = await prisma.skill.create({
    data: { nome: 'Liderança Pública & Gestão de Equipes', categoria: 'Gestão' },
  });
  const skillInovacao = await prisma.skill.create({
    data: { nome: 'Inovação & Governo Digital', categoria: 'Tecnologia' },
  });
  const skillLgpd = await prisma.skill.create({
    data: { nome: 'LGPD & Segurança da Informação', categoria: 'Compliance' },
  });
  const skillAtendimento = await prisma.skill.create({
    data: { nome: 'Atendimento Humanizado & Comunicação', categoria: 'Atendimento' },
  });
  const skillOrcamento = await prisma.skill.create({
    data: { nome: 'Orçamento & Finanças Públicas', categoria: 'Finanças' },
  });
  const skillAcessibilidade = await prisma.skill.create({
    data: { nome: 'Inclusão & Acessibilidade', categoria: 'Cidadania' },
  });

  console.log('✅ 6 Skills da Matriz de Competências cadastradas.');

  // ===========================================================================
  // 7. CURSOS ESTRUTURADOS COM MÓDULOS, AULAS E QUIZZES
  // ===========================================================================

  // CURSO 1: Inovação e Transformação Digital
  const cInovacao = await prisma.course.create({
    data: {
      titulo: 'Inovação e Transformação Digital na Gestão Pública',
      descricao:
        'Capacitação completa sobre métodos ágeis, desburocratização, serviços digitais e cultura de inovação na Prefeitura de Vitória da Conquista.',
      cargaHoraria: 40,
      categoria: 'Inovação e Governo Digital',
      modalidade: 'EAD',
      secretariaId: setp.id,
      trilhaId: trilhaGovDigital.id,
      capaUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
    },
  });
  await prisma.courseSkill.create({ data: { courseId: cInovacao.id, skillId: skillInovacao.id } });

  const modInov1 = await prisma.module.create({
    data: {
      titulo: 'Módulo 1: Fundamentos do Governo Digital e Atendimento Sem Papel',
      ordem: 1,
      courseId: cInovacao.id,
    },
  });
  const lInov1 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 1: A Era da Transformação Digital na PMVC',
      tipo: 'TEXTO',
      duracaoMin: 15,
      ordem: 1,
      moduleId: modInov1.id,
      texto:
        'A Prefeitura de Vitória da Conquista vem adotando estratégias de modernização dos serviços públicos para garantir agilidade, transparência e eficiência aos munícipes.',
    },
  });
  const lInov2 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 2: Inteligência Artificial e Automação de Processos',
      tipo: 'VIDEO',
      conteudoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duracaoMin: 20,
      ordem: 2,
      moduleId: modInov1.id,
    },
  });
  const lInov3 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 3: Avaliação de Conhecimento em Inovação',
      tipo: 'QUIZ',
      duracaoMin: 15,
      ordem: 3,
      moduleId: modInov1.id,
      quizData: JSON.stringify({
        pergunta: 'Qual o objetivo principal da transformação digital na administração municipal?',
        opcoes: [
          'Apenas reduzir computadores antigos',
          'Tornar os serviços mais ágeis, transparentes e acessíveis ao cidadão',
          'Eliminar o atendimento presencial por completo',
          'Aumentar tributos sobre serviços de internet',
        ],
        respostaCorreta: 1,
      }),
    },
  });

  // CURSO 2: LGPD no Setor Público
  const cLgpd = await prisma.course.create({
    data: {
      titulo: 'LGPD Aplicada ao Setor Público Municipal',
      descricao:
        'Princípios da Lei Geral de Proteção de Dados (Lei 13.709/2018), tratamento de dados de munícipes e segurança da informação.',
      cargaHoraria: 30,
      categoria: 'Inovação e Governo Digital',
      modalidade: 'EAD',
      secretariaId: setp.id,
      trilhaId: trilhaLgpd.id,
      capaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    },
  });
  await prisma.courseSkill.create({ data: { courseId: cLgpd.id, skillId: skillLgpd.id } });

  const modLgpd1 = await prisma.module.create({
    data: {
      titulo: 'Módulo 1: Bases Legais e Tratamento de Dados do Munícipe',
      ordem: 1,
      courseId: cLgpd.id,
    },
  });
  const lLgpd1 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 1: Fundamentos da LGPD e Responsabilidade do Servidor',
      tipo: 'TEXTO',
      duracaoMin: 15,
      ordem: 1,
      moduleId: modLgpd1.id,
      texto:
        'A proteção aos dados pessoais dos cidadãos conquistenses é um dever de todos os agentes públicos municipais em seus respectivos órgãos.',
    },
  });
  const lLgpd2 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 2: Boas Práticas e Segurança da Informação',
      tipo: 'PDF',
      conteudoUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      duracaoMin: 20,
      ordem: 2,
      moduleId: modLgpd1.id,
    },
  });

  // CURSO 3: Liderança Pública
  const cLideranca = await prisma.course.create({
    data: {
      titulo: 'Liderança Pública e Gestão de Equipes de Alta Performance',
      descricao:
        'Competências comportamentais, liderança servidora, inteligência coletiva e gestão de conflitos em secretarias municipais.',
      cargaHoraria: 40,
      categoria: 'Governança e Liderança',
      modalidade: 'EAD',
      secretariaId: setp.id,
      trilhaId: trilhaLideranca.id,
      capaUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    },
  });
  await prisma.courseSkill.create({ data: { courseId: cLideranca.id, skillId: skillLideranca.id } });

  const modLid1 = await prisma.module.create({
    data: {
      titulo: 'Módulo 1: O Papel do Líder no Setor Público',
      ordem: 1,
      courseId: cLideranca.id,
    },
  });
  const lLid1 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 1: Liderança com Foco em Pessoas e Resultados',
      tipo: 'TEXTO',
      duracaoMin: 20,
      ordem: 1,
      moduleId: modLid1.id,
      texto:
        'Liderar no setor público exige sensibilidade social, visão estratégica e capacidade de motivar servidores para entregas de alto impacto.',
    },
  });

  // CURSO 4: Atendimento Humanizado
  const cAtendimento = await prisma.course.create({
    data: {
      titulo: 'Atendimento Humanizado ao Munícipe e Comunicação Não-Violenta',
      descricao:
        'Técnicas práticas para acolhimento empático, escuta ativa, resolução ágil de demandas e cidadania nos balcões de atendimento da PMVC.',
      cargaHoraria: 25,
      categoria: 'Competência e Desempenho',
      modalidade: 'EAD',
      secretariaId: null, // Geral para toda a Prefeitura
      trilhaId: trilhaAtendimento.id,
      capaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    },
  });
  await prisma.courseSkill.create({ data: { courseId: cAtendimento.id, skillId: skillAtendimento.id } });

  const modAtd1 = await prisma.module.create({
    data: {
      titulo: 'Módulo 1: Princípios do Atendimento Humanizado',
      ordem: 1,
      courseId: cAtendimento.id,
    },
  });
  const lAtd1 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 1: Empatia e Acolhimento nos Serviços Públicos',
      tipo: 'TEXTO',
      duracaoMin: 15,
      ordem: 1,
      moduleId: modAtd1.id,
      texto:
        'O munícipe deve encontrar nos servidores da Prefeitura um porto seguro para a solução transparente de suas solicitações.',
    },
  });

  // CURSO 5: Gestão Orçamentária
  const cOrcamento = await prisma.course.create({
    data: {
      titulo: 'Orçamento Público Municipal: PPA, LDO e LOA na Prática',
      descricao:
        'Compreensão aprofundada dos ciclos orçamentários, responsabilidade fiscal, empenho, liquidação e transparência dos gastos públicos.',
      cargaHoraria: 35,
      categoria: 'Competência e Desempenho',
      modalidade: 'EAD',
      secretariaId: sefin.id,
      trilhaId: trilhaOrcamento.id,
      capaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    },
  });
  await prisma.courseSkill.create({ data: { courseId: cOrcamento.id, skillId: skillOrcamento.id } });

  // CURSO 6: Políticas de Saúde Pública
  const cSaude = await prisma.course.create({
    data: {
      titulo: 'Políticas de Saúde Integral e Humanização do SUS Conquistense',
      descricao:
        'Atenção primária à saúde, fluxo de acolhimento nas USFs e vigilância em saúde em Vitória da Conquista.',
      cargaHoraria: 30,
      categoria: 'Cidadania e Bem-Estar',
      modalidade: 'EAD',
      secretariaId: sms.id,
      trilhaId: trilhaSaude.id,
      capaUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
    },
  });

  // CURSO 7: Saúde Mental e Qualidade de Vida no Trabalho
  const cSaudeMental = await prisma.course.create({
    data: {
      titulo: 'Saúde Mental, Autocuidado e Prevenção do Burnout no Serviço Público',
      descricao:
        'Estratégias de bem-estar psicológico, equilíbrio entre vida pessoal e profissional e fortalecimento de redes de apoio institucional.',
      cargaHoraria: 20,
      categoria: 'Cultura e Valorização Humana',
      modalidade: 'EAD',
      secretariaId: null,
      trilhaId: trilhaSaudeMental.id,
      capaUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    },
  });

  // CURSO 8: Redação Oficial Municipal (Curso Avulso Geral)
  const cRedacao = await prisma.course.create({
    data: {
      titulo: 'Redação Oficial e Gestão de Documentos Digitais',
      descricao:
        'Padrões do Manual de Redação da Presidência aplicados a ofícios, memorandos, pareceres e atos normativos da PMVC.',
      cargaHoraria: 20,
      categoria: 'Geral',
      modalidade: 'EAD',
      secretariaId: null,
      trilhaId: null,
      capaUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    },
  });

  console.log('✅ 8 Cursos modelados com módulos, aulas, conteúdos e vínculos de competência.');

  // ===========================================================================
  // 8. MATRÍCULAS, PROGRESSOS, GAMIFICAÇÃO E CERTIFICADOS
  // ===========================================================================

  // Carlos Alberto (Servidor 1) -> Concluiu Inovação e LGPD
  await prisma.enrollment.create({
    data: {
      userId: uServ1.id,
      courseId: cInovacao.id,
      progress: 100.0,
      statusConclusao: 'CONCLUIDO',
      pontuacaoConquistada: 400,
      completedAt: new Date(Date.now() - 15 * 86400000),
    },
  });
  await prisma.lessonProgress.create({ data: { userId: uServ1.id, lessonId: lInov1.id, completed: true } });
  await prisma.lessonProgress.create({ data: { userId: uServ1.id, lessonId: lInov2.id, completed: true } });
  await prisma.lessonProgress.create({ data: { userId: uServ1.id, lessonId: lInov3.id, completed: true } });

  await prisma.enrollment.create({
    data: {
      userId: uServ1.id,
      courseId: cLgpd.id,
      progress: 100.0,
      statusConclusao: 'CONCLUIDO',
      pontuacaoConquistada: 300,
      completedAt: new Date(Date.now() - 5 * 86400000),
    },
  });
  await prisma.lessonProgress.create({ data: { userId: uServ1.id, lessonId: lLgpd1.id, completed: true } });
  await prisma.lessonProgress.create({ data: { userId: uServ1.id, lessonId: lLgpd2.id, completed: true } });

  // Inscrição em Trilha
  await prisma.learningPathEnrollment.create({
    data: {
      userId: uServ1.id,
      learningPathId: trilhaGovDigital.id,
      progress: 100.0,
      status: 'CONCLUIDO',
      completedAt: new Date(Date.now() - 15 * 86400000),
    },
  });

  // Badges e Passaporte Carlos
  await prisma.userBadge.create({ data: { userId: uServ1.id, badgeId: badgePioneiro.id } });
  await prisma.userBadge.create({ data: { userId: uServ1.id, badgeId: badgeInovador.id } });
  await prisma.userBadge.create({ data: { userId: uServ1.id, badgeId: badgeLgpd.id } });

  await prisma.passaportePontuacao.create({
    data: {
      userId: uServ1.id,
      pontosAnoCorrente: 580,
      pontosAcumuladosTotal: 1540,
      badgesSelosJson: JSON.stringify(['Pioneiro Conquista', 'Servidor Inovador', 'Mestre em LGPD']),
    },
  });

  // Certificados Nativos
  await prisma.certificate.create({
    data: {
      codigoValidacao: 'CS-PMVC-2026-987654',
      userId: uServ1.id,
      courseId: cInovacao.id,
      status: CertificateStatus.EMITTED,
      issuedAt: new Date(Date.now() - 15 * 86400000),
    },
  });
  await prisma.certificate.create({
    data: {
      codigoValidacao: 'CS-PMVC-2026-112233',
      userId: uServ1.id,
      courseId: cLgpd.id,
      status: CertificateStatus.EMITTED,
      issuedAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  // Mariana Fernandes (Servidor 2) -> Concluiu Atendimento Humanizado
  await prisma.enrollment.create({
    data: {
      userId: uServ2.id,
      courseId: cAtendimento.id,
      progress: 100.0,
      statusConclusao: 'CONCLUIDO',
      pontuacaoConquistada: 250,
      completedAt: new Date(Date.now() - 3 * 86400000),
    },
  });
  await prisma.lessonProgress.create({ data: { userId: uServ2.id, lessonId: lAtd1.id, completed: true } });
  await prisma.userBadge.create({ data: { userId: uServ2.id, badgeId: badgeCidadao.id } });
  await prisma.userBadge.create({ data: { userId: uServ2.id, badgeId: badgePioneiro.id } });

  await prisma.certificate.create({
    data: {
      codigoValidacao: 'CS-PMVC-2026-445566',
      userId: uServ2.id,
      courseId: cAtendimento.id,
      status: CertificateStatus.EMITTED,
      issuedAt: new Date(Date.now() - 3 * 86400000),
    },
  });

  // Dra. Ana Paula (Gestor SMS) -> Concluiu Liderança
  await prisma.enrollment.create({
    data: {
      userId: uGestorSms.id,
      courseId: cLideranca.id,
      progress: 100.0,
      statusConclusao: 'CONCLUIDO',
      pontuacaoConquistada: 400,
      completedAt: new Date(Date.now() - 8 * 86400000),
    },
  });
  await prisma.lessonProgress.create({ data: { userId: uGestorSms.id, lessonId: lLid1.id, completed: true } });
  await prisma.userBadge.create({ data: { userId: uGestorSms.id, badgeId: badgeLider.id } });

  await prisma.certificate.create({
    data: {
      codigoValidacao: 'CS-PMVC-2026-778899',
      userId: uGestorSms.id,
      courseId: cLideranca.id,
      status: CertificateStatus.EMITTED,
      issuedAt: new Date(Date.now() - 8 * 86400000),
    },
  });

  // UserSkills computadas
  await prisma.userSkill.create({
    data: { userId: uServ1.id, skillId: skillInovacao.id, nivel: 90, cursosConcluidos: 1 },
  });
  await prisma.userSkill.create({
    data: { userId: uServ1.id, skillId: skillLgpd.id, nivel: 85, cursosConcluidos: 1 },
  });
  await prisma.userSkill.create({
    data: { userId: uServ2.id, skillId: skillAtendimento.id, nivel: 95, cursosConcluidos: 1 },
  });
  await prisma.userSkill.create({
    data: { userId: uGestorSms.id, skillId: skillLideranca.id, nivel: 92, cursosConcluidos: 1 },
  });

  console.log('✅ Matrículas, certificados, notas e habilidades populadas.');

  // ===========================================================================
  // 9. EVENTOS E INSCRIÇÕES INSTITUCIONAIS
  // ===========================================================================
  const ev1 = await prisma.event.create({
    data: {
      titulo: 'I Seminário Municipal de Inovação e Inteligência Artificial PMVC 2026',
      descricao:
        'Apresentação das novas tecnologias de governo digital, automação e inteligência artificial aplicadas à melhoria contínua dos serviços públicos conquistenses.',
      categoria: 'Seminário',
      dataInicio: new Date(Date.now() + 5 * 86400000),
      dataFim: new Date(Date.now() + 5 * 86400000 + 4 * 3600000),
      local: 'Auditório Principal do Centro Cultural Glauber Rocha',
      modalidade: 'HIBRIDO',
      vagas: 200,
      capaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      secretariaId: setp.id,
      isPublished: true,
    },
  });

  await prisma.eventEnrollment.create({
    data: {
      userId: uServ1.id,
      eventId: ev1.id,
      presencaValidada: false,
    },
  });

  // ===========================================================================
  // 10. BIBLIOTECA DE DOCUMENTOS E NORMAS TÉCNICAS
  // ===========================================================================
  await prisma.biblioteca.create({
    data: {
      titulo: 'Manual de Redação Oficial e Padronização de Atos — PMVC',
      documentoUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      categoria: 'Manuais',
    },
  });

  await prisma.biblioteca.create({
    data: {
      titulo: 'Guia de Diretrizes e Boas Práticas da LGPD para Servidores Municipais',
      documentoUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      categoria: 'Governança & LGPD',
    },
  });

  await prisma.biblioteca.create({
    data: {
      titulo: 'Regimento Interno e Estrutura Organizacional da Prefeitura de Vitória da Conquista',
      documentoUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      categoria: 'Institucional',
    },
  });

  // ===========================================================================
  // 11. COMUNIDADE & FÓRUM DE DISCUSSÃO POR CURSO
  // ===========================================================================
  const postForum1 = await prisma.forumPost.create({
    data: {
      titulo: 'Como aplicar os princípios da LGPD no balcão de atendimento presencial?',
      conteudo:
        'Colegas, gostaria de debater quais procedimentos práticos vocês estão adotando para descarte seguro de formulários físicos com dados de munícipes.',
      userId: uServ1.id,
      courseId: cLgpd.id,
    },
  });

  await prisma.forumComment.create({
    data: {
      postId: postForum1.id,
      userId: uGestorSms.id,
      conteudo:
        'Na Saúde, estamos digitalizando os cadastros e utilizando caixas de descarte sigiloso para trituração diária. Tem funcionado muito bem!',
    },
  });

  // ===========================================================================
  // 12. NOTÍCIAS INSTITUCIONAIS
  // ===========================================================================
  await prisma.noticia.create({
    data: {
      titulo: 'Prefeitura de Vitória da Conquista lança a Universidade do Servidor — AVA UniVC',
      subtitulo: 'Plataforma unificada capacita milhares de servidores municipais em formato 100% digital e interativo.',
      conteudo:
        'A Prefeitura Municipal de Vitória da Conquista, por intermédio da Central de TI (CETI) e da SETP, inaugurou o ambiente virtual AVA UniVC, ofertando trilhas por eixos temáticos, gamificação ativa e emissão instantânea de certificados com autenticidade verificável.',
      categoria: 'Destaque',
      capaUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
      destaque: true,
      publicada: true,
      autorNome: 'Assessoria de Comunicação PMVC',
    },
  });

  await prisma.noticia.create({
    data: {
      titulo: 'Abertas as inscrições para as novas Trilhas de Formação em Liderança e IA',
      subtitulo: 'Capacitações com pontuação no Passaporte Digital e concessão de badges institucionais.',
      conteudo:
        'Servidores de todas as secretarias já podem se matricular nas trilhas dos eixos de Governança, Inovação e Cultura Humana diretamente pelo Portal do Servidor.',
      categoria: 'Trilhas',
      capaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
      destaque: false,
      publicada: true,
      autorNome: 'Coordenação Pedagógica UniVC',
    },
  });

  // ===========================================================================
  // 13. LOGS DE AUDITORIA LGPD & SEGURANÇA
  // ===========================================================================
  await prisma.auditLog.create({
    data: {
      userId: uServ1.id,
      acao: 'LOGIN',
      detalhes: 'Login simulado via SSO Municipal por CPF/Matrícula',
      ipAddress: '127.0.0.1',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: uServ1.id,
      acao: 'ACEITE_LGPD',
      detalhes: 'Servidor registrou consentimento aos termos de uso e privacidade de dados da plataforma',
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Seeding expandido concluído com êxito absoluto!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
