import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, CertificateStatus } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:123@localhost:5432/conquista-saberes?schema=public';
const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('🌱 Iniciando Seeding do Conquista Saberes AVA Municipal (Modelo Unificado)...');

  // Limpar tabelas existentes em ordem respeitando FKs
  await prisma.noticia.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.forumComment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.certificadoExterno.deleteMany();
  await prisma.passaportePontuacao.deleteMany();
  await prisma.frequenciaQrcode.deleteMany();
  await prisma.projetoFinal.deleteMany();
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

  // 1. Criar Secretarias da PMVC
  const setp = await prisma.secretaria.create({
    data: {
      nome: 'Secretaria Municipal de Transparência, Controle e Governança',
      sigla: 'SETP',
      descricao: 'Promoção da integridade pública, controle interno e governança.',
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
      descricao: 'Gestão da rede pública de saúde, atenção primária e vigilância.',
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
      descricao: 'Coordenação do ensino municipal e formação continuada.',
      responsavelNome: 'Prof. Carlos Eduardo Santos',
      responsavelEmail: 'carlos.santos@pmvc.ba.gov.br',
      telefone: '(77) 3429-8000',
      endereco: 'Rua Siqueira Campos, 184 - Centro',
      corIdentificacao: '#3B82F6',
    },
  });

  console.log('✅ Secretarias criadas: SETP, SMS, SMED');

  // 2. Criar Servidores Funcionais
  const servidorFuncional1 = await prisma.servidor.create({
    data: {
      cpf: '12345678900',
      matriculaPmvc: '2026001',
      nomeCompleto: 'Carlos Alberto Silva',
      cargoFuncao: 'Técnico Administrativo',
      secretariaId: setp.id,
    },
  });

  const servidorFuncional2 = await prisma.servidor.create({
    data: {
      cpf: '98765432100',
      matriculaPmvc: '2026002',
      nomeCompleto: 'Dra. Ana Paula Souza',
      cargoFuncao: 'Coordenadora Geral de Saúde',
      secretariaId: sms.id,
    },
  });

  const servidorFuncional3 = await prisma.servidor.create({
    data: {
      cpf: '11122233344',
      matriculaPmvc: '2026000',
      nomeCompleto: 'Roberto Mendes (CETI)',
      cargoFuncao: 'Administrador de TI e Capacitação CETI',
      secretariaId: setp.id,
    },
  });

  console.log('✅ Servidores Funcionais cadastrados');

  // Senhas
  const defaultPasswordHash = await bcrypt.hash('123456', 10);
  const adminPasswordHash = await bcrypt.hash('admin', 10);

  // 3. Criar Usuários / Contas de Acesso
  const servidor = await prisma.user.create({
    data: {
      cpf: '12345678900',
      matricula: '2026001',
      nome: 'Carlos Alberto Silva',
      email: 'carlos.silva@pmvc.ba.gov.br',
      passwordHash: defaultPasswordHash,
      role: Role.SERVIDOR,
      cargo: 'Técnico Administrativo',
      secretariaId: setp.id,
      servidorId: servidorFuncional1.id,
      xpPoints: 350,
      level: 2,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  const gestor = await prisma.user.create({
    data: {
      cpf: '98765432100',
      matricula: '2026002',
      nome: 'Dra. Ana Paula Souza',
      email: 'ana.souza@pmvc.ba.gov.br',
      passwordHash: defaultPasswordHash,
      role: Role.GESTOR_SECRETARIA,
      cargo: 'Coordenadora Geral de Saúde',
      secretariaId: sms.id,
      servidorId: servidorFuncional2.id,
      xpPoints: 850,
      level: 4,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  const admin = await prisma.user.create({
    data: {
      cpf: '11122233344',
      matricula: '2026000',
      nome: 'Roberto Mendes (CETI)',
      email: 'admin.rh@pmvc.ba.gov.br',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN_RH_CETI,
      cargo: 'Administrador de TI e Capacitação CETI',
      secretariaId: setp.id,
      servidorId: servidorFuncional3.id,
      xpPoints: 1500,
      level: 6,
      lgpdAccepted: true,
      lgpdAcceptedAt: new Date(),
    },
  });

  console.log('✅ Usuários de Auth vinculados aos Servidores');

  // 4. Eixos de Conhecimento e Trilhas de Aprendizagem
  const eixoGovernança = await prisma.eixoConhecimento.create({
    data: {
      nomeEixo: 'Eixo I: Governança, Gestão & Inovação Pública',
      descricao: 'Desenvolvimento de competências em gestão pública moderna, liderança, controle e transformação digital.',
    },
  });

  const trilhaIntegracao = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Integração ao Serviço Público Municipal',
      cargaHorariaTotal: 12,
      eixoId: eixoGovernança.id,
    },
  });

  const trilhaGestao = await prisma.learningPath.create({
    data: {
      tituloTrilha: 'Trilha de Gestão e Liderança',
      cargaHorariaTotal: 18,
      eixoId: eixoGovernança.id,
    },
  });

  console.log('✅ Eixos de Conhecimento e Trilhas criadas');

  // 5. Badges de Gamificação
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
      descricao: 'Alcançou 100% de aproveitamento no curso de LGPD Aplicada ao Setor Público.',
      icone: 'gavel',
      xpBonus: 100,
    },
  });

  const badgePioneiro = await prisma.badge.create({
    data: {
      nome: 'Pioneiro Conquista',
      descricao: 'Completou o seu primeiro treinamento na plataforma Conquista Saberes.',
      icone: 'military_tech',
      xpBonus: 50,
    },
  });

  console.log('✅ Badges de Gamificação criadas');

  // 6. Cursos
  const cursoInovacao = await prisma.course.create({
    data: {
      titulo: 'Inovação e Transformação Digital na Gestão Pública',
      descricao: 'Capacitação completa sobre métodos ágeis, desburocratização, serviços digitais e cultura de inovação na Prefeitura de Vitória da Conquista.',
      cargaHoraria: 40,
      categoria: 'Inovação & Governo Digital',
      modalidade: 'EAD',
      secretariaId: setp.id,
      trilhaId: trilhaIntegracao.id,
      capaUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
    },
  });

  // Módulo 1 do Curso 1
  const modInov1 = await prisma.module.create({
    data: {
      titulo: 'Módulo 1: Fundamentos do Governo Digital e Atendimento Sem Papel',
      ordem: 1,
      courseId: cursoInovacao.id,
    },
  });

  const lInov1 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 1: A Era da Transformação Digital na PMVC',
      tipo: 'TEXTO',
      duracaoMin: 15,
      ordem: 1,
      moduleId: modInov1.id,
      texto: 'A Prefeitura de Vitória da Conquista vem adotando estratégias de modernização dos serviços públicos para garantir agilidade e transparência.',
    },
  });

  const lInov2 = await prisma.lesson.create({
    data: {
      titulo: 'Aula 2: Tecnologias Emergentes e Cidadania Conquistense',
      tipo: 'VIDEO',
      conteudoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duracaoMin: 20,
      ordem: 2,
      moduleId: modInov1.id,
    },
  });

  // 7. Matrícula, Progresso, Passaporte e Certificados
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: servidor.id,
      courseId: cursoInovacao.id,
      progress: 100.0,
      statusConclusao: 'CONCLUIDO',
      pontuacaoConquistada: 400,
      completedAt: new Date(),
    },
  });

  await prisma.lessonProgress.create({ data: { userId: servidor.id, lessonId: lInov1.id, completed: true } });
  await prisma.lessonProgress.create({ data: { userId: servidor.id, lessonId: lInov2.id, completed: true } });

  await prisma.userBadge.create({ data: { userId: servidor.id, badgeId: badgePioneiro.id } });
  await prisma.userBadge.create({ data: { userId: servidor.id, badgeId: badgeInovador.id } });

  // Passaporte de Pontuação
  await prisma.passaportePontuacao.create({
    data: {
      userId: servidor.id,
      pontosAnoCorrente: 350,
      pontosAcumuladosTotal: 1240,
      badgesSelosJson: JSON.stringify(['Pioneiro Conquista', 'Servidor Inovador']),
    },
  });

  // Certificado Emitido Nativamente
  const certificadoCodigo = 'CS-PMVC-2026-987654';
  await prisma.certificate.create({
    data: {
      codigoValidacao: certificadoCodigo,
      userId: servidor.id,
      courseId: cursoInovacao.id,
      status: CertificateStatus.EMITTED,
      issuedAt: new Date(),
    },
  });

  // Certificado Externo Enviado
  await prisma.certificadoExterno.create({
    data: {
      userId: servidor.id,
      instituicaoEmissora: 'ENAP - Escola Nacional de Administração Pública',
      tituloCurso: 'Gestão Estratégica no Setor Público',
      cargaHoraria: 20,
      statusHomologacao: 'APROVADO',
      urlArquivoPdf: 'https://exemplo.com/certificados/enap-carlos.pdf',
    },
  });

  // Log de Auditoria LGPD
  await prisma.auditLog.create({
    data: {
      userId: servidor.id,
      acao: 'LOGIN',
      detalhes: 'Login simulado via SSO Municipal por CPF/Matrícula',
      ipAddress: '127.0.0.1',
    },
  });

  // 12. Notícias Institucionais
  await prisma.noticia.create({
    data: {
      titulo: 'Prefeitura lança a Universidade do Servidor Público — UniVC',
      subtitulo: 'Iniciativa marca um novo ciclo de valorização e capacitação dos servidores de Conquista.',
      conteudo: 'A Prefeitura Municipal de Vitória da Conquista, por meio do CETI, lançou o Ambiente Virtual de Aprendizagem Conquista Saberes / UniVC com cursos EAD e gamificação.',
      categoria: 'Destaque',
      capaUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
      destaque: true,
      publicada: true,
      autorNome: 'Assessoria CETI',
    },
  });

  await prisma.noticia.create({
    data: {
      titulo: 'Nova trilha de capacitação em atendimento ao cidadão',
      subtitulo: 'Conjunto de cursos voltados ao atendimento humanizado e comunicação não violenta.',
      conteudo: 'Capacitação prática para servidores que lidam diretamente com o atendimento ao público em Conquista.',
      categoria: 'Trilhas',
      capaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
      destaque: false,
      publicada: true,
      autorNome: 'Coordenação UniVC',
    },
  });

  console.log('✅ Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
