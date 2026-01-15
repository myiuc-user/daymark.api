import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Initiative {
  code: string;
  title: string;
  responsible: string;
  projectManager: string;
  period: string;
  budget: string;
  description: string;
  objectives: string[];
  deliverables: string[];
  phases: Array<{ name: string; duration: string; period: string }>;
}

const initiatives: Initiative[] = [
  {
    code: 'P1-I1',
    title: 'Transformation juridique en SAS',
    responsible: 'Directeur Juridique / Secrétaire Général',
    projectManager: 'Juriste Senior',
    period: 'T1 2026 - T4 2026',
    budget: '23 650 000 FCFA',
    description: 'Transformer la structure juridique de l\'IUC en Société par Actions Simplifiée pour moderniser la gouvernance, faciliter les levées de fonds et renforcer la crédibilité institutionnelle.',
    objectives: [
      'Audit juridique exhaustif',
      'Valorisation IUC (3 méthodes)',
      'Rédaction statuts SAS et pacte actionnaires',
      'Validation AGE transformation',
      'Formalités RCCM et publications légales',
      'Mise à jour contrats institutionnels',
      'Communication transformation'
    ],
    deliverables: [
      'Rapport audit juridique complet',
      'Rapport valorisation (3 méthodes)',
      'Statuts SAS finaux (50-70 pages)',
      'Pacte actionnaires signé (30-50 pages)',
      'Règlement intérieur CA',
      'PV AGE transformation',
      'Dossier RCCM complet',
      'Nouveau RCCM SAS',
      'Publications légales',
      'Contrats actualisés',
      'Plan communication',
      'Documentation formation gouvernance'
    ],
    phases: [
      { name: 'Diagnostic (audit juridique/financier)', duration: '3 mois', period: 'Jan-Mar 2026' },
      { name: 'Valorisation', duration: '3 mois', period: 'Fév-Avr 2026' },
      { name: 'Rédaction documents', duration: '3 mois', period: 'Avr-Juin 2026' },
      { name: 'Validation AGE', duration: '1 mois', period: 'Juil 2026' },
      { name: 'Formalités RCCM', duration: '2 mois', period: 'Août-Sept 2026' },
      { name: 'Transition/Communication', duration: '3 mois', period: 'Oct-Déc 2026' }
    ]
  },
  {
    code: 'P1-I2',
    title: 'Identification membres CA et Comités',
    responsible: 'Président CA désigné',
    projectManager: 'Secrétaire Général',
    period: 'T2 2026 - T3 2026',
    budget: '33 550 000 FCFA',
    description: 'Identifier, sélectionner et nommer 9 membres du Conseil d\'Administration et constituer 4 Comités spécialisés avec ~20 membres au total.',
    objectives: [
      'Définition profils recherchés',
      'Sourcing candidats',
      'Évaluation et due diligence',
      'Négociation conditions',
      'Nomination officielle AG',
      'Onboarding membres',
      'Constitution Comités'
    ],
    deliverables: [
      'Document profils et critères',
      'Matrice compétences cibles',
      'Longlist (30-40) et shortlist (15-20)',
      'Grilles évaluation',
      'Rapports entretiens et due diligence',
      'Propositions nomination AG',
      'Lettres mission signées (9)',
      'Composition 4 Comités',
      'Pack onboarding',
      'PV AG nomination',
      'PV 1ère réunion CA',
      'Dashboard gouvernance'
    ],
    phases: [
      { name: 'Préparation (profils, critères)', duration: '1,5 mois', period: 'Avr-Mai 2026' },
      { name: 'Sourcing (longlist, shortlist)', duration: '1,5 mois', period: 'Mai-Juin 2026' },
      { name: 'Évaluation (entretiens, DD)', duration: '1,5 mois', period: 'Juin-Juil 2026' },
      { name: 'Nomination (AG, lettres)', duration: '1 mois', period: 'Août 2026' },
      { name: 'Constitution Comités', duration: '1 mois', period: 'Sept 2026' }
    ]
  },
  {
    code: 'P1-I3',
    title: 'Calendrier annuel CA et Comités',
    responsible: 'Secrétaire Général',
    projectManager: 'Secrétaire Général',
    period: 'T3 2026 (3 mois)',
    budget: '5 000 000 FCFA',
    description: 'Élaborer calendrier annuel fixe des réunions CA (4/an minimum) et Comités (12-15 total/an) pour assurer rythme de gouvernance régulier, prévisible et efficace.',
    objectives: ['Analyse contraintes', 'Fréquence définie', 'Calendrier 3 ans', 'Validation CA', 'Agendas bloqués', 'Process convocation'],
    deliverables: ['Analyse contraintes IUC', 'Décision fréquence instances', 'Calendrier triennal détaillé', 'Ordres du jour types', 'Planning production documentation', 'Process convocation formalisé', 'Validation CA (PV)', 'Confirmations blocking agendas', 'Procédure gestion absences', 'Tableau suivi taux présence'],
    phases: [{ name: 'Analyse et consultation', duration: '1 mois', period: 'Juil 2026' }, { name: 'Élaboration calendrier', duration: '1 mois', period: 'Août 2026' }, { name: 'Validation et déploiement', duration: '1 mois', period: 'Sept 2026' }]
  },
  {
    code: 'P1-I4',
    title: 'Cartographie processus opérationnels',
    responsible: 'Directeur Qualité et Performance',
    projectManager: 'Chef de projet Processus (consultant)',
    period: 'T4 2026 - T2 2027 (9 mois)',
    budget: '45 000 000 FCFA',
    description: 'Réaliser cartographie exhaustive des 125 processus IUC selon norme BPMN 2.0. Documenter flux, responsabilités (RACI), indicateurs, risques. Identifier 30% processus à optimiser.',
    objectives: ['Recensement exhaustif processus', 'Classification 4 catégories', 'Fiches processus standardisées', 'Diagrammes BPMN 2.0', 'Matrices RACI complètes', 'Identification processus à optimiser', 'Formation équipes'],
    deliverables: ['Inventaire complet 125 processus', '125 fiches processus standardisées', '100+ diagrammes BPMN 2.0', '125 matrices RACI', 'Manuel cartographie processus', 'Base de données processus', 'Rapport identification optimisations', 'Documentation 20 processus critiques', 'Mesures situation actuelle', 'Kit formation lecture processus', 'Plan optimisation priorisé', 'Dashboard suivi processus'],
    phases: [{ name: 'Recensement et interviews', duration: '3 mois', period: 'Oct-Déc 2026' }, { name: 'Modélisation (BPMN, RACI)', duration: '4 mois', period: 'Jan-Avr 2027' }, { name: 'Documentation et priorisation', duration: '2 mois', period: 'Mai-Juin 2027' }]
  },
  {
    code: 'P1-I5',
    title: 'Refonte processus internes',
    responsible: 'Directeur Qualité et Performance',
    projectManager: 'Chef de projet Lean/Amélioration Continue',
    period: 'T3 2027 - T2 2028 (12 mois)',
    budget: '55 000 000 FCFA',
    description: 'Optimiser 40 processus prioritaires selon méthodologie Lean Six Sigma. Réduction 30% temps traitement, -50% erreurs, +25% satisfaction, libération 10 ETP.',
    objectives: ['Sélection 40 processus prioritaires', 'Analyse VSM', 'Conception processus optimisés', 'Tests pilotes', 'Déploiement général', 'Automatisation', 'Standardisation'],
    deliverables: ['Matrice priorisation 40 processus', '40 Value Stream Maps', '40 analyses gaspillages', '40 processus optimisés', '10 rapports pilotes', '40 procédures standardisées', 'Templates et outils automatisés', 'Plans formation', 'Documentation utilisateur', 'Dashboards performance', 'Rapports gains réalisés', 'Programme amélioration continue'],
    phases: [{ name: 'Sélection et analyse (VSM)', duration: '3 mois', period: 'Sept-Nov 2027' }, { name: 'Conception processus optimisés', duration: '3 mois', period: 'Déc 2027-Fév 2028' }, { name: 'Pilotes et ajustements', duration: '2 mois', period: 'Mars-Avr 2028' }, { name: 'Déploiement général', duration: '3 mois', period: 'Mai-Juil 2028' }]
  },
  {
    code: 'P1-I6',
    title: 'Renforcement équipe de direction',
    responsible: 'Directrice Générale',
    projectManager: 'Directeur RH',
    period: 'T1 2026 - T4 2027 (24 mois)',
    budget: '120 000 000 FCFA',
    description: 'Recruter 15 postes de direction stratégiques: 2 DGA, DSI, Dir. Relations Entreprises, Dir. Relations Internationales, Dir. Qualité, Dir. Marketing, Dir. PMO, etc. Packages compétitifs.',
    objectives: ['Définition 15 fiches de poste', 'Benchmarking salarial', 'Sourcing multi-canal', 'Processus sélection rigoureux', 'Due diligence candidats', 'Onboarding structuré'],
    deliverables: ['15 fiches de poste détaillées', 'Grilles de compétences', 'Benchmarking salarial', '15 packages rémunération', 'Annonces recrutement', 'Rapports shortlists', 'Grilles entretiens', '15 rapports due diligence', '15 contrats signés', 'Programmes onboarding', 'Évaluations période essai', 'Nouvel organigramme'],
    phases: [{ name: 'Vague 1 (6 postes critiques)', duration: '8 mois', period: 'Mai-Déc 2026' }, { name: 'Vague 2 (6 postes développement)', duration: '6 mois', period: 'Jan-Juin 2027' }, { name: 'Vague 3 (3 postes innovation)', duration: '6 mois', period: 'Juil-Déc 2027' }]
  },
  {
    code: 'P1-I7',
    title: 'Management de la performance RH',
    responsible: 'Directeur RH',
    projectManager: 'Responsable Formation & Développement',
    period: 'T1 2027 - T4 2027 (12 mois)',
    budget: '35 000 000 FCFA',
    description: 'Déployer système complet de management de la performance: évaluation annuelle 360° pour 100% personnel (450 personnes), objectifs SMART, revues trimestrielles, rémunération variable.',
    objectives: ['Grilles évaluation par famille poste', 'Système 360°', 'Formation managers', 'Plateforme digitale', 'Cascading objectifs', 'Revues trimestrielles', 'Rémunération variable'],
    deliverables: ['Politique gestion performance', '10 grilles évaluation', 'Plateforme digitale', 'Kit formation managers', 'Procédure cascading objectifs', 'Modèle entretien annuel', 'Politique rémunération variable', 'Dashboard KPIs RH', 'Enquête satisfaction', 'Plans développement individuels', 'Rapport annuel performance', 'Procédure recalibration'],
    phases: [{ name: 'Conception système et grilles', duration: '3 mois', period: 'Jan-Mars 2027' }, { name: 'Déploiement plateforme et formation', duration: '2 mois', period: 'Avr-Mai 2027' }, { name: 'Définition objectifs 2027', duration: '1 mois', period: 'Juin 2027' }, { name: 'Évaluations annuelles', duration: '2 mois', period: 'Nov-Déc 2027' }]
  },
  {
    code: 'P1-I8',
    title: 'Évaluation continue qualité services',
    responsible: 'Directeur Qualité et Performance',
    projectManager: 'Responsable Qualité',
    period: 'T2 2027 - T1 2028 (12 mois)',
    budget: '25 000 000 FCFA',
    description: 'Système d\'évaluation continue via enquêtes multiples (étudiants 3x/an, entreprises, personnel, alumni), indicateurs qualité mensuels, gestion réclamations digitale.',
    objectives: ['Enquêtes satisfaction structurées', 'Plateforme digitale', 'Dashboard qualité temps réel', 'Système gestion réclamations', 'Boucles amélioration continue'],
    deliverables: ['Questionnaires enquêtes validés', 'Plateforme digitale enquêtes', 'Calendrier annuel enquêtes', 'Dashboard qualité temps réel', 'Définition 20+ KPIs qualité', 'Plateforme gestion réclamations', 'Procédure traitement réclamations', 'Rapports analyse enquêtes', 'Plans action amélioration', 'Communication résultats', 'Boucles PDCA documentées', 'Rapport annuel qualité'],
    phases: [{ name: 'Conception questionnaires et KPIs', duration: '2 mois', period: 'Avr-Mai 2027' }, { name: 'Déploiement plateformes', duration: '2 mois', period: 'Juin-Juil 2027' }, { name: '1er cycle enquêtes', duration: '3 mois', period: 'Août-Oct 2027' }, { name: 'Amélioration continue', duration: '3 mois', period: 'Janv-Mars 2028' }]
  },
  {
    code: 'P1-I9',
    title: 'Structures lean, agiles et robustes',
    responsible: 'Directrice Générale Adjointe Administration',
    projectManager: 'Directeur Qualité et Performance',
    period: 'T1 2028 - T4 2028 (12 mois)',
    budget: '40 000 000 FCFA',
    description: 'Transformer organisation selon 3 principes: LEAN (élimination gaspillages), AGILE (équipes pluridisciplinaires, OKRs), ROBUSTE (PCA, cyber-résilience, trésorerie 3 mois).',
    objectives: ['Value Stream Mapping', 'Structure matricielle', 'OKRs trimestriels', 'Plans Continuité Activité', 'Plans succession', 'Cyber-résilience', 'Trésorerie sécurisée'],
    deliverables: ['15 Value Stream Maps', 'Rapports élimination gaspillages', 'Nouvel organigramme matriciel', 'Description 5 pôles transversaux', 'Framework OKRs', '10 Plans Continuité Activité', '20 Plans succession', 'Disaster Recovery Plan', 'Politique trésorerie', 'Cartographie fournisseurs', 'Procédures gestion crise', 'Rapports tests PCA/DRP'],
    phases: [{ name: 'Diagnostic et VSM', duration: '3 mois', period: 'Jan-Mars 2028' }, { name: 'Conception organisation matricielle', duration: '2 mois', period: 'Avr-Mai 2028' }, { name: 'PCA et plans succession', duration: '3 mois', period: 'Avr-Juin 2028' }, { name: 'Déploiement lean et agile', duration: '4 mois', period: 'Juin-Sept 2028' }]
  },
  {
    code: 'P1-I10',
    title: 'GPEC - Gestion Prévisionnelle Emplois',
    responsible: 'Directeur RH',
    projectManager: 'Responsable GPEC',
    period: 'T2 2028 - T1 2029 (12 mois)',
    budget: '30 000 000 FCFA',
    description: 'Mise en place GPEC: cartographie emplois/compétences, référentiel 80 métiers, plans succession 30 postes clés, mobilité interne, formation stratégique.',
    objectives: ['Cartographie emplois et compétences', 'Référentiel métiers', 'Plans succession postes clés', 'Politique mobilité interne', 'Plan formation stratégique', 'Anticipation besoins futurs'],
    deliverables: ['Cartographie emplois/compétences', 'Référentiel 80 métiers IUC', 'Matrices compétences par métier', '30 plans succession', 'Politique mobilité interne', 'Plan formation triennal', 'Outil GPEC digital', 'Procédure revue annuelle GPEC', 'Scénarios évolution effectifs', 'Dashboard RH prévisionnel', 'Guide entretiens professionnels', 'Rapport GPEC annuel'],
    phases: [{ name: 'Diagnostic et cartographie', duration: '3 mois', period: 'Avr-Juin 2028' }, { name: 'Référentiel métiers et compétences', duration: '3 mois', period: 'Juil-Sept 2028' }, { name: 'Plans succession et mobilité', duration: '3 mois', period: 'Oct-Déc 2028' }, { name: 'Déploiement et formation', duration: '3 mois', period: 'Janv-Mars 2029' }]
  },
  {
    code: 'P1-I11',
    title: 'Gestion budgétaire - Phase 1',
    responsible: 'Directeur Administratif et Financier',
    projectManager: 'Contrôleur de Gestion',
    period: 'T1 2026 - T4 2026 (12 mois)',
    budget: '35 000 000 FCFA',
    description: 'Structurer gestion budgétaire: budget base zéro, suivi mensuel par centre de coûts, ERP financier, contrôle de gestion, procédures validation dépenses.',
    objectives: ['Budget base zéro', 'Structure centres de coûts', 'ERP financier', 'Procédures budgétaires', 'Suivi mensuel', 'Contrôle de gestion'],
    deliverables: ['Procédure budget base zéro', 'Structure 25 centres de coûts', 'ERP financier déployé', 'Manuel procédures budgétaires', 'Templates budget par direction', 'Dashboard suivi budgétaire', 'Procédure validation dépenses', 'Rapports mensuels écarts', 'Politique investissements', 'Grilles délégation signature', 'Formation managers budget', 'Budget 2027 (1er exercice)'],
    phases: [{ name: 'Diagnostic et conception', duration: '3 mois', period: 'Jan-Mars 2026' }, { name: 'Déploiement ERP et procédures', duration: '4 mois', period: 'Avr-Juil 2026' }, { name: 'Formation et préparation budget 2027', duration: '3 mois', period: 'Août-Oct 2026' }, { name: '1er cycle budgétaire', duration: '2 mois', period: 'Nov-Déc 2026' }]
  },
  {
    code: 'P1-I12',
    title: 'Gestion budgétaire - Phase 2',
    responsible: 'Directeur Administratif et Financier',
    projectManager: 'Contrôleur de Gestion',
    period: 'T1 2027 - T4 2027 (12 mois)',
    budget: '25 000 000 FCFA',
    description: 'Optimisation gestion budgétaire: budget pluriannuel 3 ans, scénarios prospectifs, KPIs financiers avancés, business intelligence, prévisions trésorerie rolling.',
    objectives: ['Budget pluriannuel 3 ans', 'Scénarios prospectifs', 'KPIs financiers avancés', 'Business Intelligence', 'Prévisions trésorerie rolling', 'Optimisation coûts'],
    deliverables: ['Budget triennal 2028-2030', '3 scénarios prospectifs', 'Dashboard 30 KPIs financiers', 'Plateforme BI financière', 'Modèle prévisions trésorerie 12 mois rolling', 'Analyse rentabilité par programme', 'Politique optimisation coûts', 'Benchmarking financier secteur', 'Rapports trimestriels CA', 'Procédure reforecasts', 'Formation analyse financière', 'Plan amélioration marges'],
    phases: [{ name: 'Budget pluriannuel et scénarios', duration: '3 mois', period: 'Jan-Mars 2027' }, { name: 'Déploiement BI et KPIs avancés', duration: '4 mois', period: 'Avr-Juil 2027' }, { name: 'Optimisation coûts et marges', duration: '3 mois', period: 'Août-Oct 2027' }, { name: 'Stabilisation et amélioration', duration: '2 mois', period: 'Nov-Déc 2027' }]
  }
];

