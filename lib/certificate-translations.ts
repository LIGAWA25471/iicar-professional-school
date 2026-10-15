export type CertificateLanguage = 'en' | 'ar' | 'fr' | 'pt' | 'es' | 'de'

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
  es: {
    certificateTitle: 'Certificado de Logro',
    certificateSubtitle: 'Certificación Profesional',
    awardedTo: 'Este prestigioso certificado se otorga a',
    forSuccessfullyCompleting: 'por completar con éxito la certificación profesional en',
    levelLabel: 'Nivel',
    issuedLabel: 'Emitido',
    verifyLabel: 'Verificar Certificado',
    authorizedSignatory: 'Firmante Autorizado',
    directorPrograms: 'Director, Programas',
    principal: 'Director, IICAR',
    recognitionStatement: 'Este certificado reconoce la excelencia demostrada y la competencia en el desarrollo profesional.',
  },
  de: {
    certificateTitle: 'Leistungszertifikat',
    certificateSubtitle: 'Berufliche Zertifizierung',
    awardedTo: 'Dieses renommierte Zertifikat wird verliehen an',
    forSuccessfullyCompleting: 'für das erfolgreiche Absolvieren der beruflichen Zertifizierung in',
    levelLabel: 'Stufe',
    issuedLabel: 'Ausgestellt',
    verifyLabel: 'Zertifikat prüfen',
    authorizedSignatory: 'Autorisiertes Signatars',
    directorPrograms: 'Direktor, Programme',
    principal: 'Schulleiter, IICAR',
    recognitionStatement: 'Dieses Zertifikat würdigt nachgewiesene Exzellenz und Fachkompetenz in der beruflichen Entwicklung.',
  },
}

export const levelNames: Record<CertificateLanguage, string[]> = {
  en: ['Foundation', 'Intermediate', 'Advanced', 'Professional', 'Expert'],
  ar: ['أساسي', 'متوسط', 'متقدم', 'احترافي', 'خبير'],
  fr: ['Fondation', 'Intermédiaire', 'Avancé', 'Professionnel', 'Expert'],
  pt: ['Fundação', 'Intermediário', 'Avançado', 'Profissional', 'Especialista'],
  es: ['Fundación', 'Intermedio', 'Avanzado', 'Profesional', 'Experto'],
  de: ['Grundlage', 'Mittelstufe', 'Fortgeschritten', 'Professionell', 'Experte'],
}
