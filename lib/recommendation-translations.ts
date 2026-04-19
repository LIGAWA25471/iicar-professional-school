export type RecommendationType = 'recommendation' | 'endorsement'
export type RecommendationLanguage = 'en' | 'fr' | 'pt'

export const recommendationTranslations = {
  en: {
    recommendationTitle: 'Letter of Recommendation',
    endorsementTitle: 'Professional Endorsement',
    toWhomItMayConcern: 'To Whom It May Concern,',
    recommendationBody: (studentName: string, programTitle: string) =>
      `I am pleased to provide this letter of recommendation for ${studentName}, who has successfully completed the professional certification in ${programTitle}. Throughout the program, ${studentName} demonstrated exceptional commitment, technical proficiency, and a strong grasp of the course material.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `This is to certify that ${studentName} has demonstrated professional competency and mastery in ${programTitle}. We endorse ${studentName}'s proficiency and ability to apply the skills and knowledge acquired through our professional development program.`,
    conclusion: 'I am confident that this individual will make a valuable contribution to any organization and am happy to discuss this further if needed.',
    sincerely: 'Sincerely,',
    directorPrograms: 'Director, Professional Programs',
    icarAcademy: 'IICAR Professional School',
    generatedDate: 'Generated Date:',
  },
  fr: {
    recommendationTitle: 'Lettre de Recommandation',
    endorsementTitle: 'Approbation Professionnelle',
    toWhomItMayConcern: 'À qui de droit,',
    recommendationBody: (studentName: string, programTitle: string) =>
      `Je suis heureux de fournir cette lettre de recommandation pour ${studentName}, qui a complété avec succès la certification professionnelle en ${programTitle}. Tout au long du programme, ${studentName} a démontré un engagement exceptionnel, une maîtrise technique et une compréhension approfondie de la matière du cours.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `Ceci certifie que ${studentName} a démontré une compétence professionnelle et une maîtrise en ${programTitle}. Nous approuvons la compétence et la capacité de ${studentName} à appliquer les compétences et les connaissances acquises par le biais de notre programme de développement professionnel.`,
    conclusion: 'Je suis confiant que cette personne apportera une contribution précieuse à toute organisation et je serais heureux de discuter davantage si nécessaire.',
    sincerely: 'Sincèrement,',
    directorPrograms: 'Directeur, Programmes Professionnels',
    icarAcademy: 'École Professionnelle IICAR',
    generatedDate: 'Date de génération :',
  },
  pt: {
    recommendationTitle: 'Carta de Recomendação',
    endorsementTitle: 'Aprovação Profissional',
    toWhomItMayConcern: 'A quem interessar possa,',
    recommendationBody: (studentName: string, programTitle: string) =>
      `Tenho o prazer de fornecer esta carta de recomendação para ${studentName}, que completou com sucesso a certificação profissional em ${programTitle}. Durante o programa, ${studentName} demonstrou excepcional comprometimento, proficiência técnica e sólida compreensão do material do curso.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `Isto certifica que ${studentName} demonstrou competência profissional e domínio em ${programTitle}. Endossamos a competência e capacidade de ${studentName} em aplicar as habilidades e conhecimentos adquiridos através de nosso programa de desenvolvimento profissional.`,
    conclusion: 'Tenho confiança de que este indivíduo fará uma contribuição valiosa para qualquer organização e fico feliz em discutir isso ainda mais se necessário.',
    sincerely: 'Atenciosamente,',
    directorPrograms: 'Diretor, Programas Profissionais',
    icarAcademy: 'Escola Profissional IICAR',
    generatedDate: 'Data de Geração:',
  },
}