async function main() {
  console.log('🚀 Début de l\'importation du Projet 1...\n');

  // 1. Créer ou récupérer le super admin
  let superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdmin) {
    console.log('❌ Aucun super admin trouvé. Veuillez d\'abord créer un compte admin.');
    return;
  }

  console.log(`✅ Super admin trouvé: ${superAdmin.email}\n`);

  // 2. Créer le workspace "Projet 1 - Gouvernance IUC"
  console.log('📁 Création du workspace...');
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Projet 1 - Restructuration Gouvernance IUC',
      description: 'Restructurer et renforcer la gouvernance de l\'IUC à travers 12 initiatives stratégiques',
      ownerId: superAdmin.id,
      members: {
        create: {
          userId: superAdmin.id,
          role: 'ADMIN'
        }
      }
    }
  });
  console.log(`✅ Workspace créé: ${workspace.name} (ID: ${workspace.id})\n`);

  // 3. Créer les projets pour chaque initiative
  for (const initiative of initiatives) {
    console.log(`📊 Création du projet: ${initiative.code} - ${initiative.title}`);
    
    const project = await prisma.project.create({
      data: {
        name: `${initiative.code}: ${initiative.title}`,
        description: initiative.description,
        workspaceId: workspace.id,
        team_lead: superAdmin.id,
        status: 'PLANNING',
        priority: 'HIGH',
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-12-31'),
        members: {
          create: {
            userId: superAdmin.id,
            role: 'ADMIN'
          }
        }
      }
    });

    console.log(`  ✅ Projet créé (ID: ${project.id})`);

    // 4. Créer les tâches pour les objectifs
    console.log(`  📝 Création de ${initiative.objectives.length} tâches (objectifs)...`);
    for (const objective of initiative.objectives) {
      await prisma.task.create({
        data: {
          title: objective,
          description: `Objectif de l'initiative ${initiative.code}`,
          projectId: project.id,
          createdById: superAdmin.id,
          status: 'TODO',
          priority: 'MEDIUM',
          due_date: new Date('2026-12-31')
        }
      });
    }

    // 5. Créer les tâches pour les livrables
    console.log(`  📦 Création de ${initiative.deliverables.length} tâches (livrables)...`);
    for (const deliverable of initiative.deliverables) {
      await prisma.task.create({
        data: {
          title: `Livrable: ${deliverable}`,
          description: `Livrable attendu pour l'initiative ${initiative.code}`,
          projectId: project.id,
          createdById: superAdmin.id,
          status: 'TODO',
          priority: 'HIGH',
          due_date: new Date('2026-12-31')
        }
      });
    }

    // 6. Créer un milestone pour chaque phase
    console.log(`  🎯 Création de ${initiative.phases.length} milestones (phases)...`);
    for (const phase of initiative.phases) {
      await prisma.milestone.create({
        data: {
          name: phase.name,
          description: `Durée: ${phase.duration} | Période: ${phase.period}`,
          projectId: project.id,
          dueDate: new Date('2026-12-31'),
          completed: false
        }
      });
    }

    console.log(`  ✅ ${initiative.code} importé avec succès!\n`);
  }

  console.log('🎉 Importation terminée avec succès!');
  console.log(`\n📊 Résumé:`);
  console.log(`   - 1 workspace créé`);
  console.log(`   - ${initiatives.length} projets créés (P1-I1 à P1-I12)`);
  console.log(`   - Budget total: 472,2M FCFA`);
  console.log(`   - Tâches et milestones générés automatiquement`);
  console.log(`\n💰 Répartition budgétaire:`);
  console.log(`   - Gouvernance (I1-I3): 62,2M FCFA`);
  console.log(`   - Processus (I4-I5): 100M FCFA`);
  console.log(`   - RH (I6-I7-I10): 185M FCFA`);
  console.log(`   - Qualité & Structure (I8-I9): 65M FCFA`);
  console.log(`   - Gestion budgétaire (I11-I12): 60M FCFA`);
  console.log(`\n📅 Période d'exécution: 2026-2029 (3 ans)`);
  console.log(`\n💡 Prochaines étapes:`);
  console.log(`   1. Inviter les membres de l'équipe au workspace`);
  console.log(`   2. Assigner les tâches aux responsables`);
  console.log(`   3. Ajuster les dates et priorités selon le calendrier`);
  console.log(`   4. Créer les sprints pour chaque phase`);
  console.log(`   5. Configurer les notifications et rappels`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'importation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
