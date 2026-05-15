export type CertificateLanguage = 'en' | 'ar' | 'fr' | 'pt'

export const certificateTranslations: Record<CertificateLanguage, {
  certificateTitle: string
  certificateSubtitle: string
  awardedTo: string
  forSuccessfullyCompleting: string
  levelLabel: string
  issuedLabel: string
  verifyLabel: string
  authorizedSignatory: string
  directorPrograms: string
  principal: string
  recognitionStatement: string
}> = {
  en: {
    certificateTitle: 'Certificate of Achievement',
    certificateSubtitle: 'Professional Certification',
    awardedTo: 'This prestigious certificate is awarded to',
    forSuccessfullyCompleting: 'for successfully completing the professional certification in',
    levelLabel: 'Level',
    issuedLabel: 'Issued',
    verifyLabel: 'Verify Certificate',
    authorizedSignatory: 'Authorized Signatory',
    directorPrograms: 'Director, Programs',
    principal: 'Principal, IICAR',
    recognitionStatement: 'This certificate recognizes demonstrated excellence and proficiency in professional development.',
  },
  fr: {
    certificateTitle: 'Certificat de Réussite',
    certificateSubtitle: 'Certification Professionnelle',
    awardedTo: 'Ce certificat prestigieux est décerné à',
    forSuccessfullyCompleting: 'pour avoir complété avec succès la certification professionnelle en',
    levelLabel: 'Niveau',
    issuedLabel: 'Délivré',
    verifyLabel: 'Vérifier le Certificat',
    authorizedSignatory: 'Signataire Autorisé',
    directorPrograms: 'Directeur, Programmes',
    principal: 'Principal, IICAR',
    recognitionStatement: 'Ce certificat reconnaît l\'excellence démontrée et la maîtrise professionnelle du développement.',
  },
  pt: {
    certificateTitle: 'Certificado de Realização',
    certificateSubtitle: 'Certificação Profissional',
    awardedTo: 'Este certificado prestigiado é concedido a',
    forSuccessfullyCompleting: 'por ter completado com sucesso a certificação profissional em',
    levelLabel: 'Nível',
    issuedLabel: 'Emitido',
    verifyLabel: 'Verificar Certificado',
    authorizedSignatory: 'Signatário Autorizado',
    directorPrograms: 'Diretor, Programas',
    principal: 'Reitor, IICAR',
    recognitionStatement: 'Este certificado reconhece a excelência demonstrada e a proficiência profissional no desenvolvimento.',
  },
  ar: {
    certificateTitle: 'شهادة الإنجاز',
    certificateSubtitle: 'شهادة مهنية',
    awardedTo: 'تُمنح هذه الشهادة المرموقة إلى',
    forSuccessfullyCompleting: 'لاستكمال برنامج الشهادة المهنية بنجاح في',
    levelLabel: 'المستوى',
    issuedLabel: 'أصدرت في',
    verifyLabel: 'التحقق من الشهادة',
    authorizedSignatory: 'الموقع المفوض',
    directorPrograms: 'مدير البرامج',
    principal: 'مدير المدرسة، IICAR',
    recognitionStatement: 'تعترف هذه الشهادة بالتميز والكفاءة المهنية المثبتة في التطوير المهني.',
  },
}

export const levelNames: Record<CertificateLanguage, string[]> = {
  en: ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert'],
  ar: ['أساسي', 'متوسط', 'متقدم', 'احترافي', 'خبير'],
  fr: ['Fondation', 'Intermédiaire', 'Avancé', 'Professionnel', 'Expert'],
  pt: ['Fundação', 'Intermediário', 'Avançado', 'Profissional', 'Especialista'],
}
